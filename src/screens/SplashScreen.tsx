import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { green, spacing, typographyFor, lightColors } from '@/theme';

/**
 * Shown while the store rehydrates from AsyncStorage. No navigator is mounted
 * behind this, so nothing can navigate on stale defaults.
 *
 * Deliberately brand-green in both schemes — it matches the native splash, and
 * a scheme-dependent splash would flicker on cold start before the stored
 * theme preference has been read.
 */
export function SplashScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.mark}>
        <Text style={styles.markText}>A</Text>
      </View>
      <Text style={styles.wordmark}>Aiko</Text>
      <Text style={styles.tagline}>Dispatch & delivery · Minna</Text>
      <ActivityIndicator color="#FFFFFF" style={styles.spinner} />
    </View>
  );
}

const type = typographyFor(lightColors);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: green[500],
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  mark: {
    width: 88,
    height: 88,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.base,
  },
  markText: {
    fontSize: 48,
    fontWeight: '700',
    color: green[500],
    lineHeight: 56,
  },
  wordmark: { ...type.display, color: '#FFFFFF' },
  tagline: { ...type.bodySmall, color: green[100] },
  spinner: { marginTop: spacing.xxl },
});
