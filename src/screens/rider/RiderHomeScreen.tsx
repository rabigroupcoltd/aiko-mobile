import { useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, Switch, Text, View } from 'react-native';

import { AppHeader, Avatar, Button, Card, Chip, EmptyState, Screen } from '@/components/ui';
import { MOCK_RIDE_REQUESTS } from '@/data/mockRiders';
import { getVehicle } from '@/data/vehicleTypes';
import { useOpenDrawer } from '@/navigation/useAppNavigation';
import { useAppStore } from '@/store/appStore';
import { makeStyles, spacing, useTheme } from '@/theme';
import type { RideRequest } from '@/types/models';

type Status = 'offline' | 'online' | 'on-trip';

export function RiderHomeScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const openDrawer = useOpenDrawer();

  const user = useAppStore((s) => s.user);
  const profilePhoto = useAppStore((s) => s.photos.profile);
  const vehicleType = useAppStore((s) => s.documents.vehicleType);

  const [status, setStatus] = useState<Status>('offline');
  const [request, setRequest] = useState<RideRequest | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [activeTrip, setActiveTrip] = useState<RideRequest | null>(null);
  const [earnings, setEarnings] = useState(0);
  const [completed, setCompleted] = useState(0);

  const requestIndex = useRef(0);
  const vehicle = vehicleType ? getVehicle(vehicleType) : null;

  // While online and idle, surface a new job every few seconds.
  useEffect(() => {
    if (status !== 'online' || request || activeTrip) return;

    const timer = setTimeout(() => {
      const next = MOCK_RIDE_REQUESTS[requestIndex.current % MOCK_RIDE_REQUESTS.length];
      requestIndex.current += 1;
      setRequest(next);
      setCountdown(next.expiresInSeconds);
    }, 2500);

    return () => clearTimeout(timer);
  }, [status, request, activeTrip]);

  // Auto-decline when the acceptance window closes.
  useEffect(() => {
    if (!request) return;
    if (countdown <= 0) {
      setRequest(null);
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [request, countdown]);

  const acceptRequest = () => {
    if (!request) return;
    setActiveTrip(request);
    setRequest(null);
    setStatus('on-trip');
  };

  const completeTrip = () => {
    if (!activeTrip) return;
    setEarnings((e) => e + activeTrip.fare);
    setCompleted((c) => c + 1);
    setActiveTrip(null);
    setStatus('online');
  };

  const toggleOnline = (value: boolean) => {
    if (activeTrip) {
      Alert.alert('Finish your trip first', 'Complete the active trip before going offline.');
      return;
    }
    setStatus(value ? 'online' : 'offline');
    setRequest(null);
  };

  return (
    <Screen scroll>
      <AppHeader
        onMenu={openDrawer}
        trailing={<Avatar uri={profilePhoto?.uri} name={user?.firstName} size={36} />}
      />

      <View style={styles.greetingRow}>
        <View style={styles.greetingText}>
          <Text style={styles.greeting}>Hi {user?.firstName ?? 'rider'} 👋</Text>
          <Chip
            label={
              status === 'on-trip' ? 'On a trip' : status === 'online' ? 'Online' : 'Offline'
            }
            tone={status === 'offline' ? 'neutral' : status === 'on-trip' ? 'info' : 'success'}
            dot
          />
        </View>
      </View>

      <Card style={styles.statusCard}>
        <View style={styles.statusBody}>
          <Text style={styles.statusTitle}>
            {status === 'offline' ? 'You are offline' : 'Accepting trips'}
          </Text>
          <Text style={styles.statusHint}>
            {status === 'offline'
              ? 'Go online to start receiving trip requests.'
              : vehicle
                ? `${vehicle.emoji} ${vehicle.label} · ${vehicle.localName}`
                : 'Waiting for nearby requests…'}
          </Text>
        </View>
        <Switch
          value={status !== 'offline'}
          onValueChange={toggleOnline}
          trackColor={{ true: colors.green[300], false: colors.border }}
          thumbColor={status !== 'offline' ? colors.primary : colors.neutral[400]}
        />
      </Card>

      <View style={styles.stats}>
        <StatTile label="Today's earnings" value={`₦${earnings.toLocaleString()}`} highlight />
        <StatTile label="Trips completed" value={String(completed)} />
      </View>

      {/* ── active trip ── */}
      {activeTrip ? (
        <Card elevation="md" style={styles.tripCard}>
          <Chip label="Trip in progress" tone="info" dot />
          <Text style={styles.tripPassenger}>{activeTrip.passengerName}</Text>
          <TripRow icon="📍" label="Pickup" value={activeTrip.pickup} />
          <TripRow icon="🏁" label="Drop-off" value={activeTrip.dropoff} />
          <View style={styles.tripMeta}>
            <Text style={styles.tripMetaText}>{activeTrip.distanceKm} km</Text>
            <Text style={styles.tripFare}>₦{activeTrip.fare.toLocaleString()}</Text>
          </View>
          <Button label="Complete trip" onPress={completeTrip} />
        </Card>
      ) : null}

      {/* ── inbound request ── */}
      {request ? (
        <Card elevation="lg" style={styles.requestCard}>
          <View style={styles.requestHeader}>
            <Chip label="New request" tone="brand" dot />
            <Text style={styles.countdown}>{countdown}s</Text>
          </View>

          <Text style={styles.tripPassenger}>{request.passengerName}</Text>
          <TripRow icon="📍" label="Pickup" value={request.pickup} />
          <TripRow icon="🏁" label="Drop-off" value={request.dropoff} />

          <View style={styles.tripMeta}>
            <Text style={styles.tripMetaText}>{request.distanceKm} km away</Text>
            <Text style={styles.tripFare}>₦{request.fare.toLocaleString()}</Text>
          </View>

          <View style={styles.requestActions}>
            <Button
              label="Decline"
              variant="ghost"
              onPress={() => setRequest(null)}
              style={styles.requestButton}
            />
            <Button label="Accept" onPress={acceptRequest} style={styles.requestButton} />
          </View>
        </Card>
      ) : null}

      {/* ── idle states ── */}
      {!request && !activeTrip ? (
        status === 'online' ? (
          <EmptyState
            icon="📡"
            title="Looking for trips nearby"
            body="You'll be notified as soon as a passenger requests a ride near you."
          />
        ) : (
          <EmptyState
            icon="💤"
            title="You're offline"
            body="Turn on the switch above to start receiving trip requests."
          />
        )
      ) : null}
    </Screen>
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

function TripRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  const styles = useStyles();
  return (
    <View style={styles.tripRow}>
      <Text style={styles.tripIcon}>{icon}</Text>
      <View style={styles.tripRowBody}>
        <Text style={styles.tripLabel}>{label}</Text>
        <Text style={styles.tripValue}>{value}</Text>
      </View>
    </View>
  );
}

const useStyles = makeStyles(({ colors, type }) => ({
  greetingRow: { marginBottom: spacing.base },
  greetingText: { gap: spacing.sm, alignItems: 'flex-start' },
  greeting: { ...type.title },

  statusCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  statusBody: { flex: 1, gap: 2 },
  statusTitle: { ...type.subheading },
  statusHint: { ...type.caption },

  stats: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  statTile: { flex: 1, gap: spacing.xs },
  statLabel: { ...type.caption },
  statValue: { ...type.title, fontSize: 22 },
  statValueHighlight: { color: colors.primary },

  tripCard: { marginTop: spacing.lg, gap: spacing.sm, alignItems: 'stretch' },
  requestCard: {
    marginTop: spacing.lg,
    gap: spacing.sm,
    borderColor: colors.primary,
    borderWidth: 2,
  },
  requestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  countdown: { ...type.subheading, color: colors.warning },
  tripPassenger: { ...type.heading, fontSize: 17 },
  tripRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  tripIcon: { fontSize: 16 },
  tripRowBody: { flex: 1, gap: 1 },
  tripLabel: { ...type.caption },
  tripValue: { ...type.body, fontSize: 15 },
  tripMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    marginTop: spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  tripMetaText: { ...type.bodySmall },
  tripFare: { ...type.heading, fontSize: 18, color: colors.primary },
  requestActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xs },
  requestButton: { flex: 1 },
}));
