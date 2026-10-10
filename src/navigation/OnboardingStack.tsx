import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { LivenessScreen } from '@/screens/onboarding/LivenessScreen';
import { ProfileFormScreen } from '@/screens/onboarding/ProfileFormScreen';
import { ProfilePhotoScreen } from '@/screens/onboarding/ProfilePhotoScreen';
import { UserTypeScreen } from '@/screens/onboarding/UserTypeScreen';
// Commented out, not deleted: Google is the only sign-in for now, and it
// gives no phone number, so ProfileFormScreen collects one alongside
// name/email/dob instead of a separate step. Re-enable both the imports below
// and the two Stack.Screen entries in the navigator if a real phone-first
// sign-in comes back — see onboarding.service.ts's resolveStep for the
// matching backend side of this.
// import { OtpScreen } from '@/screens/auth/OtpScreen';
// import { PhoneEntryScreen } from '@/screens/auth/PhoneEntryScreen';
import { ROUTES, type OnboardingRouteName } from './routes';
import type { OnboardingStackParamList } from './types';

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

interface Props {
  /**
   * Where to resume, from `onboarding.resumeStep`. Read once at mount — which
   * is safe precisely because this navigator is not mounted until the
   * onboarding state has actually loaded, so the value always reflects the
   * server, not a guess made before it answered.
   */
  initialRouteName: OnboardingRouteName;
}

export function OnboardingStack({ initialRouteName }: Props) {
  return (
    <Stack.Navigator
      initialRouteName={initialRouteName}
      screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      {/* <Stack.Screen name={ROUTES.PHONE_ENTRY} component={PhoneEntryScreen} /> */}
      {/* <Stack.Screen name={ROUTES.OTP} component={OtpScreen} /> */}
      <Stack.Screen name={ROUTES.PROFILE_FORM} component={ProfileFormScreen} />
      <Stack.Screen name={ROUTES.PROFILE_PHOTO} component={ProfilePhotoScreen} />
      <Stack.Screen name={ROUTES.LIVENESS} component={LivenessScreen} />
      <Stack.Screen name={ROUTES.USER_TYPE} component={UserTypeScreen} />
    </Stack.Navigator>
  );
}
