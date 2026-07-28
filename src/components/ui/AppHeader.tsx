import type { ReactNode } from 'react';
import { Pressable, Text, View, type ViewStyle } from 'react-native';

import { hitSize, makeStyles, spacing } from '@/theme';

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
            style={styles.iconButton}>
            <Text style={styles.icon}>{onBack ? '‹' : '☰'}</Text>
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
    marginLeft: -spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // The back chevron is optically small at its natural size; bump and nudge it.
  icon: { fontSize: 30, lineHeight: 34, color: colors.text },
  trailing: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { ...type.title, marginTop: spacing.sm },
  subtitle: { ...type.bodySmall, marginTop: spacing.xs },
}));
