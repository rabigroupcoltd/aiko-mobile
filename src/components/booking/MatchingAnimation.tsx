import { useEffect, useRef } from 'react';
import { Animated, Easing, Text, View } from 'react-native';

import { makeStyles, spacing, useTheme } from '@/theme';

interface MatchingAnimationProps {
  /** Rotating status lines shown beneath the radar. */
  stages: readonly string[];
  stageIndex: number;
}

const RING_COUNT = 3;
const RADAR_SIZE = 240;

/**
 * Expanding radar rings — the visual stand-in for a Redis geo-radius query
 * fanning out to find nearby riders.
 */
export function MatchingAnimation({ stages, stageIndex }: MatchingAnimationProps) {
  const styles = useStyles();
  const { colors } = useTheme();

  // One Animated.Value per ring, started on a stagger so they chase each other.
  const rings = useRef(
    Array.from({ length: RING_COUNT }, () => new Animated.Value(0))
  ).current;

  useEffect(() => {
    const animations = rings.map((value, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 600),
          Animated.timing(value, {
            toValue: 1,
            duration: 1800,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(value, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      )
    );
    animations.forEach((a) => a.start());
    return () => animations.forEach((a) => a.stop());
  }, [rings]);

  return (
    <View style={styles.container}>
      <View style={styles.radar}>
        {rings.map((value, i) => (
          <Animated.View
            key={i}
            style={[
              styles.ring,
              {
                borderColor: colors.primary,
                backgroundColor: colors.primarySubtle,
                opacity: value.interpolate({
                  inputRange: [0, 0.15, 1],
                  outputRange: [0, 0.55, 0],
                }),
                transform: [
                  {
                    scale: value.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.35, 1],
                    }),
                  },
                ],
              },
            ]}
          />
        ))}

        <View style={styles.core}>
          <Text style={styles.coreIcon}>🏍️</Text>
        </View>
      </View>

      <View style={styles.stages}>
        {stages.map((stage, i) => (
          <Text
            key={stage}
            style={[
              styles.stage,
              i === stageIndex && styles.stageActive,
              i < stageIndex && styles.stageDone,
            ]}>
            {i < stageIndex ? '✓ ' : ''}
            {stage}
          </Text>
        ))}
      </View>
    </View>
  );
}

const useStyles = makeStyles(({ colors, type }) => ({
  container: { alignItems: 'center', gap: spacing.xxl },
  radar: {
    width: RADAR_SIZE,
    height: RADAR_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: RADAR_SIZE,
    height: RADAR_SIZE,
    borderRadius: RADAR_SIZE / 2,
    borderWidth: 2,
  },
  core: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coreIcon: { fontSize: 36 },
  stages: { gap: spacing.sm, alignItems: 'center' },
  stage: { ...type.bodySmall, color: colors.textDisabled, textAlign: 'center' },
  stageActive: { color: colors.text, fontWeight: '600' },
  stageDone: { color: colors.primary },
}));
