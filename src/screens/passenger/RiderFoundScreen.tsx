import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { MatchingAnimation } from '@/components/booking/MatchingAnimation';
import { MapPanel } from '@/components/booking/MapPanel';
import { Avatar, Button, Card, Chip, Screen } from '@/components/ui';
import { BOOKING_COPY } from '@/data/copy';
import { describeVehicle } from '@/data/vehicleTypes';
import { useRideEvent } from '@/hooks/useRideSocket';
import {
  CancelOrderManager,
  RateOrderManager,
  useGetOrderEtaManager,
  useGetOrderManager,
} from '@/modules/orders/ordersController';
import type { Order } from '@/modules/orders/ordersTypes';
import { CLOSED_ORDER_STATUSES, type OrderStatus } from '@/modules/shared/apiTypes';
import { ROUTES } from '@/navigation/routes';
import type { PassengerStackParamList } from '@/navigation/types';
import { getRideSocket } from '@/services/rideSocket';
import { useBookingStore } from '@/store/bookingStore';
import { makeStyles, spacing, useTheme } from '@/theme';
import type { Place } from '@/types/models';
import showToast from '@/utils/toast';

type Props = NativeStackScreenProps<PassengerStackParamList, typeof ROUTES.RIDER_FOUND>;

/**
 * Stages the customer may still call the order off from.
 *
 * Mirrors the server's own list. The server is what enforces it — this only
 * decides whether to show a button that would be refused.
 */
const CUSTOMER_CANCELLABLE: OrderStatus[] = [
  'PENDING',
  'SEARCHING_FOR_DRIVER',
  'ACCEPTED',
  'ARRIVED',
  'RESERVED',
  'DRIVER_ARRIVING_PICKUP',
];

/** The order is finished and the customer may rate it. */
const RATEABLE: OrderStatus[] = ['COMPLETED', 'DELIVERED'];

/**
 * What the passenger is told at each stage, across both lanes.
 *
 * The marketplace lane distinguishes RESERVED from PICKED_UP because the
 * customer cares about exactly that difference: a driver who has committed to
 * their order is not the same as one who has it in hand.
 */
const STAGE_COPY: Record<OrderStatus, { title: string; body: string; tone: 'info' | 'success' }> = {
  PENDING: { title: 'Waiting for a driver', body: 'Still looking.', tone: 'info' },
  ACCEPTED: {
    title: 'Driver on the way',
    body: 'They are heading to your pickup point.',
    tone: 'info',
  },
  ARRIVED: {
    title: 'Your driver has arrived',
    body: 'Look out for them at the pickup point.',
    tone: 'success',
  },
  IN_PROGRESS: { title: 'On the way', body: 'Enjoy your trip.', tone: 'info' },
  COMPLETED: { title: 'Trip completed', body: 'Thanks for riding with Aiko.', tone: 'success' },

  SEARCHING_FOR_DRIVER: {
    title: 'Finding you a driver',
    body: 'Your order is with drivers nearby.',
    tone: 'info',
  },
  RESERVED: {
    title: 'Driver found',
    body: 'They have accepted your order and are on the way.',
    tone: 'success',
  },
  DRIVER_ARRIVING_PICKUP: {
    title: 'Driver arriving',
    body: 'They are close to your pickup point.',
    tone: 'info',
  },
  PICKED_UP: {
    title: 'Order collected',
    body: 'Your driver has it and is heading to the drop-off.',
    tone: 'success',
  },
  IN_TRANSIT: { title: 'On the way', body: 'Your order is in transit.', tone: 'info' },
  DELIVERED: { title: 'Delivered', body: 'Your order has arrived.', tone: 'success' },
  NO_DRIVER_FOUND: {
    title: 'No driver available',
    body: 'Nobody took your order this time. Try again in a moment.',
    tone: 'info',
  },

  CANCELLED: { title: 'Order cancelled', body: 'This order is no longer active.', tone: 'info' },
};

/**
 * The live trip.
 *
 * Everything shown comes from `GET /api/orders/{id}` and the socket — the
 * screen holds no trip state of its own, so it renders identically whether it
 * was reached by accepting a bid or restored from a notification tap.
 */
