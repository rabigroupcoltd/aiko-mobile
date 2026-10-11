import { useQuery } from '@tanstack/react-query';

import Axios from '@/constants/api_management/MyHttpHelper';
import AxiosWithToken from '@/constants/api_management/MyHttpHelperWithToken';
import useApiManager, { omitKeys } from '@/constants/mainController';
import { ONBOARDING_QUERY_KEY } from '@/modules/onboarding/onboardingController';
import type { ApiResponse, QueryOptions } from '@/modules/shared/apiTypes';
import { parseApiError } from '@/utils/parseApiError';
import type {
  BlockDriverVariables,
  DriverState,
  HeartbeatAck,
  DriverAnalytics,
  DriverDetail,
  DriverLocationAck,
  DriverLocationPayload,
  DriverProfile,
  KycRejectVariables,
  ListDriversParams,
  NearbyDriver,
  NearbyDriversParams,
  PayDebtVariables,
  RegisterDriverPayload,
  RemovePhotoResult,
  RemovePhotoVariables,
  SetAvailabilityVariables,
  UpdateDebtLimitVariables,
  UpdateDriverVariables,
  UploadFile,
  UploadPhotosVariables,
  VehiclePhoto,
} from './driversTypes';
import type { DriverWallet } from '@/modules/wallet/walletTypes';

export const DRIVERS_QUERY_KEY = 'drivers';

function appendFiles(form: FormData, field: string, files: UploadFile[] = []): void {
  files.forEach((file) => form.append(field, file as unknown as Blob));
}

export const useGetMyDriverProfileManager = ({ enabled = true }: QueryOptions = {}) => {
  return useQuery({
    queryKey: [DRIVERS_QUERY_KEY, 'me'],
    queryFn: async () => {
      try {
        const response = await AxiosWithToken.get<ApiResponse<DriverDetail>>('/drivers/me');
        return response.data.data;
      } catch (error) {
        throw new Error(parseApiError(error));
      }
    },
    enabled,
  });
};

export const useGetDriverStateManager = ({ enabled = true }: QueryOptions = {}) => {
  return useQuery({
    queryKey: [DRIVERS_QUERY_KEY, 'state'],
    queryFn: async () => {
      try {
        const response = await AxiosWithToken.get<ApiResponse<DriverState>>('/drivers/state');
        return response.data.data;
      } catch (error) {
        throw new Error(parseApiError(error));
      }
    },
    enabled,
  });
};

export const useGetDriversManager = ({
  vehicleType,
  kycStatus,
  isAvailable,
  enabled = true,
}: ListDriversParams & QueryOptions = {}) => {
  return useQuery({
    queryKey: [DRIVERS_QUERY_KEY, 'list', vehicleType, kycStatus, isAvailable],
    queryFn: async () => {
      try {
        const response = await Axios.get<ApiResponse<DriverDetail[]>>('/drivers', {
          params: {
            ...(vehicleType && { vehicleType }),
            ...(kycStatus && { kycStatus }),
            ...(isAvailable !== undefined && { isAvailable }),
          },
        });
        return response.data.data;
      } catch (error) {
        throw new Error(parseApiError(error));
      }
    },
    enabled,
  });
};

export const useGetDriverManager = ({
  id,
  enabled = true,
}: QueryOptions & { id: string | null | undefined }) => {
  return useQuery({
    queryKey: [DRIVERS_QUERY_KEY, id],
    queryFn: async () => {
      try {
        const response = await Axios.get<ApiResponse<DriverDetail>>(`/drivers/${id}`);
        return response.data.data;
      } catch (error) {
        throw new Error(parseApiError(error));
      }
    },
    enabled: enabled && Boolean(id),
  });
};

