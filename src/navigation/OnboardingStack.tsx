import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { LivenessScreen } from '@/screens/onboarding/LivenessScreen';
import { ProfileFormScreen } from '@/screens/onboarding/ProfileFormScreen';
import { ProfilePhotoScreen } from '@/screens/onboarding/ProfilePhotoScreen';
import { UserTypeScreen } from '@/screens/onboarding/UserTypeScreen';
import { DocumentsReviewScreen } from '@/screens/rider/DocumentsReviewScreen';
import { LicenseCaptureScreen } from '@/screens/rider/LicenseCaptureScreen';
import { NationalIdScreen } from '@/screens/rider/NationalIdScreen';
import { PlatePhotoScreen } from '@/screens/rider/PlatePhotoScreen';
import { VehicleTypeScreen } from '@/screens/rider/VehicleTypeScreen';
import { ROUTES, type OnboardingRouteName } from './routes';
import type { OnboardingStackParamList } from './types';

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

interface Props {
  /**
   * Where to resume. Read once at mount — which is safe precisely because this
   * navigator is not mounted until store rehydration has completed, so the
   * value is always derived from real data.
   */
  initialRouteName: OnboardingRouteName;
}

export function OnboardingStack({ initialRouteName }: Props) {
  return (
    <Stack.Navigator
      initialRouteName={initialRouteName}
      screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name={ROUTES.PROFILE_FORM} component={ProfileFormScreen} />
      <Stack.Screen name={ROUTES.PROFILE_PHOTO} component={ProfilePhotoScreen} />
      <Stack.Screen name={ROUTES.LIVENESS} component={LivenessScreen} />
      <Stack.Screen name={ROUTES.USER_TYPE} component={UserTypeScreen} />

      {/* Rider document chain */}
      <Stack.Screen name={ROUTES.LICENSE_CAPTURE} component={LicenseCaptureScreen} />
      <Stack.Screen name={ROUTES.NATIONAL_ID} component={NationalIdScreen} />
      <Stack.Screen name={ROUTES.VEHICLE_TYPE} component={VehicleTypeScreen} />
      <Stack.Screen name={ROUTES.PLATE_PHOTO} component={PlatePhotoScreen} />
      <Stack.Screen name={ROUTES.DOCUMENTS_REVIEW} component={DocumentsReviewScreen} />
    </Stack.Navigator>
  );
}
