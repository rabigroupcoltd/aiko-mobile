export type LivenessPhase =
  | 'IDLE'
  | 'FACE_SEARCH'
  | 'BLINK'
  | 'HEAD_TURN'
  | 'PASSED'
  | 'FAILED';

export type BlinkStage = 'AWAIT_OPEN_BASELINE' | 'AWAIT_CLOSE' | 'AWAIT_REOPEN';

export type TurnStage = 'AWAIT_TURN' | 'AWAIT_RECENTER';

export type FailReason = 'TIMEOUT_FACE' | 'TIMEOUT_BLINK' | 'TIMEOUT_TURN';

export type FramingIssue =
  | 'none'
  | 'no-face'
  | 'too-far'
  | 'too-close'
  | 'off-centre'
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

export interface TickInput {
  now: number;
  snapshot: FaceSnapshot | null;
  faceCount: number;
  sinceLastFace: number;
}

export interface LivenessState {
  phase: LivenessPhase;
  phaseEnteredAt: number;
  attempt: number;
  failReason: FailReason | null;
  framingIssue: FramingIssue;

  framingHeldSince: number | null;
  lastCenterX: number | null;
  lastCenterY: number | null;
  multiFaceSince: number | null;
  yawBaseline: number | null;
  rollBaseline: number | null;

  blinkStage: BlinkStage;
  eyesOpenSince: number | null;
  eyesClosedAt: number | null;
  reopenSamples: number;
  blinkRetried: boolean;

  turnStage: TurnStage;
  turnHeldSince: number | null;
  peakYawDelta: number;

  progress: number;
}
