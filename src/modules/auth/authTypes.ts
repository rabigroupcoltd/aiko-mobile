import type {
  AccountType,
  AuthProvider,
  UserRole,
} from '@/modules/shared/apiTypes';
import type { DriverProfile } from '@/modules/drivers/driversTypes';
import type { OnboardingState } from '@/modules/onboarding/onboardingTypes';

/** The user record every authenticated endpoint returns. */
export interface AuthUser {
  id: string;
  /** Null for phone-only accounts — Firebase phone auth carries no email. */
  email: string | null;
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  /** Null until the phone step. */
  phone: string | null;
  /** ISO date. */
  dob: string | null;
  /** Avatar from the identity provider, distinct from the liveness selfie. */
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

// -------------------------------------------------------------- requests

/**
 * The only credential the app sends.
 *
 * One shape covers both ways in: Firebase mints the same kind of ID token for
 * a Google sign-in and for a verified phone number, so the claims differ but
 * the request does not.
 */
export interface FirebaseSignInPayload {
  idToken: string;
}

/** Staff sign-in. App accounts hold no password and cannot satisfy it. */
export interface LoginPayload {
  email: string;
  password: string;
}

// ------------------------------------------------------------- responses

export interface AuthSession {
  /** True the first time this identity is seen. */
  isNewUser: boolean;
  accessToken: string;
  user: AuthUser;
  /** Where to send them next — navigate to `onboarding.resumeStep`. */
  onboarding: OnboardingState;
}

/** `POST /api/auth/login` — same shape minus `isNewUser`. */
export type AdminSession = Omit<AuthSession, 'isNewUser'>;

/** `GET /api/auth/profile` — the user plus their driver profile, if any. */
export interface AuthProfile extends AuthUser {
  driver: DriverProfile | null;
  onboarding: OnboardingState;
}
