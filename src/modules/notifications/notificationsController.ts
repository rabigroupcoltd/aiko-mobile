import { useQuery } from '@tanstack/react-query';

import AxiosWithToken from '@/constants/api_management/MyHttpHelperWithToken';
import type { ApiResponse, QueryOptions } from '@/modules/shared/apiTypes';
import { parseApiError } from '@/utils/parseApiError';
import type {
  PushDeliveryResult,
  RegisterDeviceVariables,
  RegisteredDevice,
  UnregisterDeviceVariables,
} from './notificationsTypes';

export const NOTIFICATIONS_QUERY_KEY = 'notifications';

export async function registerDevice(details: RegisterDeviceVariables): Promise<void> {
  try {
    await AxiosWithToken.post<ApiResponse<RegisteredDevice>>('/notifications/devices', details);
  } catch (error) {
    throw new Error(parseApiError(error));
  }
}

export async function unregisterDevice(details: UnregisterDeviceVariables): Promise<void> {
  try {
    await AxiosWithToken.delete<ApiResponse<{ removed: number }>>('/notifications/devices', {
      data: details,
    });
  } catch (error) {
    throw new Error(parseApiError(error));
  }
}

export const useGetRegisteredDevicesManager = ({ enabled = true }: QueryOptions = {}) => {
  return useQuery({
    queryKey: [NOTIFICATIONS_QUERY_KEY, 'devices'],
    queryFn: async () => {
      try {
        const response =
          await AxiosWithToken.get<ApiResponse<RegisteredDevice[]>>('/notifications/devices');
        return response.data.data;
      } catch (error) {
        throw new Error(parseApiError(error));
      }
    },
    enabled,
  });
};

export async function sendTestPush(body?: {
  title?: string;
  body?: string;
}): Promise<PushDeliveryResult> {
  try {
    const response = await AxiosWithToken.post<ApiResponse<PushDeliveryResult>>(
      '/notifications/test',
      body ?? {},
    );
    return response.data.data;
  } catch (error) {
    throw new Error(parseApiError(error));
  }
}
