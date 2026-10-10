import axios from 'axios';

import { API_BASE_URL, API_TIMEOUT_MS } from '@/config/env';
import { useAuthStore } from '@/store/authStore';
import { createLogger } from '@/utils/logger';

const log = createLogger('http');


const AxiosWithToken = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: API_TIMEOUT_MS,
});

AxiosWithToken.interceptors.request.use(
  async (config) => {

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
