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

/**
 * Device registration for push.
 *
 * Plain async functions rather than the usual `useApiManager` hooks: these are
 * called from FCM's token-refresh callback and from the sign-out path, neither
 * of which is a React render. A hook cannot be reached from either.
 */

/**
 * Tells the server where to send this user's notifications.
 *
 * Idempotent — safe to call on every launch and on every token rotation.
 * Failures are swallowed by the caller: a device that could not register still
 * receives everything over the socket, so this is never worth blocking sign-in.
 */
export async function registerDevice(details: RegisterDeviceVariables): Promise<void> {
  try {
    await AxiosWithToken.post<ApiResponse<RegisteredDevice>>('/notifications/devices', details);
  } catch (error) {
    throw new Error(parseApiError(error));
  }
}

/** Call before clearing the session, while the token still authenticates. */
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

/**
 * Sends the caller a test notification. `sent: 0` without an error means the
 * server has no Firebase credentials, or this device never registered.
 */
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
