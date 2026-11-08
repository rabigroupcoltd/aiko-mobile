import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Linking, Platform, Pressable, Text, View, useWindowDimensions } from 'react-native';
import Animated, { FadeInDown, FadeOutLeft, FadeOutRight, LinearTransition } from 'react-native-reanimated';

import { ActiveOrderCard } from '@/components/marketplace/ActiveOrderCard';
import { DeliveredCelebration } from '@/components/marketplace/DeliveredCelebration';
import { OrderCard } from '@/components/marketplace/OrderCard';
import { RouteTimeline } from '@/components/marketplace/RouteTimeline';
import { ShiftToggle } from '@/components/marketplace/ShiftToggle';
import { CountUpText } from '@/components/motion';
import { AppHeader, Avatar, Button, Card, Chip, EmptyState, Screen } from '@/components/ui';
import { describeVehicle } from '@/data/vehicleTypes';
import { useDriverLocation } from '@/hooks/useDriverLocation';
import { useDriverShift } from '@/hooks/useDriverShift';
import { useRideEvent, useRideEvents } from '@/hooks/useRideSocket';
import {
  ReleaseOrderManager,
  ReserveOrderManager,
  SkipOrderManager,
  useGetActiveOrdersManager,
  useGetAvailableOrdersManager,
  useGetMarketplaceConfigManager,
} from '@/modules/marketplace/marketplaceController';
import {
  MAX_ORDER_CAPACITY_REACHED,
  ORDER_ALREADY_RESERVED,
  type ActiveOrder,
  type MarketplaceOrder,
  type RoutePlan,
} from '@/modules/marketplace/marketplaceTypes';
import {
  useGetDriverAnalyticsManager,
  useGetMyDriverProfileManager,
} from '@/modules/drivers/driversController';
import {
  UpdateOrderStatusManager,
  useGetUnreadCountsManager,
} from '@/modules/orders/ordersController';
import type { OrderStatus } from '@/modules/shared/apiTypes';
import { ROUTES } from '@/navigation/routes';
import type { RiderStackParamList } from '@/navigation/types';
import { useOpenDrawer } from '@/navigation/useAppNavigation';
import { useAppStore } from '@/store/appStore';
import { makeStyles, spacing } from '@/theme';
import { haptics } from '@/utils/haptics';
import showToast from '@/utils/toast';

type Props = NativeStackScreenProps<RiderStackParamList, typeof ROUTES.RIDER_HOME>;

type Tab = 'available' | 'active';

const BATTERY_TIP_KEY = 'aiko:rider:battery-tip-dismissed';

/**
 * Many Android phones (Tecno, Infinix, itel, Xiaomi…) close background apps to
 * save battery even with "Allow all the time" location, which drops the rider
 * to disconnected a few minutes after they minimise Aiko. There is no reliable
 * way to detect it, so riders are shown this once and can dismiss it.
 */
