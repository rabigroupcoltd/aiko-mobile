import { useQuery } from '@tanstack/react-query';

import Axios from '@/constants/api_management/MyHttpHelper';
import AxiosWithToken from '@/constants/api_management/MyHttpHelperWithToken';
import useApiManager, { omitKeys } from '@/constants/mainController';
import type { ApiResponse, QueryOptions, VehicleType } from '@/modules/shared/apiTypes';
import { parseApiError } from '@/utils/parseApiError';
import type {
  FareEstimateAllPayload,
  FareEstimatePayload,
  FareQuote,
  PricingRule,
  UpdatePricingRuleVariables,
  UpsertPricingRuleVariables,
} from './pricingTypes';

export const PRICING_QUERY_KEY = 'pricing';

// ============================================
// QUERY CONTROLLERS
// ============================================

/**
 * The rate cards. Public, so the booking screen can render them before sign-in.
 *
 * Held fresh for five minutes — pricing changes are an admin action, not
 * something worth refetching on every mount.
 */
export const useGetPricingRulesManager = ({
  activeOnly = false,
  enabled = true,
}: QueryOptions & { activeOnly?: boolean } = {}) => {
  return useQuery({
    queryKey: [PRICING_QUERY_KEY, 'list', activeOnly],
    queryFn: async () => {
      try {
        const response = await Axios.get<ApiResponse<PricingRule[]>>('/pricing', {
          params: activeOnly ? { activeOnly: 'true' } : undefined,
        });
        return response.data.data;
      } catch (error) {
        throw new Error(parseApiError(error));
      }
    },
    enabled,
    staleTime: 5 * 60_000,
  });
};

export const useGetPricingRuleManager = ({
  vehicleType,
  enabled = true,
}: QueryOptions & { vehicleType: VehicleType | null | undefined }) => {
  return useQuery({
    queryKey: [PRICING_QUERY_KEY, vehicleType],
    queryFn: async () => {
      try {
        const response = await Axios.get<ApiResponse<PricingRule>>(`/pricing/${vehicleType}`);
        return response.data.data;
      } catch (error) {
        throw new Error(parseApiError(error));
      }
    },
    enabled: enabled && Boolean(vehicleType),
    staleTime: 5 * 60_000,
  });
};

/**
 * Quotes a route as a query rather than a mutation.
 *
 * It is a POST because the coordinates go in a body, but it is a pure read —
 * modelling it as a query means the ride picker gets caching and automatic
 * refetch when the route changes, instead of firing a mutation per keystroke.
 */
export const useGetFareEstimateManager = ({
  vehicleType,
  pickupLat,
  pickupLng,
  dropoffLat,
  dropoffLng,
  enabled = true,
}: Partial<FareEstimatePayload> & QueryOptions) => {
  const hasRoute =
    pickupLat !== undefined &&
    pickupLng !== undefined &&
    dropoffLat !== undefined &&
    dropoffLng !== undefined;

  return useQuery({
    queryKey: [PRICING_QUERY_KEY, 'estimate', vehicleType, pickupLat, pickupLng, dropoffLat, dropoffLng],
    queryFn: async () => {
      try {
        const response = await AxiosWithToken.post<ApiResponse<FareQuote>>('/pricing/estimate', {
          vehicleType,
          pickupLat,
          pickupLng,
          dropoffLat,
          dropoffLng,
        });
        return response.data.data;
      } catch (error) {
        throw new Error(parseApiError(error));
      }
    },
    enabled: enabled && hasRoute && Boolean(vehicleType),
  });
};

/** One quote per active vehicle type for the same route — the ride picker. */
export const useGetAllFareEstimatesManager = ({
  vehicleType = 'TRICYCLE',
  pickupLat,
  pickupLng,
  dropoffLat,
  dropoffLng,
  enabled = true,
}: Partial<FareEstimateAllPayload> & QueryOptions) => {
  const hasRoute =
    pickupLat !== undefined &&
    pickupLng !== undefined &&
    dropoffLat !== undefined &&
    dropoffLng !== undefined;

  return useQuery({
    queryKey: [PRICING_QUERY_KEY, 'estimate-all', pickupLat, pickupLng, dropoffLat, dropoffLng],
    queryFn: async () => {
      try {
        const response = await AxiosWithToken.post<ApiResponse<FareQuote[]>>(
          '/pricing/estimate/all',
          // vehicleType is ignored by this endpoint but the DTO still demands
          // one, so a placeholder is sent rather than failing validation.
          { vehicleType, pickupLat, pickupLng, dropoffLat, dropoffLng },
        );
        return response.data.data;
      } catch (error) {
        throw new Error(parseApiError(error));
      }
    },
    enabled: enabled && hasRoute,
  });
};

// ============================================
// ADMIN MUTATION CONTROLLERS
// ============================================

/** Full replacement. Past trips keep their frozen snapshot and are unaffected. */
export const UpsertPricingRuleManager = () => {
  const { callApi, data, response, isLoading, isSuccess, isError, error, reset } = useApiManager<
    PricingRule,
    Error,
    UpsertPricingRuleVariables
  >({
    endpoint: ({ vehicleType }) => `/pricing/${vehicleType}`,
    getBody: omitKeys<UpsertPricingRuleVariables>('vehicleType'),
    queryKey: [PRICING_QUERY_KEY],
    method: 'PUT',
    showSuccessToast: true,
  });

  const upsertPricingRule = async (details: UpsertPricingRuleVariables) => {
    const result = await callApi(details);
    return result.data;
  };

  return { upsertPricingRule, data, response, isLoading, isSuccess, isError, error, reset };
};

/** Partial update — send only the fields that change. */
export const UpdatePricingRuleManager = () => {
  const { callApi, data, response, isLoading, isSuccess, isError, error, reset } = useApiManager<
    PricingRule,
    Error,
    UpdatePricingRuleVariables
  >({
    endpoint: ({ vehicleType }) => `/pricing/${vehicleType}`,
    getBody: omitKeys<UpdatePricingRuleVariables>('vehicleType'),
    queryKey: [PRICING_QUERY_KEY],
    method: 'PATCH',
    showSuccessToast: true,
  });

  const updatePricingRule = async (details: UpdatePricingRuleVariables) => {
    const result = await callApi(details);
    return result.data;
  };

  return { updatePricingRule, data, response, isLoading, isSuccess, isError, error, reset };
};
