import type { CaptureTarget } from '@/types/models';

export interface CaptureConfig {
  title: string;
  instruction: string;
  facing: 'front' | 'back';
  overlay: 'oval' | 'card' | 'plate';
  confirmLabel: string;
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
    instruction: 'Place your NIN slip or National ID card inside the frame.',
    facing: 'back',
    overlay: 'card',
    confirmLabel: 'Use this photo',
    shortLabel: 'National ID',
  },
  vehicle: {
    title: 'Your vehicle',
    instruction: 'Stand back so the whole vehicle fits in the frame, with the plate visible.',
    facing: 'back',
    overlay: 'card',
    confirmLabel: 'Use this photo',
    shortLabel: 'Vehicle photo',
  },
  plate: {
    title: 'Vehicle plate number',
    instruction: 'Fit the plate inside the frame, edge to edge. Get close enough to read every character.',
    facing: 'back',
    overlay: 'plate',
    confirmLabel: 'Use this scan',
    shortLabel: 'Vehicle plate',
  },
};

export const LIVENESS_COPY = {
  screenTitle: 'Selfie check',
  screenSubtitle:
    "We'll ask you to blink or nod — it shows us it's really you. Then we take your profile photo. It takes about 10 seconds.",

  /** Shown before the check starts. Written for real conditions: harsh sun, dim rooms at night. */
  tips: [
    "Face the light. Don't stand with the sun or a bright window behind you.",
    'Hijab or cap is fine, as long as your whole face shows.',
    'Take off sunglasses. Only you in the picture.',
  ],
  exhausted:
    'Still not working? Move somewhere brighter — outside in the shade is best — then start over.',

  prompts: {
    idle: {
      title: 'Get ready',
      subtitle: 'We need to check that you are really here.',
    },
    searching: {
      title: 'Show us your face',
      subtitle: 'Hold the phone at eye level so your face is in view.',
    },
    tooFar: {
      title: 'Move a little closer',
      subtitle: 'Your face is too small in the picture.',
    },
    tooClose: {
      title: 'Move back slightly',
      subtitle: 'Your face is too close to the camera.',
    },
    notFrontal: {
      title: 'Look at the camera',
      subtitle: 'Face the phone directly to begin.',
    },
    multipleFaces: {
      title: 'More than one face',
      subtitle: 'Make sure you are the only person in the picture.',
    },
    faceFound: {
      title: 'Got you',
      subtitle: 'Stay in view…',
    },
    blink: {
      title: 'Now blink',
      subtitle: 'Close both eyes, then open them again.',
    },
    blinkOpen: {
      title: 'Open your eyes',
      subtitle: 'Look back at the camera.',
    },
    nod: {
      title: 'Now nod your head',
      subtitle: 'Like saying "yes" — down, then back up.',
    },
    nodBack: {
      title: 'Look back up',
      subtitle: 'Bring your head back to face the camera.',
    },
    settle: {
      title: 'Look at the camera',
      subtitle: 'Eyes open — taking your photo…',
    },
    passed: {
      title: 'All done!',
      subtitle: 'Check your photo, then use it or retake it.',
    },
  },

  failures: {
    TIMEOUT_FACE: {
      title: "We couldn't see your face",
      subtitle:
        'It may be too dark. Move near a light or a window, hold the phone at eye level and try again.',
    },
    TIMEOUT_CHALLENGE: {
      title: "We didn't catch that",
      subtitle:
        "No problem — try again. Do it slowly and clearly. You may get a different action this time.",
    },
  },
} as const;

export const OTP_COPY = {
  title: 'Verify your number',
  subtitle: 'Enter the 4-digit code we sent to',
  resend: 'Resend code',
} as const;

export const BOOKING_COPY = {
  searchPlaceholder: 'Where are you going?',
  pickupPlaceholder: 'Pickup location',
  remoteSearching: 'Searching…',
  noResults: 'No matches',
  noResultsHint: 'Try a nearby landmark — for example "Mobil" or "Tunga".',
  findRider: 'Find a rider',
  matchingStages: [
    'Finding riders near you…',
    'Checking who is closest…',
    'Confirming your rider…',
  ],
} as const;
