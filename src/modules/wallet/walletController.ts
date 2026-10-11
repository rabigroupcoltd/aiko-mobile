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
  DriverWallet,
  LedgerTransaction,
  ListTransactionsVariables,
  WithdrawVariables,
} from './walletTypes';

export const WALLET_QUERY_KEY = 'wallet';

export const useGetWalletManager = ({
  driverId,
  enabled = true,
}: QueryOptions & { driverId: string | null | undefined }) => {
  return useQuery({
    queryKey: [WALLET_QUERY_KEY, driverId],
    queryFn: async () => {
      try {
        const response = await AxiosWithToken.get<ApiResponse<DriverWallet>>(
          `/wallet/driver/${driverId}`,
        );
        return response.data.data;
      } catch (error) {
        throw new Error(parseApiError(error));
      }
    },
    enabled: enabled && Boolean(driverId),
  });
};

export const useGetTransactionsManager = ({
  driverId,
  limit = 50,
  offset = 0,
  enabled = true,
}: Partial<ListTransactionsVariables> & QueryOptions) => {
  return useQuery({
    queryKey: [WALLET_QUERY_KEY, driverId, 'transactions', limit, offset],
    queryFn: async () => {
      try {
        const response = await AxiosWithToken.get<
          ApiResponse<PaginatedResponse<LedgerTransaction>>
        >(`/wallet/driver/${driverId}/transactions`, { params: { limit, offset } });
        return response.data.data;
      } catch (error) {
        throw new Error(parseApiError(error));
      }
    },
    enabled: enabled && Boolean(driverId),
  });
};

export const useGetAllWalletsManager = ({ enabled = true }: QueryOptions = {}) => {
  return useQuery({
    queryKey: [WALLET_QUERY_KEY, 'all'],
    queryFn: async () => {
      try {
        const response = await AxiosWithToken.get<ApiResponse<DriverWallet[]>>('/wallet/all');
        return response.data.data;
      } catch (error) {
        throw new Error(parseApiError(error));
      }
    },
    enabled,
  });
};

export const WithdrawManager = () => {
  const { callApi, data, response, isLoading, isSuccess, isError, error, reset } = useApiManager<
    DriverWallet,
    Error,
    WithdrawVariables
  >({
    endpoint: ({ driverId }) => `/wallet/driver/${driverId}/withdraw`,
    getBody: omitKeys<WithdrawVariables>('driverId'),
    queryKey: [WALLET_QUERY_KEY, 'drivers'],
    method: 'POST',
    showSuccessToast: true,
  });

  const withdraw = async (details: WithdrawVariables) => {
    const result = await callApi(details);
    return result.data;
  };

  return { withdraw, data, response, isLoading, isSuccess, isError, error, reset };
};
