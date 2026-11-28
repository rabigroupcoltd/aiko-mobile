import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import type { ChallengeKind } from '@/liveness/types';
import { colors, radius, spacing, typography } from '@/theme';

interface LivenessProgressProps {
  stepIndex: number;
  progress: number;
  failed?: boolean;
  challenge: ChallengeKind;
}

function Segment({ label, fill, active, done, failed }: {
  label: string;
  fill: number;
  active: boolean;
  done: boolean;
  failed?: boolean;
}) {
  const width = useSharedValue(fill);
  const tone = useSharedValue(failed ? 1 : 0);

  useEffect(() => {
    width.value = withTiming(fill, { duration: 220, easing: Easing.out(Easing.cubic) });
  }, [fill, width]);

  useEffect(() => {
    tone.value = withTiming(failed ? 1 : 0, { duration: 200 });
  }, [failed, tone]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${width.value * 100}%`,
    backgroundColor: interpolateColor(tone.value, [0, 1], [colors.livenessSuccess, colors.danger]),
  }));

  return (
    <View style={styles.segmentWrap}>
      <View style={styles.segment}>
        <Animated.View style={[styles.fill, fillStyle]} />
      </View>
      <Text style={[styles.label, (done || active) && !failed && styles.labelActive]}>
        {done ? `${label} ✓` : label}
      </Text>
    </View>
  );
}

export function LivenessProgress({ stepIndex, progress, failed, challenge }: LivenessProgressProps) {
  const steps = ['Face', challenge === 'BLINK' ? 'Blink' : 'Nod', 'Photo'];
  return (
    <View style={styles.container}>
      <View style={styles.track}>
        {steps.map((label, i) => {
          const done = i < stepIndex;
          const active = i === stepIndex;
          return (
            <Segment
              key={label}
              label={label}
              fill={done ? 1 : active ? progress : 0}
              active={active}
              done={done}
              failed={failed}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%' },
  track: { flexDirection: 'row', gap: spacing.sm },
  segmentWrap: { flex: 1, gap: spacing.xs },
  segment: {
    height: 5,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.22)',
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: radius.pill },
  label: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    fontSize: 11,
  },
  labelActive: { color: colors.onPrimary, fontWeight: '600' },
});
