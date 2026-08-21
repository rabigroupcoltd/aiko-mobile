import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { MapPanel } from '@/components/booking/MapPanel';
import { Button, Card, Chip, Screen } from '@/components/ui';
import { describeVehicle } from '@/data/vehicleTypes';
import { CreateOrderManager } from '@/modules/orders/ordersController';
import { useGetFareEstimateManager } from '@/modules/pricing/pricingController';
import { ROUTES } from '@/navigation/routes';
import type { PassengerStackParamList } from '@/navigation/types';
import { useBookingStore } from '@/store/bookingStore';
import { makeStyles, spacing, useTheme } from '@/theme';
import { formatE164ForDisplay, toE164 } from '@/utils/phone';
import showToast from '@/utils/toast';

type Props = NativeStackScreenProps<PassengerStackParamList, typeof ROUTES.ORDER_REVIEW>;

/**
 * The confirmation step — §5.
 *
 * Nothing exists server-side until the customer taps Confirm. The price shown
 * is re-quoted here rather than carried from the home screen: the customer is
 * about to agree to a number, and the number they agree to must be the one the
 * order is created at, not one that was fetched a minute and a price change ago.
 */
export function OrderReviewScreen({ navigation }: Props) {
  const styles = useStyles();
  const { colors } = useTheme();

  const pickup = useBookingStore((s) => s.pickup);
  const dropoff = useBookingStore((s) => s.dropoff);
  const pickupPhone = useBookingStore((s) => s.pickupPhone);
  const dropoffPhone = useBookingStore((s) => s.dropoffPhone);
  const vehicleType = useBookingStore((s) => s.vehicleType);
  const confirmBooking = useBookingStore((s) => s.confirmBooking);

  const { createOrder } = CreateOrderManager();
  const [confirming, setConfirming] = useState(false);

  const { data: quote, isFetching: quoting } = useGetFareEstimateManager({
    vehicleType,
    pickupLat: pickup?.lat,
    pickupLng: pickup?.lng,
    dropoffLat: dropoff?.lat,
    dropoffLng: dropoff?.lng,
  });

  const handleConfirm = useCallback(async () => {
    if (!pickup || !dropoff || confirming) return;
    setConfirming(true);

    try {
      const order = await createOrder({
        vehicleType,
        pickupLocation: pickup.name,
        dropoffLocation: dropoff.name,
        pickupLat: pickup.lat,
        pickupLng: pickup.lng,
        dropoffLat: dropoff.lat,
        dropoffLng: dropoff.lng,
        pickupPhone: toE164(pickupPhone),
        dropoffPhone: toE164(dropoffPhone),
        paymentMethod: 'CASH',
        // This is the marketplace lane. The order opens at
        // SEARCHING_FOR_DRIVER and nearby drivers claim it themselves.
        dispatch: true,
      });

      confirmBooking(order.id);
      // `replace` so Back from the tracking screen does not land on a
      // confirmation for an order that has already been placed.
      navigation.replace(ROUTES.RIDER_FOUND, { orderId: order.id });
    } catch (e: any) {
      showToast.error(e?.message ?? 'Could not place your order.');
      setConfirming(false);
    }
  }, [
    pickup,
    dropoff,
    pickupPhone,
    dropoffPhone,
    vehicleType,
    confirming,
    createOrder,
    confirmBooking,
    navigation,
  ]);

  // Reached only with both ends set, but a state reset mid-navigation would
  // otherwise render an empty summary.
  if (!pickup || !dropoff) {
    return (
      <Screen>
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Your order details are missing.</Text>
          <Button label="Start again" onPress={() => navigation.navigate(ROUTES.PASSENGER_HOME)} />
        </View>
      </Screen>
    );
  }

  const vehicle = describeVehicle(vehicleType);
  const total = quote?.fare ?? 0;

  return (
    <Screen
      scroll
      footer={
        <View style={styles.footer}>
          <Button
            label={quote ? `Confirm order · ₦${total.toLocaleString()}` : 'Confirm order'}
            onPress={handleConfirm}
            loading={confirming || quoting}
            disabled={!quote || confirming}
            testID="confirm-order"
          />
          <Button
            label="Edit details"
            variant="ghost"
            onPress={() => navigation.goBack()}
            disabled={confirming}
          />
        </View>
      }>
      <Text style={styles.title}>Order summary</Text>
      <Text style={styles.subtitle}>
        Nothing is sent to drivers until you confirm.
      </Text>

      <MapPanel pickup={pickup} dropoff={dropoff} style={styles.map} />

      <Card style={styles.section}>
        <Leg
          dotColor={colors.primary}
          label="Pickup"
          value={pickup.name}
          phone={pickupPhone}
        />
        <View style={styles.connector} />
        <Leg
          dotColor={colors.danger}
          label="Drop-off"
          value={dropoff.name}
          phone={dropoffPhone}
        />
      </Card>

      <Card style={styles.section}>
        <View style={styles.vehicleRow}>
          <Chip label={`${vehicle.emoji} ${vehicle.label}`} tone="brand" />
          <Text style={styles.vehicleHint}>{vehicle.localName}</Text>
        </View>

        {/*
          Every line comes from the server's own breakdown. There is no fare
          arithmetic on this screen — a number computed here could only ever
          disagree with what the order is actually created at.
        */}
        <PriceRow label="Base fare" value={quote?.breakdown.baseFare} />
        <PriceRow label="Distance" value={quote?.breakdown.distanceCharge} />
        <PriceRow label="Time" value={quote?.breakdown.timeCharge} />
        {quote?.breakdown.bookingFee ? (
          <PriceRow label="Booking fee" value={quote.breakdown.bookingFee} />
        ) : null}
        {quote && quote.breakdown.surgeMultiplier > 1 ? (
          <PriceRow label="Surge" value={`×${quote.breakdown.surgeMultiplier}`} raw />
        ) : null}

        <View style={styles.totalDivider} />

        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Distance</Text>
          <Text style={styles.metaValue}>{(quote?.distanceKm ?? 0).toFixed(1)} km</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Estimated time</Text>
          <Text style={styles.metaValue}>
            {Math.max(1, Math.round(quote?.durationMins ?? 0))} min
          </Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Payment</Text>
          <Text style={styles.metaValue}>Cash</Text>
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>₦{total.toLocaleString()}</Text>
        </View>
      </Card>
    </Screen>
  );
}

