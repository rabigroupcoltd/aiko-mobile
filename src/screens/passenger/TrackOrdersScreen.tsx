import { Camera, GeoJSONSource, Layer, Map, Marker, type CameraStop } from '@maplibre/maplibre-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type ListRenderItemInfo,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PressableScale, PulseDot, Shimmer } from '@/components/motion';
import { Avatar, Chip, Icon } from '@/components/ui';
import { MINNA_CENTER } from '@/config/env';
import { useGlidingPosition } from '@/hooks/useGlidingPosition';
import { useRideEvent } from '@/hooks/useRideSocket';
import { useGetOrderEtaManager, useGetTrackingManager } from '@/modules/orders/ordersController';
import type { TrackedOrder } from '@/modules/orders/ordersTypes';
import type { OrderStatus } from '@/modules/shared/apiTypes';
import { ROUTES } from '@/navigation/routes';
import type { PassengerStackParamList } from '@/navigation/types';
import { green, makeStyles, radius, shadows, spacing, useTheme } from '@/theme';

type Props = NativeStackScreenProps<PassengerStackParamList, typeof ROUTES.TRACK_ORDERS>;

const STYLE_LIGHT = 'https://tiles.openfreemap.org/styles/liberty';
const STYLE_DARK = 'https://tiles.openfreemap.org/styles/dark';

type Tone = 'neutral' | 'success' | 'pending' | 'danger' | 'info' | 'brand';

const STATUS: Partial<Record<OrderStatus, { label: string; tone: Tone }>> = {
  PENDING: { label: 'Finding a rider', tone: 'pending' },
  SEARCHING_FOR_DRIVER: { label: 'Finding a rider', tone: 'pending' },
  RESERVED: { label: 'Coming to pickup', tone: 'brand' },
  ACCEPTED: { label: 'Coming to pickup', tone: 'brand' },
  DRIVER_ARRIVING_PICKUP: { label: 'Almost at pickup', tone: 'info' },
  ARRIVED: { label: 'At pickup', tone: 'info' },
  PICKED_UP: { label: 'Package collected', tone: 'success' },
  IN_PROGRESS: { label: 'On the way', tone: 'success' },
  IN_TRANSIT: { label: 'Heading to drop-off', tone: 'success' },
};

const HEADING_TO_DROPOFF: OrderStatus[] = ['PICKED_UP', 'IN_TRANSIT', 'IN_PROGRESS'];

type LngLat = [number, number];
type Position = { lat: number; lng: number; at: number };

const toLngLat = (p: { lat: number; lng: number }): LngLat => [p.lng, p.lat];

function since(at: number, now: number): string {
  const seconds = Math.max(0, Math.round((now - at) / 1000));
  if (seconds < 20) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  return minutes < 60 ? `${minutes} min ago` : 'over an hour ago';
}

function firstName(name: string | null): string {
  return name?.trim().split(/\s+/)[0] ?? 'Rider';
}

function boundsOf(points: LngLat[]): CameraStop {
  if (points.length === 0) {
    return { center: [MINNA_CENTER.longitude, MINNA_CENTER.latitude], zoom: 12 };
  }
  const lngs = points.map((p) => p[0]);
  const lats = points.map((p) => p[1]);
  const [west, east, south, north] = [Math.min(...lngs), Math.max(...lngs), Math.min(...lats), Math.max(...lats)];
  if (east - west < 0.0005 && north - south < 0.0005) {
    return { center: points[0], zoom: 15, duration: 700, easing: 'ease' };
  }
  return {
    bounds: [west, south, east, north],
    padding: { top: 120, right: 60, bottom: 260, left: 60 },
    duration: 700,
    easing: 'ease',
  };
}

