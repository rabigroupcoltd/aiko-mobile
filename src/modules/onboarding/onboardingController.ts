import { useQuery } from '@tanstack/react-query';

import AxiosWithToken from '@/constants/api_management/MyHttpHelperWithToken';
import useApiManager from '@/constants/mainController';
import type { ApiResponse, QueryOptions } from '@/modules/shared/apiTypes';
import { useAuthStore } from '@/store/authStore';
import { parseApiError } from '@/utils/parseApiError';
import type { AccountType } from '@/modules/shared/apiTypes';
import type { OnboardingState, UpdateOnboardingPayload } from './onboardingTypes';

export const ONBOARDING_QUERY_KEY = 'onboarding';

export const useGetOnboardingManager = ({ enabled = true }: QueryOptions = {}) => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const setOnboarding = useAuthStore((state) => state.setOnboarding);

  return useQuery({
    queryKey: [ONBOARDING_QUERY_KEY],
    queryFn: async () => {
      try {
        const response = await AxiosWithToken.get<ApiResponse<OnboardingState>>('/onboarding');
        setOnboarding(response.data.data);
        return response.data.data;
      } catch (error) {
        throw new Error(parseApiError(error));
      }
    },
    enabled: enabled && Boolean(accessToken),
  });
};

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

export interface OnboardingPhotoFile {
  uri: string;
  name: string;
  type: string;
}

export const UploadOnboardingPhotoManager = () => {
  const setOnboarding = useAuthStore((state) => state.setOnboarding);

  const { callApi, data, response, isLoading, isSuccess, isError, error, reset } = useApiManager<
    OnboardingState,
    Error,
    OnboardingPhotoFile
  >({
    endpoint: '/onboarding/photo',
    getBody: (photo) => {
      const form = new FormData();
      form.append('photo', photo as unknown as Blob);
      return form;
    },
    contentType: null,
    queryKey: [ONBOARDING_QUERY_KEY, 'auth'],
    method: 'POST',
    // The selfie screen shows the error beside the photo, with a retry.
    showErrorToast: false,
  });

  const uploadPhoto = async (photo: OnboardingPhotoFile) => {
    const result = await callApi(photo);
    setOnboarding(result.data);
    return result.data;
  };

  return { uploadPhoto, data, response, isLoading, isSuccess, isError, error, reset };
};

/** Move between ordering (PASSENGER) and riding (RIDER) after onboarding. */
export const SwitchModeManager = () => {
  const setOnboarding = useAuthStore((state) => state.setOnboarding);

  const { callApi, isLoading } = useApiManager<OnboardingState, Error, { accountType: AccountType }>({
    endpoint: '/onboarding/mode',
    queryKey: [ONBOARDING_QUERY_KEY],
    method: 'POST',
    showErrorToast: false,
  });

  const switchMode = async (accountType: AccountType) => {
    const result = await callApi({ accountType });
    setOnboarding(result.data);
    return result.data;
  };

  return { switchMode, isLoading };
};

export const useOnboardingState = (): OnboardingState | null =>
  useAuthStore((state) => state.onboarding);
