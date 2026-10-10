/** Route names as constants — no magic strings anywhere in the app. */
export const ROUTES = {
  // auth
  WELCOME: 'Welcome',
  PHONE_ENTRY: 'PhoneEntry',
  OTP: 'Otp',

  // onboarding
  PROFILE_FORM: 'ProfileForm',
  PROFILE_PHOTO: 'ProfilePhoto',
  LIVENESS: 'Liveness',
  USER_TYPE: 'UserType',

  // rider onboarding
  LICENSE_CAPTURE: 'LicenseCapture',
  NATIONAL_ID: 'NationalId',
  VEHICLE_TYPE: 'VehicleType',
  VEHICLE_DETAILS: 'VehicleDetails',
  PLATE_PHOTO: 'PlatePhoto',
  DOCUMENTS_REVIEW: 'DocumentsReview',

  // post-login
  PASSENGER_HOME: 'PassengerHome',

  ORDER_REVIEW: 'OrderReview',
  MATCHING: 'Matching',
  RIDER_FOUND: 'RiderFound',
  PENDING_APPROVAL: 'PendingApproval',
  RIDER_HOME: 'RiderHome',

  DRIVER_ROUTE: 'DriverRoute',

  // drawer + common
  HOME_TAB: 'HomeTab',
  PROFILE: 'Profile',
  MY_DOCUMENTS: 'MyDocuments',
  SETTINGS: 'Settings',
  /** Per-order chat. Reachable from either side of an order. */
  ORDER_CHAT: 'OrderChat',
  DRIVER_EARNINGS: 'DriverEarnings',
  ORDER_HISTORY: 'OrderHistory',

  // modals
  CAMERA_CAPTURE: 'CameraCapture',
} as const;

export type RouteName = (typeof ROUTES)[keyof typeof ROUTES];

/**
 * PHONE_ENTRY/OTP are deliberately absent — Google is the only sign-in for
 * now, gives no phone number of its own, and the profile screen collects one
 * alongside name/email/dob instead of a separate step. Both screens and their
 * registration in OnboardingStack are commented out, not deleted, for when a
 * real phone-first sign-in returns.
 */
export type OnboardingRouteName =
  | typeof ROUTES.PROFILE_FORM
  | typeof ROUTES.PROFILE_PHOTO
  | typeof ROUTES.LIVENESS
  | typeof ROUTES.USER_TYPE;

/** The rider vehicle-registration chain, reachable from inside RiderStack. */
export type RiderOnboardingRouteName =
  | typeof ROUTES.LICENSE_CAPTURE
  | typeof ROUTES.NATIONAL_ID
  | typeof ROUTES.VEHICLE_TYPE
  | typeof ROUTES.VEHICLE_DETAILS
  | typeof ROUTES.PLATE_PHOTO
  | typeof ROUTES.DOCUMENTS_REVIEW;


export function onboardingStepRoute(
  step: OnboardingStepLike,
): OnboardingRouteName | null {
  switch (step) {
    // PHONE never comes back from the backend right now — see
    // OnboardingRouteName — but the case is left out rather than mapped
    // to a route so a stray value falls through to `default: null` instead
    // of pointing at a screen OnboardingStack no longer registers.
    case 'PROFILE':
      return ROUTES.PROFILE_FORM;
    case 'PHOTO':
      return ROUTES.PROFILE_PHOTO;
    case 'LIVENESS':
      return ROUTES.LIVENESS;
    case 'USER_TYPE':
      return ROUTES.USER_TYPE;
    default:
      return null;
  }
}


type OnboardingStepLike =
  | 'PHONE'
  | 'PROFILE'
  | 'PHOTO'
  | 'LIVENESS'
  | 'USER_TYPE'
  | 'RIDER_DOCS'
  | 'AWAITING_APPROVAL'
  | 'DONE';
