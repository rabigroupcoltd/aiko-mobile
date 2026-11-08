import { ScrollView, Text, View } from 'react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';

import { PressableScale, Shimmer } from '@/components/motion';
import { describeVehicle } from '@/data/vehicleTypes';
import type { FareQuote } from '@/modules/pricing/pricingTypes';
import type { VehicleType } from '@/modules/shared/apiTypes';
import { Icon } from '@/components/ui';
import { makeStyles, radius, spacing, useTheme } from '@/theme';

interface VehiclePickerProps {
  quotes: FareQuote[];
  selected: VehicleType;
  onSelect: (vehicleType: VehicleType) => void;
  loading?: boolean;
}

export function VehiclePicker({ quotes, selected, onSelect, loading }: VehiclePickerProps) {
  const styles = useStyles();
  const { colors } = useTheme();

  if (loading && quotes.length === 0) {
    return (
      <View style={styles.loading} accessibilityLabel="Getting prices">
        {[0, 1, 2].map((i) => (
          <Shimmer key={i} width={96} height={118} rounded={radius.md} />
        ))}
      </View>
    );
  }

  if (quotes.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}>
      {quotes.map((quote, i) => {
        const vehicle = describeVehicle(quote.vehicleType);
        const active = quote.vehicleType === selected;

        return (
          <Animated.View key={quote.vehicleType} entering={FadeInRight.delay(i * 60).springify().damping(16)}>
          <PressableScale
            onPress={() => onSelect(quote.vehicleType)}
            haptic="select"
            scaleTo={0.94}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`${vehicle.label}, ₦${quote.fare.toLocaleString()}, about ${Math.round(quote.durationMins)} minutes`}
            style={[styles.tile, active && styles.tileActive]}>
            {active ? (
              <View style={styles.check}>
                <Icon name="check" size={12} color={colors.onPrimary} strokeWidth={3} />
              </View>
            ) : null}
            <Text style={styles.emoji}>{vehicle.emoji}</Text>
            <Text style={[styles.label, active && styles.labelActive]}>{vehicle.label}</Text>
            <Text style={styles.local}>{vehicle.localName}</Text>
            <Text style={[styles.fare, active && styles.fareActive]}>
              ₦{quote.fare.toLocaleString()}
            </Text>
            <Text style={styles.eta}>{Math.max(1, Math.round(quote.durationMins))} min</Text>
          </PressableScale>
          </Animated.View>
        );
      })}
    </ScrollView>
  );
}

const useStyles = makeStyles(({ colors, type }) => ({
  row: { gap: spacing.sm, paddingVertical: spacing.xs },
  loading: { flexDirection: 'row', gap: spacing.sm, paddingVertical: spacing.xs },

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
  tileActive: { borderColor: colors.primary, backgroundColor: colors.primarySubtle, borderWidth: 2 },
  check: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emoji: { fontSize: 22 },
  label: { ...type.subheading, fontSize: 14 },
  labelActive: { color: colors.primaryDarker },
  local: { ...type.caption, fontSize: 11 },
  fare: { ...type.heading, fontSize: 16, marginTop: spacing.xxs },
  fareActive: { color: colors.primaryDarker },
  eta: { ...type.caption, fontSize: 11 },
}));
