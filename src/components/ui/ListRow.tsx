import type { ReactNode } from 'react';
import { Pressable, Text, View, type ViewStyle } from 'react-native';

import { makeStyles, radius, spacing } from '@/theme';

interface ListRowProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  trailing?: ReactNode;
  onPress?: () => void;
  chevron?: boolean;
  style?: ViewStyle;
}

export function ListRow({
  title,
  subtitle,
  icon,
  trailing,
  onPress,
  chevron,
  style,
}: ListRowProps) {
  const styles = useStyles();
  const showChevron = chevron ?? (!!onPress && !trailing);

  const content = (
    <>
      {icon ? (
        <View style={styles.iconBadge}>
          {typeof icon === 'string' ? <Text style={styles.icon}>{icon}</Text> : icon}
        </View>
      ) : null}

      <View style={styles.body}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>

      {trailing}
      {showChevron ? <Text style={styles.chevron}>›</Text> : null}
    </>
  );

  if (!onPress) return <View style={[styles.row, style]}>{content}</View>;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.row, pressed && styles.pressed, style]}>
      {content}
    </Pressable>
  );
}

const useStyles = makeStyles(({ colors, type }) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    minHeight: 60,
  },
  pressed: { backgroundColor: colors.surfaceAlt },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 18 },
  body: { flex: 1, gap: 2 },
  title: { ...type.body, fontSize: 15 },
  subtitle: type.caption,
  chevron: { fontSize: 24, color: colors.textDisabled, lineHeight: 26 },
}));
