import type { NavigatorScreenParams } from '@react-navigation/native';

import type { CaptureTarget, Place } from '@/types/models';
import type { ROUTES } from './routes';

export type AuthStackParamList = {
  [ROUTES.WELCOME]: undefined;
  [ROUTES.PHONE_ENTRY]: undefined;
  [ROUTES.OTP]: undefined;
};

export type OnboardingStackParamList = {
  [ROUTES.PROFILE_FORM]: undefined;
  [ROUTES.PROFILE_PHOTO]: undefined;
  [ROUTES.LIVENESS]: undefined;
  [ROUTES.USER_TYPE]: undefined;
  [ROUTES.LICENSE_CAPTURE]: undefined;
  [ROUTES.NATIONAL_ID]: undefined;
  [ROUTES.VEHICLE_TYPE]: undefined;
  [ROUTES.PLATE_PHOTO]: undefined;
  [ROUTES.DOCUMENTS_REVIEW]: undefined;
};

export type PassengerStackParamList = {
  [ROUTES.PASSENGER_HOME]: undefined;
  [ROUTES.MATCHING]: { pickup: Place; dropoff: Place; vehicleType: VehicleType };
  /**
   * The trip itself. Only the order id is passed — everything shown comes from
   * `GET /api/orders/{id}` and the socket, so a screen restored from a
   * notification tap needs no other params to render correctly.
   */
  [ROUTES.RIDER_FOUND]: { orderId: string };
};

export type RiderStackParamList = {
  [ROUTES.PENDING_APPROVAL]: undefined;
  [ROUTES.RIDER_HOME]: undefined;
};

export type DrawerParamList = {
  [ROUTES.HOME_TAB]:
    | NavigatorScreenParams<PassengerStackParamList>
    | NavigatorScreenParams<RiderStackParamList>
    | undefined;
  [ROUTES.PROFILE]: undefined;
  [ROUTES.MY_DOCUMENTS]: undefined;
  [ROUTES.SETTINGS]: undefined;
};

/**
 * Root modal stack. Params must stay serializable — passing a callback through
 * here would trip React Navigation's serialization warning and break state
 * persistence, which is why CameraCapture writes its result to the store
 * instead of calling back.
 */
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
