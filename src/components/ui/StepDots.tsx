import { View, type ViewStyle } from 'react-native';

import { green, makeStyles, spacing } from '@/theme';

interface StepDotsProps {
  total: number;
  /** Zero-based index of the current step. */
  current: number;
  style?: ViewStyle;
}

/** Onboarding progress. The active dot widens into a bar so it reads at a glance. */
export function StepDots({ total, current, style }: StepDotsProps) {
  const styles = useStyles();

  return (
    <View
      style={[styles.row, style]}
      accessibilityLabel={`Step ${current + 1} of ${total}`}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            i === current && styles.active,
            i < current && styles.complete,
          ]}
        />
      ))}
    </View>
  );
}

const useStyles = makeStyles(({ colors }) => ({
  row: { flexDirection: 'row', gap: spacing.xs, alignItems: 'center' },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  active: { width: 24, backgroundColor: colors.primary },
  complete: { backgroundColor: green[300] },
}));