function Leg({
  dotColor,
  label,
  value,
  phone,
}: {
  dotColor: string;
  label: string;
  value: string;
  phone: string;
}) {
  const styles = useStyles();
  return (
    <View style={styles.leg}>
      <View style={[styles.legDot, { backgroundColor: dotColor }]} />
      <View style={styles.legBody}>
        <Text style={styles.legLabel}>{label}</Text>
        <Text style={styles.legValue}>{value}</Text>
        <Text style={styles.legPhone}>{formatE164ForDisplay(phone)}</Text>
      </View>
    </View>
  );
}

function PriceRow({
  label,
  value,
  raw,
}: {
  label: string;
  value: number | string | undefined;
  raw?: boolean;
}) {
  const styles = useStyles();
  if (value == null) return null;

  return (
    <View style={styles.priceRow}>
      <Text style={styles.priceLabel}>{label}</Text>
      <Text style={styles.priceValue}>
        {raw ? value : `₦${Math.round(Number(value)).toLocaleString()}`}
      </Text>
    </View>
  );
}

const useStyles = makeStyles(({ colors, type }) => ({
  title: { ...type.title },
  subtitle: { ...type.bodySmall, marginTop: spacing.xxs, marginBottom: spacing.base },
  map: { height: 180, marginBottom: spacing.base },
  section: { gap: spacing.sm, marginBottom: spacing.base },

  leg: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  legDot: { width: 10, height: 10, borderRadius: 5, marginTop: 5 },
  legBody: { flex: 1, gap: 1 },
  legLabel: { ...type.caption },
  legValue: { ...type.body, fontSize: 15 },
  legPhone: { ...type.caption, color: colors.textMuted },
  connector: { width: 2, height: 18, backgroundColor: colors.border, marginLeft: 4 },

  vehicleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  vehicleHint: { ...type.caption },

  priceRow: { flexDirection: 'row', justifyContent: 'space-between' },
  priceLabel: { ...type.bodySmall },
  priceValue: { ...type.bodySmall, fontWeight: '600' },
  totalDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.divider,
    marginVertical: spacing.xs,
  },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between' },
  metaLabel: { ...type.caption },
  metaValue: { ...type.caption, color: colors.text, fontWeight: '600' },

  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    marginTop: spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  totalLabel: { ...type.subheading },
  totalValue: { ...type.heading, fontSize: 20, color: colors.primary },

  footer: { gap: spacing.sm },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.base },
  emptyText: { ...type.body },
}));
