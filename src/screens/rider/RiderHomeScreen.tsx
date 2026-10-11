import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Linking, Pressable, Switch, Text, View, useWindowDimensions } from 'react-native';

import { ActiveOrderCard } from '@/components/marketplace/ActiveOrderCard';
import { OrderCard } from '@/components/marketplace/OrderCard';
import { RouteTimeline } from '@/components/marketplace/RouteTimeline';
import { AppHeader, Avatar, Button, Card, Chip, EmptyState, Screen } from '@/components/ui';
import { describeVehicle } from '@/data/vehicleTypes';
import { useDriverLocation } from '@/hooks/useDriverLocation';
import { useDriverShift } from '@/hooks/useDriverShift';
import { useRideEvent, useRideEvents } from '@/hooks/useRideSocket';
import {
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
import { makeStyles, spacing, useTheme } from '@/theme';
import showToast from '@/utils/toast';

type Props = NativeStackScreenProps<RiderStackParamList, typeof ROUTES.RIDER_HOME>;

type Tab = 'available' | 'active';

const TWO_COLUMN_MIN_WIDTH = 480;

export function RiderHomeScreen({ navigation }: Props) {
  const styles = useStyles();
  const { colors } = useTheme();
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
  const { updateOrderStatus, isLoading: advancing } = UpdateOrderStatusManager();

  const {
    coords,
    granted,
    backgroundGranted,
    error: locationError,
    request: requestLocation,
    enableBackground,
  } = useDriverLocation(online);

  const [tab, setTab] = useState<Tab>('available');
  const [reserving, setReserving] = useState<string | null>(null);
  const [hidden, setHidden] = useState<Set<string>>(new Set());

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

  useRideEvent('REQUEST_NEW', () => void refetchGrid(), online && !atCapacity);

  useRideEvents(['REQUEST_LOST', 'REQUEST_CLOSED'], (payload, code, message) => {
    setHidden((current) => new Set(current).add(payload.orderId));
    if (code === 'REQUEST_LOST') showToast.info(message);
  });

  useRideEvent('REQUEST_WON', (payload) => {
    setHidden((current) => new Set(current).add(payload.order.id));
    void refetchActive();
    void refetchGrid();
  });

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
          `You are still holding ${activeOrders.length} order${activeOrders.length > 1 ? 's' : ''}.`,
        );
        return;
      }

      if (value) {
        const ok = await requestLocation();
        if (!ok) {
          Alert.alert('Location needed', 'Aiko needs your location to send you orders nearby.');
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
        showToast.success(`Order reserved · ${result.held}/${result.capacity}`);

        setHidden((current) => new Set(current).add(order.id));
        await Promise.all([refetchActive(), refetchGrid()]);
        setTab('active');
      } catch (e: any) {
        const message: string = e?.message ?? '';

        if (message.includes(ORDER_ALREADY_RESERVED)) {
          showToast.error('Another driver got there first.');
          setHidden((current) => new Set(current).add(order.id));
        } else if (message.includes(MAX_ORDER_CAPACITY_REACHED)) {
          showToast.error(`You are already holding ${capacity} orders.`);
          await refetchActive();
        } else {
          showToast.error(message || 'Could not reserve that order.');
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
      try {
        await updateOrderStatus({ id: orderId, status });
        await Promise.all([refetchActive(), refetchAnalytics()]);
        if (status === 'DELIVERED') void refetchGrid();
      } catch (e: any) {
        showToast.error(e?.message ?? 'Could not update the order.');
      }
    },
    [updateOrderStatus, refetchActive, refetchAnalytics, refetchGrid],
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

      <Card style={styles.statusCard}>
        <View style={styles.statusBody}>
          <Text style={styles.statusTitle}>
            {online ? 'Accepting orders' : 'You are offline'}
          </Text>
          <Text style={styles.statusHint}>
            {!online
              ? 'Go online to start receiving orders.'
              : vehicle
                ? `${vehicle.emoji} ${vehicle.label} · ${vehicle.localName}`
                : 'Waiting for orders nearby…'}
          </Text>
        </View>
        <Switch
          value={online}
          onValueChange={toggleOnline}
          disabled={togglingAvailability || !driver}
          trackColor={{ true: colors.green[300], false: colors.border }}
          thumbColor={online ? colors.primary : colors.neutral[400]}
        />
      </Card>

      {debt?.locked ? (
        <Card style={styles.warning}>
          <Text style={styles.warningTitle}>Commission limit reached</Text>
          <Text style={styles.warningText}>
            {`You owe ₦${debt.current.toLocaleString()} in commission from cash trips (limit ₦${debt.limit.toLocaleString()}). Pay it to Aiko to start taking new orders again.`}
          </Text>
        </Card>
      ) : debt && debt.limit > 0 && debt.current > 0 ? (
        <Text style={styles.statusHint}>
          {`Commission owed: ₦${debt.current.toLocaleString()} of ₦${debt.limit.toLocaleString()} limit`}
        </Text>
      ) : null}

      {presenceLapsed ? (
        <Card style={styles.warning}>
          <Text style={styles.warningText}>
            Reconnecting you to the dispatch pool…
          </Text>
        </Card>
      ) : null}

      {online && granted === false ? (
        <Card style={styles.warning}>
          <Text style={styles.warningText}>
            {locationError ?? 'Location access is off, so no orders can reach you.'}
          </Text>
          <Button label="Grant access" size="sm" onPress={() => void requestLocation()} />
        </Card>
      ) : null}

      {online && granted !== false && !backgroundGranted ? (
        <Card style={styles.warning}>
          <Text style={styles.warningTitle}>Orders stop when your screen locks</Text>
          <Text style={styles.warningText}>
            Aiko can only send you orders while it can see your location. Choose
            “Allow all the time” to keep receiving them with your phone in your
            pocket.
          </Text>
          <Button
            label="Keep me online in the background"
            size="sm"
            onPress={() => void enableBackground()}
          />
        </Card>
      ) : null}

      <View style={styles.stats}>
        <StatTile
          label="Today's earnings"
          value={`₦${(analytics?.todayEarnings ?? 0).toLocaleString()}`}
          highlight
        />
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
        />
      )}
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
        body="Turn on the switch above to start receiving orders."
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
        title={loading ? 'Looking for orders nearby' : 'No open orders right now'}
        body="New orders appear here automatically — no need to refresh."
      />
    );
  }

  return (
    <View style={styles.grid}>
      {offers.map((order) => (
        <View
          key={order.id}
          style={[styles.gridCell, columns === 1 ? styles.gridCellFull : styles.gridCellHalf]}>
          <OrderCard
            order={order}
            busy={reserving === order.id}
            disabled={Boolean(reserving) && reserving !== order.id}
            onAccept={() => onAccept(order)}
            onSkip={() => onSkip(order)}
          />
        </View>
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
}: {
  orders: ActiveOrder[];
  route: RoutePlan | null | undefined;
  advancing: boolean;
  onAdvance: (orderId: string, status: OrderStatus) => void;
  onNavigate: (lat: number, lng: number, label: string) => void;
  onChat: (orderId: string, title: string) => void;
  unreadByOrder: Record<string, number>;
}) {
  const styles = useStyles();

  if (!orders || orders.length === 0) {
    return (
      <EmptyState
        icon="🗂️"
        title="No active orders"
        body="Orders you accept show up here with your route."
      />
    );
  }

  return (
    <View style={styles.activeList}>
      <RouteTimeline
        route={route}
        onStopPress={(stop) => onNavigate(stop.lat, stop.lng, stop.address)}
      />

      {orders.map((order) => (
        <ActiveOrderCard
          key={order.id}
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
        />
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
      onPress={onPress}
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
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  const styles = useStyles();
  return (
    <Card style={styles.statTile}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, highlight && styles.statValueHighlight]}>{value}</Text>
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

  statusCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  statusBody: { flex: 1, gap: 2 },
  statusTitle: { ...type.subheading },
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
