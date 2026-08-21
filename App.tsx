import { NavigationContainer } from '@react-navigation/native';
import { QueryClientProvider } from '@tanstack/react-query';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { queryClient } from '@/constants/queryClient';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useRideSocketConnection } from '@/hooks/useRideSocket';
import type { PushData } from '@/modules/notifications/notificationsTypes';
import {
  navigationRef,
  onNavigationReady,
  openDriverHome,
  openOrderChat,
  openOrderTracking,
} from '@/navigation/navigationRef';
import { RootNavigator } from '@/navigation/RootNavigator';
import { ThemeProvider, navigationThemeFor, useTheme } from '@/theme';

/**
 * Where a tapped notification takes you.
 *
 * Split by who the message is for rather than by what it says: the same
 * `orderId` means "track my delivery" to a customer and "here is a job" to a
 * driver, and the two roles do not share a screen for it.
 */
function routeFromNotification(data: PushData): void {
  switch (data.type) {
    // Driver-side. The dashboard refetches the grid on focus, so landing there
    // is enough — deep-linking to a card that another driver may already have
    // taken would only produce a dead end.
    case 'ORDER_AVAILABLE':
    case 'RIDE_REQUEST':
      openDriverHome();
      return;

    case 'TRIP_MESSAGE':
      if (data.orderId) openOrderChat(data.orderId);
      return;

    // Customer-side, all of them about one specific order.
    case 'ORDER_RESERVED':
    case 'ORDER_PICKED_UP':
    case 'ORDER_DELIVERED':
    case 'ORDER_NO_DRIVER':
    case 'TRIP_STATUS':
    case 'TRIP_CANCELLED':
    case 'BID_ACCEPTED':
      if (data.orderId) openOrderTracking(data.orderId);
      return;

    default:
      // KYC and the bid-flow notifications land the user wherever state
      // already puts them, which for an approved driver is the dashboard.
      return;
  }
}

// Hold the native splash until the store has rehydrated, so the app never
// flashes the welcome screen before resuming to the correct step.
// RootNavigator calls hideAsync() once hydration completes.
void SplashScreen.preventAutoHideAsync().catch(() => {});

/**
 * Split out so it can read the theme — NavigationContainer's theme and the
 * status bar style both have to follow the active scheme, and the provider
 * has to sit above them.
 */
function ThemedApp() {
  const { colors, scheme } = useTheme();

  // Registers the device once there is a session, and keeps the query cache
  // fresh when a notification arrives. Sits here rather than in RootNavigator
  // because it needs the QueryClientProvider above it, and it must keep running
  // across every branch of the navigator — a driver waiting on KYC approval is
  // on the onboarding stack, and that is exactly who the notification is for.
  usePushNotifications({ onOpen: routeFromNotification });

  // One socket for the whole app. Held here rather than per screen so a
  // passenger keeps receiving bids while browsing, and a driver keeps
  // receiving offers with the dashboard unmounted.
  useRideSocketConnection();

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <NavigationContainer
        ref={navigationRef}
        theme={navigationThemeFor(colors)}
        // Replays a notification tapped before the tree was mounted — a cold
        // start from the tray reads that message long before this point.
        onReady={onNavigationReady}>
        <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
        <RootNavigator />
      </NavigationContainer>
    </View>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <ThemeProvider>
            <ThemedApp />
          </ThemeProvider>
        </SafeAreaProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