export const useGetNearbyDriversManager = ({
  lat,
  lng,
  radiusKm = 5,
  limit = 20,
  vehicleType,
  enabled = true,
}: Partial<NearbyDriversParams> & QueryOptions = {}) => {
  return useQuery({
    queryKey: [DRIVERS_QUERY_KEY, 'nearby', lat, lng, radiusKm, limit, vehicleType],
    queryFn: async () => {
      try {
        const response = await AxiosWithToken.get<ApiResponse<NearbyDriver[]>>('/drivers/nearby', {
          params: { lat, lng, radiusKm, limit, ...(vehicleType && { vehicleType }) },
        });
        return response.data.data;
      } catch (error) {
        throw new Error(parseApiError(error));
      }
    },
    enabled: enabled && lat !== undefined && lng !== undefined,
    staleTime: 0,
  });
};

export const useGetDriverPhotosManager = ({
  id,
  enabled = true,
}: QueryOptions & { id: string | null | undefined }) => {
  return useQuery({
    queryKey: [DRIVERS_QUERY_KEY, id, 'photos'],
    queryFn: async () => {
      try {
        const response = await Axios.get<ApiResponse<VehiclePhoto[]>>(`/drivers/${id}/photos`);
        return response.data.data;
      } catch (error) {
        throw new Error(parseApiError(error));
      }
    },
    enabled: enabled && Boolean(id),
  });
};

export const useGetDriverAnalyticsManager = ({
  id,
  enabled = true,
}: QueryOptions & { id: string | null | undefined }) => {
  return useQuery({
    queryKey: [DRIVERS_QUERY_KEY, id, 'analytics'],
    queryFn: async () => {
      try {
        const response = await AxiosWithToken.get<ApiResponse<DriverAnalytics>>(
          `/drivers/${id}/analytics`,
        );
        return response.data.data;
      } catch (error) {
        throw new Error(parseApiError(error));
      }
    },
    enabled: enabled && Boolean(id),
  });
};

export const useGetDriverWalletManager = ({
  id,
  enabled = true,
}: QueryOptions & { id: string | null | undefined }) => {
  return useQuery({
    queryKey: [DRIVERS_QUERY_KEY, id, 'wallet'],
    queryFn: async () => {
      try {
        const response = await AxiosWithToken.get<ApiResponse<DriverWallet>>(
          `/drivers/${id}/wallet`,
        );
        return response.data.data;
      } catch (error) {
        throw new Error(parseApiError(error));
      }
    },
    enabled: enabled && Boolean(id),
  });
};

export const RegisterDriverManager = () => {
  const { callApi, data, response, isLoading, isSuccess, isError, error, reset } = useApiManager<
    DriverDetail,
    Error,
    RegisterDriverPayload
  >({
    endpoint: '/drivers/register',
    getBody: ({ photos, ...fields }) => {
      const form = new FormData();

      Object.entries(fields).forEach(([key, value]) => {
        if (value !== undefined && value !== null) form.append(key, String(value));
      });
      appendFiles(form, 'photos', photos);

      return form;
    },
    contentType: null,
    queryKey: [DRIVERS_QUERY_KEY, ONBOARDING_QUERY_KEY, 'auth'],
    method: 'POST',
    showSuccessToast: true,
  });

  const registerDriver = async (details: RegisterDriverPayload) => {
    const result = await callApi(details);
    return result.data;
  };

  return { registerDriver, data, response, isLoading, isSuccess, isError, error, reset };
};

export const UpdateDriverManager = () => {
  const { callApi, data, response, isLoading, isSuccess, isError, error, reset } = useApiManager<
    DriverProfile,
    Error,
    UpdateDriverVariables
  >({
    endpoint: ({ id }) => `/drivers/${id}`,
    getBody: omitKeys<UpdateDriverVariables>('id'),
    queryKey: [DRIVERS_QUERY_KEY],
    method: 'PATCH',
    showSuccessToast: true,
  });

  const updateDriver = async (details: UpdateDriverVariables) => {
    const result = await callApi(details);
    return result.data;
  };

  return { updateDriver, data, response, isLoading, isSuccess, isError, error, reset };
};

