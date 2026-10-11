import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { LivenessScreen } from '@/screens/onboarding/LivenessScreen';
import { ProfileFormScreen } from '@/screens/onboarding/ProfileFormScreen';
import { ProfilePhotoScreen } from '@/screens/onboarding/ProfilePhotoScreen';
import { UserTypeScreen } from '@/screens/onboarding/UserTypeScreen';
import { ROUTES, type OnboardingRouteName } from './routes';
import type { OnboardingStackParamList } from './types';

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

interface Props {
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
    </Stack.Navigator>
  );
}
