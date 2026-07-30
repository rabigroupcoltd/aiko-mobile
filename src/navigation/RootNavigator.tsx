import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useCallback, useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';

import { CameraCaptureScreen } from '@/screens/common/CameraCaptureScreen';
import { SplashScreen as BrandSplash } from '@/screens/SplashScreen';
import { useAppStore } from '@/store/appStore';
import { isOnboardingComplete, resolveOnboardingRoute } from '@/store/selectors';
import { AppDrawer } from './AppDrawer';
import { AuthStack } from './AuthStack';
import { OnboardingStack } from './OnboardingStack';
import { ROUTES } from './routes';
import type { RootStackParamList } from './types';

const RootStack = createNativeStackNavigator<RootStackParamList>();

/**
 * Chooses which branch of the app is mounted, purely from store state.
 *
 * There is deliberately no `navigation.reset()`, no effect-driven redirect and
 * no imperative boot navigation anywhere in this app. Logging out or resetting
 * the demo simply changes state, and the correct branch renders on the next
 * pass — which is why those actions need no navigation logic of their own.
 */
function MainSwitch() {
  const hasHydrated = useAppStore((s) => s._hasHydrated);
  const phoneProvided = useAppStore((s) => s.phoneProvided);
  const phoneVerified = useAppStore((s) => s.phoneVerified);
  // Subscribing to the whole store here is intentional: the two selectors below
  // read across many fields, and onboarding completion must re-evaluate
  // whenever any of them changes.
  const state = useAppStore();

  if (!hasHydrated) return <BrandSplash />;
  // Having a number on file is what gets you in — verified or not, since the
  // launch flow never sends a code. `phoneVerified` is still honoured on its own
  // so anyone who completed OTP before `phoneProvided` existed stays signed in
  // instead of being thrown back to the welcome screen by the rehydrate.
  if (!phoneProvided && !phoneVerified) return <AuthStack />;
  if (!isOnboardingComplete(state)) {
    return <OnboardingStack initialRouteName={resolveOnboardingRoute(state)} />;
  }

  /**
   * Keying the drawer on `role` forces a clean remount when the demo role
   * switch fires. The drawer's screen list is role-dependent, and without a
   * remount React Navigation can be left focused on a route that no longer
   * exists — which shows up as a blank screen. Discarding the navigation stack
   * would be wrong for an ordinary user action, but this is a deliberate toggle.
   */
  return <AppDrawer key={state.role ?? 'none'} />;
}

export function RootNavigator() {
  const hasHydrated = useAppStore((s) => s._hasHydrated);

  // Hold the native splash until rehydration finishes, so the app never flashes
  // the welcome screen before resuming to the correct step.
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