export const UpdateDriverLocationManager = () => {
  const { callApi, data, response, isLoading, isSuccess, isError, error, reset } = useApiManager<
    DriverLocationAck,
    Error,
    DriverLocationPayload
  >({
    endpoint: '/drivers/location',
    method: 'POST',
    showErrorToast: false,
  });

  const updateLocation = async (details: DriverLocationPayload) => {
    const result = await callApi(details);
    return result.data;
  };

  return { updateLocation, data, response, isLoading, isSuccess, isError, error, reset };
};

export const GoOnlineManager = () => {
  const { callApi, data, response, isLoading, isSuccess, isError, error, reset } = useApiManager<
    DriverProfile,
    Error,
    void
  >({
    endpoint: '/drivers/online',
    queryKey: [DRIVERS_QUERY_KEY],
    method: 'POST',
    showSuccessToast: true,
  });

  const goOnline = async () => {
    const result = await callApi(undefined as never);
    return result.data;
  };

  return { goOnline, data, response, isLoading, isSuccess, isError, error, reset };
};

export const GoOfflineManager = () => {
  const { callApi, data, response, isLoading, isSuccess, isError, error, reset } = useApiManager<
    DriverProfile,
    Error,
    void
  >({
    endpoint: '/drivers/offline',
    queryKey: [DRIVERS_QUERY_KEY],
    method: 'POST',
    showSuccessToast: true,
  });

  const goOffline = async () => {
    const result = await callApi(undefined as never);
    return result.data;
  };

  return { goOffline, data, response, isLoading, isSuccess, isError, error, reset };
};

export const DriverHeartbeatManager = () => {
  const { callApi, data, response, isLoading, isSuccess, isError, error, reset } = useApiManager<
    HeartbeatAck,
    Error,
    void
  >({
    endpoint: '/drivers/heartbeat',
    method: 'POST',
    showErrorToast: false,
  });

  const sendHeartbeat = async () => {
    const result = await callApi(undefined as never);
    return result.data;
  };

  return { sendHeartbeat, data, response, isLoading, isSuccess, isError, error, reset };
};

export const UploadVehiclePhotosManager = () => {
  const { callApi, data, response, isLoading, isSuccess, isError, error, reset } = useApiManager<
    VehiclePhoto[],
    Error,
    UploadPhotosVariables
  >({
    endpoint: ({ id }) => `/drivers/${id}/photos`,
    getBody: ({ photos, photoTypes }) => {
      const form = new FormData();
      if (photoTypes) form.append('photoTypes', photoTypes);
      appendFiles(form, 'photos', photos);
      return form;
    },
    contentType: null,
    queryKey: [DRIVERS_QUERY_KEY],
    method: 'POST',
    showSuccessToast: true,
  });

  const uploadPhotos = async (details: UploadPhotosVariables) => {
    const result = await callApi(details);
    return result.data;
  };

  return { uploadPhotos, data, response, isLoading, isSuccess, isError, error, reset };
};

export const RemoveVehiclePhotoManager = () => {
  const { callApi, data, response, isLoading, isSuccess, isError, error, reset } = useApiManager<
    RemovePhotoResult,
    Error,
    RemovePhotoVariables
  >({
    endpoint: ({ id, photoId }) => `/drivers/${id}/photos/${photoId}`,
    getBody: () => undefined,
    queryKey: [DRIVERS_QUERY_KEY],
    method: 'DELETE',
    showSuccessToast: true,
  });

  const removePhoto = async (details: RemovePhotoVariables) => {
    const result = await callApi(details);
    return result.data;
  };

  return { removePhoto, data, response, isLoading, isSuccess, isError, error, reset };
};

