import { QueryClient } from '@tanstack/react-query';

/**
 * One client for the app.
 *
 * The defaults are tuned for a phone on mobile data rather than a desktop
 * browser: a short freshness window so screens do not refetch on every focus,
 * and no retry on a 4xx, which will fail again identically and only costs the
 * user another round trip on a metered connection.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: (failureCount, error) => {
        const status = (error as { response?: { status?: number } })?.response?.status;
        if (status && status >= 400 && status < 500) return false;
        return failureCount < 2;
      },
      // React Native has no window focus; the equivalent is handled per screen
      // with `refetch()` on navigation focus where it actually matters.
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      // A write that failed should surface, not silently replay.
      retry: false,
    },
  },
});
