import { useQuery } from '@tanstack/react-query';

import AxiosWithToken from '@/constants/api_management/MyHttpHelperWithToken';
import useApiManager from '@/constants/mainController';
import type { ApiResponse, QueryOptions } from '@/modules/shared/apiTypes';
import { useAuthStore } from '@/store/authStore';
import { parseApiError } from '@/utils/parseApiError';
import type { OnboardingState, UpdateOnboardingPayload } from './onboardingTypes';

export const ONBOARDING_QUERY_KEY = 'onboarding';

// ============================================
// QUERY CONTROLLERS
// ============================================

/**
 * Where the user left off.
 *
 * `resumeStep` is computed from what has been saved, not from a counter, so it
 * stays correct after a crash mid-step or a field cleared later. Send the user
 * there; `DONE` means the dashboard.
 */
export const useGetOnboardingManager = ({ enabled = true }: QueryOptions = {}) => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const setOnboarding = useAuthStore((state) => state.setOnboarding);

  return useQuery({
    queryKey: [ONBOARDING_QUERY_KEY],
    queryFn: async () => {
      try {
        const response = await AxiosWithToken.get<ApiResponse<OnboardingState>>('/onboarding');
        // Cached so the navigator can resolve a route on a cold start, before
        // this query has had a chance to settle.
        setOnboarding(response.data.data);
        return response.data.data;
      } catch (error) {
        throw new Error(parseApiError(error));
      }
    },
    enabled: enabled && Boolean(accessToken),
  });
};

// ============================================
// MUTATION CONTROLLERS
// ============================================

/**
 * Saves a completed step.
 *
 * One manager for every screen — pass only what that screen captured, and the
 * response carries the recomputed state, so a client never decides for itself
 * where to go next.
 *
 * Note the rider tail is not driven from here: RIDER_DOCS clears by registering
 * a vehicle through the drivers module, and AWAITING_APPROVAL clears when an
 * admin approves the KYC.
 */
export const UpdateOnboardingManager = () => {
  const setOnboarding = useAuthStore((state) => state.setOnboarding);

  const { callApi, data, response, isLoading, isSuccess, isError, error, reset } = useApiManager<
    OnboardingState,
    Error,
    UpdateOnboardingPayload
  >({
    endpoint: '/onboarding',
    queryKey: [ONBOARDING_QUERY_KEY, 'auth'],
    method: 'PATCH',
  });

  const updateOnboarding = async (details: UpdateOnboardingPayload) => {
    const result = await callApi(details);
    setOnboarding(result.data);
    return result.data;
  };

  return { updateOnboarding, data, response, isLoading, isSuccess, isError, error, reset };
};

// ============================================
// HELPERS
// ============================================

/**
 * Reads the cached onboarding state without firing a request.
 *
 * For the navigator, which has to pick a branch on the very first render —
 * before any query could have resolved.
 */
export const useOnboardingState = (): OnboardingState | null =>
  useAuthStore((state) => state.onboarding);