export const SetDriverAvailabilityManager = () => {
  const { callApi, data, response, isLoading, isSuccess, isError, error, reset } = useApiManager<
    DriverProfile,
    Error,
    SetAvailabilityVariables
  >({
    endpoint: ({ id }) => `/drivers/${id}/availability`,
    getBody: omitKeys<SetAvailabilityVariables>('id'),
    queryKey: [DRIVERS_QUERY_KEY],
    method: 'PATCH',
    showSuccessToast: true,
  });

  const setAvailability = async (details: SetAvailabilityVariables) => {
    const result = await callApi(details);
    return result.data;
  };

  return { setAvailability, data, response, isLoading, isSuccess, isError, error, reset };
};

export const PayDriverDebtManager = () => {
  const { callApi, data, response, isLoading, isSuccess, isError, error, reset } = useApiManager<
    DriverProfile,
    Error,
    PayDebtVariables
  >({
    endpoint: ({ id }) => `/drivers/${id}/pay-debt`,
    getBody: omitKeys<PayDebtVariables>('id'),
    queryKey: [DRIVERS_QUERY_KEY, 'wallet'],
    method: 'POST',
    showSuccessToast: true,
  });

  const payDebt = async (details: PayDebtVariables) => {
    const result = await callApi(details);
    return result.data;
  };

  return { payDebt, data, response, isLoading, isSuccess, isError, error, reset };
};

export const ApproveDriverKycManager = () => {
  const { callApi, data, response, isLoading, isSuccess, isError, error, reset } = useApiManager<
    DriverDetail,
    Error,
    { id: string }
  >({
    endpoint: ({ id }) => `/drivers/${id}/kyc/approve`,
    getBody: () => undefined,
    queryKey: [DRIVERS_QUERY_KEY, ONBOARDING_QUERY_KEY],
    method: 'PATCH',
    showSuccessToast: true,
  });

  const approveKyc = async (details: { id: string }) => {
    const result = await callApi(details);
    return result.data;
  };

  return { approveKyc, data, response, isLoading, isSuccess, isError, error, reset };
};

export const RejectDriverKycManager = () => {
  const { callApi, data, response, isLoading, isSuccess, isError, error, reset } = useApiManager<
    DriverDetail,
    Error,
    KycRejectVariables
  >({
    endpoint: ({ id }) => `/drivers/${id}/kyc/reject`,
    getBody: omitKeys<KycRejectVariables>('id'),
    queryKey: [DRIVERS_QUERY_KEY, ONBOARDING_QUERY_KEY],
    method: 'PATCH',
    showSuccessToast: true,
  });

  const rejectKyc = async (details: KycRejectVariables) => {
    const result = await callApi(details);
    return result.data;
  };

  return { rejectKyc, data, response, isLoading, isSuccess, isError, error, reset };
};

export const UpdateDriverDebtLimitManager = () => {
  const { callApi, data, response, isLoading, isSuccess, isError, error, reset } = useApiManager<
    DriverProfile,
    Error,
    UpdateDebtLimitVariables
  >({
    endpoint: ({ id }) => `/drivers/${id}/debt-limit`,
    getBody: omitKeys<UpdateDebtLimitVariables>('id'),
    queryKey: [DRIVERS_QUERY_KEY],
    method: 'PATCH',
    showSuccessToast: true,
  });

  const updateDebtLimit = async (details: UpdateDebtLimitVariables) => {
    const result = await callApi(details);
    return result.data;
  };

  return { updateDebtLimit, data, response, isLoading, isSuccess, isError, error, reset };
};

export const BlockDriverManager = () => {
  const { callApi, data, response, isLoading, isSuccess, isError, error, reset } = useApiManager<
    DriverProfile,
    Error,
    BlockDriverVariables
  >({
    endpoint: ({ id }) => `/drivers/${id}/block`,
    getBody: omitKeys<BlockDriverVariables>('id'),
    queryKey: [DRIVERS_QUERY_KEY],
    method: 'PATCH',
    showSuccessToast: true,
  });

  const blockDriver = async (details: BlockDriverVariables) => {
    const result = await callApi(details);
    return result.data;
  };

  return { blockDriver, data, response, isLoading, isSuccess, isError, error, reset };
};
