import { useQuery } from '@tanstack/react-query';

import AxiosWithToken from '@/constants/api_management/MyHttpHelperWithToken';
import useApiManager, { omitKeys } from '@/constants/mainController';
import type {
  ApiResponse,
  PaginatedResponse,
  QueryOptions,
} from '@/modules/shared/apiTypes';
import { parseApiError } from '@/utils/parseApiError';
import type {
  CancelOrderVariables,
  CreateOrderPayload,
  ListOrdersParams,
  Order,
  OrderEta,
  RateOrderVariables,
  RideMessage,
  RideRating,
  SendMessageVariables,
  UpdateOrderStatusVariables,
} from './ordersTypes';

export const ORDERS_QUERY_KEY = 'orders';

// ============================================
// QUERY CONTROLLERS
// ============================================

/**
 * Trips, newest first.
 *
 * Non-admins only ever see trips they are on, whichever side they were — the
 * `userId` and `driverId` filters are ignored for them server-side.
 */
export const useGetOrdersManager = ({
  status,
  userId,
  driverId,
  vehicleType,
  limit = 20,
  offset = 0,
  enabled = true,
  refetchInterval,
}: ListOrdersParams & QueryOptions & { refetchInterval?: number | false } = {}) => {
  return useQuery({
    queryKey: [ORDERS_QUERY_KEY, 'list', status, userId, driverId, vehicleType, limit, offset],
    queryFn: async () => {
      try {
        const response = await AxiosWithToken.get<ApiResponse<PaginatedResponse<Order>>>('/orders', {
          params: {
            limit,
            offset,
            ...(status && { status }),
            ...(userId && { userId }),
            ...(driverId && { driverId }),
            ...(vehicleType && { vehicleType }),
          },
        });
        return response.data.data;
      } catch (error) {
        throw new Error(parseApiError(error));
      }
    },
    enabled,
    // Off by default. The driver dashboard sets one as a fallback for a socket
    // that dropped mid-trip; a list screen has no reason to poll.
    refetchInterval,
  });
};

/**
 * One trip.
 *
 * `refetchInterval` is opt-in for the live tracking screen: while a trip is in
 * flight the status changes underneath you, and a client without a socket
 * needs to poll to notice.
 */
export const useGetOrderManager = ({
  id,
  enabled = true,
  refetchInterval,
}: QueryOptions & { id: string | null | undefined; refetchInterval?: number | false }) => {
  return useQuery({
    queryKey: [ORDERS_QUERY_KEY, id],
    queryFn: async () => {
      try {
        const response = await AxiosWithToken.get<ApiResponse<Order>>(`/orders/${id}`);
        return response.data.data;
      } catch (error) {
        throw new Error(parseApiError(error));
      }
    },
    enabled: enabled && Boolean(id),
    refetchInterval,
  });
};

/**
 * When the driver will reach this order.
 *
 * Computed server-side from the driver's whole planned route — a driver carrying
 * two other orders reaches this pickup after whatever the route puts in front of
 * it, and the straight line would promise a time they cannot keep.
 */
export const useGetOrderEtaManager = ({
  id,
  enabled = true,
  refetchInterval,
}: QueryOptions & { id: string | null | undefined; refetchInterval?: number | false }) => {
  return useQuery({
    queryKey: [ORDERS_QUERY_KEY, id, 'eta'],
    queryFn: async () => {
      try {
        const response = await AxiosWithToken.get<ApiResponse<OrderEta>>(`/orders/${id}/eta`);
        return response.data.data;
      } catch (error) {
        throw new Error(parseApiError(error));
      }
    },
    enabled: enabled && Boolean(id),
    refetchInterval,
  });
};

/** The trip chat, oldest first. Participants only. */
export const useGetOrderMessagesManager = ({
  id,
  enabled = true,
  refetchInterval,
}: QueryOptions & { id: string | null | undefined; refetchInterval?: number | false }) => {
  return useQuery({
    queryKey: [ORDERS_QUERY_KEY, id, 'messages'],
    queryFn: async () => {
      try {
        const response = await AxiosWithToken.get<ApiResponse<RideMessage[]>>(
          `/orders/${id}/messages`,
        );
        return response.data.data;
      } catch (error) {
        throw new Error(parseApiError(error));
      }
    },
    enabled: enabled && Boolean(id),
    refetchInterval,
  });
};

// ============================================
// MUTATION CONTROLLERS
// ============================================

