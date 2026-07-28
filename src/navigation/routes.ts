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
  PLATE_PHOTO: 'PlatePhoto',
  DOCUMENTS_REVIEW: 'DocumentsReview',

  // post-login
  PASSENGER_HOME: 'PassengerHome',
  MATCHING: 'Matching',
  RIDER_FOUND: 'RiderFound',
  PENDING_APPROVAL: 'PendingApproval',
  RIDER_HOME: 'RiderHome',

  // drawer + common
  HOME_TAB: 'HomeTab',
  PROFILE: 'Profile',
  MY_DOCUMENTS: 'MyDocuments',
  SETTINGS: 'Settings',

  // modals
  CAMERA_CAPTURE: 'CameraCapture',
} as const;

export type RouteName = (typeof ROUTES)[keyof typeof ROUTES];

/** The subset of routes `resolveOnboardingRoute` can return. */
export type OnboardingRouteName =
  | typeof ROUTES.PROFILE_FORM
  | typeof ROUTES.PROFILE_PHOTO
  | typeof ROUTES.LIVENESS
  | typeof ROUTES.USER_TYPE
  | typeof ROUTES.LICENSE_CAPTURE
  | typeof ROUTES.NATIONAL_ID
  | typeof ROUTES.VEHICLE_TYPE
  | typeof ROUTES.PLATE_PHOTO
  | typeof ROUTES.DOCUMENTS_REVIEW;
