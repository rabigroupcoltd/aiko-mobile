import { useQuery } from '@tanstack/react-query';

import AxiosWithToken from '@/constants/api_management/MyHttpHelperWithToken';
import type { ApiResponse, QueryOptions } from '@/modules/shared/apiTypes';
import { parseApiError } from '@/utils/parseApiError';
import type { StorageProviderInfo } from './storageTypes';

export const STORAGE_QUERY_KEY = 'storage';

export const useGetStorageProviderManager = ({ enabled = true }: QueryOptions = {}) => {
  return useQuery({
    queryKey: [STORAGE_QUERY_KEY, 'provider'],
    queryFn: async () => {
      try {
        const response =
          await AxiosWithToken.get<ApiResponse<StorageProviderInfo>>('/storage/provider');
        return response.data.data;
      } catch (error) {
        throw new Error(parseApiError(error));
      }
    },
    enabled,
    staleTime: Infinity,
  });
};
