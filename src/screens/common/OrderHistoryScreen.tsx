import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppHeader, Card, Chip, EmptyState, Screen } from '@/components/ui';
import { useGetSkippedOrdersManager } from '@/modules/marketplace/marketplaceController';
import { useGetOrdersManager } from '@/modules/orders/ordersController';
import type { Order } from '@/modules/orders/ordersTypes';
import {
  CLOSED_ORDER_STATUSES,
  DRIVER_ACTIVE_ORDER_STATUSES,
  type OrderStatus,
} from '@/modules/shared/apiTypes';
import { useOnboardingState } from '@/modules/onboarding/onboardingController';
import { useOpenDrawer } from '@/navigation/useAppNavigation';
import { makeStyles, spacing } from '@/theme';

type Filter = 'active' | 'completed' | 'cancelled' | 'skipped';

const STATUS_CHIP: Partial<
  Record<OrderStatus, { label: string; tone: 'success' | 'danger' | 'info' | 'neutral' | 'brand' }>
> = {
  DELIVERED: { label: 'Delivered', tone: 'success' },
  COMPLETED: { label: 'Completed', tone: 'success' },
  CANCELLED: { label: 'Cancelled', tone: 'danger' },
  NO_DRIVER_FOUND: { label: 'No driver', tone: 'neutral' },
  RESERVED: { label: 'Reserved', tone: 'brand' },
  DRIVER_ARRIVING_PICKUP: { label: 'Heading to pickup', tone: 'info' },
  PICKED_UP: { label: 'Picked up', tone: 'info' },
  IN_TRANSIT: { label: 'In transit', tone: 'info' },
  SEARCHING_FOR_DRIVER: { label: 'Finding a driver', tone: 'info' },
};

export function OrderHistoryScreen() {
  const styles = useStyles();
  const openDrawer = useOpenDrawer();
  const isRider = useOnboardingState()?.accountType === 'RIDER';

  const [filter, setFilter] = useState<Filter>('active');

  const { data: page } = useGetOrdersManager({ limit: 50 });
  const { data: skipped } = useGetSkippedOrdersManager({
    enabled: isRider && filter === 'skipped',
  });

  const orders = page?.result ?? [];

  const shown = orders.filter((order) => {
    if (filter === 'active') return !CLOSED_ORDER_STATUSES.includes(order.status);
    if (filter === 'completed')
      return order.status === 'DELIVERED' || order.status === 'COMPLETED';
    if (filter === 'cancelled')
      return order.status === 'CANCELLED' || order.status === 'NO_DRIVER_FOUND';
    return false;
  });

  const filters: Filter[] = isRider
    ? ['active', 'completed', 'cancelled', 'skipped']
    : ['active', 'completed', 'cancelled'];

  return (
    <Screen scroll>
      <AppHeader onMenu={openDrawer} />
      <Text style={styles.title}>Orders</Text>

      <View style={styles.filters}>
        {filters.map((value) => (
          <Pressable
            key={value}
            onPress={() => setFilter(value)}
            accessibilityRole="tab"
            accessibilityState={{ selected: filter === value }}
            style={({ pressed }) => [
              styles.filter,
              filter === value && styles.filterActive,
              pressed && styles.filterPressed,
            ]}>
            <Text style={[styles.filterLabel, filter === value && styles.filterLabelActive]}>
              {value[0].toUpperCase() + value.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      {filter === 'skipped' ? (
        (skipped ?? []).length === 0 ? (
          <EmptyState
            icon="↩️"
            title="Nothing skipped"
            body="Orders you pass on are listed here. Skipping never cancels an order — other drivers still see it."
          />
        ) : (
          <View style={styles.list}>
            {(skipped ?? []).map((action) => (
              <Card key={action.id} style={styles.row}>
                <Text style={styles.route} numberOfLines={1}>
                  {action.order.pickupLocation} → {action.order.dropoffLocation}
                </Text>
                <View style={styles.meta}>
                  <Text style={styles.metaText}>
                    {action.order.distanceKm.toFixed(1)} km ·{' '}
                    {new Date(action.updatedAt).toLocaleDateString()}
                  </Text>
                  <Text style={styles.amount}>
                    ₦{action.order.driverEarnings.toLocaleString()}
                  </Text>
                </View>
              </Card>
            ))}
          </View>
        )
      ) : shown.length === 0 ? (
        <EmptyState icon="🗂️" title={`No ${filter} orders`} body="They will appear here." />
      ) : (
        <View style={styles.list}>
          {shown.map((order) => (
            <OrderRow key={order.id} order={order} isRider={isRider} />
          ))}
        </View>
      )}
    </Screen>
  );
}

function OrderRow({ order, isRider }: { order: Order; isRider: boolean }) {
  const styles = useStyles();
  const chip = STATUS_CHIP[order.status];
  const active = DRIVER_ACTIVE_ORDER_STATUSES.includes(order.status);

  return (
    <Card style={styles.row}>
      <View style={styles.rowHeader}>
        {chip ? <Chip label={chip.label} tone={chip.tone} dot={active} /> : null}
        <Text style={styles.amount}>
          ₦{(isRider ? order.driverEarnings : order.fare).toLocaleString()}
        </Text>
      </View>

      <Text style={styles.route} numberOfLines={2}>
        {order.pickupLocation} → {order.dropoffLocation}
      </Text>

      <View style={styles.meta}>
        <Text style={styles.metaText}>{order.distanceKm.toFixed(1)} km</Text>
        <Text style={styles.metaText}>{new Date(order.createdAt).toLocaleDateString()}</Text>
      </View>
    </Card>
  );
}

const useStyles = makeStyles(({ colors, type }) => ({
  title: { ...type.title, marginBottom: spacing.base },

  filters: {
    flexDirection: 'row',
    gap: spacing.xs,
    padding: 4,
    marginBottom: spacing.base,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 12,
  },
  filter: { flex: 1, paddingVertical: spacing.sm, borderRadius: 9, alignItems: 'center' },
  filterActive: { backgroundColor: colors.surface },
  filterPressed: { opacity: 0.7 },
  filterLabel: { ...type.caption, fontWeight: '600' },
  filterLabelActive: { color: colors.text },

  list: { gap: spacing.md },
  row: { gap: spacing.xs },
  rowHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  route: { ...type.body, fontSize: 14 },
  meta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  metaText: { ...type.caption },
  amount: { ...type.subheading, color: colors.primary },
}));
