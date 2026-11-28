import { useEffect, useState } from 'react';
import { Alert, Linking, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';

import { SwipeToConfirm } from '@/components/motion';
import { Button, Card, Chip } from '@/components/ui';
import type { ActiveOrder } from '@/modules/marketplace/marketplaceTypes';
import type { OrderStatus } from '@/modules/shared/apiTypes';
import { makeStyles, spacing, useTheme } from '@/theme';
import { orderReference, spellCode } from '@/utils/orderCode';
import showToast from '@/utils/toast';

const NEXT_STAGE: Partial<Record<OrderStatus, { label: string; status: OrderStatus }>> = {
  RESERVED: { label: 'Swipe — heading to pickup', status: 'DRIVER_ARRIVING_PICKUP' },
  DRIVER_ARRIVING_PICKUP: { label: 'Swipe — picked up', status: 'PICKED_UP' },
  PICKED_UP: { label: 'Swipe — on my way to drop-off', status: 'IN_TRANSIT' },
  IN_TRANSIT: { label: 'Swipe — delivered', status: 'DELIVERED' },
};

const STAGE_CHIP: Partial<
  Record<OrderStatus, { label: string; tone: 'brand' | 'info' | 'success' | 'pending' }>
> = {
  RESERVED: { label: "It's yours", tone: 'brand' },
  DRIVER_ARRIVING_PICKUP: { label: 'Heading to pickup', tone: 'info' },
  PICKED_UP: { label: 'Picked up', tone: 'success' },
  IN_TRANSIT: { label: 'On the way', tone: 'info' },
};

export function ActiveOrderCard({
  order,
  onAdvance,
  onNavigate,
  onChat,
  unread = 0,
  advancing,
  declineMinutes = 5,
  onRelease,
  releasing,
}: {
  order: ActiveOrder;
  onAdvance: (status: OrderStatus) => void;
  onNavigate: () => void;
  onChat: () => void;
  unread?: number;
  advancing?: boolean;
  declineMinutes?: number;
  onRelease?: () => void;
  releasing?: boolean;
}) {
  const styles = useStyles();
  const { colors } = useTheme();

  const declineUntil =
    order.assignedById && order.assignedAt && order.status === 'RESERVED'
      ? Date.parse(order.assignedAt) + declineMinutes * 60_000
      : null;
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (declineUntil == null || declineUntil <= Date.now()) return;
    const timer = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(timer);
  }, [declineUntil]);
  const canHandBack = declineUntil != null && now < declineUntil && Boolean(onRelease);
  const minutesLeft = declineUntil != null ? Math.max(1, Math.ceil((declineUntil - now) / 60_000)) : 0;

  const confirmHandBack = () =>
    Alert.alert(
      "Can't take this one?",
      'It goes back to other riders and the customer is told we are finding someone else.',
      [
        { text: 'Keep it', style: 'cancel' },
        { text: 'Hand it back', style: 'destructive', onPress: onRelease },
      ],
    );

  const next = NEXT_STAGE[order.status];
  const chip = STAGE_CHIP[order.status] ?? { label: order.status, tone: 'info' as const };
  const collected = Boolean(order.pickedUpAt);

  const phone = collected ? order.dropoffPhone : order.pickupPhone;
  const eta = collected ? order.deliveryEtaMinutes : order.pickupEtaMinutes;

  // Before collecting, the rider checks the code the customer reads out
  // against this screen, so they never leave with the wrong order.
  const advance = (status: OrderStatus) => {
    if (status !== 'PICKED_UP' || !order.code) {
      onAdvance(status);
      return;
    }
    Alert.alert(
      `Did they say ${order.code}?`,
      "Only collect the order if the code the customer told you matches. If it doesn't, call them before you go.",
      [
        { text: 'Not yet', style: 'cancel' },
        { text: 'Yes, it matches', onPress: () => onAdvance(status) },
      ],
    );
  };

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
        <Animated.View key={order.status} entering={ZoomIn.springify().damping(14)}>
          <Chip label={chip.label} tone={chip.tone} dot />
        </Animated.View>
        <Text style={styles.earnings}>₦{order.driverEarnings.toLocaleString()}</Text>
      </View>

      {order.code && !collected ? (
        <View
          style={styles.codeBox}
          accessible
          accessibilityLabel={`Ask the customer for their order code. It should be ${spellCode(order.code)}.`}>
          <Text style={styles.codeLabel}>Ask the customer for their order code</Text>
          <Text style={styles.code}>{order.code}</Text>
          <Text style={styles.codeHint}>Collect only if it matches.</Text>
        </View>
      ) : (
        <Text style={styles.reference}>Order {orderReference(order)}</Text>
      )}

      {order.assignedById ? (
        <Animated.View entering={ZoomIn.springify()} style={styles.assigned}>
          <Text style={styles.assignedText}>Assigned to you by Aiko</Text>
        </Animated.View>
      ) : null}

      <Leg
        color={colors.primary}
        label="Pickup"
        value={order.pickupLocation}
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
        <Button
          label={unread > 0 ? `Chat (${unread > 9 ? '9+' : unread})` : 'Chat'}
          variant={unread > 0 ? 'primary' : 'secondary'}
          size="sm"
          onPress={onChat}
          style={styles.contact}
        />
      </View>

      {next ? (
        <Animated.View key={next.status} entering={FadeIn.duration(250)}>
          <SwipeToConfirm
            label={next.label}
            onConfirm={() => advance(next.status)}
            loading={advancing}
            tone={next.status === 'DELIVERED' ? 'accent' : 'primary'}
          />
        </Animated.View>
      ) : null}

      {canHandBack ? (
        <Button
          label={`Can't take it · ${minutesLeft} min left to hand back`}
          variant="ghost"
          size="sm"
          onPress={confirmHandBack}
          loading={releasing}
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
  codeBox: {
    alignItems: 'center',
    gap: 2,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 14,
    backgroundColor: colors.primarySubtle,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderStyle: 'dashed',
  },
  codeLabel: { ...type.caption, color: colors.primaryDarker, fontWeight: '700' },
  code: { fontSize: 30, lineHeight: 36, fontWeight: '800', letterSpacing: 4, color: colors.text },
  codeHint: { ...type.caption },
  assigned: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primaryLight,
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  assignedText: { ...type.caption, color: colors.primary, fontWeight: '600' },

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
