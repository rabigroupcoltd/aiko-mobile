import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Linking, RefreshControl, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp, LinearTransition } from 'react-native-reanimated';

import { MatchingAnimation } from '@/components/booking/MatchingAnimation';
import { MapPanel } from '@/components/booking/MapPanel';
import { MATCHING_LINES, useMatchingLine } from '@/components/booking/matchingCopy';
import { RatingStars } from '@/components/booking/RatingStars';
import { Confetti, PulseDot, SuccessBurst } from '@/components/motion';
import { Avatar, Button, Card, Chip, Icon, Screen } from '@/components/ui';
import { OrderCodeCard } from '@/components/booking/OrderCodeCard';
import { describeVehicle } from '@/data/vehicleTypes';
import { useRideEvent } from '@/hooks/useRideSocket';
import {
  CancelOrderManager,
  RateOrderManager,
  useGetDriverLocationManager,
  useGetOrderEtaManager,
  useGetOrderManager,
  useGetUnreadCountsManager,
} from '@/modules/orders/ordersController';
import type { Order } from '@/modules/orders/ordersTypes';
import { CLOSED_ORDER_STATUSES, type OrderStatus } from '@/modules/shared/apiTypes';
import { ROUTES } from '@/navigation/routes';
import type { PassengerStackParamList } from '@/navigation/types';
import { useBookingStore } from '@/store/bookingStore';
import { makeStyles, spacing, useTheme } from '@/theme';
import type { Place } from '@/types/models';
import showToast from '@/utils/toast';

type Props = NativeStackScreenProps<PassengerStackParamList, typeof ROUTES.RIDER_FOUND>;

const CUSTOMER_CANCELLABLE: OrderStatus[] = [
  'PENDING',
  'SEARCHING_FOR_DRIVER',
  'ACCEPTED',
  'ARRIVED',
  'RESERVED',
  'DRIVER_ARRIVING_PICKUP',
];

const RATEABLE: OrderStatus[] = ['COMPLETED', 'DELIVERED'];

type StageCopy = { title: string; body: string; tone: 'info' | 'success' };

function stageCopy(status: OrderStatus, rider: string): StageCopy {
  switch (status) {
    case 'PENDING':
    case 'SEARCHING_FOR_DRIVER':
      return { title: 'Finding you a rider', body: 'Riders near your pickup can see your order.', tone: 'info' };
    case 'RESERVED':
    case 'ACCEPTED':
      return { title: `${rider} is on the way`, body: 'Heading to your pickup point now.', tone: 'success' };
    case 'DRIVER_ARRIVING_PICKUP':
      return { title: `${rider} is almost there`, body: 'Get your package ready at the pickup point.', tone: 'info' };
    case 'ARRIVED':
      return { title: `${rider} has arrived`, body: 'Meet them at the pickup point.', tone: 'success' };
    case 'PICKED_UP':
      return { title: 'Package collected', body: `${rider} has it and is heading to the drop-off.`, tone: 'success' };
    case 'IN_TRANSIT':
    case 'IN_PROGRESS':
      return { title: 'On the way to drop-off', body: 'Your package is moving.', tone: 'info' };
    case 'DELIVERED':
    case 'COMPLETED':
      return { title: 'Delivered!', body: 'Your package has arrived safely.', tone: 'success' };
    case 'NO_DRIVER_FOUND':
      return {
        title: 'No rider was free',
        body: 'Nobody could take your order this time. Riders come online all the time, so try again shortly.',
        tone: 'info',
      };
    case 'CANCELLED':
      return { title: 'Order cancelled', body: 'This order is no longer active.', tone: 'info' };
  }
}

const LIVE: OrderStatus[] = [
  'RESERVED',
  'ACCEPTED',
  'DRIVER_ARRIVING_PICKUP',
  'ARRIVED',
  'PICKED_UP',
  'IN_TRANSIT',
  'IN_PROGRESS',
];

// Celebrations play once per order, even if the customer leaves and comes back.
const celebrated = new Set<string>();

