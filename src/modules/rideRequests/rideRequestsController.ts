import { useQuery } from '@tanstack/react-query';

import AxiosWithToken from '@/constants/api_management/MyHttpHelperWithToken';
import useApiManager, { omitKeys } from '@/constants/mainController';
import { ORDERS_QUERY_KEY } from '@/modules/orders/ordersController';
import type { ApiResponse, QueryOptions } from '@/modules/shared/apiTypes';
import { parseApiError } from '@/utils/parseApiError';
import type {
  AcceptDriverResult,
  AcceptDriverVariables,
  CancelRideRequestVariables,
  CreateRideRequestPayload,
  NearbyRideRequest,
  NearbyRideRequestsQuery,
  PlaceBidVariables,
  RideBid,
  RideRequest,
  RideRequestCreated,
  RideRequestWithBids,
} from './rideRequestsTypes';

export const RIDE_REQUESTS_QUERY_KEY = 'ride-requests';

/**
 * REST mirror of the WebSocket matching flow.
 *
 * The socket is the primary path — it pushes bids as they arrive. These exist
 * for clients that cannot hold a socket open, and as the fallback when the
 * connection drops mid-search. Both raise the same server-side events, so a
 * cancel here reaches a driver listening on a socket.
 */

// ============================================
// QUERY CONTROLLERS
// ============================================

/** Requests the caller raised as a passenger, newest first. */
export const useGetMyRideRequestsManager = ({ enabled = true }: QueryOptions = {}) => {
  return useQuery({
    queryKey: [RIDE_REQUESTS_QUERY_KEY, 'mine'],
    queryFn: async () => {
      try {
        const response =
          await AxiosWithToken.get<ApiResponse<RideRequestWithBids[]>>('/ride-requests');
        return response.data.data;
      } catch (error) {
        throw new Error(parseApiError(error));
      }
    },
    enabled,
  });
};

/**
 * A driver's inbox of open offers.
 *
 * Polled rather than cached: a request expires after RIDE_REQUEST_TTL seconds,
 * so a stale inbox shows jobs that are already gone. The socket delivers these
 * live — this is the fallback.
 */
export const useGetDriverInboxManager = ({
  enabled = true,
  refetchInterval = 10_000,
}: QueryOptions & { refetchInterval?: number | false } = {}) => {
  return useQuery({
    queryKey: [RIDE_REQUESTS_QUERY_KEY, 'inbox'],
    queryFn: async () => {
      try {
        const response =
          await AxiosWithToken.get<ApiResponse<RideRequestWithBids[]>>('/ride-requests/inbox');
        return response.data.data;
      } catch (error) {
        throw new Error(parseApiError(error));
      }
    },
    enabled,
    refetchInterval,
    staleTime: 0,
  });
};

/**
 * Open requests around the driver, whether or not they were matched into them.
 *
 * The counterpart to the inbox. Matching only pushes — a request fans out to
 * whoever was online the moment it was raised — so a driver who came online
 * mid-search will not appear in `inbox` for work that is already in flight.
 * This is how they find it.
 *
 * Polled like the inbox, and for the same reason: an offer that has expired is
 * worse than no offer. Pass the driver's live position, not a remembered one.
 */
export const useGetNearbyRideRequestsManager = ({
  lat,
  lng,
  radiusKm,
  limit,
  enabled = true,
  refetchInterval = 10_000,
}: QueryOptions &
  Partial<NearbyRideRequestsQuery> & { refetchInterval?: number | false }) => {
  return useQuery({
    // The position is part of the key: moving invalidates the answer, and two
    // positions must not share one cache entry.
    queryKey: [RIDE_REQUESTS_QUERY_KEY, 'nearby', lat, lng, radiusKm],
    queryFn: async () => {
      try {
        const response = await AxiosWithToken.get<ApiResponse<NearbyRideRequest[]>>(
          '/ride-requests/nearby',
          { params: { lat, lng, radiusKm, limit } },
        );
        return response.data.data;
      } catch (error) {
        throw new Error(parseApiError(error));
      }
    },
    enabled: enabled && lat != null && lng != null,
    refetchInterval,
    staleTime: 0,
  });
};

