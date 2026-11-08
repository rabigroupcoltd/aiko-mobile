import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, RefreshControl, ScrollView, Text, View } from 'react-native';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';

import { MatchingAnimation } from '@/components/booking/MatchingAnimation';
import { BidCard } from '@/components/booking/BidCard';
import { MATCHING_LINES, useMatchingLine } from '@/components/booking/matchingCopy';
import { Button, Screen } from '@/components/ui';
import {
  AcceptDriverManager,
  CancelRideRequestManager,
  CreateRideRequestManager,
  findOpenRequest,
  useGetRideRequestManager,
} from '@/modules/rideRequests/rideRequestsController';
import type { RideBidWithDriver } from '@/modules/rideRequests/rideRequestsTypes';
import { ROUTES } from '@/navigation/routes';
import type { PassengerStackParamList } from '@/navigation/types';
import { useBookingStore } from '@/store/bookingStore';
import { makeStyles, spacing, useTheme } from '@/theme';
import { haptics } from '@/utils/haptics';
import { createLogger } from '@/utils/logger';
import showToast from '@/utils/toast';

const log = createLogger('matching');

type Props = NativeStackScreenProps<PassengerStackParamList, typeof ROUTES.MATCHING>;

export function MatchingScreen({ navigation, route }: Props) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { pickup, dropoff, vehicleType } = route.params;

  const requestId = useBookingStore((s) => s.requestId);
  const setRequestId = useBookingStore((s) => s.setRequestId);
  const setMatchState = useBookingStore((s) => s.setMatchState);
  const confirmBooking = useBookingStore((s) => s.confirmBooking);
  const reset = useBookingStore((s) => s.reset);

  const [refreshing, setRefreshing] = useState(false);
  const [accepting, setAccepting] = useState<string | null>(null);
  const [failed, setFailed] = useState<string | null>(null);

  const { createRideRequest, isLoading: creating } = CreateRideRequestManager();
  const { acceptDriver } = AcceptDriverManager();
  const { cancelRideRequest } = CancelRideRequestManager();

  const created = useRef(false);

  useEffect(() => {
    if (created.current) return;
    created.current = true;

    (async () => {
      try {
        const result = await createRideRequest({
          vehicleType,
          pickupLocation: pickup.name,
          dropoffLocation: dropoff.name,
          pickupLat: pickup.lat,
          pickupLng: pickup.lng,
          dropoffLat: dropoff.lat,
          dropoffLng: dropoff.lng,
          paymentMethod: 'CASH',
        });

        setRequestId(result.request.id);
        setMatchState('searching');
      } catch (e: any) {
        log.warn('Could not create the ride request', e);

        const open = await findOpenRequest();
        if (open) {
          setRequestId(open.id);
          setMatchState('searching');
          return;
        }

        setFailed(e?.message ?? 'We could not start looking for a rider. Please try again.');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { data: request, refetch } = useGetRideRequestManager({
    requestId,
    refetchInterval: 5_000,
  });

  const bids = (request?.bids ?? []) as RideBidWithDriver[];
  const expired = request?.status === 'EXPIRED';
  const cancelled = request?.status === 'CANCELLED';

  const stageIndex = useMatchingLine(bids.length === 0 && !failed);

  useEffect(() => {
    if (bids.length > 0) setMatchState('matched');
  }, [bids.length, setMatchState]);

  // The first offer is the moment the search pays off — make it felt.
  const hadBids = useRef(false);
  useEffect(() => {
    if (bids.length > 0 && !hadBids.current) {
      hadBids.current = true;
      haptics.alert();
    }
  }, [bids.length]);

  const handleAccept = useCallback(
    async (bid: RideBidWithDriver) => {
      if (!requestId || accepting) return;
      setAccepting(bid.driverId);

      try {
        const order = await acceptDriver({ requestId, driverId: bid.driverId });
        confirmBooking(order.id);
        navigation.replace(ROUTES.RIDER_FOUND, { orderId: order.id });
      } catch (e: any) {
        showToast.error(e?.message ?? 'We could not book that rider. Try another one.');
        setAccepting(null);
        void refetch();
      }
    },
    [requestId, accepting, acceptDriver, confirmBooking, navigation, refetch],
  );

  const handleCancel = useCallback(() => {
    Alert.alert('Stop looking for a rider?', 'Riders will stop seeing your request.', [
      { text: 'Keep looking', style: 'cancel' },
      {
        text: 'Stop',
        style: 'destructive',
        onPress: async () => {
          if (requestId) await cancelRideRequest({ requestId }).catch(() => undefined);
          reset();
          navigation.navigate(ROUTES.PASSENGER_HOME);
        },
      },
    ]);
  }, [requestId, cancelRideRequest, reset, navigation]);

  const goHome = useCallback(() => {
    reset();
    navigation.navigate(ROUTES.PASSENGER_HOME);
  }, [reset, navigation]);

  if (failed || expired || cancelled) {
    const message = failed
      ? failed
      : expired
        ? 'No rider was free in time. Riders come online all the time, so try again in a minute.'
        : 'This request was cancelled.';

    return (
      <Screen>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>No rider this time</Text>
            <Text style={styles.route}>{message}</Text>
          </View>
          <View style={styles.terminalActions}>
            <Button label="Try again" onPress={goHome} />
          </View>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {bids.length > 0
              ? `${bids.length} rider${bids.length > 1 ? 's' : ''} ready to go`
              : 'Finding you a rider'}
          </Text>
          <Text style={styles.route} numberOfLines={2}>
            {pickup.name} → {dropoff.name}
          </Text>
        </View>

        {bids.length === 0 ? (
          <MatchingAnimation stages={MATCHING_LINES} stageIndex={stageIndex} />
        ) : (
          <ScrollView
            style={styles.bids}
            contentContainerStyle={styles.bidsContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                tintColor={colors.primary}
                colors={[colors.primary]}
                onRefresh={async () => {
                  setRefreshing(true);
                  await refetch().catch(() => undefined);
                  setRefreshing(false);
                }}
              />
            }>
            <Text style={styles.hint}>Pick the rider you like. Prices are what you pay in cash.</Text>
            {bids.map((bid, i) => (
              <Animated.View
                key={bid.id}
                entering={FadeInDown.delay(i * 70).springify().damping(16)}
                layout={LinearTransition.springify().damping(18)}>
                <BidCard
                  bid={bid}
                  onAccept={() => handleAccept(bid)}
                  accepting={accepting === bid.driverId}
                  disabled={Boolean(accepting) && accepting !== bid.driverId}
                />
              </Animated.View>
            ))}
          </ScrollView>
        )}

        <Button
          label={creating ? 'Starting…' : 'Stop looking'}
          variant="ghost"
          onPress={handleCancel}
          disabled={creating}
        />
      </View>
    </Screen>
  );
}

const useStyles = makeStyles(({ type }) => ({
  container: {
    flex: 1,
    alignItems: 'stretch',
    justifyContent: 'space-between',
    paddingVertical: spacing.xxl,
  },
  header: { alignItems: 'center', gap: spacing.xs },
  title: { ...type.title, textAlign: 'center' },
  route: { ...type.bodySmall, textAlign: 'center', maxWidth: 300, alignSelf: 'center' },
  bids: { flex: 1, marginVertical: spacing.base },
  bidsContent: { gap: spacing.md, paddingBottom: spacing.base },
  hint: { ...type.caption, textAlign: 'center' },
  terminalActions: { gap: spacing.sm },
}));
