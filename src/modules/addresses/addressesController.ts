import { useQuery } from '@tanstack/react-query';

import AxiosWithToken from '@/constants/api_management/MyHttpHelperWithToken';
import useApiManager, { omitKeys } from '@/constants/mainController';
import type { ApiResponse, QueryOptions } from '@/modules/shared/apiTypes';
import { parseApiError } from '@/utils/parseApiError';
import type {
  Address,
  AddressSearchResponse,
  CreateAddressPayload,
  DeleteAddressResult,
  SearchAddressParams,
  UpdateAddressVariables,
} from './addressesTypes';

export const ADDRESSES_QUERY_KEY = 'addresses';

/** Below this the server rejects the query, so don't spend the round trip. */
const MIN_SEARCH_LENGTH = 2;

// ============================================
// QUERY CONTROLLERS
// ============================================

/**
 * Cache-first place search.
 *
 * The server checks the caller's saved addresses and the shared place cache
 * before falling back to the Places API, so most keystrokes never leave the
 * database. Results are held for a few minutes because a landmark's
 * coordinates do not move.
 *
 * Debounce `q` at the call site — this fires on every change to it.
 */
export const useSearchAddressesManager = ({
  q,
  lat,
  lng,
  limit = 10,
  enabled = true,
}: Partial<SearchAddressParams> & QueryOptions = {}) => {
  const query = q?.trim() ?? '';

  return useQuery({
    queryKey: [ADDRESSES_QUERY_KEY, 'search', query, lat, lng, limit],
    queryFn: async () => {
      try {
        const response = await AxiosWithToken.get<ApiResponse<AddressSearchResponse>>(
          '/addresses/search',
          {
            params: {
              q: query,
              limit,
              ...(lat !== undefined && { lat }),
              ...(lng !== undefined && { lng }),
            },
          },
        );
        return response.data.data;
      } catch (error) {
        throw new Error(parseApiError(error));
      }
    },
    enabled: enabled && query.length >= MIN_SEARCH_LENGTH,
    staleTime: 5 * 60_000,
  });
};

/** Saved addresses — default first, then newest. */
export const useGetAddressesManager = ({ enabled = true }: QueryOptions = {}) => {
  return useQuery({
    queryKey: [ADDRESSES_QUERY_KEY],
    queryFn: async () => {
      try {
        const response = await AxiosWithToken.get<ApiResponse<Address[]>>('/addresses');
        return response.data.data;
      } catch (error) {
        throw new Error(parseApiError(error));
      }
    },
    enabled,
  });
};

export const useGetAddressManager = ({
  id,
  enabled = true,
}: QueryOptions & { id: string | null | undefined }) => {
  return useQuery({
    queryKey: [ADDRESSES_QUERY_KEY, id],
    queryFn: async () => {
      try {
        const response = await AxiosWithToken.get<ApiResponse<Address>>(`/addresses/${id}`);
        return response.data.data;
      } catch (error) {
        throw new Error(parseApiError(error));
      }
    },
    enabled: enabled && Boolean(id),
  });
};

// ============================================
// MUTATION CONTROLLERS
// ============================================

/** Addresses are unique per user, so saving the same text twice updates it. */
export const CreateAddressManager = () => {
  const { callApi, data, response, isLoading, isSuccess, isError, error, reset } = useApiManager<
    Address,
    Error,
    CreateAddressPayload
  >({
    endpoint: '/addresses',
    queryKey: [ADDRESSES_QUERY_KEY],
    method: 'POST',
    showSuccessToast: true,
  });

  const createAddress = async (details: CreateAddressPayload) => {
    const result = await callApi(details);
    return result.data;
  };

  return { createAddress, data, response, isLoading, isSuccess, isError, error, reset };
};

export const UpdateAddressManager = () => {
  const { callApi, data, response, isLoading, isSuccess, isError, error, reset } = useApiManager<
    Address,
    Error,
    UpdateAddressVariables
  >({
    endpoint: ({ id }) => `/addresses/${id}`,
    getBody: omitKeys<UpdateAddressVariables>('id'),
    queryKey: [ADDRESSES_QUERY_KEY],
    method: 'PATCH',
    showSuccessToast: true,
  });

  const updateAddress = async (details: UpdateAddressVariables) => {
    const result = await callApi(details);
    return result.data;
  };

  return { updateAddress, data, response, isLoading, isSuccess, isError, error, reset };
};

/** Removes the personal row only — the shared place cache is untouched. */
export const DeleteAddressManager = () => {
  const { callApi, data, response, isLoading, isSuccess, isError, error, reset } = useApiManager<
    DeleteAddressResult,
    Error,
    { id: string }
  >({
    endpoint: ({ id }) => `/addresses/${id}`,
    getBody: () => undefined,
    queryKey: [ADDRESSES_QUERY_KEY],
    method: 'DELETE',
    showSuccessToast: true,
  });

  const deleteAddress = async (details: { id: string }) => {
    const result = await callApi(details);
    return result.data;
  };

  return { deleteAddress, data, response, isLoading, isSuccess, isError, error, reset };
};
