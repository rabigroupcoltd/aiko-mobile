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

const MIN_SEARCH_LENGTH = 2;

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
