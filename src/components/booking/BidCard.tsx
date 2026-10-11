import { StyleSheet, Text, View } from 'react-native';

import { Avatar, Button, Card, Chip } from '@/components/ui';
import { describeVehicle } from '@/data/vehicleTypes';
import type { RideBidWithDriver } from '@/modules/rideRequests/rideRequestsTypes';
import { makeStyles, spacing } from '@/theme';

interface BidCardProps {
  bid: RideBidWithDriver;
  onAccept: () => void;
  accepting?: boolean;
  disabled?: boolean;
}

export function BidCard({ bid, onAccept, accepting, disabled }: BidCardProps) {
  const styles = useStyles();
  const { driver } = bid;
  const vehicle = describeVehicle(driver.vehicleType);
  const name = driver.user?.name ?? 'Driver';

  const vehicleLine = [driver.vehicleColor, driver.vehicleModel].filter(Boolean).join(' ');

  return (
    <Card elevation="md" style={styles.card}>
      <View style={styles.header}>
        <Avatar name={name} size={52} />

        <View style={styles.identity}>
          <Text style={styles.name}>{name}</Text>
          <View style={styles.ratingRow}>
            <Text style={styles.rating}>★ {driver.rating.toFixed(1)}</Text>
            <Text style={styles.trips}>· {driver.totalTrips.toLocaleString()} trips</Text>
          </View>
          <Chip label={`${vehicle.emoji} ${vehicle.label} · ${vehicle.localName}`} tone="brand" />
        </View>

        <View style={styles.amount}>
          <Text style={styles.amountValue}>₦{bid.amount.toLocaleString()}</Text>
        </View>
      </View>

      {bid.note ? <Text style={styles.note}>“{bid.note}”</Text> : null}

      <View style={styles.divider} />

      <View style={styles.details}>
        <Detail label="Plate" value={driver.vehiclePlate} />
        {vehicleLine ? <Detail label="Vehicle" value={vehicleLine} /> : null}
      </View>

      <Button
        label={accepting ? 'Booking…' : 'Choose this driver'}
        onPress={onAccept}
        loading={accepting}
        disabled={disabled || accepting}
        size="md"
      />
    </Card>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  const styles = useStyles();
  return (
    <View style={styles.detail}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const useStyles = makeStyles(({ colors, type }) => ({
  card: { gap: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  identity: { flex: 1, gap: spacing.xs, alignItems: 'flex-start' },
  name: { ...type.heading, fontSize: 16 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  rating: { ...type.bodySmall, color: colors.warning, fontWeight: '600' },
  trips: type.caption,
  amount: { alignItems: 'flex-end' },
  amountValue: { ...type.title, fontSize: 20, color: colors.primary },
  note: { ...type.bodySmall, fontStyle: 'italic', color: colors.textMuted },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.divider },
  details: { flexDirection: 'row', gap: spacing.lg },
  detail: { gap: 2 },
  detailLabel: type.caption,
  detailValue: { ...type.subheading, fontSize: 14 },
}));
