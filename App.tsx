import { NavigationContainer } from '@react-navigation/native';
import { QueryClientProvider } from '@tanstack/react-query';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { queryClient } from '@/constants/queryClient';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { RootNavigator } from '@/navigation/RootNavigator';
import { ThemeProvider, navigationThemeFor, useTheme } from '@/theme';

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
  usePushNotifications();

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <NavigationContainer theme={navigationThemeFor(colors)}>
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
