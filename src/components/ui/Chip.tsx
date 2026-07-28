import { Text, View, type ViewStyle } from 'react-native';

import { makeStyles, radius, spacing, useTheme } from '@/theme';

type Tone = 'neutral' | 'success' | 'pending' | 'danger' | 'info' | 'brand';

interface ChipProps {
  label: string;
  tone?: Tone;
  /** Leading dot — useful for status ("Pending", "Approved"). */
  dot?: boolean;
  style?: ViewStyle;
}

export function Chip({ label, tone = 'neutral', dot = false, style }: ChipProps) {
  const styles = useStyles();
  const { colors } = useTheme();

  const tones: Record<Tone, { bg: string; fg: string }> = {
    neutral: { bg: colors.surfaceAlt, fg: colors.textSecondary },
    success: { bg: colors.successBg, fg: colors.success },
    pending: { bg: colors.warningBg, fg: colors.warning },
    danger: { bg: colors.dangerBg, fg: colors.danger },
    info: { bg: colors.infoBg, fg: colors.info },
    brand: { bg: colors.primaryLight, fg: colors.primaryDarker },
  };
  const t = tones[tone];

  return (
    <View style={[styles.chip, { backgroundColor: t.bg }, style]}>
      {dot ? <View style={[styles.dot, { backgroundColor: t.fg }]} /> : null}
      <Text style={[styles.label, { color: t.fg }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const useStyles = makeStyles(({ type }) => ({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 1,
    borderRadius: radius.pill,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  label: { ...type.caption, fontWeight: '600' },
}));
