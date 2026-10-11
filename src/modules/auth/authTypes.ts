import type {
  AccountType,
  AuthProvider,
  UserRole,
} from '@/modules/shared/apiTypes';
import type { DriverProfile } from '@/modules/drivers/driversTypes';
import type { OnboardingState } from '@/modules/onboarding/onboardingTypes';

export interface AuthUser {
  id: string;
  email: string | null;
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  dob: string | null;
  photoUrl: string | null;
  profilePhotoUrl: string | null;
  firebaseUid?: string | null;
  roles: UserRole[];
  authProvider: AuthProvider;
  emailVerified: boolean;
  phoneVerified: boolean;
  accountType: AccountType | null;
  onboardingStep: string;
  onboardingCompletedAt: string | null;
  livenessPassedAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FirebaseSignInPayload {
  idToken: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthSession {
  isNewUser: boolean;
  accessToken: string;
  user: AuthUser;
  onboarding: OnboardingState;
}

export type AdminSession = Omit<AuthSession, 'isNewUser'>;

export interface AuthProfile extends AuthUser {
  driver: DriverProfile | null;
  onboarding: OnboardingState;
}
