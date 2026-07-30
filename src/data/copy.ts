import type { CaptureTarget } from '@/types/models';

/**
 * Single source of truth for user-facing strings.
 *
 * CAPTURE_CONFIG in particular is what makes one CameraCapture component serve
 * four different flows — adding a fifth document type is a data change here,
 * not a new screen.
 */

export interface CaptureConfig {
  title: string;
  instruction: string;
  facing: 'front' | 'back';
  overlay: 'oval' | 'card' | 'plate';
  confirmLabel: string;
  /** Shown on the screen that owns this asset. */
  shortLabel: string;
}

export const CAPTURE_CONFIG: Record<CaptureTarget, CaptureConfig> = {
  profile: {
    title: 'Profile photo',
    instruction: 'Centre your face in the circle and look straight ahead.',
    facing: 'front',
    overlay: 'oval',
    confirmLabel: 'Use this photo',
    shortLabel: 'Profile photo',
  },
  license: {
    title: "Driver's licence",
    instruction: 'Place your licence flat inside the frame. Make sure all four corners are visible.',
    facing: 'back',
    overlay: 'card',
    confirmLabel: 'Use this photo',
    shortLabel: "Driver's licence",
  },
  nationalId: {
    title: 'National ID',
    instruction: 'Place your NIN slip or national ID card inside the frame.',
    facing: 'back',
    overlay: 'card',
    confirmLabel: 'Use this photo',
    shortLabel: 'National ID',
  },
  plate: {
    title: 'Vehicle plate number',
    instruction: 'Take a clear photo of your plate number. Get close enough to read it.',
    facing: 'back',
    overlay: 'plate',
    confirmLabel: 'Use this photo',
    shortLabel: 'Vehicle plate',
  },
};

export const LIVENESS_COPY = {
  screenTitle: 'Liveness check',
  screenSubtitle: 'This confirms you are a real person, not a photo.',

  prompts: {
    idle: {
      title: 'Get ready',
      subtitle: 'We need to check that you are really here.',
    },
    searching: {
      title: 'Position your face',
      subtitle: 'Fit your face inside the oval.',
    },
    tooFar: {
      title: 'Move a little closer',
      subtitle: 'Your face is too small in the frame.',
    },
    tooClose: {
      title: 'Move back slightly',
      subtitle: 'Your face is too close to the camera.',
    },
    offCentre: {
      title: 'Centre your face',
      subtitle: 'Line your face up with the oval.',
    },
    notFrontal: {
      title: 'Look straight ahead',
      subtitle: 'Face the camera directly to begin.',
    },
    multipleFaces: {
      title: 'More than one face',
      subtitle: 'Make sure you are the only person in the frame.',
    },
    holdStill: {
      title: 'Hold still',
      subtitle: 'Almost there…',
    },
    blink: {
      title: 'Now blink',
      subtitle: 'Blink once, naturally.',
    },
    blinkAgain: {
      title: 'Blink once more',
      subtitle: "That didn't quite register — try a normal, quick blink.",
    },
    headTurn: {
      title: 'Turn your head',
      subtitle: 'Slowly turn your head to one side.',
    },
    headTurnBack: {
      title: 'Now face forward again',
      subtitle: 'Bring your head back to the centre.',
    },
    passed: {
      title: 'Liveness confirmed',
      subtitle: 'You are verified as a real person.',
    },
  },

  // Only timeouts reach this state. Face conditions — no face, several faces, a
  // bad pose — are coached via `prompts` while the clock runs, never failed on.
  failures: {
    TIMEOUT_FACE: {
      title: 'That took too long',
      subtitle:
        'Hold the phone steady at eye level, centre your face in the oval, and try again.',
    },
    TIMEOUT_BLINK: {
      title: "We didn't detect a blink",
      subtitle: 'Try again in better light, and blink normally rather than slowly.',
    },
    TIMEOUT_TURN: {
      title: "We didn't detect a head turn",
      subtitle: 'Turn your head a little further to one side, then face forward again.',
    },
  },
} as const;

export const OTP_COPY = {
  title: 'Verify your number',
  subtitle: 'Enter the 4-digit code we sent to',
  resend: 'Resend code',
  demoHint: 'Demo mode — any 4 digits will work.',
} as const;

export const BOOKING_COPY = {
  searchPlaceholder: 'Where are you going?',
  pickupPlaceholder: 'Pickup location',
  cacheHitBadge: 'Cached',
  remoteSearching: 'Checking wider area…',
  noResults: 'No saved address matches that',
  noResultsHint: 'Try a nearby landmark — for example "Mobil" or "Tunga".',
  findRider: 'Find a rider',
  matchingStages: [
    'Finding riders near you…',
    'Checking who is closest…',
    'Confirming your rider…',
  ],
} as const;
