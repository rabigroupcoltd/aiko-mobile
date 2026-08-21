import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';

import { MatchingAnimation } from '@/components/booking/MatchingAnimation';
import { BidCard } from '@/components/booking/BidCard';
import { Button, Screen } from '@/components/ui';
import { BOOKING_COPY } from '@/data/copy';
import { useRideEvent } from '@/hooks/useRideSocket';
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
import { makeStyles, spacing } from '@/theme';
import { createLogger } from '@/utils/logger';
import showToast from '@/utils/toast';

const log = createLogger('matching');

type Props = NativeStackScreenProps<PassengerStackParamList, typeof ROUTES.MATCHING>;

/**
 * The live search.
 *
 * Creates a real `RideRequest`, then shows bids as drivers place them. The
 * passenger picks one — nobody is auto-assigned, which is the whole point of
 * the broadcast-and-bid model the backend implements.
 *
 * Two delivery paths run at once by design: the socket pushes each bid the
 * instant it lands, and the request is polled as a fallback for a socket that
 * dropped. Both write to the same react-query cache, so a duplicate is a
 * no-op rather than a doubled entry.
 */
export function MatchingScreen({ navigation, route }: Props) {
  const styles = useStyles();
  const { pickup, dropoff, vehicleType } = route.params;

  const requestId = useBookingStore((s) => s.requestId);
  const setRequestId = useBookingStore((s) => s.setRequestId);
  const setMatchState = useBookingStore((s) => s.setMatchState);
  const confirmBooking = useBookingStore((s) => s.confirmBooking);
  const reset = useBookingStore((s) => s.reset);

  const [stageIndex, setStageIndex] = useState(0);
  const [accepting, setAccepting] = useState<string | null>(null);
  const [failed, setFailed] = useState<string | null>(null);

  const { createRideRequest, isLoading: creating } = CreateRideRequestManager();
  const { acceptDriver } = AcceptDriverManager();
  const { cancelRideRequest } = CancelRideRequestManager();

  /**
   * StrictMode and a re-render both re-run effects; creating the request twice
   * would get the second attempt rejected with "You already have an open ride
   * request" and strand the screen. One request per mount, enforced here.
   */
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

        // The server allows one open request per passenger. Backing out of
        // this screen without cancelling leaves one live, so a second attempt
        // is rejected — adopting it is right, because it is the same search
        // the passenger thinks they are starting.
        const open = await findOpenRequest();
        if (open) {
          setRequestId(open.id);
          setMatchState('searching');
          return;
        }

        setFailed(e?.message ?? 'Could not start the search.');
      }
    })();
    // Intentionally runs once — see the `created` ref above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Polled slowly. The socket is what makes bids feel instant; this only has to
   * catch a client whose socket dropped, and the request expires after 120s
   * anyway so there is little to miss.
   */
  const { data: request, refetch } = useGetRideRequestManager({
    requestId,
    refetchInterval: 5_000,
  });

  const bids = (request?.bids ?? []) as RideBidWithDriver[];
  const expired = request?.status === 'EXPIRED';
  const cancelled = request?.status === 'CANCELLED';

  // Every socket event here means the same thing — the request changed — so
  // they all resolve to one refetch rather than patching the cache by hand.
  useRideEvent('driver-bid-placed', () => void refetch(), Boolean(requestId));
  useRideEvent('ride-request-expired', () => void refetch(), Boolean(requestId));

  // The stage copy is a progress indication, not a simulation of work: the
  // search really is running server-side for RIDE_REQUEST_TTL seconds.
  useEffect(() => {
    if (bids.length > 0 || failed) return;

    const timer = setInterval(
      () => setStageIndex((index) => Math.min(index + 1, BOOKING_COPY.matchingStages.length - 1)),
      4_000,
    );
    return () => clearInterval(timer);
  }, [bids.length, failed]);

  useEffect(() => {
    if (bids.length > 0) setMatchState('matched');
  }, [bids.length, setMatchState]);

  const handleAccept = useCallback(
    async (bid: RideBidWithDriver) => {
      if (!requestId || accepting) return;
      setAccepting(bid.driverId);

      try {
        const order = await acceptDriver({ requestId, driverId: bid.driverId });
        confirmBooking(order.id);
        navigation.replace(ROUTES.RIDER_FOUND, { orderId: order.id });
      } catch (e: any) {
        // Losing the race is normal — the request may have expired, or the
        // driver may have withdrawn. Refetching shows the passenger why.
        showToast.error(e?.message ?? 'Could not book that driver.');
        setAccepting(null);
        void refetch();
      }
    },
    [requestId, accepting, acceptDriver, confirmBooking, navigation, refetch],
  );

  const handleCancel = useCallback(() => {
    Alert.alert('Stop looking?', 'Your request will be withdrawn.', [
      { text: 'Keep looking', style: 'cancel' },
      {
        text: 'Stop',
        style: 'destructive',
        onPress: async () => {
          // Cancelled server-side so matched drivers stop showing the offer;
          // failure is not worth blocking on, since it expires by itself.
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

  // ------------------------------------------------------------- terminal

  if (failed || expired || cancelled) {
    const message = failed
      ? failed
      : expired
        ? 'No driver accepted your request in time.'
        : 'This request was cancelled.';

    return (
      <Screen>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>No luck this time</Text>
            <Text style={styles.route}>{message}</Text>
          </View>
          <View style={styles.terminalActions}>
            <Button label="Try again" onPress={goHome} />
          </View>
        </View>
      </Screen>
    );
  }

  // -------------------------------------------------------------- searching

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {bids.length > 0 ? 'Choose your driver' : 'Finding you a rider'}
          </Text>
          <Text style={styles.route} numberOfLines={2}>
            {pickup.name} → {dropoff.name}
          </Text>
        </View>

        {bids.length === 0 ? (
          <MatchingAnimation stages={BOOKING_COPY.matchingStages} stageIndex={stageIndex} />
        ) : (
          <ScrollView
            style={styles.bids}
            contentContainerStyle={styles.bidsContent}
            showsVerticalScrollIndicator={false}>
            {bids.map((bid) => (
              <BidCard
                key={bid.id}
                bid={bid}
                onAccept={() => handleAccept(bid)}
                accepting={accepting === bid.driverId}
                // One accept at a time — two in flight would race for a
                // request only one of them can claim.
                disabled={Boolean(accepting) && accepting !== bid.driverId}
              />
            ))}
          </ScrollView>
        )}

        <Button
          label={creating ? 'Starting…' : 'Cancel'}
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
  terminalActions: { gap: spacing.sm },
}));
