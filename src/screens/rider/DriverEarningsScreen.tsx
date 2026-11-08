import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { CountUpText, Shimmer } from '@/components/motion';
import { AppHeader, Card, EmptyState, Screen } from '@/components/ui';
import {
  useGetDriverAnalyticsManager,
  useGetMyDriverProfileManager,
} from '@/modules/drivers/driversController';
import { useGetOrdersManager } from '@/modules/orders/ordersController';
import type { Order } from '@/modules/orders/ordersTypes';
import { useOpenDrawer } from '@/navigation/useAppNavigation';
import { makeStyles, screenGutter, spacing, useTheme } from '@/theme';
import { haptics } from '@/utils/haptics';

const naira = (n: number) => `₦${Math.round(n).toLocaleString()}`;

export function DriverEarningsScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const openDrawer = useOpenDrawer();
  const [refreshing, setRefreshing] = useState(false);

  const { data: driver } = useGetMyDriverProfileManager();
  const {
    data: analytics,
    isLoading: loadingTotals,
    refetch: refetchAnalytics,
  } = useGetDriverAnalyticsManager({ id: driver?.id });
  const { data: page, isLoading: loadingOrders, refetch: refetchOrders } = useGetOrdersManager({ limit: 50 });

  const settled = (page?.result ?? []).filter(
    (order) => order.status === 'DELIVERED' || order.status === 'COMPLETED',
  );

  const refresh = useCallback(async () => {
    setRefreshing(true);
    haptics.select();
    try {
      await Promise.all([refetchAnalytics(), refetchOrders()]);
    } finally {
      setRefreshing(false);
    }
  }, [refetchAnalytics, refetchOrders]);

  const totalsLoading = loadingTotals || !driver;

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <AppHeader onMenu={openDrawer} />
      </View>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void refresh()}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }>
        <Animated.Text entering={FadeInDown.springify().damping(16)} style={styles.title}>
          Your earnings
        </Animated.Text>

        <Animated.View entering={FadeInDown.springify().damping(16).delay(60)} style={styles.tiles}>
          <Tile label="Today" value={analytics?.todayEarnings ?? 0} loading={totalsLoading} highlight />
          <Tile label="This week" value={analytics?.weekEarnings ?? 0} loading={totalsLoading} />
        </Animated.View>
        <Animated.View entering={FadeInDown.springify().damping(16).delay(120)} style={styles.tiles}>
          <Tile label="All time" value={analytics?.totalEarnings ?? 0} loading={totalsLoading} />
          <Tile
            label="Owed to Aiko"
            value={analytics?.currentDebt ?? 0}
            loading={totalsLoading}
            warn={(analytics?.currentDebt ?? 0) > 0}
          />
        </Animated.View>

        <Text style={styles.sectionTitle}>Completed deliveries</Text>

        {loadingOrders ? (
          <Card style={styles.list}>
            {Array.from({ length: 4 }).map((_, i) => (
              <View key={i} style={[styles.row, i > 0 && styles.rowDivided]}>
                <View style={styles.rowBody}>
                  <Shimmer width="80%" height={14} />
                  <Shimmer width="50%" height={11} />
                </View>
                <Shimmer width={64} height={18} />
              </View>
            ))}
          </Card>
        ) : settled.length === 0 ? (
          <EmptyState
            icon="💸"
            title="No earnings yet"
            body="Every delivery you complete shows up here, with what you made on it."
          />
        ) : (
          <Animated.View entering={FadeInDown.springify().damping(16).delay(180)}>
            <Card style={styles.list}>
              {settled.map((order, index) => (
                <EarningRow key={order.id} order={order} first={index === 0} />
              ))}
            </Card>
          </Animated.View>
        )}
      </ScrollView>
    </Screen>
  );
}

function Tile({
  label,
  value,
  loading,
  highlight,
  warn,
}: {
  label: string;
  value: number;
  loading?: boolean;
  highlight?: boolean;
  warn?: boolean;
}) {
  const styles = useStyles();
  return (
    <Card style={styles.tile}>
      <Text style={styles.tileLabel}>{label}</Text>
      {loading ? (
        <Shimmer width="70%" height={24} />
      ) : (
        <CountUpText
          value={value}
          format={naira}
          style={[styles.tileValue, highlight && styles.tileValueHighlight, warn && styles.tileValueWarn]}
        />
      )}
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
        <Text style={styles.rowEarnings}>+{naira(order.driverEarnings)}</Text>
        <Text style={styles.rowFare}>of {naira(order.fare)} fare</Text>
      </View>
    </View>
  );
}

const useStyles = makeStyles(({ colors, type }) => ({
  header: { paddingHorizontal: screenGutter },
  content: { paddingHorizontal: screenGutter, paddingBottom: spacing.xxl },
  title: { ...type.title, marginBottom: spacing.base },
  tiles: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  tile: { flex: 1, gap: spacing.xs },
  tileLabel: { ...type.caption },
  tileValue: { ...type.title, fontSize: 20, fontVariant: ['tabular-nums'] },
  tileValueHighlight: { color: colors.primary },
  tileValueWarn: { color: colors.warning },

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
  rowBody: { flex: 1, gap: 4 },
  rowRoute: { ...type.body, fontSize: 14 },
  rowMeta: { ...type.caption },
  rowAmounts: { alignItems: 'flex-end' },
  rowEarnings: { ...type.subheading, color: colors.primary },
  rowFare: { ...type.caption, fontSize: 10 },
}));
