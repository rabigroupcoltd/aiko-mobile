import axios from 'axios';

import { API_BASE_URL, API_TIMEOUT_MS } from '@/config/env';
import { useAuthStore } from '@/store/authStore';
import { createLogger } from '@/utils/logger';

const log = createLogger('http');

/**
 * Authenticated axios instance — attaches the bearer token from the auth store.
 *
 * The token is read per request rather than captured once, so signing out or
 * refreshing mid-session takes effect on the very next call.
 */
const AxiosWithToken = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: API_TIMEOUT_MS,
});

AxiosWithToken.interceptors.request.use(
  async (config) => {
    // On a cold start a screen can fire a query before AsyncStorage has
    // rehydrated, which would send the request without a token and get a 401
    // for a user who is in fact signed in. Waiting for hydration is the whole
    // reason this interceptor is async.
    if (!useAuthStore.getState()._hasHydrated) {
      await waitForHydration();
    }

    const token = useAuthStore.getState().accessToken;
    if (token) config.headers.Authorization = `Bearer ${token}`;
    else log.warn(`No access token for ${config.method?.toUpperCase()} ${config.url}`);

    return config;
  },
  (error) => Promise.reject(error),
);

AxiosWithToken.interceptors.response.use(
  (response) => response,
  (error) => {
    // The session is dead — drop it so the navigator falls back to the auth
    // stack on its next render. Deliberately no imperative navigation here:
    // routing in this app is derived from state, never pushed.
    if (error.response?.status === 401) {
      log.warn('401 — clearing session');
      useAuthStore.getState().clearSession();
    }

    return Promise.reject(error);
  },
);

/** Resolves once the store reports hydration, or after a short grace period. */
const HYDRATION_TIMEOUT_MS = 2000;

function waitForHydration(): Promise<void> {
  return new Promise((resolve) => {
    // Never leave a request hanging on a rehydrate that failed silently — a
    // request without a token is recoverable, a request that never fires is not.
    const timer = setTimeout(() => {
      unsubscribe();
      log.warn('Timed out waiting for auth rehydration');
      resolve();
    }, HYDRATION_TIMEOUT_MS);

    const unsubscribe = useAuthStore.subscribe((state) => {
      if (!state._hasHydrated) return;
      clearTimeout(timer);
      unsubscribe();
      resolve();
    });
  });
}

export default AxiosWithToken;
