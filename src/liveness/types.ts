/** Types for the liveness pipeline. Pure data — no React, no camera. */

export type LivenessPhase =
  | 'IDLE'
  | 'FACE_SEARCH'
  | 'BLINK'
  | 'HEAD_TURN'
  | 'PASSED'
  | 'FAILED';

/** Sub-states of the blink check. */
export type BlinkStage = 'AWAIT_OPEN_BASELINE' | 'AWAIT_CLOSE' | 'AWAIT_REOPEN';

/** Sub-states of the head-turn check. */
export type TurnStage = 'AWAIT_TURN' | 'AWAIT_RECENTER';

export type FailReason =
  | 'TIMEOUT_FACE'
  | 'TIMEOUT_BLINK'
  | 'TIMEOUT_TURN'
  | 'MULTIPLE_FACES'
  | 'FACE_LOST';

/** Why framing isn't yet acceptable — drives the on-screen coaching prompt. */
export type FramingIssue =
  | 'none'
  | 'no-face'
  | 'too-far'
  | 'too-close'
  | 'off-centre'
  | 'not-frontal';

/**
 * A plain-object copy of a detected face.
 *
 * CRITICAL: this exists because the library's `Face` is a Nitro HybridObject
 * backed by native memory. It cannot be spread, serialized, or read after the
 * detector callback returns. Everything downstream works with this instead.
 */
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
  /** null when the classifier didn't report a value — a dropout, NOT a closure. */
  leftEye: number | null;
  rightEye: number | null;
  t: number;
}

/** One evaluation step's input. */
export interface TickInput {
  now: number;
  snapshot: FaceSnapshot | null;
  faceCount: number;
  /** ms since a face was last seen. */
  sinceLastFace: number;
}

export interface LivenessState {
  phase: LivenessPhase;
  /** When the current phase was entered — all timeouts derive from this. */
  phaseEnteredAt: number;
  attempt: number;
  failReason: FailReason | null;
  framingIssue: FramingIssue;

  // framing
  framingHeldSince: number | null;
  yawBaseline: number | null;
  rollBaseline: number | null;

  // blink
  blinkStage: BlinkStage;
  eyesOpenSince: number | null;
  eyesClosedAt: number | null;
  reopenSamples: number;
  /** Set when a blink was detected but rejected, so the UI can say "try again". */
  blinkRetried: boolean;

  // head turn
  turnStage: TurnStage;
  turnHeldSince: number | null;
  /** Peak absolute yaw delta seen this attempt — drives the progress ring. */
  peakYawDelta: number;

  /** 0..1 progress through the current phase, for the UI. */
  progress: number;
}