/** Books a trip directly, bypassing the bidding flow. */
export const CreateOrderManager = () => {
  const { callApi, data, response, isLoading, isSuccess, isError, error, reset } = useApiManager<
    Order,
    Error,
    CreateOrderPayload
  >({
    endpoint: '/orders',
    queryKey: [ORDERS_QUERY_KEY],
    method: 'POST',
  });

  const createOrder = async (details: CreateOrderPayload) => {
    const result = await callApi(details);
    return result.data;
  };

  return { createOrder, data, response, isLoading, isSuccess, isError, error, reset };
};

/**
 * Driver-side claim on a pending trip.
 *
 * The claim is a conditional update, so exactly one driver wins a race and the
 * losers get a 409 — surface that as "someone else took it", not as an error.
 */
export const AcceptOrderManager = () => {
  const { callApi, data, response, isLoading, isSuccess, isError, error, reset } = useApiManager<
    Order,
    Error,
    { id: string }
  >({
    endpoint: ({ id }) => `/orders/${id}/accept`,
    getBody: () => undefined,
    queryKey: [ORDERS_QUERY_KEY],
    method: 'POST',
  });

  const acceptOrder = async (details: { id: string }) => {
    const result = await callApi(details);
    return result.data;
  };

  return { acceptOrder, data, response, isLoading, isSuccess, isError, error, reset };
};

/**
 * Moves the trip along.
 *
 * Transitions run PENDING → ACCEPTED → ARRIVED → IN_PROGRESS → COMPLETED, and
 * any open state may go to CANCELLED. COMPLETED settles the fare into the
 * driver's wallet, which is why that key is invalidated too.
 */
export const UpdateOrderStatusManager = () => {
  const { callApi, data, response, isLoading, isSuccess, isError, error, reset } = useApiManager<
    Order,
    Error,
    UpdateOrderStatusVariables
  >({
    endpoint: ({ id }) => `/orders/${id}/status`,
    getBody: omitKeys<UpdateOrderStatusVariables>('id'),
    queryKey: [ORDERS_QUERY_KEY, 'wallet', 'drivers'],
    method: 'PATCH',
  });

  const updateOrderStatus = async (details: UpdateOrderStatusVariables) => {
    const result = await callApi(details);
    return result.data;
  };

  return { updateOrderStatus, data, response, isLoading, isSuccess, isError, error, reset };
};

/** Either participant may cancel while the trip is open. */
export const CancelOrderManager = () => {
  const { callApi, data, response, isLoading, isSuccess, isError, error, reset } = useApiManager<
    Order,
    Error,
    CancelOrderVariables
  >({
    endpoint: ({ id }) => `/orders/${id}/cancel`,
    getBody: omitKeys<CancelOrderVariables>('id'),
    queryKey: [ORDERS_QUERY_KEY],
    method: 'POST',
    showSuccessToast: true,
  });

  const cancelOrder = async (details: CancelOrderVariables) => {
    const result = await callApi(details);
    return result.data;
  };

  return { cancelOrder, data, response, isLoading, isSuccess, isError, error, reset };
};

/** Also pushed to the other party over the socket. Closed trips reject these. */
export const SendOrderMessageManager = () => {
  const { callApi, data, response, isLoading, isSuccess, isError, error, reset } = useApiManager<
    RideMessage,
    Error,
    SendMessageVariables
  >({
    endpoint: ({ id }) => `/orders/${id}/messages`,
    getBody: omitKeys<SendMessageVariables>('id'),
    queryKey: [ORDERS_QUERY_KEY],
    method: 'POST',
  });

  const sendMessage = async (details: SendMessageVariables) => {
    const result = await callApi(details);
    return result.data;
  };

  return { sendMessage, data, response, isLoading, isSuccess, isError, error, reset };
};

/** COMPLETED trips only, once per participant. */
export const RateOrderManager = () => {
  const { callApi, data, response, isLoading, isSuccess, isError, error, reset } = useApiManager<
    RideRating,
    Error,
    RateOrderVariables
  >({
    endpoint: ({ id }) => `/orders/${id}/rating`,
    getBody: omitKeys<RateOrderVariables>('id'),
    queryKey: [ORDERS_QUERY_KEY, 'drivers'],
    method: 'POST',
    showSuccessToast: true,
  });

  const rateOrder = async (details: RateOrderVariables) => {
    const result = await callApi(details);
    return result.data;
  };

  return { rateOrder, data, response, isLoading, isSuccess, isError, error, reset };
};
