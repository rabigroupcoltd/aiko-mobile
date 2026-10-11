import { Pressable, Text, View } from 'react-native';

import { Card } from '@/components/ui';
import type { PlannedStop, RoutePlan } from '@/modules/marketplace/marketplaceTypes';
import { makeStyles, spacing, useTheme } from '@/theme';

export function RouteTimeline({
  route,
  onStopPress,
}: {
  route: RoutePlan | null | undefined;
  onStopPress?: (stop: PlannedStop) => void;
}) {
  const styles = useStyles();

  if (!route || route.stops.length === 0) return null;

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Your route</Text>
        <Text style={styles.summary}>
          {route.totalKm.toFixed(1)} km · {route.totalMinutes} min
        </Text>
      </View>

      {route.stops.map((stop, index) => (
        <Stop
          key={`${stop.orderId}-${stop.kind}`}
          stop={stop}
          last={index === route.stops.length - 1}
          onPress={onStopPress ? () => onStopPress(stop) : undefined}
        />
      ))}
    </Card>
  );
}

function Stop({
  stop,
  last,
  onPress,
}: {
  stop: PlannedStop;
  last: boolean;
  onPress?: () => void;
}) {
  const styles = useStyles();
  const { colors } = useTheme();

  const isPickup = stop.kind === 'PICKUP';

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`Stop ${stop.sequence}: ${isPickup ? 'pick up' : 'drop off'} at ${stop.address}`}
      style={({ pressed }) => [styles.stop, pressed && onPress && styles.stopPressed]}>
      <View style={styles.rail}>
        <View
          style={[
            styles.marker,
            { backgroundColor: isPickup ? colors.primary : colors.danger },
          ]}>
          <Text style={styles.markerText}>{stop.sequence}</Text>
        </View>
        {!last ? <View style={styles.connector} /> : null}
      </View>

      <View style={styles.body}>
        <Text style={styles.kind}>
          {isPickup ? 'Pick up' : 'Drop off'} · #{stop.orderId.slice(0, 8).toUpperCase()}
        </Text>
        <Text style={styles.address} numberOfLines={2}>
          {stop.address}
        </Text>
        <Text style={styles.timing}>
          {stop.cumulativeKm.toFixed(1)} km · ~{stop.etaMinutes} min
        </Text>
      </View>
    </Pressable>
  );
}

const useStyles = makeStyles(({ colors, type }) => ({
  card: { gap: spacing.xs },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  title: { ...type.label },
  summary: { ...type.caption, color: colors.text, fontWeight: '600' },

  stop: { flexDirection: 'row', gap: spacing.md },
  stopPressed: { opacity: 0.7 },
  rail: { alignItems: 'center', width: 24 },
  marker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerText: { ...type.caption, color: colors.onPrimary, fontWeight: '700', fontSize: 11 },
  connector: { flex: 1, width: 2, backgroundColor: colors.border, minHeight: 16 },

  body: { flex: 1, paddingBottom: spacing.md, gap: 1 },
  kind: { ...type.caption, fontSize: 10, letterSpacing: 0.4 },
  address: { ...type.body, fontSize: 14 },
  timing: { ...type.caption },
}));
