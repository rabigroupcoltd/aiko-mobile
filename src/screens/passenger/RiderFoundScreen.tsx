import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Alert, Text, View } from 'react-native';

import { MapPanel } from '@/components/booking/MapPanel';
import { RiderResultCard } from '@/components/booking/RiderResultCard';
import { Button, Card, Screen } from '@/components/ui';
import { getVehicle } from '@/data/vehicleTypes';
import { ROUTES } from '@/navigation/routes';
import type { PassengerStackParamList } from '@/navigation/types';
import { useBookingStore } from '@/store/bookingStore';
import { makeStyles, spacing, useTheme } from '@/theme';
import { distanceKm, estimateFare } from '@/utils/search';

type Props = NativeStackScreenProps<PassengerStackParamList, typeof ROUTES.RIDER_FOUND>;

export function RiderFoundScreen({ navigation, route }: Props) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { pickup, dropoff } = route.params;
  const rider = useBookingStore((s) => s.matchedRider);
  const reset = useBookingStore((s) => s.reset);

  const km = distanceKm(pickup, dropoff);
  const fare = rider ? estimateFare(km, getVehicle(rider.vehicle).fareMultiplier) : null;

  const handleCancel = () => {
    Alert.alert('Cancel this trip?', 'Your rider is already on the way.', [
      { text: 'Keep trip', style: 'cancel' },
      {
        text: 'Cancel trip',
        style: 'destructive',
        onPress: () => {
          reset();
          navigation.navigate(ROUTES.PASSENGER_HOME);
        },
      },
    ]);
  };

  if (!rider) {
    return (
      <Screen>
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No rider matched.</Text>
          <Button label="Back" onPress={() => navigation.navigate(ROUTES.PASSENGER_HOME)} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      scroll
      footer={
        <View style={styles.actions}>
          <Button
            label="Call rider"
            variant="secondary"
            onPress={() => Alert.alert('Demo', 'Calling is not available in this demo.')}
            leading={<Text>📞</Text>}
          />
          <Button label="Cancel trip" variant="ghost" onPress={handleCancel} />
        </View>
      }>
      <View style={styles.banner}>
        <Text style={styles.bannerIcon}>✓</Text>
        <View style={styles.bannerText}>
          <Text style={styles.bannerTitle}>Rider found</Text>
          <Text style={styles.bannerBody}>
            {rider.name.split(' ')[0]} is on the way to your pickup point.
          </Text>
        </View>
      </View>

      <MapPanel pickup={pickup} dropoff={dropoff} style={styles.map} />

      <RiderResultCard rider={rider} fare={fare ?? undefined} distanceKm={km} />

      <Card style={styles.trip}>
        <Text style={styles.tripTitle}>Your trip</Text>
        <TripLeg dotColor={colors.primary} label="Pickup" value={pickup.name} area={pickup.area} />
        <View style={styles.legConnector} />
        <TripLeg dotColor={colors.danger} label="Drop-off" value={dropoff.name} area={dropoff.area} />
      </Card>
    </Screen>
  );
}

function TripLeg({
  dotColor,
  label,
  value,
  area,
}: {
  dotColor: string;
  label: string;
  value: string;
  area: string;
}) {
  const styles = useStyles();
  return (
    <View style={styles.leg}>
      <View style={[styles.legDot, { backgroundColor: dotColor }]} />
      <View style={styles.legBody}>
        <Text style={styles.legLabel}>{label}</Text>
        <Text style={styles.legValue}>{value}</Text>
        <Text style={styles.legArea}>{area}, Minna</Text>
      </View>
    </View>
  );
}

const useStyles = makeStyles(({ colors, type }) => ({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.base,
    backgroundColor: colors.successBg,
    borderRadius: 14,
    marginBottom: spacing.base,
  },
  bannerIcon: {
    fontSize: 16,
    color: colors.onPrimary,
    backgroundColor: colors.primary,
    width: 30,
    height: 30,
    borderRadius: 15,
    textAlign: 'center',
    lineHeight: 30,
    overflow: 'hidden',
  },
  bannerText: { flex: 1, gap: 1 },
  bannerTitle: { ...type.subheading, color: colors.primaryDarker },
  bannerBody: { ...type.caption, color: colors.primaryDark },

  map: { height: 180, marginBottom: spacing.base },

  trip: { marginTop: spacing.base, gap: spacing.sm },
  tripTitle: { ...type.label, marginBottom: spacing.xxs },
  leg: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  legDot: { width: 10, height: 10, borderRadius: 5, marginTop: 5 },
  legBody: { flex: 1, gap: 1 },
  legLabel: { ...type.caption },
  legValue: { ...type.body, fontSize: 15 },
  legArea: { ...type.caption },
  legConnector: {
    width: 2,
    height: 18,
    backgroundColor: colors.border,
    marginLeft: 4,
  },

  actions: { gap: spacing.sm },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.base },
  emptyText: { ...type.body },
}));