function useCelebrateOnce(key: string, when: boolean): boolean {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!when || celebrated.has(key)) return;
    celebrated.add(key);
    setShow(true);
    const t = setTimeout(() => setShow(false), 2600);
    return () => clearTimeout(t);
  }, [key, when]);
  return show;
}

function useNow(intervalMs: number): number {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);
  return now;
}

function sinceLabel(ms: number): string {
  const seconds = Math.max(0, Math.round(ms / 1000));
  if (seconds < 20) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  return minutes < 60 ? `${minutes} min ago` : 'over an hour ago';
}

export function RiderFoundScreen({ navigation, route }: Props) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { orderId } = route.params;

  const reset = useBookingStore((s) => s.reset);
  const [driverPosition, setDriverPosition] = useState<
    { lat: number; lng: number; heading?: number; at: number } | null
  >(null);
  const now = useNow(15_000);

  const { data: order, refetch } = useGetOrderManager({ id: orderId, refetchInterval: 15_000 });

  const { cancelOrder, isLoading: cancelling } = CancelOrderManager();
  const { rateOrder, isLoading: rating } = RateOrderManager();

  const driverId = order?.driverId ?? null;

  useRideEvent(
    'DRIVER_LOCATION',
    (position) => {
      if (position.driverId !== driverId) return;
      setDriverPosition({
        lat: position.lat,
        lng: position.lng,
        heading: position.heading,
        at: Date.parse(position.recordedAt) || Date.now(),
      });
    },
    Boolean(driverId),
  );

  const status = order?.status ?? 'PENDING';
  const searching = status === 'SEARCHING_FOR_DRIVER' || status === 'PENDING';
  const finished = CLOSED_ORDER_STATUSES.includes(status);
  const riderFirstName = order?.driver?.user?.name?.trim().split(/\s+/)[0] ?? 'Your rider';
  const copy = stageCopy(status, riderFirstName);
  const matchingLine = useMatchingLine(searching);

  // "Rider found" celebrates when we watched the search end, or when the
  // customer opens the order within a minute of a rider taking it.
  const sawSearch = useRef(false);
  if (searching) sawSearch.current = true;
  const reservedAt = order?.reservedAt ? Date.parse(order.reservedAt) : null;
  const freshlyReserved = reservedAt != null && Date.now() - reservedAt < 60_000;
  const riderJustFound = useCelebrateOnce(
    `found:${orderId}`,
    status === 'RESERVED' && (sawSearch.current || freshlyReserved),
  );
  const delivered = RATEABLE.includes(status);
  const deliveredParty = useCelebrateOnce(`delivered:${orderId}`, delivered);

  const { data: polledPosition } = useGetDriverLocationManager({
    id: orderId,
    enabled: Boolean(driverId) && !finished,
    refetchInterval: 30_000,
  });

  useEffect(() => {
    if (!polledPosition || polledPosition.driverId !== driverId) return;
    const at = polledPosition.recordedAt ? Date.parse(polledPosition.recordedAt) : Date.now();
    setDriverPosition((current) =>
      current && current.at >= at
        ? current
        : {
            lat: polledPosition.lat,
            lng: polledPosition.lng,
            heading: polledPosition.heading ?? undefined,
            at,
          },
    );
  }, [polledPosition, driverId]);

  const onTheWayToDropoff =
    status === 'PICKED_UP' || status === 'IN_TRANSIT' || status === 'IN_PROGRESS';

  const { data: eta, refetch: refetchEta } = useGetOrderEtaManager({
    id: orderId,
    enabled: Boolean(driverId) && !finished,
    refetchInterval: 30_000,
  });

  const [refreshing, setRefreshing] = useState(false);

  useRideEvent('ORDER_STATUS', () => void refetch(), Boolean(orderId));
  useRideEvent('ORDER_CANCELLED', () => void refetch(), Boolean(orderId));

  useRideEvent(
    'ORDER_RESERVED',
    (payload) => {
      if (payload?.order?.id !== orderId) return;
      void refetch();
      void refetchEta();
    },
    Boolean(orderId),
  );
  useRideEvent('ORDER_NO_DRIVER', () => void refetch(), Boolean(orderId));

  const { data: unread, refetch: refetchUnread } = useGetUnreadCountsManager();
  const unreadHere = unread?.counts?.[orderId] ?? 0;

  useRideEvent('MESSAGE', () => void refetchUnread(), Boolean(orderId));
  useRideEvent('MESSAGE_READ', () => void refetchUnread(), Boolean(orderId));

  const goHome = useCallback(() => {
    reset();
    navigation.navigate(ROUTES.PASSENGER_HOME);
  }, [reset, navigation]);

  const handleCancel = useCallback(() => {
    Alert.alert(
      'Cancel this order?',
      searching ? 'Riders will stop seeing your order.' : `${riderFirstName} is already on the way.`,
      [
      { text: 'Keep order', style: 'cancel' },
      {
        text: 'Cancel order',
        style: 'destructive',
        onPress: async () => {
          try {
            await cancelOrder({ id: orderId, reason: 'Cancelled by passenger' });
            goHome();
          } catch (e: any) {
            showToast.error(e?.message ?? 'We could not cancel your order. Please try again.');
          }
        },
      },
      ],
    );
  }, [cancelOrder, orderId, goHome, searching, riderFirstName]);

  const handleCall = useCallback(() => {
    const phone = order?.driver?.user?.phone;
    if (!phone) {
      showToast.error('We do not have a phone number for this rider. Try the chat.');
      return;
    }
    void Linking.openURL(`tel:${phone}`);
  }, [order]);

  const handleRate = useCallback(
    async (score: number) => {
      try {
        await rateOrder({ id: orderId, score });
        showToast.success('Thanks for rating your rider!');
        goHome();
      } catch (e: any) {
        showToast.error(e?.message ?? 'We could not save your rating. Please try again.');
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
          <MatchingAnimation stages={MATCHING_LINES} stageIndex={matchingLine} />
          <Animated.Text entering={FadeInUp.delay(150)} style={styles.searchBody} numberOfLines={2}>
            {order.pickupLocation} → {order.dropoffLocation}
          </Animated.Text>
          <Animated.Text entering={FadeInUp.delay(250)} style={styles.searchFare}>
            ₦{order.fare.toLocaleString()}
          </Animated.Text>
        </View>
      </Screen>
    );
  }

  if (status === 'NO_DRIVER_FOUND') {
    return (
      <Screen footer={<Button label="Try again" onPress={goHome} />}>
        <Animated.View entering={FadeInDown.springify().damping(16)} style={styles.empty}>
          <Text style={styles.emptyTitle}>{copy.title}</Text>
          <Text style={styles.emptyText}>{copy.body}</Text>
        </Animated.View>
      </Screen>
    );
  }

  const driver = order.driver;
  const vehicle = describeVehicle(order.vehicleType);
  const driverName = driver?.user?.name ?? 'Your rider';

  return (
    <Screen
      scroll
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            void Promise.all([refetch(), refetchEta()]).finally(() => setRefreshing(false));
          }}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
      footer={
        <View style={styles.actions}>
          {delivered ? (
            <Animated.View entering={FadeInDown.delay(400).springify().damping(16)} style={styles.actions}>
              <Text style={styles.rateLabel}>How was {riderFirstName}?</Text>
              <RatingStars onRate={handleRate} disabled={rating} />
              <Button label="Not now" variant="ghost" onPress={goHome} />
            </Animated.View>
          ) : finished ? (
            <Button label="Place another order" onPress={goHome} />
          ) : (
            <>
              <View style={styles.contactRow}>
                <Button
                  label={unreadHere > 0 ? `Chat (${unreadHere > 9 ? '9+' : unreadHere})` : 'Chat'}
                  variant={unreadHere > 0 ? 'primary' : 'secondary'}
                  onPress={() =>
                    navigation.navigate(ROUTES.ORDER_CHAT, { orderId, title: driverName })
                  }
                  leading={
                    <Icon name="message" size={18} color={unreadHere > 0 ? colors.onPrimary : colors.primary} />
                  }
                  style={styles.contactButton}
                />
                <Button
                  label="Call"
                  variant="secondary"
                  onPress={handleCall}
                  leading={<Icon name="phone" size={18} color={colors.primary} />}
                  style={styles.contactButton}
                />
              </View>
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
      {riderJustFound || delivered ? (
        <Animated.View entering={FadeIn.duration(300)} style={styles.hero}>
          <SuccessBurst size={84} haptic={riderJustFound || deliveredParty} />
          <Animated.Text entering={FadeInUp.delay(250).springify().damping(15)} style={styles.heroTitle}>
            {delivered ? 'Delivered!' : `${riderFirstName} is on the way!`}
          </Animated.Text>
          <Animated.Text entering={FadeInUp.delay(350)} style={styles.heroBody}>
            {delivered
              ? `Your package reached ${order.dropoffLocation}. Thanks for sending with Aiko.`
              : 'Your rider has accepted and is heading to your pickup.'}
          </Animated.Text>
        </Animated.View>
      ) : (
        <Animated.View
          key={status}
          entering={FadeInDown.springify().damping(16)}
          layout={LinearTransition}
          style={[styles.banner, copy.tone === 'info' && styles.bannerInfo]}>
          <View style={[styles.bannerIcon, copy.tone === 'info' && styles.bannerIconInfo]}>
            {LIVE.includes(status) && copy.tone === 'info' ? (
              <PulseDot color={colors.info} size={10} />
            ) : (
              <Icon
                name={copy.tone === 'success' ? 'check' : 'bike'}
                size={16}
                color={copy.tone === 'success' ? colors.onPrimary : colors.info}
                strokeWidth={2.8}
              />
            )}
          </View>
          <View style={styles.bannerText}>
            <Text style={[styles.bannerTitle, copy.tone === 'info' && styles.bannerTitleInfo]}>
              {copy.title}
            </Text>
            <Text style={[styles.bannerBody, copy.tone === 'info' && styles.bannerBodyInfo]}>
              {copy.body}
            </Text>
          </View>
        </Animated.View>
      )}

      {eta && !finished ? (
        <Animated.View entering={FadeInDown.delay(80).springify().damping(16)}>
        <Card style={styles.etaCard}>
          <View style={styles.etaRow}>
            <Text style={styles.etaLabel}>
              {order.pickedUpAt ? 'Arrives at drop-off in' : 'Reaches your pickup in'}
            </Text>
            <Text style={styles.etaValue}>
              {(order.pickedUpAt ? eta.deliveryMinutes : eta.pickupMinutes) ?? '—'} min
            </Text>
          </View>
          {eta.driverHandlingOtherOrders ? (
            <Text style={styles.etaNote}>
              {riderFirstName} is also delivering a nearby order. This time already includes it.
            </Text>
          ) : null}
        </Card>
        </Animated.View>
      ) : null}

      <MapPanel
        pickup={toPlace(order, 'pickup')}
        dropoff={toPlace(order, 'dropoff')}
        driver={finished ? null : driverPosition}
        driverTarget={onTheWayToDropoff ? 'dropoff' : 'pickup'}
        driverLabel={
          driver
            ? [driver.user?.name?.trim().split(/\s+/)[0], driver.vehiclePlate].filter(Boolean).join(' · ')
            : null
        }
        style={styles.map}
      />
      {driverId && !finished ? (
        <Text style={styles.mapCaption}>
          {driverPosition
            ? `Rider location updated ${sinceLabel(now - driverPosition.at)}`
            : `Waiting for ${riderFirstName}’s location…`}
        </Text>
      ) : null}

      {driver ? (
        <Animated.View entering={FadeInDown.delay(riderJustFound ? 500 : 120).springify().damping(14)}>
          <Card elevation="md" style={styles.driverCard}>
            <View style={styles.driverHeader}>
              <Avatar name={driverName} size={56} />
              <View style={styles.driverIdentity}>
                <Text style={styles.driverName}>{driverName}</Text>
                <Animated.View entering={FadeIn.delay(riderJustFound ? 750 : 250)} style={styles.ratingRow}>
                  <Icon name="star" size={14} color={colors.warning} strokeWidth={2.6} />
                  <Text style={styles.rating}>{driver.rating.toFixed(1)}</Text>
                  <Text style={styles.trips}>· {driver.totalTrips.toLocaleString()} deliveries</Text>
                </Animated.View>
                <Animated.View entering={FadeIn.delay(riderJustFound ? 850 : 300)}>
                  <Chip label={`${vehicle.emoji} ${vehicle.label}`} tone="brand" />
                </Animated.View>
              </View>
              <Animated.View entering={FadeInDown.delay(riderJustFound ? 900 : 320)} style={styles.plateBox}>
                <Text style={styles.plateCaption}>PLATE</Text>
                <Text style={styles.plate}>{driver.vehiclePlate}</Text>
                <Text style={styles.vehicleModel}>
                  {[driver.vehicleColor, driver.vehicleModel].filter(Boolean).join(' ')}
                </Text>
              </Animated.View>
            </View>
            {order.code && !finished ? (
              <OrderCodeCard
                code={order.code}
                riderName={riderFirstName}
                collected={Boolean(order.pickedUpAt)}
                isPackage
              />
            ) : null}
          </Card>
        </Animated.View>
      ) : null}

      <Animated.View entering={FadeInDown.delay(200).springify().damping(16)}>
      <Card style={styles.trip}>
        <View style={styles.tripHeader}>
          <Text style={styles.tripTitle}>Your delivery</Text>
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
            {order.paymentMethod === 'CASH' ? 'Pay cash' : 'Transfer'}
          </Text>
        </View>
      </Card>
      </Animated.View>

      {riderJustFound || deliveredParty ? <Confetti /> : null}
    </Screen>
  );
}

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
    backgroundColor: colors.primary,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerText: { flex: 1, gap: 1 },
  bannerTitle: { ...type.subheading, color: colors.primaryDarker },
  bannerBody: { ...type.caption, color: colors.primaryDark },

  bannerInfo: { backgroundColor: colors.infoBg },
  bannerIconInfo: { backgroundColor: colors.surface },
  hero: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.lg, marginBottom: spacing.sm },
  heroTitle: { ...type.title, textAlign: 'center' },
  heroBody: { ...type.bodySmall, textAlign: 'center', maxWidth: 300 },
  bannerTitleInfo: { color: colors.text },
  bannerBodyInfo: { color: colors.textMuted },

  map: { height: 240, marginBottom: spacing.xs },
  mapCaption: { ...type.caption, textAlign: 'center', marginBottom: spacing.base },

  driverCard: { gap: spacing.md },
  driverHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  driverIdentity: { flex: 1, gap: spacing.xs, alignItems: 'flex-start' },
  driverName: { ...type.heading, fontSize: 16 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  rating: { ...type.bodySmall, color: colors.warning, fontWeight: '600' },
  trips: type.caption,
  plateBox: { alignItems: 'flex-end', gap: 2 },
  plateCaption: { ...type.caption, fontSize: 10, letterSpacing: 0.6 },
  plate: {
    ...type.subheading,
    fontSize: 15,
    letterSpacing: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceAlt,
  },
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
  searchBody: { ...type.bodySmall, textAlign: 'center', maxWidth: 300 },
  searchFare: { ...type.heading, fontSize: 22, color: colors.primary },

  contactRow: { flexDirection: 'row', gap: spacing.sm },
  contactButton: { flex: 1 },

  actions: { gap: spacing.sm },
  rateLabel: { ...type.subheading, textAlign: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.base },
  emptyTitle: { ...type.title, textAlign: 'center' },
  emptyText: { ...type.body, textAlign: 'center' },
}));
