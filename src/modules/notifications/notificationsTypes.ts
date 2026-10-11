export const DEVICE_PLATFORMS = ['ANDROID', 'IOS', 'WEB'] as const;
export type DevicePlatform = (typeof DEVICE_PLATFORMS)[number];

export const PUSH_TYPES = [
  'RIDE_REQUEST',
  'RIDE_REQUEST_CANCELLED',
  'RIDE_REQUEST_EXPIRED',
  'BID_PLACED',
  'BID_ACCEPTED',
  'TRIP_STATUS',
  'TRIP_CANCELLED',
  'TRIP_MESSAGE',
  'KYC_STATUS',

  'ORDER_AVAILABLE',
  'ORDER_REMOVED',
  'ORDER_RESERVED',
  'ORDER_PICKED_UP',
  'ORDER_DELIVERED',
  'ORDER_NO_DRIVER',
  'DRIVER_UNREACHABLE',
] as const;
export type PushType = (typeof PUSH_TYPES)[number];

export interface PushData extends Record<string, string | undefined> {
  type?: PushType;
  dedupeKey?: string;
  requestId?: string;
  orderId?: string;
  driverId?: string;
  status?: string;
}

export interface RegisterDeviceVariables {
  token: string;
  platform?: DevicePlatform;
  deviceId?: string;
  deviceName?: string;
  appVersion?: string;
}

export interface UnregisterDeviceVariables {
  token: string;
}

export interface RegisteredDevice {
  id: string;
  platform: DevicePlatform;
  deviceId: string | null;
  deviceName: string | null;
  appVersion: string | null;
  lastUsedAt: string | null;
  createdAt: string;
}

export interface PushDeliveryResult {
  sent: number;
  failed: number;
  pruned: number;
}
