import { StyleSheet, Text, View } from 'react-native';

import { AppHeader, Card, EmptyState, Screen } from '@/components/ui';
import {
  useGetDriverAnalyticsManager,
  useGetMyDriverProfileManager,
} from '@/modules/drivers/driversController';
import { useGetOrdersManager } from '@/modules/orders/ordersController';
import type { Order } from '@/modules/orders/ordersTypes';
import { useOpenDrawer } from '@/navigation/useAppNavigation';
import { makeStyles, spacing } from '@/theme';

export function DriverEarningsScreen() {
  const styles = useStyles();
  const openDrawer = useOpenDrawer();

  const { data: driver } = useGetMyDriverProfileManager();
  const { data: analytics } = useGetDriverAnalyticsManager({ id: driver?.id });
  const { data: page } = useGetOrdersManager({ limit: 50 });

  const settled = (page?.result ?? []).filter(
    (order) => order.status === 'DELIVERED' || order.status === 'COMPLETED',
  );

  return (
    <Screen scroll>
      <AppHeader onMenu={openDrawer} />
      <Text style={styles.title}>Earnings</Text>

      <View style={styles.tiles}>
        <Tile label="Today" value={analytics?.todayEarnings ?? 0} highlight />
        <Tile label="This week" value={analytics?.weekEarnings ?? 0} />
      </View>
      <View style={styles.tiles}>
        <Tile label="All time" value={analytics?.totalEarnings ?? 0} />
        <Tile label="Outstanding debt" value={analytics?.currentDebt ?? 0} />
      </View>

      <Text style={styles.sectionTitle}>Completed orders</Text>

      {settled.length === 0 ? (
        <EmptyState
          icon="💸"
          title="No earnings yet"
          body="Completed orders and what you made on each one appear here."
        />
      ) : (
        <Card style={styles.list}>
          {settled.map((order, index) => (
            <EarningRow key={order.id} order={order} first={index === 0} />
          ))}
        </Card>
      )}
    </Screen>
  );
}

function Tile({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  const styles = useStyles();
  return (
    <Card style={styles.tile}>
      <Text style={styles.tileLabel}>{label}</Text>
      <Text style={[styles.tileValue, highlight && styles.tileValueHighlight]}>
        ₦{Math.round(value).toLocaleString()}
      </Text>
    </Card>
  );
}

function EarningRow({ order, first }: { order: Order; first: boolean }) {
  const styles = useStyles();
  return (
    <View style={[styles.row, !first && styles.rowDivided]}>
      <View style={styles.rowBody}>
        <Text style={styles.rowRoute} numberOfLines={1}>
          {order.pickupLocation} → {order.dropoffLocation}
        </Text>
        <Text style={styles.rowMeta}>
          {new Date(order.completedAt ?? order.createdAt).toLocaleDateString()} ·{' '}
          {order.distanceKm.toFixed(1)} km · {order.paymentMethod === 'CASH' ? 'Cash' : 'Transfer'}
        </Text>
      </View>
      <View style={styles.rowAmounts}>
        <Text style={styles.rowEarnings}>₦{order.driverEarnings.toLocaleString()}</Text>
        <Text style={styles.rowFare}>of ₦{order.fare.toLocaleString()}</Text>
      </View>
    </View>
  );
}

const useStyles = makeStyles(({ colors, type }) => ({
  title: { ...type.title, marginBottom: spacing.base },
  tiles: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  tile: { flex: 1, gap: spacing.xs },
  tileLabel: { ...type.caption },
  tileValue: { ...type.title, fontSize: 20 },
  tileValueHighlight: { color: colors.primary },

  sectionTitle: { ...type.label, marginTop: spacing.md, marginBottom: spacing.sm },
  list: { padding: 0, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.base,
  },
  rowDivided: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  rowBody: { flex: 1, gap: 2 },
  rowRoute: { ...type.body, fontSize: 14 },
  rowMeta: { ...type.caption },
  rowAmounts: { alignItems: 'flex-end' },
  rowEarnings: { ...type.subheading, color: colors.primary },
  rowFare: { ...type.caption, fontSize: 10 },
}));
