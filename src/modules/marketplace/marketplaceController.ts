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

/**
 * The driver's order marketplace.
 *
 * The socket is what makes new orders appear — `order-available` lands and the
 * screen refetches. These queries are the fallback for a dropped connection and
 * the source of the per-driver compatibility scores, which the broadcast cannot
 * carry because they depend on where this driver is and what they hold.
 */

// ============================================
// QUERY CONTROLLERS
// ============================================

/**
 * Dispatch limits, straight from the server.
 *
 * Fetched rather than hard-coded: "2 / 3 orders" is a number the backend
 * enforces, and a client-side copy would eventually disagree with the limit that
 * actually rejects the reservation.
 */
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
    // Changes only on a deploy.
    staleTime: 30 * 60_000,
  });
};

/**
 * Available orders, best route match first.
 *
 * Position is part of the query key: moving changes which orders are near and
 * how well each one fits, so two positions must not share a cache entry.
 */
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
    // Slower than the old 10s inbox poll: the socket carries new orders, and the
    // grid costs a compatibility pass per order server-side.
    refetchInterval,
    staleTime: 0,
  });
};

/** Everything the driver is holding, plus the route across all of it. */
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

/** Skip history, newest first. */
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

// ============================================
// MUTATION CONTROLLERS
// ============================================

/**
 * Claim an order.
 *
 * Losing a race is normal and expected — the server answers 409
 * ORDER_ALREADY_RESERVED — so the error toast is suppressed here and the call
 * site decides what to say. Capacity is rejected as
 * MAX_ORDER_CAPACITY_REACHED.
 */
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

/**
 * Drop an order from this driver's grid.
 *
 * Not a cancellation: the order stays open and every other driver still sees it.
 */
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

/**
 * Position rounded to ~11 m before it enters a cache key.
 *
 * GPS jitters on every fix. Keying on the raw float would mint a fresh cache
 * entry for a driver standing still, which turns the poll into a request per
 * fix — the opposite of what §47 asks for.
 */
function roundKey(value?: number): number | undefined {
  return value == null ? undefined : Math.round(value * 10_000) / 10_000;
}
