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

// ============================================
// MUTATION CONTROLLERS
// ============================================

/**
 * The app's only way in.
 *
 * Sign-up and sign-in are the same call — the server finds or creates the
 * account behind the token and reports which happened via `isNewUser`. The
 * session is written to the auth store here rather than at every call site, so
 * the token is available to the next request whatever screen triggered this.
 *
 * Navigate on `onboarding.resumeStep`, not on `isNewUser`: a user who
 * abandoned setup halfway is a returning user who still owes steps.
 */
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

/** Password sign-in for staff. App accounts have no password to check. */
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

/**
 * Ends the session locally.
 *
 * There is no server-side logout — the token is stateless and expires on its
 * own — so this only has to forget it. Firebase sign-out is the caller's job,
 * since not every consumer wants the Google session dropped too.
 *
 * The one thing it cannot leave until afterwards is dropping the push
 * registration: that request is authenticated by the very token being cleared,
 * so it has to go first or the next person to sign in on this handset inherits
 * the previous user's notifications. It is awaited but never allowed to fail
 * the logout — being unable to reach the server is not a reason to keep someone
 * signed in.
 *
 * Local capture drafts are cleared too — a license photo or chosen vehicle
 * type left in `appStore` must not silently attach itself to whoever signs
 * in next on this device.
 */
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

// ============================================
// QUERY CONTROLLERS
// ============================================

/** The signed-in user, their driver profile if any, and onboarding state. */
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
    // Without a token this can only 401, and a failed query would put the UI
    // into an error state that is really just "not signed in yet".
    enabled: enabled && Boolean(accessToken),
  });
};

/**
 * Whether the API is reachable, using a public endpoint.
 *
 * Useful on a splash or retry screen: it distinguishes "the server is down"
 * from "this user is signed out", which a 401 alone cannot.
 */
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
