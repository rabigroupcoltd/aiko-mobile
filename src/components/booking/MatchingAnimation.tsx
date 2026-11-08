import { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  ReduceMotion,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { Icon } from '@/components/ui';
import { makeStyles, spacing, useTheme } from '@/theme';

interface MatchingAnimationProps {
  stages: readonly string[];
  stageIndex: number;
}

const RING_COUNT = 3;
const RADAR_SIZE = 240;
const CORE = 88;

export function MatchingAnimation({ stages, stageIndex }: MatchingAnimationProps) {
  const styles = useStyles();
  const reduced = useReducedMotion();
  const sweep = useSharedValue(0);
  const bob = useSharedValue(0);

  useEffect(() => {
    sweep.value = withRepeat(
      withTiming(1, { duration: 2400, easing: Easing.linear, reduceMotion: ReduceMotion.System }),
      -1,
      false,
    );
    bob.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 700, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 700, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
      undefined,
      ReduceMotion.System,
    );
  }, [bob, sweep]);

  const sweepStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${sweep.value * 360}deg` }] }));
  const coreStyle = useAnimatedStyle(() => ({ transform: [{ translateY: -3 * bob.value }] }));

  const stage = stages[Math.min(stageIndex, stages.length - 1)] ?? '';

  return (
    <View style={styles.container}>
      <View style={styles.radar} accessibilityLabel="Searching for a rider">
        {reduced
          ? null
          : Array.from({ length: RING_COUNT }, (_, i) => <Ring key={i} index={i} />)}

        <View style={styles.grid} />
        <View style={[styles.grid, styles.gridInner]} />

        {reduced ? null : (
          <Animated.View style={[styles.sweepWrap, sweepStyle]}>
            <View style={styles.sweep} />
          </Animated.View>
        )}

        <View style={styles.coreRing}>
          <Animated.View style={[styles.core, coreStyle]}>
            <Icon name="bike" size={40} color="#FFFFFF" strokeWidth={2.2} />
          </Animated.View>
        </View>
      </View>

      <View style={styles.stageBox}>
        <Animated.Text
          key={stage}
          entering={FadeIn.duration(350)}
          exiting={FadeOut.duration(200)}
          style={styles.stage}>
          {stage}
        </Animated.Text>
        <View style={styles.dots}>
          {stages.map((_, i) => (
            <View key={i} style={[styles.dot, i <= stageIndex && styles.dotOn]} />
          ))}
        </View>
      </View>
    </View>
  );
}

function Ring({ index }: { index: number }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      index * 700,
      withRepeat(withTiming(1, { duration: 2100, easing: Easing.out(Easing.quad) }), -1, false),
    );
  }, [index, progress]);

  const animated = useAnimatedStyle(() => ({
    opacity: progress.value < 0.12 ? (progress.value / 0.12) * 0.6 : 0.6 * (1 - progress.value),
    transform: [{ scale: 0.35 + progress.value * 0.65 }],
  }));

  return (
    <Animated.View
      style={[styles.ring, { borderColor: colors.primary, backgroundColor: colors.primarySubtle }, animated]}
    />
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
  grid: {
    position: 'absolute',
    width: RADAR_SIZE * 0.72,
    height: RADAR_SIZE * 0.72,
    borderRadius: RADAR_SIZE,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  gridInner: { width: RADAR_SIZE * 0.48, height: RADAR_SIZE * 0.48 },
  sweepWrap: {
    position: 'absolute',
    width: RADAR_SIZE * 0.72,
    height: RADAR_SIZE * 0.72,
    alignItems: 'center',
  },
  sweep: {
    width: 3,
    height: RADAR_SIZE * 0.36,
    borderRadius: 2,
    backgroundColor: colors.primary,
    opacity: 0.35,
  },
  coreRing: {
    width: CORE + 14,
    height: CORE + 14,
    borderRadius: (CORE + 14) / 2,
    borderWidth: 5,
    borderColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  core: {
    width: CORE,
    height: CORE,
    borderRadius: CORE / 2,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stageBox: { alignItems: 'center', gap: spacing.md, minHeight: 56 },
  stage: { ...type.subheading, color: colors.text, textAlign: 'center' },
  dots: { flexDirection: 'row', gap: spacing.xs },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.border },
  dotOn: { backgroundColor: colors.primary, width: 18 },
}));
