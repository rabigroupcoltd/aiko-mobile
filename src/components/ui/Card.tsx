import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { makeStyles, radius, shadows, spacing } from '@/theme';

interface CardProps {
  children: ReactNode;
  onPress?: () => void;
  elevation?: 'none' | 'sm' | 'md' | 'lg';
  padded?: boolean;
  style?: ViewStyle;
}

export function Card({
  children,
  onPress,
  elevation = 'sm',
  padded = true,
  style,
}: CardProps) {
  const styles = useStyles();
  const base = [styles.card, shadows[elevation], padded && styles.padded, style];

  if (!onPress) return <View style={base}>{children}</View>;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [...base, pressed && styles.pressed]}>
      {children}
    </Pressable>
  );
}

const useStyles = makeStyles(({ colors }) => ({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  padded: { padding: spacing.base },
  pressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
}));
