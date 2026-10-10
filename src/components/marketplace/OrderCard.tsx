import { StyleSheet, Text, View } from 'react-native';

import { Button, Card, Chip } from '@/components/ui';
import type { MarketplaceOrder, RouteMatch } from '@/modules/marketplace/marketplaceTypes';
import { makeStyles, spacing, useTheme } from '@/theme';

/**
 * One order in the driver's grid.
 *
 * Built for a glance at a traffic light: price first and largest, then the two
 * ends of the trip, then the numbers that decide it. Two buttons, both large
 * enough to hit without looking closely — §42.
 */
export function OrderCard({
  order,
  onAccept,
  onSkip,
  busy,
  disabled,
}: {
  order: MarketplaceOrder;
  onAccept: () => void;
  onSkip: () => void;
  /** This card's own reservation is in flight. */
  busy?: boolean;
  /** Another card is being reserved, or the driver is at capacity. */
  disabled?: boolean;
}) {
  const styles = useStyles();
  const { compatibility: fit } = order;

  return (
    <Card
      elevation="md"
      style={StyleSheet.flatten([
        styles.card,
        fit.compatible ? styles.cardFits : styles.cardPoor,
      ])}>
      <View style={styles.header}>
        <Text style={styles.price}>₦{order.earnings.toLocaleString()}</Text>
        <MatchBadge match={fit.match} />
      </View>

      {/*
        What the driver is being asked to carry. Directly under the price
        because it is the other half of the same decision — a fare is only
        worth taking if the parcel fits on the bike. Hidden entirely when the
        customer said nothing, rather than shown as an empty row.
      */}
      {order.description ? (
        <Text style={styles.description} numberOfLines={2}>
          {order.description}
        </Text>
      ) : null}

      <Leg label="Pickup" value={order.pickupLocation} tone="pickup" />
      <Leg label="Drop-off" value={order.dropoffLocation} tone="dropoff" />

      <View style={styles.metrics}>
        <Metric label="Trip" value={`${order.distanceKm.toFixed(1)} km`} />
        <Metric label="From you" value={`${fit.pickupDistanceKm.toFixed(1)} km`} />
        <Metric label="Age" value={formatAge(order.ageSeconds)} />
      </View>

      {/*
        The detour is the number that actually decides a second or third order,
        so it gets its own line rather than being buried among the metrics. It
        is meaningless on the first order — there is no route to detour from.
      */}
      {fit.additionalDistanceKm > 0 ? (
        <Text style={[styles.reason, !fit.compatible && styles.reasonPoor]}>
          {fit.compatible ? '+' : ''}
          {fit.reason}
        </Text>
      ) : (
        <Text style={styles.reason}>{fit.reason}</Text>
      )}

      <View style={styles.actions}>
        <Button
          label="Skip"
          variant="ghost"
          size="md"
          onPress={onSkip}
          disabled={busy}
          style={styles.action}
        />
        <Button
          label="Accept"
          size="md"
          onPress={onAccept}
          loading={busy}
          // Incompatible orders stay visible and stay honest about why — §16 —
          // but the server refuses them unless ALLOW_INCOMPATIBLE_RESERVATION
          // is on, so offering the button would be a lie.
          disabled={disabled || busy || !fit.compatible}
          style={styles.action}
        />
      </View>
    </Card>
  );
}

const MATCH_CHIP: Record<
  RouteMatch,
  { label: string; tone: 'success' | 'brand' | 'info' | 'neutral' }
> = {
  GREAT: { label: 'Great match', tone: 'success' },
  GOOD: { label: 'Good match', tone: 'brand' },
  FAIR: { label: 'Fair match', tone: 'info' },
  POOR: { label: 'Poor match', tone: 'neutral' },
};

/** GREAT / GOOD / FAIR / POOR, coloured so the grid reads at a glance. */
export function MatchBadge({ match }: { match: RouteMatch }) {
  const chip = MATCH_CHIP[match];
  return <Chip label={chip.label} tone={chip.tone} dot />;
}

function Leg({ label, value, tone }: { label: string; value: string; tone: 'pickup' | 'dropoff' }) {
  const styles = useStyles();
  const { colors } = useTheme();

  return (
    <View style={styles.leg}>
      <View
        style={[
          styles.dot,
          { backgroundColor: tone === 'pickup' ? colors.primary : colors.danger },
        ]}
      />
      <View style={styles.legBody}>
        <Text style={styles.legLabel}>{label}</Text>
        <Text style={styles.legValue} numberOfLines={2}>
          {value}
        </Text>
      </View>
    </View>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  const styles = useStyles();
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

/** "2m" reads faster than "just now" when you are deciding in three seconds. */
function formatAge(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  return `${Math.floor(seconds / 3600)}h`;
}

const useStyles = makeStyles(({ colors, type }) => ({
  description: {
    ...type.bodySmall,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  card: { gap: spacing.sm, borderWidth: 2 },
  cardFits: { borderColor: colors.primary },
  // Muted rather than hidden: the driver still sees the job exists and why it
  // was not recommended.
  cardPoor: { borderColor: colors.border, opacity: 0.75 },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  price: { ...type.title, fontSize: 24, color: colors.primary },

  leg: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  legBody: { flex: 1 },
  legLabel: { ...type.caption, fontSize: 10 },
  legValue: { ...type.body, fontSize: 14 },

  metrics: {
    flexDirection: 'row',
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  metric: { flex: 1, gap: 1 },
  metricLabel: { ...type.caption, fontSize: 10 },
  metricValue: { ...type.subheading, fontSize: 13 },

  reason: { ...type.caption, color: colors.textMuted },
  reasonPoor: { color: colors.warning },

  actions: { flexDirection: 'row', gap: spacing.sm },
  action: { flex: 1 },
}));
