import { Pressable, Text, View, type ViewStyle } from 'react-native';

import { makeStyles, radius, shadows, spacing } from '@/theme';

interface SelectableCardProps {
  title: string;
  description?: string;
  icon?: string;
  selected: boolean;
  onPress: () => void;
  meta?: string;
  style?: ViewStyle;
  testID?: string;
}

export function SelectableCard({
  title,
  description,
  icon,
  selected,
  onPress,
  meta,
  style,
  testID,
}: SelectableCardProps) {
  const styles = useStyles();

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        styles.card,
        selected ? styles.selected : shadows.sm,
        pressed && styles.pressed,
        style,
      ]}>
      {icon ? (
        <View style={[styles.iconBadge, selected && styles.iconBadgeSelected]}>
          <Text style={styles.icon}>{icon}</Text>
        </View>
      ) : null}

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{title}</Text>
          {meta ? <Text style={styles.meta}>{meta}</Text> : null}
        </View>
        {description ? <Text style={styles.description}>{description}</Text> : null}
      </View>

      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected ? <Text style={styles.check}>✓</Text> : null}
      </View>
    </Pressable>
  );
}

const useStyles = makeStyles(({ colors, type }) => ({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
    padding: spacing.base,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.border,
  },
  selected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySubtle,
  },
  pressed: { opacity: 0.92 },
  iconBadge: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBadgeSelected: { backgroundColor: colors.primaryLight },
  icon: { fontSize: 26 },
  body: { flex: 1, gap: spacing.xxs },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  title: { ...type.subheading, flexShrink: 1 },
  meta: type.caption,
  description: type.bodySmall,
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { borderColor: colors.primary, backgroundColor: colors.primary },
  check: { color: colors.onPrimary, fontSize: 14, fontWeight: '700', lineHeight: 16 },
}));
