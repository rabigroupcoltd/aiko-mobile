/**
 * Tuned to be forgiving. The camera is full screen with no guide to line up
 * against: any single, reasonably sized, roughly front-on face counts. Proof of
 * life comes from the random challenge, not from precise framing.
 */
export const LIVENESS = {
  TICK_MS: 100,

  /** A face may vanish this long (motion blur, a nod, a detector hiccup) before progress is lost. */
  FACE_LOST_MS: 1_500,
  MULTI_FACE_GRACE_MS: 800,

  // Face width as a share of the shorter side of the camera frame. Using the
  // shorter side keeps this right whichever way the sensor frame is rotated.
  MIN_FACE_SIZE: 0.18,
  MAX_FACE_SIZE: 0.95,
  MAX_FRAMING_YAW_DEG: 25,
  MAX_FRAMING_ROLL_DEG: 25,
  MAX_FRAMING_PITCH_DEG: 25,
  /** How long a usable face must stay in view before the challenge starts. */
  FRAMING_HOLD_MS: 500,
  /** A coaching message must persist this long before it replaces the one on screen. */
  PROMPT_SETTLE_MS: 350,

  MEDIAN_WINDOW: 3,
  EMA_ALPHA: 0.55,

  // Blink: eye-open probability (ML Kit, 0–1, the less-open eye of the two).
  EYE_OPEN: 0.6,
  EYE_CLOSED: 0.3,
  /** Eyes shut longer than this is not a blink; start the blink over. */
  BLINK_MAX_CLOSED_MS: 2_000,
  /** No eye data for this long during a blink challenge switches it to a nod. */
  NO_EYE_DATA_FALLBACK_MS: 2_500,

  // Nod: pitch change from the angle the challenge started at, either direction.
  NOD_DELTA_DEG: 10,
  /** Back up counts once within this many degrees of the start... */
  NOD_RETURN_DEG: 7,
  /** ...or once half of the furthest tip has been undone, whichever is easier. */
  NOD_RETURN_SHARE: 0.5,
  NOD_MAX_YAW_DEG: 20,

  // Settle: after the challenge, wait briefly for a front-on, eyes-open pose
  // so the photo is a good one — but never block on it.
  SETTLE_MAX_YAW_DEG: 18,
  SETTLE_MAX_PITCH_DELTA_DEG: 12,
  SETTLE_HOLD_MS: 300,
  SETTLE_MAX_MS: 2_500,

  TIMEOUT_FACE_SEARCH_MS: 60_000,
  TIMEOUT_CHALLENGE_MS: 20_000,
  MAX_ATTEMPTS: 3,
} as const;

export type LivenessConstants = typeof LIVENESS;
