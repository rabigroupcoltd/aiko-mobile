import type { AccountType } from '@/modules/shared/apiTypes';

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
  rejectionReason: string | null;
}

export interface OnboardingState {
  resumeStep: OnboardingStep;
  recordedStep: OnboardingStep;
  stepIndex: number;
  totalSteps: number;
  completed: boolean;
  completedAt: string | null;
  accountType: AccountType | null;
  passengerReady: boolean;
  driver: OnboardingDriverState;
  requirements: OnboardingRequirements;
}

export interface UpdateOnboardingPayload {
  step?: OnboardingStep;

  firstName?: string;
  lastName?: string;
  email?: string;
  dob?: string;
  phone?: string;

  profilePhotoUrl?: string;
  profilePhotoKey?: string;

  livenessPassed?: boolean;

  accountType?: AccountType;
}
