import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';

import { hitSize, makeStyles, radius, shadows, spacing, useTheme } from '@/theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  /** Rendered before the label — an emoji or icon element. */
  leading?: React.ReactNode;
  style?: ViewStyle;
  testID?: string;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'lg',
  loading = false,
  disabled = false,
  fullWidth = true,
  leading,
  style,
  testID,
}: ButtonProps) {
  const styles = useStyles();
  const { colors } = useTheme();
  const isInert = disabled || loading;

  const variants: Record<Variant, { bg: string; fg: string; border: string }> = {
    primary: { bg: colors.primary, fg: colors.onPrimary, border: colors.primary },
    secondary: { bg: colors.surface, fg: colors.primary, border: colors.primary },
    ghost: { bg: 'transparent', fg: colors.textSecondary, border: 'transparent' },
    danger: { bg: colors.dangerBg, fg: colors.danger, border: colors.dangerBg },
  };
  const v = variants[variant];

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={isInert}
      accessibilityRole="button"
      accessibilityState={{ disabled: isInert, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        SIZES[size],
        { backgroundColor: v.bg, borderColor: v.border },
        variant === 'primary' && !isInert && shadows.md,
        fullWidth && styles.fullWidth,
        pressed && !isInert && styles.pressed,
        isInert && styles.inert,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={v.fg} size="small" />
      ) : (
        <View style={styles.content}>
          {leading ? <View style={styles.leading}>{leading}</View> : null}
          <Text style={[styles.label, { color: v.fg }]} numberOfLines={1}>
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const SIZES: Record<Size, ViewStyle> = StyleSheet.create({
  sm: { minHeight: 36, paddingHorizontal: spacing.base, borderRadius: radius.md },
  md: { minHeight: hitSize, paddingHorizontal: spacing.lg, borderRadius: radius.base },
  lg: { minHeight: 56, paddingHorizontal: spacing.xl, borderRadius: radius.lg },
});

const useStyles = makeStyles(({ type }) => ({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  fullWidth: { alignSelf: 'stretch' },
  content: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  leading: { justifyContent: 'center' },
  label: { ...type.button, fontWeight: '700' },
  pressed: { opacity: 0.85, transform: [{ scale: 0.985 }] },
  // Dimming the whole button keeps disabled state legible without needing a
  // separate colour for every variant.
  inert: { opacity: 0.45 },
}));
