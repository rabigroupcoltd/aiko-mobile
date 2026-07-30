import { LIVENESS } from './constants';
import { angleDelta, clamp01, normaliseFace } from './signals';
import type {
  FaceSnapshot,
  FailReason,
  FramingIssue,
  LivenessState,
  TickInput,
} from './types';

/**
 * The liveness state machine — a PURE reducer.
 *
 * No React, no camera, no timers, no I/O. Everything it needs arrives in the
 * tick; everything it decides comes out in the returned state. That is what
 * makes it unit-testable by replaying synthetic snapshot sequences, and what
 * keeps threshold tuning separate from logic changes.
 *
 * NOTE: no numeric literals belong in this file. Every threshold lives in
 * `constants.ts` so tuning never means editing logic.
 */

export function initialState(now: number, attempt = 1): LivenessState {
  return {
    phase: 'IDLE',
    phaseEnteredAt: now,
    attempt,
    failReason: null,
    framingIssue: 'no-face',
    framingHeldSince: null,
    lastCenterX: null,
    lastCenterY: null,
    multiFaceSince: null,
    yawBaseline: null,
    rollBaseline: null,
    blinkStage: 'AWAIT_OPEN_BASELINE',
    eyesOpenSince: null,
    eyesClosedAt: null,
    reopenSamples: 0,
    blinkRetried: false,
    turnStage: 'AWAIT_TURN',
    turnHeldSince: null,
    peakYawDelta: 0,
    progress: 0,
  };
}

/** Extra inputs the hook computes from the smoothers before each tick. */
export interface TickSignals {
  /** Smoothed, fused eye-open probability. null = dropout / not yet known. */
  eye: number | null;
  /** Median-smoothed pose angles. */
  yaw: number;
  roll: number;
}

function enter(
  state: LivenessState,
  phase: LivenessState['phase'],
  now: number,
  patch: Partial<LivenessState> = {}
): LivenessState {
  return { ...state, phase, phaseEnteredAt: now, progress: 0, ...patch };
}

function fail(state: LivenessState, now: number, reason: FailReason): LivenessState {
  return enter(state, 'FAILED', now, { failReason: reason });
}

/** Which framing condition is currently unmet. */
function assessFraming(s: FaceSnapshot, signals: TickSignals): FramingIssue {
  const { centerX, centerY, widthRatio } = normaliseFace(s);

  if (widthRatio < LIVENESS.MIN_FACE_RATIO) return 'too-far';
  if (widthRatio > LIVENESS.MAX_FACE_RATIO) return 'too-close';

  // Mirroring cancels for a centred target (the X target is symmetric), so the
  // raw bounds are used directly. This only holds while the guide oval is
  // horizontally centred — revisit if it ever moves.
  if (Math.abs(centerX - LIVENESS.TARGET_CENTER_X) > LIVENESS.CENTER_TOL_X)
    return 'off-centre';
  if (Math.abs(centerY - LIVENESS.TARGET_CENTER_Y) > LIVENESS.CENTER_TOL_Y)
    return 'off-centre';

  // All three axes, not just yaw. Pitch comes straight off the snapshot because
  // only yaw and roll are smoothed, and this is a gate rather than something a
  // hold duration is measured against.
  if (Math.abs(signals.yaw) > LIVENESS.YAW_BASELINE_MAX_DEG) return 'not-frontal';
  if (Math.abs(signals.roll) > LIVENESS.MAX_FRAMING_ROLL_DEG) return 'not-frontal';
  if (Math.abs(s.pitch) > LIVENESS.MAX_FRAMING_PITCH_DEG) return 'not-frontal';

  return 'none';
}

export function step(
  state: LivenessState,
  tick: TickInput,
  signals: TickSignals
): LivenessState {
  const { now, snapshot, faceCount, sinceLastFace } = tick;

  // ── terminal states are inert ────────────────────────────────────────────
  if (state.phase === 'PASSED' || state.phase === 'FAILED') return state;

  // ── IDLE: wait for start() to move us on ─────────────────────────────────
  if (state.phase === 'IDLE') return state;

  const elapsed = now - state.phaseEnteredAt;

  // ── global guards ────────────────────────────────────────────────────────
  // NOTE: nothing about the face ends an attempt. A second face used to fail
  // outright here; it is now a framing issue handled in FACE_SEARCH, so the user
  // can just step out of shot and carry on. The phase timers are the only path
  // to FAILED, which is what puts the retry button on screen.
  const lossAllowance =
    state.phase === 'HEAD_TURN'
      ? LIVENESS.FACE_LOST_MS * LIVENESS.FACE_LOST_MS_TURN_MULT
      : LIVENESS.FACE_LOST_MS;

  if (sinceLastFace > lossAllowance) {
    // Losing the face regresses to framing rather than failing outright —
    // people drift out of frame constantly and a hard fail would be brutal.
    if (state.phase === 'FACE_SEARCH') {
      if (elapsed > LIVENESS.TIMEOUT_FACE_SEARCH_MS)
        return fail(state, now, 'TIMEOUT_FACE');
      return {
        ...state,
        framingIssue: 'no-face',
        framingHeldSince: null,
        lastCenterX: null,
        lastCenterY: null,
        multiFaceSince: null,
        progress: 0,
      };
    }
    return enter(state, 'FACE_SEARCH', now, {
      framingIssue: 'no-face',
      framingHeldSince: null,
      lastCenterX: null,
      lastCenterY: null,
      multiFaceSince: null,
      // Baselines were captured for a face we can no longer see.
      yawBaseline: null,
      rollBaseline: null,
      blinkStage: 'AWAIT_OPEN_BASELINE',
      eyesOpenSince: null,
      eyesClosedAt: null,
      reopenSamples: 0,
      turnStage: 'AWAIT_TURN',
      turnHeldSince: null,
    });
  }

  if (!snapshot) return state;

  switch (state.phase) {
    case 'FACE_SEARCH':
      return stepFaceSearch(state, now, elapsed, snapshot, signals, faceCount);
    case 'BLINK':
      return stepBlink(state, now, elapsed, signals);
    case 'HEAD_TURN':
      return stepHeadTurn(state, now, elapsed, signals);
    default:
      return state;
  }
}

