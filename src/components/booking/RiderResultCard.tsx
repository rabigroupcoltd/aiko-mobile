import { StyleSheet, Text, View } from 'react-native';

import { Avatar, Card, Chip } from '@/components/ui';
import { getVehicle } from '@/data/vehicleTypes';
import { makeStyles, radius, spacing } from '@/theme';
import type { MockRider } from '@/types/models';

interface RiderResultCardProps {
  rider: Omit<MockRider, 'avatar'>;
  fare?: number;
  distanceKm?: number;
}

export function RiderResultCard({ rider, fare, distanceKm }: RiderResultCardProps) {
  const styles = useStyles();
  const vehicle = getVehicle(rider.vehicle);

  return (
    <Card elevation="md" style={styles.card}>
      <View style={styles.header}>
        <Avatar name={rider.name} size={60} />

        <View style={styles.identity}>
          <Text style={styles.name}>{rider.name}</Text>
          <View style={styles.ratingRow}>
            <Text style={styles.rating}>★ {rider.rating.toFixed(1)}</Text>
            <Text style={styles.trips}>· {rider.trips.toLocaleString()} trips</Text>
          </View>
          <Chip
            label={`${vehicle.emoji} ${vehicle.label} · ${vehicle.localName}`}
            tone="brand"
          />
        </View>

        <View style={styles.eta}>
          <Text style={styles.etaValue}>{rider.etaMinutes}</Text>
          <Text style={styles.etaUnit}>min away</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.details}>
        <Detail label="Plate number" value={rider.plate} />
        {distanceKm != null ? (
          <Detail label="Distance" value={`${distanceKm.toFixed(1)} km`} />
        ) : null}
        {fare != null ? (
          <Detail label="Est. fare" value={`₦${fare.toLocaleString()}`} highlight />
        ) : null}
      </View>
    </Card>
  );
}

function Detail({
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
    <View style={styles.detail}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, highlight && styles.detailValueHighlight]}>
        {value}
      </Text>
    </View>
  );
}

const useStyles = makeStyles(({ colors, type }) => ({
  card: { gap: spacing.base },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  identity: { flex: 1, gap: spacing.xs, alignItems: 'flex-start' },
  name: { ...type.heading, fontSize: 17 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  rating: { ...type.bodySmall, color: colors.warning, fontWeight: '600' },
  trips: type.caption,
  eta: {
    alignItems: 'center',
    backgroundColor: colors.primarySubtle,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  etaValue: { ...type.title, fontSize: 26, color: colors.primaryDarker },
  etaUnit: { ...type.caption, color: colors.primaryDark },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.divider },
  details: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  detail: { gap: 2 },
  detailLabel: type.caption,
  detailValue: { ...type.subheading, fontSize: 15 },
  detailValueHighlight: { color: colors.primary },
}));
