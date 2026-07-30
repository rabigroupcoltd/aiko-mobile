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
  const matchState = useBookingStore((s) => s.matchState);
  const confirmBooking = useBookingStore((s) => s.confirmBooking);
  const reset = useBookingStore((s) => s.reset);

  /**
   * A found rider is a proposal until the passenger confirms it. Before that
   * this screen is a quote to review — rider, fare and route — and nothing has
   * been booked.
   *
   * The real flow continues from `confirmBooking()`: push the request to the
   * rider's device, wait for them to accept, then update the passenger. None of
   * that exists here (no backend, one device), so confirming goes straight to
   * the trip being under way rather than faking an acceptance round-trip.
   */
  const confirmed = matchState === 'confirmed';

  const km = distanceKm(pickup, dropoff);
  const fare = rider ? estimateFare(km, getVehicle(rider.vehicle).fareMultiplier) : null;

  const handleCancel = () => {
    const [title, body, confirmLabel] = confirmed
      ? ['Cancel this trip?', 'Your rider is already on the way.', 'Cancel trip']
      : ['Discard this booking?', 'Nothing has been booked yet.', 'Discard'];

    Alert.alert(title, body, [
      { text: 'Keep', style: 'cancel' },
      {
        text: confirmLabel,
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
          {confirmed ? (
            <>
              <Button
                label="Call rider"
                variant="secondary"
                onPress={() => Alert.alert('Demo', 'Calling is not available in this demo.')}
                leading={<Text>📞</Text>}
              />
              <Button label="Cancel trip" variant="ghost" onPress={handleCancel} />
            </>
          ) : (
            <>
              <Button
                label={fare != null ? `Confirm booking · ₦${fare.toLocaleString()}` : 'Confirm booking'}
                onPress={confirmBooking}
                testID="confirm-booking"
              />
              <Button label="Cancel" variant="ghost" onPress={handleCancel} />
            </>
          )}
        </View>
      }>
      <View style={[styles.banner, !confirmed && styles.bannerPending]}>
        <Text style={[styles.bannerIcon, !confirmed && styles.bannerIconPending]}>
          {confirmed ? '✓' : '🏍️'}
        </Text>
        <View style={styles.bannerText}>
          <Text style={[styles.bannerTitle, !confirmed && styles.bannerTitlePending]}>
            {confirmed ? 'Rider found' : 'We found you a rider'}
          </Text>
          <Text style={[styles.bannerBody, !confirmed && styles.bannerBodyPending]}>
            {confirmed
              ? `${rider.name.split(' ')[0]} is on the way to your pickup point.`
              : 'Check the fare and route, then confirm to book.'}
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

  // Before confirming, the banner is informational rather than a success state —
  // green with a tick would read as "booked" when nothing has been booked.
  bannerPending: { backgroundColor: colors.infoBg },
  bannerIconPending: { backgroundColor: 'transparent', color: colors.info, fontSize: 20 },
  bannerTitlePending: { color: colors.text },
  bannerBodyPending: { color: colors.textMuted },

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