/**
 * Framing gate. Advances only on a face that is well-sized, properly centred,
 * frontal on all three axes AND holding still — every condition continuously
 * satisfied for FRAMING_HOLD_MS. Failing any of them only resets the hold; the
 * phase timeout above is the sole way out to FAILED.
 */
function stepFaceSearch(
  state: LivenessState,
  now: number,
  elapsed: number,
  snapshot: FaceSnapshot,
  signals: TickSignals,
  faceCount: number
): LivenessState {
  if (elapsed > LIVENESS.TIMEOUT_FACE_SEARCH_MS) {
    return fail(state, now, 'TIMEOUT_FACE');
  }

  const multiFaceSince = faceCount > 1 ? (state.multiFaceSince ?? now) : null;
  const multiFaceConfirmed =
    multiFaceSince != null && now - multiFaceSince >= LIVENESS.MULTI_FACE_GRACE_MS;

  const { centerX, centerY } = normaliseFace(snapshot);

  // Steadiness. Compared against the previous tick (~TICK_MS ago), so this is a
  // velocity gate: correct framing reached while the head is still travelling
  // does not count, which is what stops the capture landing mid-movement.
  const settled =
    state.lastCenterX == null ||
    state.lastCenterY == null ||
    Math.hypot(centerX - state.lastCenterX, centerY - state.lastCenterY) <=
      LIVENESS.CENTER_DRIFT_TOL;

  const issue = multiFaceConfirmed ? 'multiple-faces' : assessFraming(snapshot, signals);

  // Carried on every return path — dropping it would leave the steadiness check
  // comparing against a stale centre.
  const tracked = {
    ...state,
    lastCenterX: centerX,
    lastCenterY: centerY,
    multiFaceSince,
  };

  if (issue !== 'none' || !settled) {
    // A face that is framed but still moving keeps the 'none' issue, so the
    // prompt stays "hold still" rather than accusing the user of bad framing.
    return { ...tracked, framingIssue: issue, framingHeldSince: null, progress: 0 };
  }

  const heldSince = state.framingHeldSince ?? now;
  const held = now - heldSince;

  if (held >= LIVENESS.FRAMING_HOLD_MS) {
    // Capture the pose baseline from a confirmed-frontal, settled face.
    return enter(tracked, 'BLINK', now, {
      framingIssue: 'none',
      framingHeldSince: null,
      yawBaseline: signals.yaw,
      rollBaseline: signals.roll,
      blinkStage: 'AWAIT_OPEN_BASELINE',
      eyesOpenSince: null,
      eyesClosedAt: null,
      reopenSamples: 0,
    });
  }

  return {
    ...tracked,
    framingIssue: 'none',
    framingHeldSince: heldSince,
    progress: clamp01(held / LIVENESS.FRAMING_HOLD_MS),
  };
}

/**
 * Blink sub-machine: establish eyes-open baseline, detect a closure, then
 * require a confirmed re-open within a plausible duration window.
 */
