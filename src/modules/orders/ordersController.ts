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
  MarkReadResult,
  Order,
  OrderEta,
  RateOrderVariables,
  RideMessage,
  RideRating,
  SendMessageVariables,
  UnreadCounts,
  UpdateOrderStatusVariables,
} from './ordersTypes';

export const ORDERS_QUERY_KEY = 'orders';

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
    refetchInterval,
  });
};

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

export const useGetUnreadCountsManager = ({
  enabled = true,
  refetchInterval = 60_000,
}: QueryOptions & { refetchInterval?: number | false } = {}) => {
  return useQuery({
    queryKey: [ORDERS_QUERY_KEY, 'unread'],
    queryFn: async () => {
      try {
        const response = await AxiosWithToken.get<ApiResponse<UnreadCounts>>('/orders/unread');
        return response.data.data;
      } catch (error) {
        throw new Error(parseApiError(error));
      }
    },
    enabled,
    refetchInterval,
  });
};

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

export const MarkMessagesReadManager = () => {
  const { callApi, data, response, isLoading, isSuccess, isError, error, reset } = useApiManager<
    MarkReadResult,
    Error,
    { id: string }
  >({
    endpoint: ({ id }) => `/orders/${id}/messages/read`,
    getBody: () => ({}),
    queryKey: [ORDERS_QUERY_KEY, 'unread'],
    method: 'POST',
    showErrorToast: false,
  });

  const markRead = async (id: string) => {
    const result = await callApi({ id });
    return result.data;
  };

  return { markRead, data, response, isLoading, isSuccess, isError, error, reset };
};

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
