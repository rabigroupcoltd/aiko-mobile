/**
 * Demo-only switches.
 *
 * Everything here exists to keep a live stakeholder walkthrough moving when
 * hardware or lighting misbehaves. All of it is gated on __DEV__ and must be
 * removed (or forced false) before anything resembling a real release.
 */
export const featureFlags = {
  /**
   * NOT a demo switch — a product decision, and the one flag here that is
   * deliberately not gated on __DEV__.
   *
   * The first launch goes out with Google as the way in: the user types their
   * phone number so we can reach them about trips, and we do not send an SMS
   * code. Flip this to true to put the OTP step back in front of the profile
   * form; `OtpScreen` and the whole OTP path stay wired up for that.
   *
   * An unverified number is recorded as `phoneProvided`, never `phoneVerified` —
   * see the store. Nothing may treat a typed-in number as a verified one.
   */
  REQUIRE_OTP: false,

  /**
   * Shows a "Skip liveness" button on the liveness screen, and enables the
   * five-tap-on-title gesture that force-passes it.
   *
   * Harsh backlight or a projector-lit conference room can defeat ML Kit's eye
   * classifier, and a demo that dead-ends at identity verification is a bad
   * demo. The real check still runs — this is only an escape hatch.
   */
  DEMO_BYPASS_LIVENESS: __DEV__,

  /** Live yaw/roll/pitch/eye-probability readout over the liveness camera. */
  SHOW_LIVENESS_DEBUG: __DEV__,

  /** Dev panel in the drawer: reset demo, switch role, approve rider. */
  SHOW_DEV_PANEL: __DEV__,

  /** Simulated network latency for mocked "server" calls, in ms. */
  FAKE_DELAY_MS: 1500,

  /** How long the "searching for a rider" animation runs. */
  MATCHING_DURATION_MS: 2800,

  /** Simulated latency for an address that misses the local cache. */
  REMOTE_LOOKUP_MS: 900,
} as const;