export const useGetRideRequestManager = ({
  requestId,
  enabled = true,
  refetchInterval,
}: QueryOptions & { requestId: string | null | undefined; refetchInterval?: number | false }) => {
  return useQuery({
    queryKey: [RIDE_REQUESTS_QUERY_KEY, requestId],
    queryFn: async () => {
      try {
        const response = await AxiosWithToken.get<ApiResponse<RideRequestWithBids>>(
          `/ride-requests/${requestId}`,
        );
        return response.data.data;
      } catch (error) {
        throw new Error(parseApiError(error));
      }
    },
    enabled: enabled && Boolean(requestId),
    refetchInterval,
  });
};

// ============================================
// MUTATION CONTROLLERS
// ============================================

/**
 * The caller's still-open request, if they have one.
 *
 * The server allows exactly one per passenger, so creating a second is a 409.
 * This is how a screen recovers from that: the open request is the same search
 * the passenger is trying to start, so it is adopted rather than reported as an
 * error. Not a hook — it runs inside a failed mutation's catch.
 */
export async function findOpenRequest(): Promise<RideRequestWithBids | null> {
  try {
    const response =
      await AxiosWithToken.get<ApiResponse<RideRequestWithBids[]>>('/ride-requests');

    return (
      response.data.data.find(
        (request) =>
          (request.status === 'PENDING' || request.status === 'MATCHED') &&
          new Date(request.expiresAt).getTime() > Date.now(),
      ) ?? null
    );
  } catch {
    // Only ever called on a path that has already failed — reporting a second
    // failure here would replace a useful message with a less useful one.
    return null;
  }
}

/**
 * Asks for a driver. One open request per passenger — a second returns 409.
 */
export const CreateRideRequestManager = () => {
  const { callApi, data, response, isLoading, isSuccess, isError, error, reset } = useApiManager<
    RideRequestCreated,
    Error,
    CreateRideRequestPayload
  >({
    endpoint: '/ride-requests',
    queryKey: [RIDE_REQUESTS_QUERY_KEY],
    method: 'POST',
  });

  const createRideRequest = async (details: CreateRideRequestPayload) => {
    const result = await callApi(details);
    return result.data;
  };

  return { createRideRequest, data, response, isLoading, isSuccess, isError, error, reset };
};

/** Driver-side. Bidding again replaces the previous bid. */
export const PlaceBidManager = () => {
  const { callApi, data, response, isLoading, isSuccess, isError, error, reset } = useApiManager<
    RideBid,
    Error,
    PlaceBidVariables
  >({
    endpoint: ({ requestId }) => `/ride-requests/${requestId}/bids`,
    getBody: omitKeys<PlaceBidVariables>('requestId'),
    queryKey: [RIDE_REQUESTS_QUERY_KEY],
    method: 'POST',
  });

  const placeBid = async (details: PlaceBidVariables) => {
    const result = await callApi(details);
    return result.data;
  };

  return { placeBid, data, response, isLoading, isSuccess, isError, error, reset };
};

/**
 * Passenger-side. Turns the winning bid into a trip and returns the Order.
 *
 * The claim is conditional server-side, so a request that expired or was
 * cancelled mid-flight comes back 409 rather than creating a phantom trip.
 */
export const AcceptDriverManager = () => {
  const { callApi, data, response, isLoading, isSuccess, isError, error, reset } = useApiManager<
    AcceptDriverResult,
    Error,
    AcceptDriverVariables
  >({
    endpoint: ({ requestId }) => `/ride-requests/${requestId}/accept`,
    getBody: omitKeys<AcceptDriverVariables>('requestId'),
    queryKey: [RIDE_REQUESTS_QUERY_KEY, ORDERS_QUERY_KEY],
    method: 'POST',
  });

  const acceptDriver = async (details: AcceptDriverVariables) => {
    const result = await callApi(details);
    return result.data;
  };

  return { acceptDriver, data, response, isLoading, isSuccess, isError, error, reset };
};

/** Calls off the search. Once it is a trip, cancel the order instead. */
export const CancelRideRequestManager = () => {
  const { callApi, data, response, isLoading, isSuccess, isError, error, reset } = useApiManager<
    RideRequest,
    Error,
    CancelRideRequestVariables
  >({
    endpoint: ({ requestId }) => `/ride-requests/${requestId}/cancel`,
    getBody: omitKeys<CancelRideRequestVariables>('requestId'),
    queryKey: [RIDE_REQUESTS_QUERY_KEY],
    method: 'POST',
    showSuccessToast: true,
  });

  const cancelRideRequest = async (details: CancelRideRequestVariables) => {
    const result = await callApi(details);
    return result.data;
  };

  return { cancelRideRequest, data, response, isLoading, isSuccess, isError, error, reset };
};
