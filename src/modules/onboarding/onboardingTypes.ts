import type { AccountType } from '@/modules/shared/apiTypes';

/**
 * One value per screen the user must clear.
 *
 * The last two are rider-only: RIDER_DOCS is the vehicle registration, and
 * AWAITING_APPROVAL is the wait for an admin to clear the KYC.
 */
export const ONBOARDING_STEPS = [
  'PHONE',
  'PROFILE',
  'PHOTO',
  'LIVENESS',
  'USER_TYPE',
  'RIDER_DOCS',
  'AWAITING_APPROVAL',
  'DONE',
] as const;

export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

export type DriverApprovalStatus =
  | 'NOT_APPLICABLE'
  | 'NOT_SUBMITTED'
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED';

export interface OnboardingRequirements {
  phone: boolean;
  profile: boolean;
  photo: boolean;
  liveness: boolean;
  accountType: boolean;
  vehicleDetails: boolean;
  adminApproval: boolean;
}

export interface OnboardingDriverState {
  status: DriverApprovalStatus;
  driverId: string | null;
  /** Set when status is REJECTED — show it so they know what to re-shoot. */
  rejectionReason: string | null;
}

export interface OnboardingState {
  /**
   * The screen to navigate to. Derived server-side from what has actually been
   * saved, so it survives the app being killed mid-step.
   */
  resumeStep: OnboardingStep;
  /** The client's own breadcrumb. `resumeStep` wins when they disagree. */
  recordedStep: OnboardingStep;
  stepIndex: number;
  /** Riders have two extra screens, so this is account-type dependent. */
  totalSteps: number;
  completed: boolean;
  completedAt: string | null;
  accountType: AccountType | null;
  /**
   * True once the shared steps are done. Gate app access on THIS, not
   * `completed` — every driver is a passenger by default, so a rider waiting
   * on KYC can already book trips.
   */
  passengerReady: boolean;
  driver: OnboardingDriverState;
  requirements: OnboardingRequirements;
}

/**
 * One body for every onboarding screen — send only the fields that screen
 * captured. Everything is optional so a single endpoint serves them all.
 */
export interface UpdateOnboardingPayload {
  step?: OnboardingStep;

  // profile step
  firstName?: string;
  lastName?: string;
  email?: string;
  /** ISO date, e.g. "1998-04-12". The app enforces 18+. */
  dob?: string;
  phone?: string;

  // photo step
  profilePhotoUrl?: string;
  profilePhotoKey?: string;

  // liveness step
  livenessPassed?: boolean;

  // user type step
  accountType?: AccountType;
}