export function TrackOrdersScreen({ navigation, route }: Props) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const cardWidth = Math.min(width - spacing.xl * 2, 340);

  const { data: orders = [], isLoading } = useGetTrackingManager();
  const [selectedId, setSelectedId] = useState<string | null>(route.params?.orderId ?? null);
  const [live, setLive] = useState<Record<string, Position>>({});
  const [now, setNow] = useState(Date.now());
  const listRef = useRef<FlatList<TrackedOrder>>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(timer);
  }, []);

  const driverIds = useMemo(
    () => new Set(orders.map((o) => o.driver?.driverId).filter(Boolean) as string[]),
    [orders],
  );

  useRideEvent(
    'DRIVER_LOCATION',
    (position) => {
      if (!driverIds.has(position.driverId)) return;
      const at = Date.parse(position.recordedAt) || Date.now();
      setLive((current) =>
        current[position.driverId] && current[position.driverId].at >= at
          ? current
          : { ...current, [position.driverId]: { lat: position.lat, lng: position.lng, at } },
      );
    },
    driverIds.size > 0,
  );

  const positionOf = (order: TrackedOrder): Position | null => {
    const driver = order.driver;
    if (!driver) return null;
    const polled = driver.position
      ? {
          lat: driver.position.lat,
          lng: driver.position.lng,
          at: driver.position.recordedAt ? Date.parse(driver.position.recordedAt) : Date.now(),
        }
      : null;
    const pushed = live[driver.driverId];
    if (pushed && (!polled || pushed.at > polled.at)) return pushed;
    return polled;
  };

  useEffect(() => {
    if (selectedId && orders.some((o) => o.orderId === selectedId)) return;
    const first = orders.find((o) => o.driver) ?? orders[0];
    setSelectedId(first?.orderId ?? null);
  }, [orders, selectedId]);

  const selected = orders.find((o) => o.orderId === selectedId) ?? null;
  const selectedPosition = selected ? positionOf(selected) : null;

  // Follow the selected rider with a gentle ease, timed to the marker's glide
  // between pings, instead of a fly-to on every update.
  const stop = useMemo<CameraStop>(() => {
    if (selectedPosition) {
      return { center: toLngLat(selectedPosition), zoom: 15, duration: 1000, easing: 'ease' };
    }
    if (selected) return boundsOf([toLngLat(selected.pickup), toLngLat(selected.dropoff)]);
    return boundsOf(
      orders.map((o) => positionOf(o)).filter(Boolean).map((p) => toLngLat(p!)),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, selectedPosition?.lat, selectedPosition?.lng, orders.length]);

  const routeLine = useMemo(() => {
    if (!selected) return null;
    const target = HEADING_TO_DROPOFF.includes(selected.status) ? selected.dropoff : selected.pickup;
    const from = selectedPosition ?? selected.pickup;
    const coordinates = selectedPosition
      ? [toLngLat(from), toLngLat(target)]
      : [toLngLat(selected.pickup), toLngLat(selected.dropoff)];
    return {
      type: 'Feature' as const,
      properties: {},
      geometry: { type: 'LineString' as const, coordinates },
    };
  }, [selected, selectedPosition]);

  function select(orderId: string, scroll = true) {
    setSelectedId(orderId);
    const index = orders.findIndex((o) => o.orderId === orderId);
    if (scroll && index >= 0) listRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
  }

  const renderCard = ({ item, index }: ListRenderItemInfo<TrackedOrder>) => (
    <Animated.View entering={FadeInDown.delay(index * 80).springify().damping(16)}>
      <OrderCard
        order={item}
        position={positionOf(item)}
        active={item.orderId === selectedId}
        width={cardWidth}
        now={now}
        onPress={() => select(item.orderId, false)}
        onDetails={() => navigation.navigate(ROUTES.RIDER_FOUND, { orderId: item.orderId })}
      />
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <Map
        style={StyleSheet.absoluteFill}
        mapStyle={colors.isDark ? STYLE_DARK : STYLE_LIGHT}
        logo={false}
        attribution
        attributionPosition={{ top: 8, right: 8 }}
        compass={false}>
        <Camera {...stop} />

        {routeLine ? (
          <GeoJSONSource id="selected-route" data={routeLine}>
            <Layer
              id="selected-route-line"
              type="line"
              layout={{ 'line-cap': 'round' }}
              paint={{ 'line-color': green[900], 'line-width': 3, 'line-dasharray': [1.5, 1.5] }}
            />
          </GeoJSONSource>
        ) : null}

        {selected ? (
          <>
            <Marker id="sel-pickup" lngLat={toLngLat(selected.pickup)} anchor="center">
              <View style={styles.pickupDot} />
            </Marker>
            <Marker id="sel-dropoff" lngLat={toLngLat(selected.dropoff)} anchor="bottom">
              <Icon name="map-pin" size={30} color={green[900]} strokeWidth={2.4} />
            </Marker>
          </>
        ) : null}

        {orders.map((order) => {
          const position = positionOf(order);
          if (!order.driver || !position) return null;
          const plate = order.driver.vehiclePlate ? ' · ' + order.driver.vehiclePlate : '';
          return (
            <RiderMarker
              key={order.orderId}
              orderId={order.orderId}
              position={position}
              label={firstName(order.driver.name) + plate}
              active={order.orderId === selectedId}
              stale={now - position.at > 5 * 60 * 1000}
              onPress={() => select(order.orderId)}
            />
          );
        })}
      </Map>

      <SafeAreaView edges={['top']} style={styles.topBar} pointerEvents="box-none">
        <Pressable
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={styles.back}>
          <Icon name="chevron-left" size={22} strokeWidth={2.4} />
        </Pressable>
        <Animated.View entering={FadeInDown.springify().damping(16)} style={styles.titlePill}>
          {orders.some((o) => o.driver) ? <PulseDot color={colors.primary} size={8} /> : null}
          <Text style={styles.title}>
            {isLoading
              ? 'Loading your orders…'
              : orders.length === 0
                ? 'Nothing on the way'
                : `${orders.length} order${orders.length > 1 ? 's' : ''} on the way`}
          </Text>
        </Animated.View>
      </SafeAreaView>

      <SafeAreaView edges={['bottom']} style={styles.bottom} pointerEvents="box-none">
        {orders.length > 0 ? (
          <FlatList
            ref={listRef}
            data={orders}
            keyExtractor={(item) => item.orderId}
            renderItem={renderCard}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={cardWidth + spacing.md}
            decelerationRate="fast"
            contentContainerStyle={styles.list}
            ItemSeparatorComponent={() => <View style={{ width: spacing.md }} />}
            onScrollToIndexFailed={() => {}}
            onMomentumScrollEnd={(event) => {
              const index = Math.round(event.nativeEvent.contentOffset.x / (cardWidth + spacing.md));
              const order = orders[Math.max(0, Math.min(index, orders.length - 1))];
              if (order && order.orderId !== selectedId) setSelectedId(order.orderId);
            }}
          />
        ) : isLoading ? (
          <View style={[styles.card, styles.emptyCard]}>
            <View style={styles.cardTop}>
              <Shimmer width={44} height={44} rounded={22} />
              <View style={styles.cardInfo}>
                <Shimmer width="60%" height={14} />
                <Shimmer width="40%" height={12} />
              </View>
            </View>
            <Shimmer width="80%" height={12} />
          </View>
        ) : (
          <Animated.View entering={FadeInUp.springify().damping(16)} style={[styles.card, styles.emptyCard]}>
            <Text style={styles.cardName}>Nothing to track right now</Text>
            <Text style={styles.cardMeta}>When you send a package, you can watch your rider here.</Text>
          </Animated.View>
        )}
      </SafeAreaView>
    </View>
  );
}

