import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useCallback, useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';

import { useGetOnboardingManager, useOnboardingState } from '@/modules/onboarding/onboardingController';
import { CameraCaptureScreen } from '@/screens/common/CameraCaptureScreen';
import { SplashScreen as BrandSplash } from '@/screens/SplashScreen';
import { useAuthStore } from '@/store/authStore';
import { AppDrawer } from './AppDrawer';
import { AuthStack } from './AuthStack';
import { OnboardingStack } from './OnboardingStack';
import { onboardingStepRoute, ROUTES } from './routes';
import type { RootStackParamList } from './types';

const RootStack = createNativeStackNavigator<RootStackParamList>();


function MainSwitch() {
  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  const accessToken = useAuthStore((s) => s.accessToken);
  const onboarding = useOnboardingState();


  useGetOnboardingManager({ enabled: Boolean(accessToken) });

  if (!hasHydrated) return <BrandSplash />;
  if (!accessToken) return <AuthStack />;


  if (!onboarding) return <BrandSplash />;

  if (!onboarding.passengerReady) {
    // PROFILE_FORM, not PHONE_ENTRY: the phone step is commented out of
    // OnboardingStack below — Google is the only sign-in for now and never
    // resolves to PHONE, so this fallback only covers an unexpected resumeStep.
    const initialRouteName = onboardingStepRoute(onboarding.resumeStep) ?? ROUTES.PROFILE_FORM;
    return <OnboardingStack initialRouteName={initialRouteName} />;
  }


  return <AppDrawer key={onboarding.accountType ?? 'none'} />;
}

export function RootNavigator() {
  const hasHydrated = useAuthStore((s) => s._hasHydrated);


  useEffect(() => {
    if (hasHydrated) void SplashScreen.hideAsync().catch(() => {});
  }, [hasHydrated]);

  const renderMain = useCallback(() => <MainSwitch />, []);

  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      <RootStack.Screen name="Main">{renderMain}</RootStack.Screen>

      {/* Root-level so any screen — including drawer items — can open it. */}
      <RootStack.Screen
        name={ROUTES.CAMERA_CAPTURE}
        component={CameraCaptureScreen}
        options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}
      />
    </RootStack.Navigator>
  );
}
