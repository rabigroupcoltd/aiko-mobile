export const ROUTES = {
  WELCOME: 'Welcome',
  PHONE_ENTRY: 'PhoneEntry',
  OTP: 'Otp',

  PROFILE_FORM: 'ProfileForm',
  PROFILE_PHOTO: 'ProfilePhoto',
  LIVENESS: 'Liveness',
  USER_TYPE: 'UserType',

  LICENSE_CAPTURE: 'LicenseCapture',
  NATIONAL_ID: 'NationalId',
  VEHICLE_TYPE: 'VehicleType',
  VEHICLE_DETAILS: 'VehicleDetails',
  PLATE_PHOTO: 'PlatePhoto',
  DOCUMENTS_REVIEW: 'DocumentsReview',

  PASSENGER_HOME: 'PassengerHome',

  ORDER_REVIEW: 'OrderReview',
  MATCHING: 'Matching',
  RIDER_FOUND: 'RiderFound',
  PENDING_APPROVAL: 'PendingApproval',
  RIDER_HOME: 'RiderHome',

  DRIVER_ROUTE: 'DriverRoute',

  HOME_TAB: 'HomeTab',
  PROFILE: 'Profile',
  MY_DOCUMENTS: 'MyDocuments',
  SETTINGS: 'Settings',
  ORDER_CHAT: 'OrderChat',
  DRIVER_EARNINGS: 'DriverEarnings',
  ORDER_HISTORY: 'OrderHistory',

  CAMERA_CAPTURE: 'CameraCapture',
} as const;

export type RouteName = (typeof ROUTES)[keyof typeof ROUTES];

export type OnboardingRouteName =
  | typeof ROUTES.PROFILE_FORM
  | typeof ROUTES.PROFILE_PHOTO
  | typeof ROUTES.LIVENESS
  | typeof ROUTES.USER_TYPE;

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
