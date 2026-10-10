import { Linking, StyleSheet, Text, View } from 'react-native';

import { Button, Card, Chip } from '@/components/ui';
import type { ActiveOrder } from '@/modules/marketplace/marketplaceTypes';
import type { OrderStatus } from '@/modules/shared/apiTypes';
import { makeStyles, spacing, useTheme } from '@/theme';
import showToast from '@/utils/toast';

/**
 * What the driver presses next, per stage — one button, never a menu.
 *
 * The RESERVED → PICKED_UP step is the important one: it is the driver telling
 * the system they physically have the parcel, which is what separates "I said
 * I'd take it" from "I have it".
 */
const NEXT_STAGE: Partial<Record<OrderStatus, { label: string; status: OrderStatus }>> = {
  RESERVED: { label: "I'm heading to pickup", status: 'DRIVER_ARRIVING_PICKUP' },
  DRIVER_ARRIVING_PICKUP: { label: 'Picked up', status: 'PICKED_UP' },
  PICKED_UP: { label: 'On the way to drop-off', status: 'IN_TRANSIT' },
  IN_TRANSIT: { label: 'Delivered', status: 'DELIVERED' },
};

const STAGE_CHIP: Partial<
  Record<OrderStatus, { label: string; tone: 'brand' | 'info' | 'success' | 'pending' }>
> = {
  RESERVED: { label: 'Reserved', tone: 'brand' },
  DRIVER_ARRIVING_PICKUP: { label: 'Heading to pickup', tone: 'info' },
  PICKED_UP: { label: 'Picked up', tone: 'success' },
  IN_TRANSIT: { label: 'In transit', tone: 'info' },
};

/**
 * One order the driver is holding.
 *
 * Each card carries its own status, its own customer, its own price and its own
 * next action — §22 and §45. Completing this one does nothing to the others.
 */
export function ActiveOrderCard({
  order,
  onAdvance,
  onNavigate,
  onChat,
  unread = 0,
  advancing,
}: {
  order: ActiveOrder;
  onAdvance: (status: OrderStatus) => void;
  onNavigate: () => void;
  onChat: () => void;
  /** Unread messages on this order's chat. Badged onto the Chat button. */
  unread?: number;
  advancing?: boolean;
}) {
  const styles = useStyles();
  const { colors } = useTheme();

  const next = NEXT_STAGE[order.status];
  const chip = STAGE_CHIP[order.status] ?? { label: order.status, tone: 'info' as const };
  const collected = Boolean(order.pickedUpAt);

  // Which end the driver is being sent to right now — and therefore which of
  // the two numbers the call button should dial.
  const phone = collected ? order.dropoffPhone : order.pickupPhone;
  const eta = collected ? order.deliveryEtaMinutes : order.pickupEtaMinutes;

  const call = () => {
    if (!phone) {
      showToast.error('No phone number on file for this stop.');
      return;
    }
    void Linking.openURL(`tel:${phone}`);
  };

  return (
    <Card elevation="md" style={styles.card}>
      <View style={styles.header}>
        <Chip label={chip.label} tone={chip.tone} dot />
        <Text style={styles.earnings}>₦{order.driverEarnings.toLocaleString()}</Text>
      </View>

      <Text style={styles.reference}>Order #{order.id.slice(0, 8).toUpperCase()}</Text>

      <Leg
        color={colors.primary}
        label="Pickup"
        value={order.pickupLocation}
        // Struck through once collected: the driver has been there, and the
        // route no longer includes it.
        done={collected}
      />
      <Leg color={colors.danger} label="Drop-off" value={order.dropoffLocation} />

      <View style={styles.meta}>
        <Text style={styles.metaText}>{order.distanceKm.toFixed(1)} km</Text>
        {eta != null ? (
          <Text style={styles.metaText}>
            · {collected ? 'drop-off' : 'pickup'} in ~{eta} min
          </Text>
        ) : null}
      </View>

      <View style={styles.contactRow}>
        <Button label="Navigate" variant="secondary" size="sm" onPress={onNavigate} style={styles.contact} />
        <Button label="Call" variant="secondary" size="sm" onPress={call} style={styles.contact} />
        {/*
          The count goes in the label rather than a floating dot: a driver
          holding three orders is scanning three identical cards at a traffic
          light, and "Chat (2)" survives that glance where a badge in the corner
          does not.
        */}
        <Button
          label={unread > 0 ? `Chat (${unread > 9 ? '9+' : unread})` : 'Chat'}
          variant={unread > 0 ? 'primary' : 'secondary'}
          size="sm"
          onPress={onChat}
          style={styles.contact}
        />
      </View>

      {next ? (
        <Button
          label={next.label}
          size="md"
          onPress={() => onAdvance(next.status)}
          loading={advancing}
        />
      ) : null}
    </Card>
  );
}

function Leg({
  color,
  label,
  value,
  done,
}: {
  color: string;
  label: string;
  value: string;
  done?: boolean;
}) {
  const styles = useStyles();
  return (
    <View style={styles.leg}>
      <View style={[styles.dot, { backgroundColor: color }, done && styles.dotDone]} />
      <View style={styles.legBody}>
        <Text style={styles.legLabel}>{label}</Text>
        <Text style={[styles.legValue, done && styles.legValueDone]} numberOfLines={2}>
          {value}
        </Text>
      </View>
    </View>
  );
}

const useStyles = makeStyles(({ colors, type }) => ({
  card: { gap: spacing.sm },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  earnings: { ...type.heading, fontSize: 18, color: colors.primary },
  reference: { ...type.caption, letterSpacing: 0.5 },

  leg: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  dotDone: { opacity: 0.4 },
  legBody: { flex: 1 },
  legLabel: { ...type.caption, fontSize: 10 },
  legValue: { ...type.body, fontSize: 14 },
  legValueDone: { textDecorationLine: 'line-through', color: colors.textDisabled },

  meta: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  metaText: { ...type.caption },

  contactRow: { flexDirection: 'row', gap: spacing.xs },
  contact: { flex: 1 },
}));
