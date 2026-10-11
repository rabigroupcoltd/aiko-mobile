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
    return null;
  }
}

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