function RiderMarker({
  orderId,
  position,
  label,
  active,
  stale,
  onPress,
}: {
  orderId: string;
  position: Position;
  label: string;
  active: boolean;
  stale: boolean;
  onPress: () => void;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { point, heading } = useGlidingPosition(position);
  if (!point) return null;

  return (
    <Marker id={'driver-' + orderId} lngLat={toLngLat(point)} anchor="bottom" onPress={onPress}>
      <View style={[styles.driverPin, { opacity: stale ? 0.55 : 1 }]}>
        <View style={[styles.label, active && styles.labelActive]}>
          {active && !stale ? <PulseDot color={colors.accent} size={7} /> : null}
          <Text style={[styles.labelText, active && styles.labelTextActive]} numberOfLines={1}>
            {label}
          </Text>
        </View>
        <View style={styles.dotWrap}>
          {heading != null && !stale ? (
            <View style={[styles.headingWrap, { transform: [{ rotate: heading + 'deg' }] }]}>
              <View style={styles.headingTip}>
                <Icon name="navigation" size={11} color={green[900]} strokeWidth={2.6} />
              </View>
            </View>
          ) : null}
          <View style={[styles.driverDot, active && styles.driverDotActive]}>
            <Icon name="bike" size={active ? 18 : 15} color="#FFFFFF" strokeWidth={2.4} />
          </View>
        </View>
      </View>
    </Marker>
  );
}

function OrderCard({
  order,
  position,
  active,
  width,
  now,
  onPress,
  onDetails,
}: {
  order: TrackedOrder;
  position: Position | null;
  active: boolean;
  width: number;
  now: number;
  onPress: () => void;
  onDetails: () => void;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  const status = STATUS[order.status] ?? { label: order.status, tone: 'neutral' as Tone };
  const driver = order.driver;
  const vehicle = driver
    ? [driver.vehicleBrand, driver.vehicleModel].filter(Boolean).join(' ') || driver.vehicleType
    : null;
  const toDropoff = HEADING_TO_DROPOFF.includes(order.status);

  const { data: eta } = useGetOrderEtaManager({
    id: order.orderId,
    enabled: Boolean(driver),
    refetchInterval: 30_000,
  });
  const minutes = eta ? (toDropoff ? eta.deliveryMinutes : eta.pickupMinutes) : null;

  return (
    <PressableScale
      haptic="select"
      scaleTo={0.98}
      onPress={onPress}
      style={[styles.card, { width }, active && styles.cardActive]}>
      <View style={styles.cardTop}>
        <Avatar uri={driver?.photoUrl} name={driver?.name ?? undefined} size={44} />
        <View style={styles.cardInfo}>
          <Text style={styles.cardName} numberOfLines={1}>
            {driver?.name ?? 'Finding you a rider…'}
          </Text>
          <Text style={styles.cardMeta} numberOfLines={1}>
            {driver ? vehicle + (driver.vehiclePlate ? ' · ' + driver.vehiclePlate : '') : order.pickup.name}
          </Text>
        </View>
        {driver?.phone ? (
          <PressableScale
            onPress={() => void Linking.openURL('tel:' + driver.phone)}
            hitSlop={8}
            accessibilityLabel={'Call ' + (driver.name ?? 'rider')}
            style={styles.callButton}>
            <Icon name="phone" size={16} color={colors.primary} strokeWidth={2.4} />
            <Text style={styles.callText}>Call</Text>
          </PressableScale>
        ) : null}
      </View>

      {minutes != null ? (
        <View style={styles.etaRow}>
          <Icon name="clock" size={15} color={colors.primary} strokeWidth={2.4} />
          <Text style={styles.etaText}>
            {minutes <= 1 ? 'Less than a minute' : 'About ' + minutes + ' min'}
            <Text style={styles.etaSub}>{toDropoff ? ' to drop-off' : ' to your pickup'}</Text>
          </Text>
        </View>
      ) : null}

      <View style={styles.cardBottom}>
        <Chip label={status.label} tone={status.tone} dot />
        <Text style={styles.cardSince}>
          {driver ? (position ? 'Updated ' + since(position.at, now) : 'Waiting for location') : ''}
        </Text>
      </View>

      <Text style={styles.cardRoute} numberOfLines={1}>
        {order.pickup.name} → {order.dropoff.name}
      </Text>

      <PressableScale onPress={onDetails} hitSlop={6} style={styles.detailsLink}>
        <Text style={styles.cardLink}>See order details</Text>
        <Icon name="chevron-right" size={16} color={colors.primary} strokeWidth={2.4} />
      </PressableScale>
    </PressableScale>
  );
}

const useStyles = makeStyles(({ colors, type }) => ({
  container: { flex: 1, backgroundColor: colors.background },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,
  },
  back: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  titlePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    ...shadows.md,
  },
  title: { ...type.subheading, fontSize: 15 },
  bottom: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingBottom: spacing.base },
  list: { paddingHorizontal: spacing.xl },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.base,
    gap: spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
    ...shadows.lg,
  },
  cardActive: { borderColor: colors.primary },
  emptyCard: { marginHorizontal: spacing.xl, gap: spacing.md },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  cardInfo: { flex: 1, gap: 2 },
  cardName: { ...type.subheading, fontSize: 16 },
  cardMeta: type.caption,
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySubtle,
  },
  callText: { ...type.subheading, fontSize: 14, color: colors.primary },
  cardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardSince: type.caption,
  cardRoute: { ...type.bodySmall, color: colors.textSecondary },
  cardLink: { ...type.subheading, fontSize: 14, color: colors.primary },
  detailsLink: { flexDirection: 'row', alignItems: 'center', gap: 2, alignSelf: 'flex-start' },
  etaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.primarySubtle,
  },
  etaText: { ...type.subheading, fontSize: 15, color: colors.primaryDarker },
  etaSub: { ...type.bodySmall, color: colors.textSecondary },
  pickupDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 4,
    borderColor: colors.primary,
    backgroundColor: '#FFFFFF',
  },
  driverPin: { alignItems: 'center' },
  label: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    maxWidth: 170,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: '#FFFFFF',
    marginBottom: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  labelActive: { backgroundColor: green[900], borderColor: green[900] },
  labelText: { fontSize: 12, fontWeight: '700', color: '#111917' },
  labelTextActive: { color: '#FFFFFF' },
  dotWrap: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center' },
  headingWrap: { position: 'absolute', width: 52, height: 52, alignItems: 'center' },
  headingTip: {
    width: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  driverDotActive: { width: 38, height: 38, borderRadius: 19, backgroundColor: green[700] },
}));
