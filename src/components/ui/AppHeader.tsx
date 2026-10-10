import type { ReactNode } from 'react';
import { Pressable, Text, View, type ViewStyle } from 'react-native';

import { hitSize, makeStyles, radius, spacing } from '@/theme';
import { Icon } from './Icon';

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  onBack?: () => void;
  onMenu?: () => void;
  /** Rendered on the right — e.g. a skip button or step dots. */
  trailing?: ReactNode;
  style?: ViewStyle;
}

/**
 * In-screen header. Navigators run with `headerShown: false` throughout, so
 * every screen composes its own header — that keeps title/back/step-dots
 * layout consistent instead of half-configuring native headers per stack.
 */
export function AppHeader({
  title,
  subtitle,
  onBack,
  onMenu,
  trailing,
  style,
}: AppHeaderProps) {
  const styles = useStyles();
  const leading = onBack ?? onMenu;

  return (
    <View style={[styles.container, style]}>
      <View style={styles.bar}>
        {leading ? (
          <Pressable
            onPress={leading}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={onBack ? 'Go back' : 'Open menu'}
            style={({ pressed }) => [styles.iconButton, styles.iconButtonFilled, pressed && styles.pressed]}>
            <Icon name={onBack ? 'chevron-left' : 'menu'} size={22} strokeWidth={2.2} />
          </Pressable>
        ) : (
          <View style={styles.iconButton} />
        )}

        <View style={styles.trailing}>{trailing}</View>
      </View>

      {title ? <Text style={styles.title}>{title}</Text> : null}
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const useStyles = makeStyles(({ colors, type }) => ({
  container: { paddingTop: spacing.sm, paddingBottom: spacing.base },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: hitSize,
  },
  iconButton: {
    width: hitSize,
    height: hitSize,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonFilled: {
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: { opacity: 0.7 },
  trailing: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { ...type.title, marginTop: spacing.base },
  subtitle: { ...type.bodySmall, marginTop: spacing.xs },
}));
