import type { NavigatorScreenParams } from '@react-navigation/native';

import type { VehicleType } from '@/modules/shared/apiTypes';
import type { CaptureTarget, Place } from '@/types/models';
import type { ROUTES } from './routes';

export type AuthStackParamList = {
  [ROUTES.WELCOME]: undefined;
};

export type OnboardingStackParamList = {
  [ROUTES.PHONE_ENTRY]: undefined;
  [ROUTES.OTP]: { phone: string };
  [ROUTES.PROFILE_FORM]: undefined;
  [ROUTES.PROFILE_PHOTO]: undefined;
  [ROUTES.LIVENESS]: undefined;
  [ROUTES.USER_TYPE]: undefined;
};

export type PassengerStackParamList = {
  [ROUTES.PASSENGER_HOME]: undefined;
  [ROUTES.ORDER_REVIEW]: undefined;
  [ROUTES.MATCHING]: { pickup: Place; dropoff: Place; vehicleType: VehicleType };
  [ROUTES.RIDER_FOUND]: { orderId: string };
  [ROUTES.ORDER_CHAT]: { orderId: string; title?: string };
};

export type RiderStackParamList = {
  [ROUTES.LICENSE_CAPTURE]: undefined;
  [ROUTES.NATIONAL_ID]: undefined;
  [ROUTES.VEHICLE_TYPE]: undefined;
  [ROUTES.VEHICLE_DETAILS]: undefined;
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
