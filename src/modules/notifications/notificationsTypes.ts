/**
 * Push notification types, mirroring `backend/src/notifications`.
 *
 * `PushType` is the contract that matters: every message the server sends
 * carries one in its data payload, and it is what the app switches on to decide
 * what to refresh and where to navigate.
 */

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
] as const;
export type PushType = (typeof PUSH_TYPES)[number];

/**
 * The data payload, as it arrives.
 *
 * Every value is a string — FCM data payloads are string-to-string, so numbers
 * like `fare` and `pickupLat` need parsing before use.
 */
export interface PushData extends Record<string, string | undefined> {
  type?: PushType;
  /**
   * Matches the WebSocket event this notification duplicates. A foreground
   * client that already handled the socket event uses it to avoid acting twice.
   */
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

/** The token itself is never returned — it is a send-only credential. */
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
