import { LIVENESS } from './constants';
import { angleDelta, clamp01 } from './signals';
import type {
  ChallengeKind,
  EyeWindow,
  FaceSnapshot,
  FailReason,
  FramingIssue,
  LivenessState,
  TickInput,
} from './types';

export interface TickSignals {
  yaw: number;
  roll: number;
  pitch: number;
}

const NO_EYES: EyeWindow = { min: null, max: null };

export function pickChallenge(random: () => number = Math.random): ChallengeKind {
  return random() < 0.5 ? 'BLINK' : 'NOD';
}

const CHALLENGE_RESET: Partial<LivenessState> = {
  stage: 'READY',
  stageSince: null,
  eyesOpenSeen: false,
  noEyeDataSince: null,
  pitchBaseline: null,
  yawBaseline: null,
  peakPitchDelta: 0,
  settledSince: null,
};

const SEARCH_RESET: Partial<LivenessState> = {
  ...CHALLENGE_RESET,
  framingIssue: 'no-face',
  framingHeldSince: null,
  multiFaceSince: null,
};

export function initialState(now: number, attempt = 1, challenge: ChallengeKind = 'BLINK'): LivenessState {
  return {
    phase: 'IDLE',
    phaseEnteredAt: now,
    attempt,
    challenge,
    failReason: null,
    framingIssue: 'no-face',
    framingHeldSince: null,
    multiFaceSince: null,
    stage: 'READY',
    stageSince: null,
    eyesOpenSeen: false,
    noEyeDataSince: null,
    pitchBaseline: null,
    yawBaseline: null,
    peakPitchDelta: 0,
    settledSince: null,
    progress: 0,
  };
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

/** Face width as a share of the frame's shorter side — orientation-independent. */
export function faceSize(face: FaceSnapshot): number {
  const short = Math.min(face.frameW || 1, face.frameH || 1);
  return face.w / short;
}

/** Deliberately loose: the camera is full screen, so position doesn't matter. */
function assessFraming(face: FaceSnapshot, signals: TickSignals): FramingIssue {
  const size = faceSize(face);
  if (size < LIVENESS.MIN_FACE_SIZE) return 'too-far';
  if (size > LIVENESS.MAX_FACE_SIZE) return 'too-close';
  if (Math.abs(signals.yaw) > LIVENESS.MAX_FRAMING_YAW_DEG) return 'not-frontal';
  if (Math.abs(signals.roll) > LIVENESS.MAX_FRAMING_ROLL_DEG) return 'not-frontal';
  if (Math.abs(signals.pitch) > LIVENESS.MAX_FRAMING_PITCH_DEG) return 'not-frontal';
  return 'none';
}

/**
 * One tick of the check. A printed photo or a phone screen held to the camera
 * can be framed, but it cannot blink or nod on request — and which of the two
 * is asked for is only decided when the attempt starts.
 */
export function step(state: LivenessState, tick: TickInput, signals: TickSignals): LivenessState {
  const { now, snapshot, faceCount, sinceLastFace } = tick;
  const eyes = tick.eyes ?? NO_EYES;

  if (state.phase === 'PASSED' || state.phase === 'FAILED' || state.phase === 'IDLE') return state;

  const elapsed = now - state.phaseEnteredAt;

  if (sinceLastFace > LIVENESS.FACE_LOST_MS) {
    if (state.phase === 'FACE_SEARCH') {
      if (elapsed > LIVENESS.TIMEOUT_FACE_SEARCH_MS) return fail(state, now, 'TIMEOUT_FACE');
      return { ...state, ...SEARCH_RESET, progress: 0 };
    }
    // Losing the face mid-challenge isn't a failure, but the photo must be of
    // the person who did the challenge, so it starts again from finding them.
    return enter(state, 'FACE_SEARCH', now, SEARCH_RESET);
  }

  if (!snapshot) return state;

  switch (state.phase) {
    case 'FACE_SEARCH':
      return stepFaceSearch(state, now, elapsed, snapshot, signals, faceCount);
    case 'CHALLENGE':
      return stepChallenge(state, now, elapsed, signals, eyes);
    case 'SETTLE':
      return stepSettle(state, now, elapsed, signals, eyes);
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

  // Any second face blocks progress at once; the grace period only delays the
  // message, so a one-frame detector ghost doesn't flash a warning.
  const multiFaceSince = faceCount > 1 ? (state.multiFaceSince ?? now) : null;
  if (multiFaceSince != null) {
    const confirmed = now - multiFaceSince >= LIVENESS.MULTI_FACE_GRACE_MS;
    return {
      ...state,
      multiFaceSince,
      framingIssue: confirmed ? 'multiple-faces' : state.framingIssue,
      framingHeldSince: null,
      progress: 0,
    };
  }
  const issue = assessFraming(snapshot, signals);

  if (issue !== 'none') {
    return { ...state, multiFaceSince, framingIssue: issue, framingHeldSince: null, progress: 0 };
  }

  const heldSince = state.framingHeldSince ?? now;
  const held = now - heldSince;

  if (held >= LIVENESS.FRAMING_HOLD_MS) {
    return enter(state, 'CHALLENGE', now, {
      ...CHALLENGE_RESET,
      multiFaceSince,
      framingIssue: 'none',
      framingHeldSince: null,
      pitchBaseline: signals.pitch,
      yawBaseline: signals.yaw,
    });
  }

  return {
    ...state,
    multiFaceSince,
    framingIssue: 'none',
    framingHeldSince: heldSince,
    progress: clamp01(held / LIVENESS.FRAMING_HOLD_MS),
  };
}

function toSettle(state: LivenessState, now: number): LivenessState {
  return enter(state, 'SETTLE', now, { settledSince: null, stage: 'READY', stageSince: null });
}

function stepChallenge(
  state: LivenessState,
  now: number,
  elapsed: number,
  signals: TickSignals,
  eyes: EyeWindow,
): LivenessState {
  if (elapsed > LIVENESS.TIMEOUT_CHALLENGE_MS) return fail(state, now, 'TIMEOUT_CHALLENGE');
  return state.challenge === 'BLINK'
    ? stepBlink(state, now, signals, eyes)
    : stepNod(state, now, signals);
}

function stepBlink(state: LivenessState, now: number, signals: TickSignals, eyes: EyeWindow): LivenessState {
  // Some devices never report eye probabilities. Rather than wait out the
  // timeout, ask for a nod instead — still a live action.
  if (eyes.min == null && eyes.max == null) {
    const since = state.noEyeDataSince ?? now;
    if (now - since >= LIVENESS.NO_EYE_DATA_FALLBACK_MS) {
      return enter(state, 'CHALLENGE', now, {
        ...CHALLENGE_RESET,
        challenge: 'NOD',
        pitchBaseline: signals.pitch,
        yawBaseline: signals.yaw,
      });
    }
    return { ...state, noEyeDataSince: since };
  }

  const open = eyes.max != null && eyes.max >= LIVENESS.EYE_OPEN;
  const closed = eyes.min != null && eyes.min <= LIVENESS.EYE_CLOSED;
  const base = { ...state, noEyeDataSince: null };

  if (state.stage === 'READY') {
    // A blink faster than one tick shows up as open and closed together —
    // count it, as long as the eyes were already seen open before.
    if (state.eyesOpenSeen && closed && open) return toSettle(base, now);
    if (state.eyesOpenSeen && closed) {
      return { ...base, stage: 'ACTING', stageSince: now, progress: 0.6 };
    }
    return { ...base, eyesOpenSeen: state.eyesOpenSeen || open, progress: open ? 0.2 : 0 };
  }

  if (open) return toSettle(base, now);
  if (now - (state.stageSince ?? now) > LIVENESS.BLINK_MAX_CLOSED_MS) {
    return { ...base, stage: 'READY', stageSince: null, eyesOpenSeen: false, progress: 0 };
  }
  return base;
}

function stepNod(state: LivenessState, now: number, signals: TickSignals): LivenessState {
  const pitchDiff = Math.abs(angleDelta(signals.pitch, state.pitchBaseline ?? signals.pitch));
  const yawDiff = Math.abs(angleDelta(signals.yaw, state.yawBaseline ?? signals.yaw));
  const peakPitchDelta = Math.max(state.peakPitchDelta, pitchDiff);

  if (state.stage === 'READY') {
    // Either direction: pitch sign varies between devices, and a nod up proves
    // the same as a nod down. A head turn is not a nod.
    if (pitchDiff >= LIVENESS.NOD_DELTA_DEG && yawDiff <= LIVENESS.NOD_MAX_YAW_DEG) {
      return { ...state, stage: 'ACTING', stageSince: now, peakPitchDelta, progress: 0.6 };
    }
    return {
      ...state,
      peakPitchDelta,
      progress: clamp01(pitchDiff / LIVENESS.NOD_DELTA_DEG) * 0.5,
    };
  }

  const returnedWithin = Math.max(LIVENESS.NOD_RETURN_DEG, peakPitchDelta * LIVENESS.NOD_RETURN_SHARE);
  if (pitchDiff <= returnedWithin) return toSettle({ ...state, peakPitchDelta }, now);

  return {
    ...state,
    peakPitchDelta,
    progress: clamp01(0.6 + (1 - pitchDiff / Math.max(peakPitchDelta, 1)) * 0.4),
  };
}

/** Waits for a front-on, eyes-open pose for the photo, up to a short limit. */
function stepSettle(
  state: LivenessState,
  now: number,
  elapsed: number,
  signals: TickSignals,
  eyes: EyeWindow,
): LivenessState {
  if (elapsed >= LIVENESS.SETTLE_MAX_MS) return enter(state, 'PASSED', now, { progress: 1 });

  const pitchDiff = Math.abs(angleDelta(signals.pitch, state.pitchBaseline ?? signals.pitch));
  const eyesOk = eyes.max == null || eyes.max >= LIVENESS.EYE_OPEN;
  const good =
    Math.abs(signals.yaw) <= LIVENESS.SETTLE_MAX_YAW_DEG &&
    pitchDiff <= LIVENESS.SETTLE_MAX_PITCH_DELTA_DEG &&
    eyesOk;

  if (!good) return { ...state, settledSince: null, progress: 0 };

  const since = state.settledSince ?? now;
  if (now - since >= LIVENESS.SETTLE_HOLD_MS) return enter(state, 'PASSED', now, { progress: 1 });
  return { ...state, settledSince: since, progress: clamp01((now - since) / LIVENESS.SETTLE_HOLD_MS) };
}

/** Starts (or restarts) an attempt with a freshly picked challenge. */
export function start(
  state: LivenessState,
  now: number,
  challenge: ChallengeKind = pickChallenge(),
): LivenessState {
  const attempt = state.phase === 'FAILED' ? state.attempt + 1 : state.attempt;
  return enter(initialState(now, attempt, challenge), 'FACE_SEARCH', now);
}

export const canRetry = (state: LivenessState): boolean => state.attempt < LIVENESS.MAX_ATTEMPTS;
