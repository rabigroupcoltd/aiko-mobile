export type LivenessPhase = 'IDLE' | 'FACE_SEARCH' | 'NOD' | 'PASSED' | 'FAILED';

export type NodStage = 'AWAIT_NOD' | 'AWAIT_RETURN';

export type FailReason = 'TIMEOUT_FACE' | 'TIMEOUT_NOD';

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

  pitchBaseline: number | null;
  yawBaseline: number | null;
  nodStage: NodStage;
  nodHeldSince: number | null;
  peakPitchDelta: number;

  progress: number;
}
