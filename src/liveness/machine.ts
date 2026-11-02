import { LIVENESS } from './constants';
import { angleDelta, clamp01, normaliseFace } from './signals';
import type { FaceSnapshot, FailReason, FramingIssue, LivenessState, TickInput } from './types';

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
    pitchBaseline: null,
    yawBaseline: null,
    nodStage: 'AWAIT_NOD',
    nodHeldSince: null,
    peakPitchDelta: 0,
    progress: 0,
  };
}

export interface TickSignals {
  yaw: number;
  roll: number;
  pitch: number;
}

function enter(
  state: LivenessState,
  phase: LivenessState['phase'],
  now: number,
  patch: Partial<LivenessState> = {},
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

  if (Math.abs(centerX - LIVENESS.TARGET_CENTER_X) > LIVENESS.CENTER_TOL_X) return 'off-centre';
  if (Math.abs(centerY - LIVENESS.TARGET_CENTER_Y) > LIVENESS.CENTER_TOL_Y) return 'off-centre';

  if (Math.abs(signals.yaw) > LIVENESS.MAX_FRAMING_YAW_DEG) return 'not-frontal';
  if (Math.abs(signals.roll) > LIVENESS.MAX_FRAMING_ROLL_DEG) return 'not-frontal';
  if (Math.abs(signals.pitch) > LIVENESS.MAX_FRAMING_PITCH_DEG) return 'not-frontal';

  return 'none';
}

const SEARCH_RESET: Partial<LivenessState> = {
  framingIssue: 'no-face',
  framingHeldSince: null,
  lastCenterX: null,
  lastCenterY: null,
  multiFaceSince: null,
  pitchBaseline: null,
  yawBaseline: null,
  nodStage: 'AWAIT_NOD',
  nodHeldSince: null,
  peakPitchDelta: 0,
};

/**
 * Two steps: hold a well-framed face still (that frame becomes the profile
 * photo), then nod once — down and back up. A printed photo or a screen
 * held up to the camera can be framed, but it cannot nod.
 */
export function step(state: LivenessState, tick: TickInput, signals: TickSignals): LivenessState {
  const { now, snapshot, faceCount, sinceLastFace } = tick;

  if (state.phase === 'PASSED' || state.phase === 'FAILED' || state.phase === 'IDLE') return state;

  const elapsed = now - state.phaseEnteredAt;
  const lossAllowance =
    state.phase === 'NOD' ? LIVENESS.FACE_LOST_MS * LIVENESS.FACE_LOST_MS_NOD_MULT : LIVENESS.FACE_LOST_MS;

  if (sinceLastFace > lossAllowance) {
    if (state.phase === 'FACE_SEARCH') {
      if (elapsed > LIVENESS.TIMEOUT_FACE_SEARCH_MS) return fail(state, now, 'TIMEOUT_FACE');
      return { ...state, ...SEARCH_RESET, progress: 0 };
    }
    return enter(state, 'FACE_SEARCH', now, SEARCH_RESET);
  }

  if (!snapshot) return state;

  switch (state.phase) {
    case 'FACE_SEARCH':
      return stepFaceSearch(state, now, elapsed, snapshot, signals, faceCount);
    case 'NOD':
      return stepNod(state, now, elapsed, signals);
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
  faceCount: number,
): LivenessState {
  if (elapsed > LIVENESS.TIMEOUT_FACE_SEARCH_MS) return fail(state, now, 'TIMEOUT_FACE');

  const multiFaceSince = faceCount > 1 ? (state.multiFaceSince ?? now) : null;
  const multiFaceConfirmed =
    multiFaceSince != null && now - multiFaceSince >= LIVENESS.MULTI_FACE_GRACE_MS;

  const { centerX, centerY } = normaliseFace(snapshot);
  const settled =
    state.lastCenterX == null ||
    state.lastCenterY == null ||
    Math.hypot(centerX - state.lastCenterX, centerY - state.lastCenterY) <= LIVENESS.CENTER_DRIFT_TOL;

  const issue = multiFaceConfirmed ? 'multiple-faces' : assessFraming(snapshot, signals);
  const tracked = { ...state, lastCenterX: centerX, lastCenterY: centerY, multiFaceSince };

  if (issue !== 'none' || !settled) {
    return { ...tracked, framingIssue: issue, framingHeldSince: null, progress: 0 };
  }

  const heldSince = state.framingHeldSince ?? now;
  const held = now - heldSince;

  if (held >= LIVENESS.FRAMING_HOLD_MS) {
    return enter(tracked, 'NOD', now, {
      framingIssue: 'none',
      framingHeldSince: null,
      pitchBaseline: signals.pitch,
      yawBaseline: signals.yaw,
      nodStage: 'AWAIT_NOD',
      nodHeldSince: null,
      peakPitchDelta: 0,
    });
  }

  return {
    ...tracked,
    framingIssue: 'none',
    framingHeldSince: heldSince,
    progress: clamp01(held / LIVENESS.FRAMING_HOLD_MS),
  };
}

function stepNod(state: LivenessState, now: number, elapsed: number, signals: TickSignals): LivenessState {
  if (elapsed > LIVENESS.TIMEOUT_NOD_MS) return fail(state, now, 'TIMEOUT_NOD');

  const pitchDiff = Math.abs(angleDelta(signals.pitch, state.pitchBaseline ?? signals.pitch));
  const yawDiff = Math.abs(angleDelta(signals.yaw, state.yawBaseline ?? signals.yaw));
  const peakPitchDelta = Math.max(state.peakPitchDelta, pitchDiff);

  if (state.nodStage === 'AWAIT_NOD') {
    // Direction-agnostic: pitch sign differs between devices, and a nod up
    // proves the same thing as a nod down. A head turn is not a nod.
    const nodded = pitchDiff >= LIVENESS.NOD_DELTA_DEG && yawDiff <= LIVENESS.NOD_MAX_YAW_DEG;
    if (!nodded) {
      return {
        ...state,
        nodHeldSince: null,
        peakPitchDelta,
        progress: clamp01(pitchDiff / LIVENESS.NOD_DELTA_DEG) * 0.5,
      };
    }
    const since = state.nodHeldSince ?? now;
    if (now - since >= LIVENESS.NOD_HOLD_MS) {
      return { ...state, nodStage: 'AWAIT_RETURN', nodHeldSince: null, peakPitchDelta, progress: 0.6 };
    }
    return { ...state, nodHeldSince: since, peakPitchDelta, progress: 0.55 };
  }

  if (pitchDiff <= LIVENESS.NOD_RETURN_DEG) {
    return enter(state, 'PASSED', now, { progress: 1, peakPitchDelta });
  }

  return {
    ...state,
    peakPitchDelta,
    progress: clamp01(0.6 + (1 - pitchDiff / Math.max(peakPitchDelta, 1)) * 0.4),
  };
}

export function start(state: LivenessState, now: number): LivenessState {
  const attempt = state.phase === 'FAILED' ? state.attempt + 1 : state.attempt;
  return enter(initialState(now, attempt), 'FACE_SEARCH', now);
}

export const canRetry = (state: LivenessState): boolean => state.attempt < LIVENESS.MAX_ATTEMPTS;
