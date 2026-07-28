import { NavigationContainer } from '@react-navigation/native';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

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
      <SafeAreaProvider>
        <ThemeProvider>
          <ThemedApp />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
