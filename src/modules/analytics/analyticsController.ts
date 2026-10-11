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

export const useGetAnalyticsOverviewManager = ({ enabled = true }: QueryOptions = {}) =>
  useQuery({ ...analyticsQuery<AnalyticsOverview>('overview', '/analytics/overview'), enabled });

export const useGetDriverAnalyticsManager = ({ enabled = true }: QueryOptions = {}) =>
  useQuery({ ...analyticsQuery<DriverAnalyticsRow[]>('drivers', '/analytics/drivers'), enabled });

export const useGetOrderAnalyticsManager = ({ enabled = true }: QueryOptions = {}) =>
  useQuery({ ...analyticsQuery<OrderAnalytics>('orders', '/analytics/orders'), enabled });

export const useGetRevenueAnalyticsManager = ({ enabled = true }: QueryOptions = {}) =>
  useQuery({ ...analyticsQuery<RevenueAnalytics>('revenue', '/analytics/revenue'), enabled });

export const useGetVehicleTypeAnalyticsManager = ({ enabled = true }: QueryOptions = {}) =>
  useQuery({
    ...analyticsQuery<VehicleTypeAnalytics[]>('vehicle-types', '/analytics/vehicle-types'),
    enabled,
  });

export const useGetTopDriversManager = ({
  limit = 10,
  enabled = true,
}: QueryOptions & { limit?: number } = {}) =>
  useQuery({
    ...analyticsQuery<TopDriver[]>('top-drivers', '/analytics/top-drivers', { limit }),
    enabled,
  });

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
