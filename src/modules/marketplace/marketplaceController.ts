import { useQuery } from '@tanstack/react-query';

import AxiosWithToken from '@/constants/api_management/MyHttpHelperWithToken';
import useApiManager from '@/constants/mainController';
import { ORDERS_QUERY_KEY } from '@/modules/orders/ordersController';
import type { ApiResponse, QueryOptions } from '@/modules/shared/apiTypes';
import { parseApiError } from '@/utils/parseApiError';
import type {
  ActiveOrdersResponse,
  MarketplaceConfig,
  MarketplaceGrid,
  MarketplaceQuery,
  ReserveOrderResult,
  SkippedOrderAction,
} from './marketplaceTypes';

export const MARKETPLACE_QUERY_KEY = 'marketplace';

export const useGetMarketplaceConfigManager = ({ enabled = true }: QueryOptions = {}) => {
  return useQuery({
    queryKey: [MARKETPLACE_QUERY_KEY, 'config'],
    queryFn: async () => {
      try {
        const response =
          await AxiosWithToken.get<ApiResponse<MarketplaceConfig>>('/marketplace/config');
        return response.data.data;
      } catch (error) {
        throw new Error(parseApiError(error));
      }
    },
    enabled,
    staleTime: 30 * 60_000,
  });
};

export const useGetAvailableOrdersManager = ({
  lat,
  lng,
  radiusKm,
  limit,
  enabled = true,
  refetchInterval = 15_000,
}: QueryOptions & MarketplaceQuery & { refetchInterval?: number | false } = {}) => {
  return useQuery({
    queryKey: [MARKETPLACE_QUERY_KEY, 'orders', roundKey(lat), roundKey(lng), radiusKm],
    queryFn: async () => {
      try {
        const response = await AxiosWithToken.get<ApiResponse<MarketplaceGrid>>(
          '/marketplace/orders',
          { params: { lat, lng, radiusKm, limit } },
        );
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

export const useGetActiveOrdersManager = ({
  enabled = true,
  refetchInterval = 20_000,
}: QueryOptions & { refetchInterval?: number | false } = {}) => {
  return useQuery({
    queryKey: [MARKETPLACE_QUERY_KEY, 'active'],
    queryFn: async () => {
      try {
        const response =
          await AxiosWithToken.get<ApiResponse<ActiveOrdersResponse>>('/marketplace/active');
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

export const useGetSkippedOrdersManager = ({ enabled = true }: QueryOptions = {}) => {
  return useQuery({
    queryKey: [MARKETPLACE_QUERY_KEY, 'skipped'],
    queryFn: async () => {
      try {
        const response =
          await AxiosWithToken.get<ApiResponse<SkippedOrderAction[]>>('/marketplace/skipped');
        return response.data.data;
      } catch (error) {
        throw new Error(parseApiError(error));
      }
    },
    enabled,
  });
};

export const ReserveOrderManager = () => {
  const { callApi, data, response, isLoading, isSuccess, isError, error, reset } = useApiManager<
    ReserveOrderResult,
    Error,
    { orderId: string }
  >({
    endpoint: ({ orderId }) => `/marketplace/orders/${orderId}/reserve`,
    getBody: () => undefined,
    queryKey: [MARKETPLACE_QUERY_KEY, ORDERS_QUERY_KEY, 'drivers'],
    method: 'POST',
    showErrorToast: false,
  });

  const reserveOrder = async (details: { orderId: string }) => {
    const result = await callApi(details);
    return result.data;
  };

  return { reserveOrder, data, response, isLoading, isSuccess, isError, error, reset };
};

export const SkipOrderManager = () => {
  const { callApi, data, response, isLoading, isSuccess, isError, error, reset } = useApiManager<
    { orderId: string; skipped: boolean; hiddenUntil: string | null },
    Error,
    { orderId: string }
  >({
    endpoint: ({ orderId }) => `/marketplace/orders/${orderId}/skip`,
    getBody: () => undefined,
    queryKey: [MARKETPLACE_QUERY_KEY],
    method: 'POST',
    showErrorToast: false,
  });

  const skipOrder = async (details: { orderId: string }) => {
    const result = await callApi(details);
    return result.data;
  };

  return { skipOrder, data, response, isLoading, isSuccess, isError, error, reset };
};

function roundKey(value?: number): number | undefined {
  return value == null ? undefined : Math.round(value * 10_000) / 10_000;
}