export function RiderFoundScreen({ navigation, route }: Props) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { orderId } = route.params;

  const reset = useBookingStore((s) => s.reset);
  const [driverPosition, setDriverPosition] = useState<
    { lat: number; lng: number; heading?: number } | null
  >(null);

  /**
   * Polled as a fallback only. `ride-stage-changed` pushes every transition, so
   * the interval exists for a socket that dropped mid-trip — 15s is frequent
   * enough that a missed "driver arrived" is not left stale for long.
   */
  const { data: order, refetch } = useGetOrderManager({ id: orderId, refetchInterval: 15_000 });

  const { cancelOrder, isLoading: cancelling } = CancelOrderManager();
  const { rateOrder, isLoading: rating } = RateOrderManager();

  const driverId = order?.driverId ?? null;

  // Subscribe to the driver's position feed. The gateway also joins us
  // automatically on connect for a trip already in flight, so this mainly
  // covers the trip that was accepted during this session.
  useEffect(() => {
    if (!driverId) return;

    const socket = getRideSocket();
    socket?.emit('subscribe-driver-location', { driverId });

    return () => {
      socket?.emit('unsubscribe-driver-location', { driverId });
    };
  }, [driverId]);

  useRideEvent(
    'driver-location-update',
    (position) => {
      if (position.driverId !== driverId) return;
      setDriverPosition({ lat: position.lat, lng: position.lng, heading: position.heading });
    },
    Boolean(driverId),
  );

  const status = order?.status ?? 'PENDING';
  const searching = status === 'SEARCHING_FOR_DRIVER' || status === 'PENDING';
  const finished = CLOSED_ORDER_STATUSES.includes(status);
  const copy = STAGE_COPY[status];

  /**
   * When the driver actually reaches this order.
   *
   * Polled only while the order is live and assigned — a driver taking on
   * another compatible order changes this number, and §39 is the whole reason
   * it comes from the server rather than a straight line on the map.
   */
  const { data: eta, refetch: refetchEta } = useGetOrderEtaManager({
    id: orderId,
    enabled: Boolean(driverId) && !finished,
    refetchInterval: 30_000,
  });

  useRideEvent('ride-stage-changed', () => void refetch(), Boolean(orderId));
  useRideEvent('trip-cancelled', () => void refetch(), Boolean(orderId));

  // A driver claimed the order. Both the order and its ETA change at once, so
  // the ETA is refetched alongside rather than waiting for its own poll.
  useRideEvent(
    'order-reserved',
    (payload) => {
      if (payload?.order?.id !== orderId) return;
      void refetch();
      void refetchEta();
    },
    Boolean(orderId),
  );
  useRideEvent('order-no-driver', () => void refetch(), Boolean(orderId));

  const goHome = useCallback(() => {
    reset();
    navigation.navigate(ROUTES.PASSENGER_HOME);
  }, [reset, navigation]);

  const handleCancel = useCallback(() => {
    Alert.alert('Cancel this trip?', 'Your driver is already on the way.', [
      { text: 'Keep trip', style: 'cancel' },
      {
        text: 'Cancel trip',
        style: 'destructive',
        onPress: async () => {
          try {
            await cancelOrder({ id: orderId, reason: 'Cancelled by passenger' });
            goHome();
          } catch (e: any) {
            showToast.error(e?.message ?? 'Could not cancel the trip.');
          }
        },
      },
    ]);
  }, [cancelOrder, orderId, goHome]);

  const handleCall = useCallback(() => {
    const phone = order?.driver?.user?.phone;
    if (!phone) {
      showToast.error('No phone number on file for this driver.');
      return;
    }
    void Linking.openURL(`tel:${phone}`);
  }, [order]);

  const handleRate = useCallback(
    async (score: number) => {
      try {
        await rateOrder({ id: orderId, score });
        goHome();
      } catch (e: any) {
        showToast.error(e?.message ?? 'Could not submit your rating.');
      }
    },
    [rateOrder, orderId, goHome],
  );

  if (!order) {
    return (
      <Screen>
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Loading your order…</Text>
        </View>
      </Screen>
    );
  }

  /**
   * Still looking.
   *
   * A separate return rather than a variant of the trip layout: there is no
   * driver card, no position feed and nothing to call, so most of the screen
   * below would render empty. The order is live server-side the whole time —
   * this is a real search, not a spinner.
   */
  if (searching) {
    return (
      <Screen
        footer={
          <Button
            label="Cancel order"
            variant="ghost"
            onPress={handleCancel}
            loading={cancelling}
          />
        }>
        <View style={styles.searching}>
          <MatchingAnimation stages={BOOKING_COPY.matchingStages} stageIndex={0} />
          <Text style={styles.searchTitle}>{copy.title}</Text>
          <Text style={styles.searchBody} numberOfLines={2}>
            {order.pickupLocation} → {order.dropoffLocation}
          </Text>
          <Text style={styles.searchFare}>₦{order.fare.toLocaleString()}</Text>
        </View>
      </Screen>
    );
  }

  if (status === 'NO_DRIVER_FOUND') {
    return (
      <Screen footer={<Button label="Try again" onPress={goHome} />}>
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>{copy.title}</Text>
          <Text style={styles.emptyText}>{copy.body}</Text>
        </View>
      </Screen>
    );
  }

  const driver = order.driver;
  const vehicle = describeVehicle(order.vehicleType);
  const driverName = driver?.user?.name ?? 'Your driver';

  return (
    <Screen
      scroll
      footer={
        <View style={styles.actions}>
          {RATEABLE.includes(status) ? (
            <>
              <Text style={styles.rateLabel}>Rate {driverName.split(' ')[0]}</Text>
              <View style={styles.stars}>
                {[1, 2, 3, 4, 5].map((score) => (
                  <Pressable
                    key={score}
                    onPress={() => handleRate(score)}
                    disabled={rating}
                    accessibilityRole="button"
                    accessibilityLabel={`Rate ${score} out of 5`}
                    hitSlop={6}
                    style={({ pressed }) => [styles.star, pressed && styles.starPressed]}>
                    <Text style={styles.starGlyph}>★</Text>
                  </Pressable>
                ))}
              </View>
              <Button label="Skip" variant="ghost" onPress={goHome} />
            </>
          ) : finished ? (
            <Button label="Place another order" onPress={goHome} />
          ) : (
            <>
              <View style={styles.contactRow}>
                <Button
                  label="Chat"
                  variant="secondary"
                  onPress={() =>
                    navigation.navigate(ROUTES.ORDER_CHAT, { orderId, title: driverName })
                  }
                  leading={<Text>💬</Text>}
                  style={styles.contactButton}
                />
                <Button
                  label="Call"
                  variant="secondary"
                  onPress={handleCall}
                  leading={<Text>📞</Text>}
                  style={styles.contactButton}
                />
              </View>
              {/* Only offered while it is still the customer's to cancel — once
                  the driver physically has the order the server refuses. */}
              {CUSTOMER_CANCELLABLE.includes(status) ? (
                <Button
                  label="Cancel order"
                  variant="ghost"
                  onPress={handleCancel}
                  loading={cancelling}
                />
              ) : null}
            </>
          )}
        </View>
      }>
      <View style={[styles.banner, copy.tone === 'info' && styles.bannerInfo]}>
        <Text style={[styles.bannerIcon, copy.tone === 'info' && styles.bannerIconInfo]}>
          {copy.tone === 'success' ? '✓' : vehicle.emoji}
        </Text>
        <View style={styles.bannerText}>
          <Text style={[styles.bannerTitle, copy.tone === 'info' && styles.bannerTitleInfo]}>
            {copy.title}
          </Text>
          <Text style={[styles.bannerBody, copy.tone === 'info' && styles.bannerBodyInfo]}>
            {copy.body}
          </Text>
        </View>
      </View>

      {/*
        §20. The customer is told their driver has other work and what it costs
        them in minutes — and nothing at all about whose orders those are or
        where they go.
      */}
      {eta && !finished ? (
        <Card style={styles.etaCard}>
          <View style={styles.etaRow}>
            <Text style={styles.etaLabel}>
              {order.pickedUpAt ? 'Arriving at drop-off' : 'Estimated pickup'}
            </Text>
            <Text style={styles.etaValue}>
              {(order.pickedUpAt ? eta.deliveryMinutes : eta.pickupMinutes) ?? '—'} min
            </Text>
          </View>
          {eta.driverHandlingOtherOrders ? (
            <Text style={styles.etaNote}>
              Your driver is handling another nearby order — this time already
              accounts for it.
            </Text>
          ) : null}
        </Card>
      ) : null}

      <MapPanel
        pickup={toPlace(order, 'pickup')}
        dropoff={toPlace(order, 'dropoff')}
        driver={finished ? null : driverPosition}
        style={styles.map}
      />

      {driver ? (
        <Card elevation="md" style={styles.driverCard}>
          <View style={styles.driverHeader}>
            <Avatar name={driverName} size={52} />
            <View style={styles.driverIdentity}>
              <Text style={styles.driverName}>{driverName}</Text>
              <View style={styles.ratingRow}>
                <Text style={styles.rating}>★ {driver.rating.toFixed(1)}</Text>
                <Text style={styles.trips}>· {driver.totalTrips.toLocaleString()} trips</Text>
              </View>
              <Chip label={`${vehicle.emoji} ${vehicle.label}`} tone="brand" />
            </View>
            <View style={styles.plateBox}>
              <Text style={styles.plate}>{driver.vehiclePlate}</Text>
              <Text style={styles.vehicleModel}>
                {[driver.vehicleColor, driver.vehicleModel].filter(Boolean).join(' ')}
              </Text>
            </View>
          </View>
        </Card>
      ) : null}

      <Card style={styles.trip}>
        <View style={styles.tripHeader}>
          <Text style={styles.tripTitle}>Your trip</Text>
          <Text style={styles.tripFare}>
            {order.currency === 'NGN' ? '₦' : `${order.currency} `}
            {order.fare.toLocaleString()}
          </Text>
        </View>

        <TripLeg
          dotColor={colors.primary}
          label="Pickup"
          value={order.pickupLocation}
        />
        <View style={styles.legConnector} />
        <TripLeg
          dotColor={colors.danger}
          label="Drop-off"
          value={order.dropoffLocation}
        />

        <View style={styles.tripMeta}>
          <Text style={styles.tripMetaText}>{order.distanceKm.toFixed(1)} km</Text>
          <Text style={styles.tripMetaText}>·</Text>
          <Text style={styles.tripMetaText}>{Math.round(order.durationMins)} min</Text>
          <Text style={styles.tripMetaText}>·</Text>
          <Text style={styles.tripMetaText}>
            {order.paymentMethod === 'CASH' ? 'Cash' : 'Transfer'}
          </Text>
        </View>
      </Card>
    </Screen>
  );
}

