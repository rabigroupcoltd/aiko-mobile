import { useQuery } from '@tanstack/react-query';

import AxiosWithToken from '@/constants/api_management/MyHttpHelperWithToken';
import type { ApiResponse, QueryOptions } from '@/modules/shared/apiTypes';
import { parseApiError } from '@/utils/parseApiError';
import type {
  AnalyticsOverview,
  DriverAnalyticsRow,
  LowPerformingDriver,
  OrderAnalytics,
  RevenueAnalytics,
  TopDriver,
  VehicleTypeAnalytics,
} from './analyticsTypes';

export const ANALYTICS_QUERY_KEY = 'analytics';

/**
 * Admin-only reporting, included for parity with the API surface.
 *
 * The passenger and rider app has no screen for any of this and will get 403 —
 * a driver's own figures live in the drivers module. These are here so an admin
 * build, or a dashboard sharing this layer, has them without a second client.
 *
 * Everything is held for a minute: these are aggregates over the whole
 * platform, and refetching them on every mount is a heavy query for a number
 * that barely moves.
 */
const ANALYTICS_STALE_TIME = 60_000;

function analyticsQuery<TData>(key: string, path: string, params?: Record<string, unknown>) {
  return {
    queryKey: [ANALYTICS_QUERY_KEY, key, ...(params ? [params] : [])],
    queryFn: async () => {
      try {
        const response = await AxiosWithToken.get<ApiResponse<TData>>(path, { params });
        return response.data.data;
      } catch (error) {
        throw new Error(parseApiError(error));
      }
    },
    staleTime: ANALYTICS_STALE_TIME,
  };
}

// ============================================
// QUERY CONTROLLERS
// ============================================

/** Counts, revenue split by payment method, platform earnings, driver debt. */
export const useGetAnalyticsOverviewManager = ({ enabled = true }: QueryOptions = {}) =>
  useQuery({ ...analyticsQuery<AnalyticsOverview>('overview', '/analytics/overview'), enabled });

/** One row per driver, with lifetime earnings and rates. */
export const useGetDriverAnalyticsManager = ({ enabled = true }: QueryOptions = {}) =>
  useQuery({ ...analyticsQuery<DriverAnalyticsRow[]>('drivers', '/analytics/drivers'), enabled });

/** Today, this week, this month, plus all-time totals. */
export const useGetOrderAnalyticsManager = ({ enabled = true }: QueryOptions = {}) =>
  useQuery({ ...analyticsQuery<OrderAnalytics>('orders', '/analytics/orders'), enabled });

/** Daily revenue for the last 30 days. */
export const useGetRevenueAnalyticsManager = ({ enabled = true }: QueryOptions = {}) =>
  useQuery({ ...analyticsQuery<RevenueAnalytics>('revenue', '/analytics/revenue'), enabled });

/** Demand broken down by vehicle type. */
export const useGetVehicleTypeAnalyticsManager = ({ enabled = true }: QueryOptions = {}) =>
  useQuery({
    ...analyticsQuery<VehicleTypeAnalytics[]>('vehicle-types', '/analytics/vehicle-types'),
    enabled,
  });

/** Busiest drivers, by lifetime trip count. */
export const useGetTopDriversManager = ({
  limit = 10,
  enabled = true,
}: QueryOptions & { limit?: number } = {}) =>
  useQuery({
    ...analyticsQuery<TopDriver[]>('top-drivers', '/analytics/top-drivers', { limit }),
    enabled,
  });

/** Lowest-rated drivers with at least one trip. */
export const useGetLowPerformingDriversManager = ({
  limit = 10,
  enabled = true,
}: QueryOptions & { limit?: number } = {}) =>
  useQuery({
    ...analyticsQuery<LowPerformingDriver[]>('low-performers', '/analytics/low-performers', {
      limit,
    }),
    enabled,
  });
