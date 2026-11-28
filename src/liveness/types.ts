/**
 * IDLE → FACE_SEARCH (find one face) → CHALLENGE (blink or nod, picked at
 * random) → SETTLE (look back at the camera) → PASSED, when the photo is taken.
 */
export type LivenessPhase = 'IDLE' | 'FACE_SEARCH' | 'CHALLENGE' | 'SETTLE' | 'PASSED' | 'FAILED';

/** The action asked of the user. Random per attempt, so a recording can't anticipate it. */
export type ChallengeKind = 'BLINK' | 'NOD';

/** READY: waiting for the action. ACTING: eyes closed / head tipped, waiting for the return. */
export type ChallengeStage = 'READY' | 'ACTING';

export type FailReason = 'TIMEOUT_FACE' | 'TIMEOUT_CHALLENGE';

export type FramingIssue =
  | 'none'
  | 'no-face'
  | 'too-far'
  | 'too-close'
  | 'not-frontal'
  | 'multiple-faces';

export interface FaceSnapshot {
  x: number;
  y: number;
  w: number;
  h: number;
  frameW: number;
  frameH: number;
  yaw: number;
  roll: number;
  pitch: number;
  leftEye: number | null;
  rightEye: number | null;
  t: number;
}

/**
 * Eye-open probability seen across every detector frame since the last tick.
 * A blink can be shorter than one tick, so the extremes are kept rather than
 * only the latest value. null when the detector reported no eye data.
 */
export interface EyeWindow {
  min: number | null;
  max: number | null;
}

export interface TickInput {
  now: number;
  snapshot: FaceSnapshot | null;
  faceCount: number;
  sinceLastFace: number;
  eyes?: EyeWindow;
}

export interface LivenessState {
  phase: LivenessPhase;
  phaseEnteredAt: number;
  attempt: number;
  challenge: ChallengeKind;
  failReason: FailReason | null;
  framingIssue: FramingIssue;

  framingHeldSince: number | null;
  multiFaceSince: number | null;

  stage: ChallengeStage;
  stageSince: number | null;
  /** Eyes have been seen open since the blink challenge began — a closed-eye photo can't "blink". */
  eyesOpenSeen: boolean;
  /** When eye data went missing during a blink challenge, to fall back to a nod. */
  noEyeDataSince: number | null;

  pitchBaseline: number | null;
  yawBaseline: number | null;
  peakPitchDelta: number;

  settledSince: number | null;

  progress: number;
}
