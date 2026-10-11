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

function routeFromNotification(data: PushData): void {
  switch (data.type) {
    case 'ORDER_AVAILABLE':
    case 'RIDE_REQUEST':
      openDriverHome();
      return;

    case 'TRIP_MESSAGE':
      if (data.orderId) openOrderChat(data.orderId);
      return;

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
      return;
  }
}

void SplashScreen.preventAutoHideAsync().catch(() => {});

function ThemedApp() {
  const { colors, scheme } = useTheme();

  usePushNotifications({ onOpen: routeFromNotification });

  useRideSocketConnection();

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <NavigationContainer
        ref={navigationRef}
        theme={navigationThemeFor(colors)}
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