/** The map takes `Place`s; an order carries the same points as flat columns. */
function toPlace(order: Order, end: 'pickup' | 'dropoff'): Place {
  const isPickup = end === 'pickup';
  return {
    id: `${order.id}-${end}`,
    name: isPickup ? order.pickupLocation : order.dropoffLocation,
    address: isPickup ? order.pickupLocation : order.dropoffLocation,
    lat: isPickup ? order.pickupLat : order.dropoffLat,
    lng: isPickup ? order.pickupLng : order.dropoffLng,
    placeId: null,
    category: null,
    source: 'CACHED',
    isDefault: false,
  };
}

function TripLeg({
  dotColor,
  label,
  value,
}: {
  dotColor: string;
  label: string;
  value: string;
}) {
  const styles = useStyles();
  return (
    <View style={styles.leg}>
      <View style={[styles.legDot, { backgroundColor: dotColor }]} />
      <View style={styles.legBody}>
        <Text style={styles.legLabel}>{label}</Text>
        <Text style={styles.legValue}>{value}</Text>
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

  // An in-progress stage is informational, not a success state — green with a
  // tick would read as "finished" halfway through the trip.
  bannerInfo: { backgroundColor: colors.infoBg },
  bannerIconInfo: { backgroundColor: 'transparent', color: colors.info, fontSize: 20 },
  bannerTitleInfo: { color: colors.text },
  bannerBodyInfo: { color: colors.textMuted },

  map: { height: 200, marginBottom: spacing.base },

  driverCard: { gap: spacing.md },
  driverHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  driverIdentity: { flex: 1, gap: spacing.xs, alignItems: 'flex-start' },
  driverName: { ...type.heading, fontSize: 16 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  rating: { ...type.bodySmall, color: colors.warning, fontWeight: '600' },
  trips: type.caption,
  plateBox: { alignItems: 'flex-end', gap: 2 },
  plate: { ...type.subheading, fontSize: 15 },
  vehicleModel: { ...type.caption },

  trip: { marginTop: spacing.base, gap: spacing.sm },
  tripHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tripTitle: { ...type.label },
  tripFare: { ...type.heading, fontSize: 18, color: colors.primary },
  leg: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  legDot: { width: 10, height: 10, borderRadius: 5, marginTop: 5 },
  legBody: { flex: 1, gap: 1 },
  legLabel: { ...type.caption },
  legValue: { ...type.body, fontSize: 15 },
  legConnector: { width: 2, height: 18, backgroundColor: colors.border, marginLeft: 4 },
  tripMeta: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  tripMetaText: { ...type.caption },

  etaCard: { gap: spacing.xs, marginBottom: spacing.base },
  etaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  etaLabel: { ...type.label },
  etaValue: { ...type.heading, fontSize: 18, color: colors.primary },
  etaNote: { ...type.caption },

  searching: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.sm },
  searchTitle: { ...type.title, textAlign: 'center' },
  searchBody: { ...type.bodySmall, textAlign: 'center', maxWidth: 300 },
  searchFare: { ...type.heading, fontSize: 22, color: colors.primary },

  contactRow: { flexDirection: 'row', gap: spacing.sm },
  contactButton: { flex: 1 },

  actions: { gap: spacing.sm },
  rateLabel: { ...type.subheading, textAlign: 'center' },
  stars: { flexDirection: 'row', gap: spacing.md, justifyContent: 'center' },
  star: { paddingHorizontal: spacing.xs, paddingVertical: spacing.xxs },
  starPressed: { opacity: 0.5 },
  starGlyph: { fontSize: 34, color: colors.warning },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.base },
  emptyTitle: { ...type.title, textAlign: 'center' },
  emptyText: { ...type.body, textAlign: 'center' },
}));
