import { useQuery } from '@tanstack/react-query';

import AxiosWithToken from '@/constants/api_management/MyHttpHelperWithToken';
import useApiManager, { omitKeys } from '@/constants/mainController';
import type { ApiResponse, QueryOptions } from '@/modules/shared/apiTypes';
import { parseApiError } from '@/utils/parseApiError';
import type { UpdateUserVariables, User } from './usersTypes';

export const USERS_QUERY_KEY = 'users';

export const useGetUsersManager = ({ enabled = true }: QueryOptions = {}) => {
  return useQuery({
    queryKey: [USERS_QUERY_KEY],
    queryFn: async () => {
      try {
        const response = await AxiosWithToken.get<ApiResponse<User[]>>('/users');
        return response.data.data;
      } catch (error) {
        throw new Error(parseApiError(error));
      }
    },
    enabled,
  });
};

export const useGetUserManager = ({
  id,
  enabled = true,
}: QueryOptions & { id: string | null | undefined }) => {
  return useQuery({
    queryKey: [USERS_QUERY_KEY, id],
    queryFn: async () => {
      try {
        const response = await AxiosWithToken.get<ApiResponse<User>>(`/users/${id}`);
        return response.data.data;
      } catch (error) {
        throw new Error(parseApiError(error));
      }
    },
    enabled: enabled && Boolean(id),
  });
};

export const UpdateUserManager = () => {
  const { callApi, data, response, isLoading, isSuccess, isError, error, reset } = useApiManager<
    User,
    Error,
    UpdateUserVariables
  >({
    endpoint: ({ id }) => `/users/${id}`,
    getBody: omitKeys<UpdateUserVariables>('id'),
    queryKey: [USERS_QUERY_KEY, 'auth'],
    method: 'PATCH',
    showSuccessToast: true,
  });

  const updateUser = async (details: UpdateUserVariables) => {
    const result = await callApi(details);
    return result.data;
  };

  return { updateUser, data, response, isLoading, isSuccess, isError, error, reset };
};
