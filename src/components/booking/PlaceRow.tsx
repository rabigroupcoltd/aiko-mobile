import { Pressable, Text, View } from 'react-native';

import { Chip } from '@/components/ui';
import { makeStyles, radius, spacing } from '@/theme';
import type { Place } from '@/types/models';

interface PlaceRowProps {
  place: Place;
  onPress: () => void;
  /** Show the "Cached" badge — this result came from the local list. */
  cached?: boolean;
}

const CATEGORY_ICON: Record<Place['category'], string> = {
  landmark: '📍',
  market: '🛒',
  campus: '🎓',
  hospital: '🏥',
  transport: '🚏',
  government: '🏛️',
  residential: '🏘️',
};

export function PlaceRow({ place, onPress, cached }: PlaceRowProps) {
  const styles = useStyles();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={styles.icon}>
        <Text style={styles.iconText}>{CATEGORY_ICON[place.category]}</Text>
      </View>

      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>
          {place.name}
        </Text>
        <Text style={styles.area} numberOfLines={1}>
          {place.area}, Minna
        </Text>
      </View>

      {cached ? <Chip label="Cached" tone="brand" /> : null}
    </Pressable>
  );
}

const useStyles = makeStyles(({ colors, type }) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  pressed: { backgroundColor: colors.surfaceAlt, borderRadius: radius.md },
  icon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: { fontSize: 18 },
  body: { flex: 1, gap: 1 },
  name: { ...type.body, fontSize: 15 },
  area: type.caption,
}));
