
export const LIVENESS = {
  // ── engine ────────────────────────────────────────────────────────────────
  /** FSM evaluation rate. Decoupled from camera fps so timings are portable. */
  TICK_MS: 100,
  /** Ring buffer depth (~1.6s of history at 10Hz). */
  SAMPLE_BUFFER: 16,
  /** No face for this long regresses the current phase. */
  FACE_LOST_MS: 700,
  /** Head-turn tolerates longer loss — extreme angles legitimately drop tracking. */
  FACE_LOST_MS_TURN_MULT: 2,
  /**
   * How long a second face must persist before we coach about it.
   *
   * Extra faces are COACHING, never a failure: nothing about the face itself
   * ends an attempt any more, only the phase timers do. The grace exists because
   * ML Kit reports a phantom second face for a frame or two often enough that
   * reacting instantly would keep resetting the framing hold for no reason.
   */
  MULTI_FACE_GRACE_MS: 600,

  // ── framing (normalised against face.frameWidth / frameHeight) ─────────────
  TARGET_CENTER_X: 0.5,
  /** Slightly above centre — phones are held below eye level. */
  TARGET_CENTER_Y: 0.45,
  /**
   * Centring tolerance. Tight on purpose: the capture has to happen with the
   * face genuinely in the middle of the oval, not merely somewhere inside it.
   */
  CENTER_TOL_X: 0.14,
  CENTER_TOL_Y: 0.16,
  /** Face width as a fraction of frame width. Below this: "move closer". */
  MIN_FACE_RATIO: 0.26,
  /** Above this: "move back". */
  MAX_FACE_RATIO: 0.68,
  /**
   * Maximum head tilt and up/down angle still considered "facing the camera".
   * Framing previously gated on yaw alone, so a head tilted or tipped well back
   * counted as frontal and became the pose baseline.
   */
  MAX_FRAMING_ROLL_DEG: 15,
  MAX_FRAMING_PITCH_DEG: 15,
  /**
   * Maximum movement of the face centre between two ticks (normalised, ~100ms
   * apart) for the face to count as settled.
   *
   * This is the "truly focused" half of the gate: framing that is momentarily
   * correct while the head is still moving would otherwise satisfy the hold, and
   * the capture landed mid-movement — off-centre and motion-blurred.
   */
  CENTER_DRIFT_TOL: 0.035,
  /**
   * How long every framing condition — including steadiness — must hold before
   * advancing. Longer than a reflex, so this cannot be satisfied in passing.
   */
  FRAMING_HOLD_MS: 900,

  // ── blink ─────────────────────────────────────────────────────────────────
  /** Fused eye probability at or below this counts as closed. */
  EYE_LOW: 0.22,
  /** At or above this counts as open. The gap gives hysteresis. */
  EYE_HIGH: 0.62,
  /** Eyes must be open this long before we start looking for a blink. */
  EYE_OPEN_BASELINE_MS: 400,
  /** Shorter than this is sensor noise, not a blink. */
  BLINK_MIN_MS: 80,
  /** Longer than this means eyes held shut — restart, don't accept. */
  BLINK_MAX_MS: 700,
  /** Consecutive open samples required to confirm the re-open. */
  BLINK_REOPEN_SAMPLES: 2,
  /** Median-of-N over raw samples, to kill single-frame dropouts. */
  MEDIAN_WINDOW: 3,
  /**
   * EMA smoothing factor. Deliberately high (fast-responding).
   * A blink is 100-400ms — only 1-4 ticks. Over-smoothing (alpha <= 0.2)
   * flattens the dip above EYE_LOW and makes the check impossible to pass.
   * This is the most likely tuning mistake.
   */
  EMA_ALPHA: 0.55,

  // ── head turn ─────────────────────────────────────────────────────────────
  YAW_BASELINE_SAMPLES: 8,
  /** Baseline is only accepted from a near-frontal pose. */
  YAW_BASELINE_MAX_DEG: 18,
  /** Required yaw excursion from baseline. */
  YAW_DELTA_DEG: 20,
  /** How long the excursion must hold. */
  YAW_HOLD_MS: 250,
  /** Must return within this of baseline to complete the step. */
  YAW_RECENTER_DEG: 12,
  /** Rejects a head tilt masquerading as a turn. */
  MAX_ROLL_DELTA_DEG: 22,
  /**
   * When false, a turn in EITHER direction is accepted and the prompt says
   * "to one side" rather than naming a side.
   *
   * ML Kit's yawAngle is defined against the image buffer, whose handedness
   * varies with sensor orientation and platform — so "left" is positive on some
   * devices and negative on others. For a stakeholder demo, silently rejecting
   * a correctly-turned head is far worse than not naming the direction, and a
   * flat photo still cannot fake a 20-degree excursion plus a re-centre.
   *
   * To enable direction enforcement: read the debug overlay on-device, set
   * YAW_SIGN so that turning left produces a positive delta, then flip this.
   */
  ENFORCE_TURN_DIRECTION: false,
  YAW_SIGN: 1,

  // ── timeouts / retries ────────────────────────────────────────────────────
  /**
   * The ONLY thing that ends an attempt. Raised alongside the stricter framing
   * gate above: a tighter gate takes longer to satisfy, and the retry button
   * should appear because time ran out, not because the face wobbled.
   */
  TIMEOUT_FACE_SEARCH_MS: 35_000,
  TIMEOUT_BLINK_MS: 15_000,
  TIMEOUT_HEAD_TURN_MS: 18_000,
  MAX_ATTEMPTS: 3,
  /** Hold the failure state briefly so it registers before offering retry. */
  FAIL_COOLDOWN_MS: 1_200,
} as const;

export type LivenessConstants = typeof LIVENESS;
