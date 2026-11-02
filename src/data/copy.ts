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
    instruction: 'Place your NIN slip or national ID card inside the frame.',
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
    instruction: 'Take a clear photo of your plate number. Get close enough to read it.',
    facing: 'back',
    overlay: 'plate',
    confirmLabel: 'Use this photo',
    shortLabel: 'Vehicle plate',
  },
};

export const LIVENESS_COPY = {
  screenTitle: 'Selfie check',
  screenSubtitle:
    'Look at the camera, then nod once. This takes your profile photo and confirms you are a real person.',

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
      subtitle: 'Taking your photo…',
    },
    nod: {
      title: 'Now nod your head',
      subtitle: 'Slowly nod down, then look back up.',
    },
    nodBack: {
      title: 'Look back up',
      subtitle: 'Bring your head back to the centre.',
    },
    passed: {
      title: 'All done!',
      subtitle: "You're verified, and we've saved your profile photo.",
    },
  },

  failures: {
    TIMEOUT_FACE: {
      title: 'That took too long',
      subtitle:
        'Hold the phone steady at eye level, centre your face in the oval, and try again.',
    },
    TIMEOUT_NOD: {
      title: "We didn't see a nod",
      subtitle: 'Nod a little further down, then look back up. Good light helps.',
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
