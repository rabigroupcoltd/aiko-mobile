import { Pressable, Text, View } from 'react-native';

import { Chip } from '@/components/ui';
import { makeStyles, radius, spacing } from '@/theme';
import type { Place, PlaceCategory } from '@/types/models';

interface PlaceRowProps {
  place: Place;
  onPress: () => void;
  /** Show the "Cached" badge — this result came from the local list. */
  cached?: boolean;
}

const CATEGORY_ICON: Record<PlaceCategory, string> = {
  landmark: '📍',
  market: '🛒',
  campus: '🎓',
  hospital: '🏥',
  transport: '🚏',
  government: '🏛️',
  residential: '🏘️',
};

/** Saved addresses and Google results carry no category. */
const DEFAULT_ICON = '📍';
const SAVED_ICON = '⭐';

function iconFor(place: Place): string {
  if (place.category) return CATEGORY_ICON[place.category];
  return place.source === 'SAVED' ? SAVED_ICON : DEFAULT_ICON;
}

export function PlaceRow({ place, onPress, cached }: PlaceRowProps) {
  const styles = useStyles();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={styles.icon}>
        <Text style={styles.iconText}>{iconFor(place)}</Text>
      </View>

      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>
          {place.name}
        </Text>
        <Text style={styles.area} numberOfLines={1}>
          {place.address}
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
