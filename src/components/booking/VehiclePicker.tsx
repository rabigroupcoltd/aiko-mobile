import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

import { describeVehicle } from '@/data/vehicleTypes';
import type { FareQuote } from '@/modules/pricing/pricingTypes';
import type { VehicleType } from '@/modules/shared/apiTypes';
import { makeStyles, radius, spacing } from '@/theme';

interface VehiclePickerProps {
  quotes: FareQuote[];
  selected: VehicleType;
  onSelect: (vehicleType: VehicleType) => void;
  loading?: boolean;
}

export function VehiclePicker({ quotes, selected, onSelect, loading }: VehiclePickerProps) {
  const styles = useStyles();

  if (loading && quotes.length === 0) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator />
        <Text style={styles.loadingText}>Getting prices…</Text>
      </View>
    );
  }

  if (quotes.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}>
      {quotes.map((quote) => {
        const vehicle = describeVehicle(quote.vehicleType);
        const active = quote.vehicleType === selected;

        return (
          <Pressable
            key={quote.vehicleType}
            onPress={() => onSelect(quote.vehicleType)}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`${vehicle.label}, ₦${quote.fare.toLocaleString()}, about ${Math.round(quote.durationMins)} minutes`}
            style={({ pressed }) => [
              styles.tile,
              active && styles.tileActive,
              pressed && styles.tilePressed,
            ]}>
            <Text style={styles.emoji}>{vehicle.emoji}</Text>
            <Text style={[styles.label, active && styles.labelActive]}>{vehicle.label}</Text>
            <Text style={styles.local}>{vehicle.localName}</Text>
            <Text style={[styles.fare, active && styles.fareActive]}>
              ₦{quote.fare.toLocaleString()}
            </Text>
            <Text style={styles.eta}>{Math.max(1, Math.round(quote.durationMins))} min</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const useStyles = makeStyles(({ colors, type }) => ({
  row: { gap: spacing.sm, paddingVertical: spacing.xs },
  loading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.base,
  },
  loadingText: { ...type.caption },

  tile: {
    minWidth: 96,
    alignItems: 'center',
    gap: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  tileActive: { borderColor: colors.primary, backgroundColor: colors.primarySubtle },
  tilePressed: { opacity: 0.7 },

  emoji: { fontSize: 22 },
  label: { ...type.subheading, fontSize: 14 },
  labelActive: { color: colors.primaryDarker },
  local: { ...type.caption, fontSize: 11 },
  fare: { ...type.heading, fontSize: 16, marginTop: spacing.xxs },
  fareActive: { color: colors.primaryDarker },
  eta: { ...type.caption, fontSize: 11 },
}));
