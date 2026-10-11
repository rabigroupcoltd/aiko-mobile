import { LIVENESS } from './constants';
import { angleDelta, clamp01, normaliseFace } from './signals';
import type {
  FaceSnapshot,
  FailReason,
  FramingIssue,
  LivenessState,
  TickInput,
} from './types';

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

export interface TickSignals {
  eye: number | null;
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

function assessFraming(s: FaceSnapshot, signals: TickSignals): FramingIssue {
  const { centerX, centerY, widthRatio } = normaliseFace(s);

  if (widthRatio < LIVENESS.MIN_FACE_RATIO) return 'too-far';
  if (widthRatio > LIVENESS.MAX_FACE_RATIO) return 'too-close';

  if (Math.abs(centerX - LIVENESS.TARGET_CENTER_X) > LIVENESS.CENTER_TOL_X)
    return 'off-centre';
  if (Math.abs(centerY - LIVENESS.TARGET_CENTER_Y) > LIVENESS.CENTER_TOL_Y)
    return 'off-centre';

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

  if (state.phase === 'PASSED' || state.phase === 'FAILED') return state;

  if (state.phase === 'IDLE') return state;

  const elapsed = now - state.phaseEnteredAt;

  const lossAllowance =
    state.phase === 'HEAD_TURN'
      ? LIVENESS.FACE_LOST_MS * LIVENESS.FACE_LOST_MS_TURN_MULT
      : LIVENESS.FACE_LOST_MS;

  if (sinceLastFace > lossAllowance) {
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

  const settled =
    state.lastCenterX == null ||
    state.lastCenterY == null ||
    Math.hypot(centerX - state.lastCenterX, centerY - state.lastCenterY) <=
      LIVENESS.CENTER_DRIFT_TOL;

  const issue = multiFaceConfirmed ? 'multiple-faces' : assessFraming(snapshot, signals);

  const tracked = {
    ...state,
    lastCenterX: centerX,
    lastCenterY: centerY,
    multiFaceSince,
  };

  if (issue !== 'none' || !settled) {
    return { ...tracked, framingIssue: issue, framingHeldSince: null, progress: 0 };
  }

  const heldSince = state.framingHeldSince ?? now;
  const held = now - heldSince;

  if (held >= LIVENESS.FRAMING_HOLD_MS) {
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

export function start(state: LivenessState, now: number): LivenessState {
  const attempt = state.phase === 'FAILED' ? state.attempt + 1 : state.attempt;
  return enter(initialState(now, attempt), 'FACE_SEARCH', now);
}

export const canRetry = (state: LivenessState): boolean =>
  state.attempt < LIVENESS.MAX_ATTEMPTS;
