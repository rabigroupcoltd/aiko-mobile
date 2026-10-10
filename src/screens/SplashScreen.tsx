import { useEffect, useRef } from 'react';
import { ActivityIndicator, Animated, StyleSheet, Text, View } from 'react-native';

import { AikoMark } from '@/components/brand/AikoMark';
import { BrandBackdrop } from '@/components/brand/BrandBackdrop';
import { green, spacing, typographyFor, lightColors } from '@/theme';

/**
 * Shown while the store rehydrates from AsyncStorage. No navigator is mounted
 * behind this, so nothing can navigate on stale defaults.
 *
 * Deliberately brand-green in both schemes — it matches the native splash
 * (same glyph, same green), so the hand-off from native to JS is seamless, and
 * a scheme-dependent splash would flicker on cold start before the stored
 * theme preference has been read.
 */
export function SplashScreen() {
  const enter = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(enter, { toValue: 1, useNativeDriver: true, friction: 7 }).start();
  }, [enter]);

  return (
    <View style={styles.container}>
      <BrandBackdrop />
      <Animated.View
        style={[
          styles.center,
          {
            opacity: enter,
            transform: [{ scale: enter.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) }],
          },
        ]}>
        <AikoMark size={132} variant="glyph" />
        <Text style={styles.wordmark}>aiko</Text>
        <Text style={styles.tagline}>Send anything. We deliver fast.</Text>
      </Animated.View>
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
  },
  center: { alignItems: 'center', gap: spacing.xs },
  wordmark: {
    fontSize: 44,
    lineHeight: 50,
    fontWeight: '800',
    letterSpacing: -1.5,
    color: '#FFFFFF',
    marginTop: spacing.sm,
  },
  tagline: { ...type.bodySmall, color: green[100] },
  spinner: { position: 'absolute', bottom: spacing.huge * 1.5 },
});