function stepBlink(
  state: LivenessState,
  now: number,
  elapsed: number,
  signals: TickSignals
): LivenessState {
  if (elapsed > LIVENESS.TIMEOUT_BLINK_MS) {
    return fail(state, now, 'TIMEOUT_BLINK');
  }

  const eye = signals.eye;
  // No usable classifier reading yet — hold position rather than guess.
  if (eye == null) return state;

  switch (state.blinkStage) {
    case 'AWAIT_OPEN_BASELINE': {
      if (eye < LIVENESS.EYE_HIGH) {
        return { ...state, eyesOpenSince: null, progress: 0 };
      }
      const since = state.eyesOpenSince ?? now;
      const open = now - since;
      if (open >= LIVENESS.EYE_OPEN_BASELINE_MS) {
        return { ...state, blinkStage: 'AWAIT_CLOSE', eyesOpenSince: since, progress: 0.2 };
      }
      return {
        ...state,
        eyesOpenSince: since,
        progress: clamp01(open / LIVENESS.EYE_OPEN_BASELINE_MS) * 0.2,
      };
    }

    case 'AWAIT_CLOSE': {
      if (eye <= LIVENESS.EYE_LOW) {
        return { ...state, blinkStage: 'AWAIT_REOPEN', eyesClosedAt: now, reopenSamples: 0, progress: 0.5 };
      }
      return { ...state, progress: 0.3 };
    }

    case 'AWAIT_REOPEN': {
      const closedAt = state.eyesClosedAt ?? now;
      const closedFor = now - closedAt;

      // Held shut too long: not a natural blink. Restart the sub-machine rather
      // than fail — the user may simply have been slow, and we still have time.
      if (closedFor > LIVENESS.BLINK_MAX_MS && eye < LIVENESS.EYE_HIGH) {
        return {
          ...state,
          blinkStage: 'AWAIT_OPEN_BASELINE',
          eyesOpenSince: null,
          eyesClosedAt: null,
          reopenSamples: 0,
          blinkRetried: true,
          progress: 0,
        };
      }

      if (eye >= LIVENESS.EYE_HIGH) {
        const samples = state.reopenSamples + 1;
        if (samples < LIVENESS.BLINK_REOPEN_SAMPLES) {
          return { ...state, reopenSamples: samples, progress: 0.8 };
        }

        // Too fast to be a real blink — almost certainly sensor noise.
        if (closedFor < LIVENESS.BLINK_MIN_MS) {
          return {
            ...state,
            blinkStage: 'AWAIT_OPEN_BASELINE',
            eyesOpenSince: null,
            eyesClosedAt: null,
            reopenSamples: 0,
            blinkRetried: true,
            progress: 0,
          };
        }

        // Genuine blink confirmed.
        return enter(state, 'HEAD_TURN', now, {
          turnStage: 'AWAIT_TURN',
          turnHeldSince: null,
          peakYawDelta: 0,
        });
      }

      return { ...state, reopenSamples: 0, progress: 0.6 };
    }
  }
}

/**
 * Head-turn sub-machine: a sustained yaw excursion from baseline, followed by a
 * return to centre. Roll is checked so a head *tilt* cannot pass as a turn.
 */
function stepHeadTurn(
  state: LivenessState,
  now: number,
  elapsed: number,
  signals: TickSignals
): LivenessState {
  if (elapsed > LIVENESS.TIMEOUT_HEAD_TURN_MS) {
    return fail(state, now, 'TIMEOUT_TURN');
  }

  const yawBase = state.yawBaseline ?? signals.yaw;
  const rollBase = state.rollBaseline ?? signals.roll;

  const yawDiff = angleDelta(signals.yaw, yawBase);
  const rollDiff = Math.abs(angleDelta(signals.roll, rollBase));

  // Direction-agnostic by default; see ENFORCE_TURN_DIRECTION in constants.ts
  // for why, and how to switch it on.
  const effectiveDelta = LIVENESS.ENFORCE_TURN_DIRECTION
    ? yawDiff * LIVENESS.YAW_SIGN
    : Math.abs(yawDiff);

  const peakYawDelta = Math.max(state.peakYawDelta, Math.abs(yawDiff));

  if (state.turnStage === 'AWAIT_TURN') {
    const turnedEnough = effectiveDelta >= LIVENESS.YAW_DELTA_DEG;
    const tiltedNotTurned = rollDiff > LIVENESS.MAX_ROLL_DELTA_DEG;

    if (!turnedEnough || tiltedNotTurned) {
      return {
        ...state,
        turnHeldSince: null,
        peakYawDelta,
        progress: clamp01(Math.abs(yawDiff) / LIVENESS.YAW_DELTA_DEG) * 0.5,
      };
    }

    const since = state.turnHeldSince ?? now;
    if (now - since >= LIVENESS.YAW_HOLD_MS) {
      return { ...state, turnStage: 'AWAIT_RECENTER', turnHeldSince: null, peakYawDelta, progress: 0.6 };
    }
    return {
      ...state,
      turnHeldSince: since,
      peakYawDelta,
      progress: 0.5 + clamp01((now - since) / LIVENESS.YAW_HOLD_MS) * 0.1,
    };
  }

  // AWAIT_RECENTER
  if (Math.abs(yawDiff) <= LIVENESS.YAW_RECENTER_DEG) {
    return enter(state, 'PASSED', now, { progress: 1, peakYawDelta });
  }

  return {
    ...state,
    peakYawDelta,
    progress: clamp01(
      0.6 + (1 - Math.abs(yawDiff) / Math.max(peakYawDelta, 1)) * 0.4
    ),
  };
}

/** Begin a run (or a retry) from IDLE / FAILED. */
export function start(state: LivenessState, now: number): LivenessState {
  const attempt = state.phase === 'FAILED' ? state.attempt + 1 : state.attempt;
  return enter(initialState(now, attempt), 'FACE_SEARCH', now);
}

export const canRetry = (state: LivenessState): boolean =>
  state.attempt < LIVENESS.MAX_ATTEMPTS;
