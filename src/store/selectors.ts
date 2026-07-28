import { ROUTES, type OnboardingRouteName } from '@/navigation/routes';
import { useAppStore } from './appStore';

type State = ReturnType<typeof useAppStore.getState>;

/** Rider document capture is complete when all three photos + vehicle type exist. */
export function hasAllRiderDocuments(s: State): boolean {
  const { license, nationalId, plate, vehicleType } = s.documents;
  return Boolean(license && nationalId && plate && vehicleType);
}

export function isOnboardingComplete(s: State): boolean {
  if (!s.user) return false;
  if (!s.photos.profile) return false;
  if (!s.livenessPassed) return false;
  if (!s.role) return false;
  // Riders must have submitted their documents; passengers are done at role choice.
  if (s.role === 'rider') return s.verificationStatus !== 'none';
  return true;
}

/**
 * The first incomplete onboarding step, derived from DATA PRESENCE rather than
 * the persisted `onboardingStep` counter.
 *
 * A stored counter goes stale the moment someone uses the dev role switch,
 * re-captures a photo from the drawer, or the app is killed between setting the
 * step and writing the data it refers to. When the two disagree, this wins.
 */
export function resolveOnboardingRoute(s: State): OnboardingRouteName {
  if (!s.user) return ROUTES.PROFILE_FORM;
  if (!s.photos.profile) return ROUTES.PROFILE_PHOTO;
  if (!s.livenessPassed) return ROUTES.LIVENESS;
  if (!s.role) return ROUTES.USER_TYPE;

  // Rider document chain.
  if (!s.documents.license) return ROUTES.LICENSE_CAPTURE;
  if (!s.documents.nationalId) return ROUTES.NATIONAL_ID;
  if (!s.documents.vehicleType) return ROUTES.VEHICLE_TYPE;
  if (!s.documents.plate) return ROUTES.PLATE_PHOTO;
  return ROUTES.DOCUMENTS_REVIEW;
}

/** Index used by the onboarding StepDots. */
export const ONBOARDING_TOTAL_STEPS = 5;

export function onboardingStepIndex(s: State): number {
  if (!s.user) return 0;
  if (!s.photos.profile) return 1;
  if (!s.livenessPassed) return 2;
  if (!s.role) return 3;
  return 4;
}