function useBatteryTip(enabled: boolean) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!enabled || Platform.OS !== 'android') return;
    let cancelled = false;
    AsyncStorage.getItem(BATTERY_TIP_KEY)
      .then((value) => {
        if (!cancelled && !value) setVisible(true);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  const dismiss = useCallback(() => {
    setVisible(false);
    void AsyncStorage.setItem(BATTERY_TIP_KEY, '1').catch(() => undefined);
  }, []);

  return { visible, dismiss };
}

const TWO_COLUMN_MIN_WIDTH = 480;

export function RiderHomeScreen({ navigation }: Props) {
  const styles = useStyles();
  const openDrawer = useOpenDrawer();
  const { width } = useWindowDimensions();

  const profilePhoto = useAppStore((s) => s.photos.profile);

  const { data: driver, refetch: refetchDriver } = useGetMyDriverProfileManager();
  const { data: config } = useGetMarketplaceConfigManager();

  const {
    online,
    presenceLapsed,
    debt,
    setOnline,
    toggling: togglingAvailability,
    refetch: refetchShift,
  } = useDriverShift();
  const { reserveOrder } = ReserveOrderManager();
  const { skipOrder } = SkipOrderManager();
  const { releaseOrder } = ReleaseOrderManager();
  const [releasing, setReleasing] = useState<string | null>(null);
  const { updateOrderStatus, isLoading: advancing } = UpdateOrderStatusManager();

  const {
    coords,
    granted,
    backgroundGranted,
    error: locationError,
    request: requestLocation,
    enableBackground,
  } = useDriverLocation(online);

  const batteryTip = useBatteryTip(online && backgroundGranted);

  const [tab, setTab] = useState<Tab>('available');
  const [reserving, setReserving] = useState<string | null>(null);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [celebrating, setCelebrating] = useState<number | null>(null);
  const closeCelebration = useCallback(() => setCelebrating(null), []);

  const { data: active, refetch: refetchActive } = useGetActiveOrdersManager();

  const activeOrders = active?.orders ?? [];
  const held = active?.held ?? 0;
  const capacity = active?.capacity ?? config?.maxReservedOrdersPerDriver ?? 3;
  const atCapacity = held >= capacity;

  const { data: grid, refetch: refetchGrid, isFetching: loadingGrid } =
    useGetAvailableOrdersManager({
      lat: coords?.lat,
      lng: coords?.lng,
      enabled: online && !atCapacity && coords != null,
    });

  const offers = useMemo(
    () => (grid?.orders ?? []).filter((order) => !hidden.has(order.id)),
    [grid, hidden],
  );

  useRideEvent(
    'REQUEST_NEW',
    () => {
      haptics.alert();
      void refetchGrid();
    },
    online && !atCapacity,
  );

  useRideEvents(['REQUEST_LOST', 'REQUEST_CLOSED'], (payload, code, message) => {
    setHidden((current) => new Set(current).add(payload.orderId));
    if (code === 'REQUEST_LOST') showToast.info(message);
  });

  useRideEvent('REQUEST_WON', (payload) => {
    setHidden((current) => new Set(current).add(payload.order.id));
    void refetchActive();
    void refetchGrid();

    if (!payload.assignedByAdmin) {
      haptics.success();
    } else {
      haptics.alert();
      setTab('active');
      const order = payload.order as { pickupLocation?: string; dropoffLocation?: string };
      Alert.alert(
        'Aiko assigned you a delivery',
        [order.pickupLocation, order.dropoffLocation].filter(Boolean).join(' → ') ||
          'Open your active orders to see it.',
        [{ text: 'OK' }],
      );
    }
  });

  const handleRelease = useCallback(
    async (orderId: string) => {
      setReleasing(orderId);
      try {
        await releaseOrder({ orderId });
        showToast.info("Handed back. We'll find another rider.");
      } catch (e: any) {
        showToast.error(e?.message || 'Could not hand that order back.');
      } finally {
        setReleasing(null);
        void refetchActive();
      }
    },
    [releaseOrder, refetchActive],
  );

  useRideEvent('ORDER_STATUS', () => {
    void refetchActive();
    void refetchGrid();
    void refetchShift();
  });
  useRideEvent('ORDER_CANCELLED', () => void refetchActive());

  const { data: unread, refetch: refetchUnread } = useGetUnreadCountsManager();

  useRideEvent('MESSAGE', () => void refetchUnread());
  useRideEvent('MESSAGE_READ', () => void refetchUnread());

  const { data: analytics, refetch: refetchAnalytics } = useGetDriverAnalyticsManager({
    id: driver?.id,
  });

  const toggleOnline = useCallback(
    async (value: boolean) => {
      if (!driver) return;

      if (activeOrders.length > 0 && !value) {
        Alert.alert(
          'Finish your orders first',
          `You still have ${activeOrders.length} order${activeOrders.length > 1 ? 's' : ''} to deliver.`,
        );
        return;
      }

      if (value) {
        const ok = await requestLocation();
        if (!ok) {
          Alert.alert('Turn on location', 'Aiko needs your location to send you orders nearby.');
          return;
        }
      }

      try {
        await setOnline(value);
        await refetchDriver();
      } catch (e: any) {
        showToast.error(e?.message ?? 'Could not change your status.');
      }
    },
    [driver, activeOrders.length, requestLocation, setOnline, refetchDriver],
  );

  const handleAccept = useCallback(
    async (order: MarketplaceOrder) => {
      if (reserving) return;
      setReserving(order.id);

      try {
        const result = await reserveOrder({ orderId: order.id });
        showToast.success(`It's yours! You're holding ${result.held} of ${result.capacity}.`);

        setHidden((current) => new Set(current).add(order.id));
        await Promise.all([refetchActive(), refetchGrid()]);
        setTab('active');
      } catch (e: any) {
        const message: string = e?.message ?? '';

        if (message.includes(ORDER_ALREADY_RESERVED)) {
          showToast.error('Another rider got there first.');
          setHidden((current) => new Set(current).add(order.id));
        } else if (message.includes(MAX_ORDER_CAPACITY_REACHED)) {
          showToast.error(`You're already holding ${capacity} orders. Deliver one first.`);
          await refetchActive();
        } else {
          showToast.error(message || "Couldn't take that order. Try again.");
        }

        await refetchGrid();
      } finally {
        setReserving(null);
      }
    },
    [reserving, reserveOrder, refetchActive, refetchGrid, capacity],
  );

  const handleSkip = useCallback(
    async (order: MarketplaceOrder) => {
      setHidden((current) => new Set(current).add(order.id));

      try {
        await skipOrder({ orderId: order.id });
      } catch {
      }
    },
    [skipOrder],
  );

  const advanceOrder = useCallback(
    async (orderId: string, status: OrderStatus) => {
      const earnings = activeOrders.find((o) => o.id === orderId)?.driverEarnings ?? null;
      try {
        await updateOrderStatus({ id: orderId, status });
        if (status === 'DELIVERED') setCelebrating(earnings ?? 0);
        await Promise.all([refetchActive(), refetchAnalytics()]);
        if (status === 'DELIVERED') void refetchGrid();
      } catch (e: any) {
        haptics.error();
        showToast.error(e?.message ?? "Couldn't update the order. Try again.");
      }
    },
    [activeOrders, updateOrderStatus, refetchActive, refetchAnalytics, refetchGrid],
  );

  const navigateTo = useCallback((lat: number, lng: number, label: string) => {
    const query = encodeURIComponent(label);
    void Linking.openURL(`geo:${lat},${lng}?q=${lat},${lng}(${query})`).catch(() =>
      Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`),
    );
  }, []);

  const vehicle = driver ? describeVehicle(driver.vehicleType) : null;
  const dispatchStatus = active?.status ?? (online ? 'AVAILABLE' : 'OFFLINE');
  const columns = width >= TWO_COLUMN_MIN_WIDTH ? 2 : 1;

  return (
    <Screen scroll>
      <AppHeader
        onMenu={openDrawer}
        trailing={
          <Avatar uri={profilePhoto?.uri} name={driver?.user?.firstName ?? undefined} size={36} />
        }
      />

      <View style={styles.greetingRow}>
        <Text style={styles.greeting}>Hi {driver?.user?.firstName ?? 'rider'} 👋</Text>
        <Chip
          label={
            dispatchStatus === 'BUSY'
              ? 'Busy'
              : dispatchStatus === 'AVAILABLE'
                ? 'Available'
                : 'Offline'
          }
          tone={
            dispatchStatus === 'OFFLINE' ? 'neutral' : dispatchStatus === 'BUSY' ? 'info' : 'success'
          }
          dot
        />
      </View>

      <ShiftToggle
        online={online}
        busy={togglingAvailability}
        disabled={!driver}
        hint={
          online
            ? `Orders near you will pop up here${vehicle ? ` · ${vehicle.emoji} ${vehicle.label}` : ''}.`
            : 'Go online to start earning.'
        }
        onToggle={(next) => void toggleOnline(next)}
      />

      {debt?.locked ? (
        <Card style={styles.warning}>
          <Text style={styles.warningTitle}>Commission limit reached</Text>
          <Text style={styles.warningText}>
            {`You owe Aiko ₦${debt.current.toLocaleString()} commission from cash trips — your limit is ₦${debt.limit.toLocaleString()}. Pay it to take new orders again.`}
          </Text>
        </Card>
      ) : debt && debt.limit > 0 && debt.current > 0 ? (
        <Text style={styles.statusHint}>
          {`Commission owed: ₦${debt.current.toLocaleString()} of your ₦${debt.limit.toLocaleString()} limit`}
        </Text>
      ) : null}

      {presenceLapsed ? (
        <Card style={styles.warning}>
          <Text style={styles.warningText}>
            Reconnecting you so orders can reach you…
          </Text>
        </Card>
      ) : null}

      {online && granted === false ? (
        <Card style={styles.warning}>
          <Text style={styles.warningText}>
            {locationError ?? "Location is off, so orders can't reach you."}
          </Text>
          <Button label="Turn on location" size="sm" onPress={() => void requestLocation()} />
        </Card>
      ) : null}

      {online && granted !== false && !backgroundGranted ? (
        <Card style={styles.warning}>
          <Text style={styles.warningTitle}>Orders stop when your screen locks</Text>
          <Text style={styles.warningText}>
            Aiko collects your location data to send you nearby orders and let our
            dispatchers see where you are, even when the app is closed or not in use,
            while you are online. Tracking stops when you go offline. Choose
            “Allow all the time” on the next screen to keep receiving orders with
            your phone in your pocket.
          </Text>
          <Button
            label="Keep me online in the background"
            size="sm"
            onPress={() => void enableBackground()}
          />
        </Card>
      ) : null}

      {batteryTip.visible ? (
        <Card style={styles.warning}>
          <Text style={styles.warningTitle}>Stay online with the app minimised</Text>
          <Text style={styles.warningText}>
            Some phones close apps in the background to save battery, and you stop getting
            orders. Open Aiko's settings, tap Battery, and choose “Unrestricted” or “No
            restrictions”.
          </Text>
          <Button
            label="Open Aiko settings"
            size="sm"
            onPress={() => {
              void Linking.openSettings();
              batteryTip.dismiss();
            }}
          />
          <Button label="I've done this" size="sm" variant="ghost" onPress={batteryTip.dismiss} />
        </Card>
      ) : null}

      <View style={styles.stats}>
        <StatTile label="Today's earnings" amount={analytics?.todayEarnings ?? 0} highlight />
        <StatTile label="Orders held" value={`${held} / ${capacity}`} />
      </View>

      <View style={styles.tabs}>
        <TabButton
          label={`Available${offers.length ? ` (${offers.length})` : ''}`}
          active={tab === 'available'}
          onPress={() => setTab('available')}
        />
        <TabButton
          label={`Active${held ? ` (${held})` : ''}`}
          active={tab === 'active'}
          onPress={() => setTab('active')}
        />
      </View>

      {tab === 'available' ? (
        <AvailableTab
          online={online}
          atCapacity={atCapacity}
          capacity={capacity}
          loading={loadingGrid}
          offers={offers}
          columns={columns}
          reserving={reserving}
          onAccept={handleAccept}
          onSkip={handleSkip}
        />
      ) : (
        <ActiveTab
          orders={activeOrders}
          route={active?.route}
          advancing={advancing}
          onAdvance={advanceOrder}
          onNavigate={navigateTo}
          onChat={(orderId, title) => navigation.navigate(ROUTES.ORDER_CHAT, { orderId, title })}
          unreadByOrder={unread?.counts ?? {}}
          declineMinutes={config?.assignmentDeclineMinutes}
          releasing={releasing}
          onRelease={(orderId) => void handleRelease(orderId)}
        />
      )}

      <DeliveredCelebration earnings={celebrating} onClose={closeCelebration} />
    </Screen>
  );
}

function AvailableTab({
  online,
  atCapacity,
  capacity,
  loading,
  offers,
  columns,
  reserving,
  onAccept,
  onSkip,
}: {
  online: boolean;
  atCapacity: boolean;
  capacity: number;
  loading: boolean;
  offers: MarketplaceOrder[];
  columns: number;
  reserving: string | null;
  onAccept: (order: MarketplaceOrder) => void;
  onSkip: (order: MarketplaceOrder) => void;
}) {
  const styles = useStyles();

  if (!online) {
    return (
      <EmptyState
        icon="💤"
        title="You're offline"
        body="Tap the card above to go online and start earning."
      />
    );
  }

  if (atCapacity) {
    return (
      <EmptyState
        icon="📦"
        title={`You're holding ${capacity} orders`}
        body="Deliver one to make room for the next."
      />
    );
  }

  if (offers.length === 0) {
    return (
      <EmptyState
        icon="📡"
        title={loading ? 'Looking for orders near you…' : 'No orders nearby yet'}
        body="Stay online — new orders pop up here by themselves."
      />
    );
  }

  return (
    <View style={styles.grid}>
      {offers.map((order, index) => (
        <Animated.View
          key={order.id}
          entering={FadeInDown.springify().damping(16).delay(Math.min(index, 5) * 60)}
          exiting={FadeOutLeft.duration(220)}
          layout={LinearTransition.springify().damping(18)}
          style={[styles.gridCell, columns === 1 ? styles.gridCellFull : styles.gridCellHalf]}>
          <OrderCard
            order={order}
            busy={reserving === order.id}
            disabled={Boolean(reserving) && reserving !== order.id}
            onAccept={() => onAccept(order)}
            onSkip={() => onSkip(order)}
          />
        </Animated.View>
      ))}
    </View>
  );
}

function ActiveTab({
  orders,
  route,
  advancing,
  onAdvance,
  onNavigate,
  onChat,
  unreadByOrder,
  declineMinutes,
  releasing,
  onRelease,
}: {
  orders: ActiveOrder[];
  route: RoutePlan | null | undefined;
  advancing: boolean;
  onAdvance: (orderId: string, status: OrderStatus) => void;
  onNavigate: (lat: number, lng: number, label: string) => void;
  onChat: (orderId: string, title: string) => void;
  unreadByOrder: Record<string, number>;
  declineMinutes?: number;
  releasing: string | null;
  onRelease: (orderId: string) => void;
}) {
  const styles = useStyles();

  if (!orders || orders.length === 0) {
    return (
      <EmptyState
        icon="🗂️"
        title="No active orders"
        body="Orders you take show up here, with the best route to deliver them."
      />
    );
  }

  return (
    <View style={styles.activeList}>
      <RouteTimeline
        route={route}
        onStopPress={(stop) => onNavigate(stop.lat, stop.lng, stop.address)}
      />

      {orders.map((order, index) => (
        <Animated.View
          key={order.id}
          entering={FadeInDown.springify().damping(16).delay(Math.min(index, 3) * 70)}
          exiting={FadeOutRight.duration(240)}
          layout={LinearTransition.springify().damping(18)}>
          <ActiveOrderCard
            order={order}
            advancing={advancing}
            onAdvance={(status) => onAdvance(order.id, status)}
            onNavigate={() =>
              order.pickedUpAt
                ? onNavigate(order.dropoffLat, order.dropoffLng, order.dropoffLocation)
                : onNavigate(order.pickupLat, order.pickupLng, order.pickupLocation)
            }
            onChat={() => onChat(order.id, order.user?.name ?? 'Customer')}
            unread={unreadByOrder[order.id] ?? 0}
            declineMinutes={declineMinutes}
            releasing={releasing === order.id}
            onRelease={() => onRelease(order.id)}
          />
        </Animated.View>
      ))}
    </View>
  );
}

function TabButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const styles = useStyles();
  return (
    <Pressable
      onPress={() => {
        if (!active) haptics.select();
        onPress();
      }}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      style={({ pressed }) => [styles.tab, active && styles.tabActive, pressed && styles.tabPressed]}>
      <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
    </Pressable>
  );
}

function StatTile({
  label,
  value,
  amount,
  highlight,
}: {
  label: string;
  value?: string;
  /** Naira amount; rolls up when it changes. */
  amount?: number;
  highlight?: boolean;
}) {
  const styles = useStyles();
  const style = [styles.statValue, highlight && styles.statValueHighlight];
  return (
    <Card style={styles.statTile}>
      <Text style={styles.statLabel}>{label}</Text>
      {amount != null ? (
        <CountUpText value={amount} format={(n) => `₦${Math.round(n).toLocaleString()}`} style={style} />
      ) : (
        <Text style={style}>{value}</Text>
      )}
    </Card>
  );
}

const useStyles = makeStyles(({ colors, type }) => ({
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.base,
  },
  greeting: { ...type.title },

  statusHint: { ...type.caption },

  warning: {
    marginTop: spacing.md,
    gap: spacing.sm,
    borderColor: colors.warning,
    borderWidth: 1,
  },
  warningTitle: { ...type.subheading, fontSize: 15 },
  warningText: { ...type.bodySmall },

  stats: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  statTile: { flex: 1, gap: spacing.xs },
  statLabel: { ...type.caption },
  statValue: { ...type.title, fontSize: 22 },
  statValueHighlight: { color: colors.primary },

  tabs: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    padding: 4,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 12,
  },
  tab: { flex: 1, paddingVertical: spacing.sm, borderRadius: 9, alignItems: 'center' },
  tabActive: { backgroundColor: colors.surface },
  tabPressed: { opacity: 0.7 },
  tabLabel: { ...type.bodySmall, fontWeight: '600', color: colors.textSecondary },
  tabLabelActive: { color: colors.text },

  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -spacing.xs },
  gridCell: { paddingHorizontal: spacing.xs, paddingBottom: spacing.md },
  gridCellFull: { width: '100%' },
  gridCellHalf: { width: '50%' },

  activeList: { gap: spacing.md },
}));
