import { useQuery } from '@tanstack/react-query';
import { useCallback } from 'react';

import Axios from '@/constants/api_management/MyHttpHelper';
import AxiosWithToken from '@/constants/api_management/MyHttpHelperWithToken';
import useApiManager from '@/constants/mainController';
import type { ApiResponse, QueryOptions } from '@/modules/shared/apiTypes';
import { unregisterPushToken } from '@/services/pushNotifications';
import { useAppStore } from '@/store/appStore';
import { useAuthStore } from '@/store/authStore';
import { parseApiError } from '@/utils/parseApiError';
import type {
  AdminSession,
  AuthProfile,
  AuthSession,
  FirebaseSignInPayload,
  LoginPayload,
} from './authTypes';

export const AUTH_QUERY_KEY = 'auth';

export const FirebaseSignInManager = () => {
  const setSession = useAuthStore((state) => state.setSession);

  const { callApi, data, response, isLoading, isSuccess, isError, error, reset } = useApiManager<
    AuthSession,
    Error,
    FirebaseSignInPayload
  >({
    endpoint: '/auth/firebase',
    queryKey: [AUTH_QUERY_KEY, 'onboarding'],
    method: 'POST',
    isAuth: false,
  });

  const signInWithFirebase = async (details: FirebaseSignInPayload) => {
    const result = await callApi(details);

    setSession({
      accessToken: result.data.accessToken,
      user: result.data.user,
      onboarding: result.data.onboarding,
    });

    return result.data;
  };

  return { signInWithFirebase, data, response, isLoading, isSuccess, isError, error, reset };
};

export const AdminLoginManager = () => {
  const setSession = useAuthStore((state) => state.setSession);

  const { callApi, data, response, isLoading, isSuccess, isError, error, reset } = useApiManager<
    AdminSession,
    Error,
    LoginPayload
  >({
    endpoint: '/auth/login',
    queryKey: [AUTH_QUERY_KEY],
    method: 'POST',
    isAuth: false,
  });

  const adminLogin = async (details: LoginPayload) => {
    const result = await callApi(details);

    setSession({
      accessToken: result.data.accessToken,
      user: result.data.user,
      onboarding: result.data.onboarding,
    });

    return result.data;
  };

  return { adminLogin, data, response, isLoading, isSuccess, isError, error, reset };
};

export const useLogoutManager = () => {
  const clearSession = useAuthStore((state) => state.clearSession);
  const clearLocalDrafts = useAppStore((state) => state.clearLocalDrafts);

  const logout = useCallback(async () => {
    await unregisterPushToken();
    clearSession();
    clearLocalDrafts();
  }, [clearSession, clearLocalDrafts]);

  return { logout };
};

export const useGetProfileManager = ({ enabled = true }: QueryOptions = {}) => {
  const accessToken = useAuthStore((state) => state.accessToken);

  return useQuery({
    queryKey: [AUTH_QUERY_KEY, 'profile'],
    queryFn: async () => {
      try {
        const response = await AxiosWithToken.get<ApiResponse<AuthProfile>>('/auth/profile');
        return response.data.data;
      } catch (error) {
        throw new Error(parseApiError(error));
      }
    },
    enabled: enabled && Boolean(accessToken),
  });
};

export const useApiHealthManager = ({ enabled = true }: QueryOptions = {}) => {
  return useQuery({
    queryKey: [AUTH_QUERY_KEY, 'health'],
    queryFn: async () => {
      await Axios.get('/pricing');
      return true;
    },
    enabled,
    retry: false,
    staleTime: 0,
  });
};
