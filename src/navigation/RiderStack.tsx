import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useOnboardingState } from '@/modules/onboarding/onboardingController';
import { OrderChatScreen } from '@/screens/common/OrderChatScreen';
import { DocumentsReviewScreen } from '@/screens/rider/DocumentsReviewScreen';
import { LicenseCaptureScreen } from '@/screens/rider/LicenseCaptureScreen';
import { NationalIdScreen } from '@/screens/rider/NationalIdScreen';
import { PendingApprovalScreen } from '@/screens/rider/PendingApprovalScreen';
import { PlatePhotoScreen } from '@/screens/rider/PlatePhotoScreen';
import { RiderHomeScreen } from '@/screens/rider/RiderHomeScreen';
import { VehicleDetailsScreen } from '@/screens/rider/VehicleDetailsScreen';
import { VehicleTypeScreen } from '@/screens/rider/VehicleTypeScreen';
import { ROUTES } from './routes';
import type { RiderStackParamList } from './types';

const Stack = createNativeStackNavigator<RiderStackParamList>();


export function RiderStack() {
  const onboarding = useOnboardingState();
  const status = onboarding?.driver.status ?? 'NOT_SUBMITTED';

  if (status === 'NOT_SUBMITTED' || status === 'REJECTED') {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name={ROUTES.LICENSE_CAPTURE} component={LicenseCaptureScreen} />
        <Stack.Screen name={ROUTES.NATIONAL_ID} component={NationalIdScreen} />
        <Stack.Screen name={ROUTES.VEHICLE_TYPE} component={VehicleTypeScreen} />
        <Stack.Screen name={ROUTES.VEHICLE_DETAILS} component={VehicleDetailsScreen} />
        <Stack.Screen name={ROUTES.PLATE_PHOTO} component={PlatePhotoScreen} />
        <Stack.Screen name={ROUTES.DOCUMENTS_REVIEW} component={DocumentsReviewScreen} />
      </Stack.Navigator>
    );
  }

  if (status === 'PENDING') {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name={ROUTES.PENDING_APPROVAL} component={PendingApprovalScreen} />
      </Stack.Navigator>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name={ROUTES.RIDER_HOME} component={RiderHomeScreen} />
      {/* Only registered for an approved rider, so an unapproved one cannot
          reach a customer conversation by any navigation path. */}
      <Stack.Screen name={ROUTES.ORDER_CHAT} component={OrderChatScreen} />
    </Stack.Navigator>
  );
}
