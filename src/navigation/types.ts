import type { NavigatorScreenParams } from '@react-navigation/native';

import type { VehicleType } from '@/modules/shared/apiTypes';
import type { CaptureTarget, Place } from '@/types/models';
import type { ROUTES } from './routes';

/** Pre-session. The only way out is a real Firebase sign-in. */
export type AuthStackParamList = {
  [ROUTES.WELCOME]: undefined;
};

/**
 * The shared steps every account walks once signed in, before
 * `onboarding.passengerReady` is true. See `onboardingStepRoute`.
 */
export type OnboardingStackParamList = {
  [ROUTES.PHONE_ENTRY]: undefined;
  /** OTP is a client-only sub-screen of PHONE, never a resume target on its own. */
  [ROUTES.OTP]: { phone: string };
  [ROUTES.PROFILE_FORM]: undefined;
  [ROUTES.PROFILE_PHOTO]: undefined;
  [ROUTES.LIVENESS]: undefined;
  [ROUTES.USER_TYPE]: undefined;
};

export type PassengerStackParamList = {
  [ROUTES.PASSENGER_HOME]: undefined;
  /**
   * The confirmation step. Everything shown is re-quoted here from the server,
   * so the price the customer confirms is the price the order is created at.
   */
  [ROUTES.ORDER_REVIEW]: undefined;
  [ROUTES.MATCHING]: { pickup: Place; dropoff: Place; vehicleType: VehicleType };
  /**
   * The trip itself. Only the order id is passed — everything shown comes from
   * `GET /api/orders/{id}` and the socket, so a screen restored from a
   * notification tap needs no other params to render correctly.
   */
  [ROUTES.RIDER_FOUND]: { orderId: string };
  [ROUTES.ORDER_CHAT]: { orderId: string; title?: string };
};


export type RiderStackParamList = {
  [ROUTES.LICENSE_CAPTURE]: undefined;
  [ROUTES.NATIONAL_ID]: undefined;
  [ROUTES.VEHICLE_TYPE]: undefined;
  [ROUTES.PLATE_PHOTO]: undefined;
  [ROUTES.DOCUMENTS_REVIEW]: undefined;
  [ROUTES.PENDING_APPROVAL]: undefined;
  [ROUTES.RIDER_HOME]: undefined;
  [ROUTES.DRIVER_ROUTE]: undefined;
  [ROUTES.ORDER_CHAT]: { orderId: string; title?: string };
};

export type DrawerParamList = {
  [ROUTES.HOME_TAB]:
    | NavigatorScreenParams<PassengerStackParamList>
    | NavigatorScreenParams<RiderStackParamList>
    | undefined;
  [ROUTES.PROFILE]: undefined;
  [ROUTES.MY_DOCUMENTS]: undefined;
  [ROUTES.SETTINGS]: undefined;
  [ROUTES.DRIVER_EARNINGS]: undefined;
  [ROUTES.ORDER_HISTORY]: undefined;
};


export type RootStackParamList = {
  Main: undefined;
  [ROUTES.CAMERA_CAPTURE]: { target: CaptureTarget };
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
