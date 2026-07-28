import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/theme';

interface LivenessProgressProps {
  /** 0 = framing, 1 = blink, 2 = head turn, 3 = done. */
  stepIndex: number;
  /** 0..1 within the current step. */
  progress: number;
  failed?: boolean;
}

const STEPS = ['Position', 'Blink', 'Turn'];

/** Three-segment progress bar across the liveness checks. */
export function LivenessProgress({ stepIndex, progress, failed }: LivenessProgressProps) {
  return (
    <View style={styles.container}>
      <View style={styles.track}>
        {STEPS.map((label, i) => {
          const done = i < stepIndex;
          const active = i === stepIndex;
          const fill = done ? 1 : active ? progress : 0;

          return (
            <View key={label} style={styles.segmentWrap}>
              <View style={styles.segment}>
                <View
                  style={[
                    styles.fill,
                    {
                      width: `${Math.round(fill * 100)}%`,
                      backgroundColor: failed ? colors.danger : colors.livenessSuccess,
                    },
                  ]}
                />
              </View>
              <Text
                style={[
                  styles.label,
                  (done || active) && !failed && styles.labelActive,
                ]}>
                {label}
              </Text>
            </View>
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
    backgroundColor: 'rgba(255,255,255,0.25)',
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
