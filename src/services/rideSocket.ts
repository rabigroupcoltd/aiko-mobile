import { io, type Socket } from 'socket.io-client';

import { WEBSOCKET_URL } from '@/config/env';
import { useAuthStore } from '@/store/authStore';
import { createLogger } from '@/utils/logger';

const log = createLogger('socket');

/**
 * The `/ride` gateway — a notification pipe, and nothing else.
 *
 * The socket never sends. Every mutation the app makes is a REST call through
 * the controllers, which already carry retries, error toasts and react-query
 * invalidation; emitting the same thing here would need all of that rebuilt to
 * gain nothing. What arrives is a stream of notifications telling the app that
 * something changed so it can update what is on screen.
 *
 * One socket for the whole app, not one per screen: the server joins you to
 * your user room, your driver room and any in-flight trip room on connect, and
 * a second connection would duplicate every notification.
 *
 * Reconnecting needs no resubscription and no replay. The server re-joins every
 * room on each handshake, and because nothing was ever in flight there is
 * nothing to reconcile — a driver calls `GET /api/drivers/state` and rebuilds.
 */

let socket: Socket | null = null;

// ------------------------------------------------------------------- codes

/**
 * The driver's card grid.
 *
 * A card appears on REQUEST_NEW and leaves on exactly one of the other three.
 * There is no fourth way, and the app never expires one on its own.
 */
export const INFO_CODES = {
  REQUEST_NEW: 'REQUEST_NEW',
  REQUEST_WON: 'REQUEST_WON',
  REQUEST_LOST: 'REQUEST_LOST',
  REQUEST_CLOSED: 'REQUEST_CLOSED',

  ORDER_RESERVED: 'ORDER_RESERVED',
  ORDER_STATUS: 'ORDER_STATUS',
  ORDER_CANCELLED: 'ORDER_CANCELLED',
  ORDER_NO_DRIVER: 'ORDER_NO_DRIVER',
  DRIVER_LOCATION: 'DRIVER_LOCATION',
  MESSAGE: 'MESSAGE',
  MESSAGE_READ: 'MESSAGE_READ',
  KYC_UPDATED: 'KYC_UPDATED',
} as const;

export type InfoCode = (typeof INFO_CODES)[keyof typeof INFO_CODES];

export const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  NOTIFICATION_FAILED: 'NOTIFICATION_FAILED',
} as const;

export type SocketErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

/** Why a card left the grid. */
export type RemovalReason = 'TAKEN' | 'CANCELLED' | 'NO_DRIVER_FOUND' | 'SKIPPED';

// ---------------------------------------------------------------- payloads

/**
 * An open order as a driver sees it before committing.
 *
 * Carries no compatibility score on purpose: that is per-driver, and one
 * notification goes to everyone in the ring. The screen refetches the grid on
 * receipt, which is where the scoring happens.
 */
export interface OrderCard {
  id: string;
  vehicleType: string;
  /** What the passenger is sending. Null on orders raised before the field existed. */
  description: string | null;
  pickupLocation: string;
  pickupLat: number;
  pickupLng: number;
  dropoffLocation: string;
  dropoffLat: number;
  dropoffLng: number;
  distanceKm: number;
  earnings: number;
  fare: number;
  currency: string;
  createdAt: string;
}

export interface DriverPosition {
  driverId: string;
  lat: number;
  lng: number;
  heading?: number;
  speedKph?: number;
  recordedAt: string;
}

/** `data` keyed by the code that carried it. */
export interface InfoPayloads {
  REQUEST_NEW: { order: OrderCard };
  REQUEST_WON: { order: { id: string; [key: string]: unknown } };
  REQUEST_LOST: { orderId: string; reason: RemovalReason };
  REQUEST_CLOSED: { orderId: string; reason: RemovalReason };

  ORDER_RESERVED: {
    order: { id: string; [key: string]: unknown };
    eta: { pickupMinutes: number | null; deliveryMinutes: number | null } | null;
  };
  ORDER_STATUS: { order: { id: string; status: string; [key: string]: unknown } };
  ORDER_CANCELLED: { order: { id: string; [key: string]: unknown } };
  ORDER_NO_DRIVER: { order: { id: string; [key: string]: unknown } };
  DRIVER_LOCATION: DriverPosition;
  MESSAGE: { message: { orderId: string; [key: string]: unknown } };
  /**
   * The other party opened the chat, so everything sent before `readAt` is
   * read. Both parties are in the trip room, so compare `readerId` against your
   * own id to ignore the receipt you just caused.
   */
  MESSAGE_READ: { orderId: string; readerId: string; readAt: string; count: number };
  KYC_UPDATED: { driver: { id: string; kycStatus: string; [key: string]: unknown } };
}

export interface InfoEnvelope<K extends InfoCode = InfoCode> {
  code: K;
  message: string;
  data: K extends keyof InfoPayloads ? InfoPayloads[K] : unknown;
}

export interface SocketErrorEnvelope {
  code: SocketErrorCode;
  message: string;
  error: string;
}

// ------------------------------------------------------------ connection

/**
 * Connects, or returns the live socket.
 *
 * Reconnection is left to socket.io — it backs off on its own, and the gateway
 * re-joins every room on each successful handshake.
 */
export function getRideSocket(): Socket | null {
  const token = useAuthStore.getState().accessToken;
  if (!token) return null;

  if (socket?.connected || socket?.active) return socket;

  socket = io(WEBSOCKET_URL, {
    transports: ['websocket'],
    auth: { token },
    // The handshake carries the token, so a stale socket left over from a
    // previous session must not be reused after signing in as someone else.
    forceNew: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 8000,
  });

  socket.on('connect', () => log.info('connected'));
  socket.on('disconnect', (reason) => log.info('disconnected', reason));
  socket.on('connect_error', (error) => log.warn('connect error', error.message));

  socket.on('error', (envelope: SocketErrorEnvelope) => {
    if (envelope?.code === ERROR_CODES.UNAUTHORIZED) {
      // The server closes the socket right after this. Reconnecting would loop
      // on the same rejected token, so the session is dropped instead and the
      // navigator falls back to the auth stack on its next render.
      log.warn('handshake rejected — clearing session');
      disconnectRideSocket();
      useAuthStore.getState().clearSession();
      return;
    }

    log.warn('socket error', envelope?.code, envelope?.message);
  });

  return socket;
}

export function disconnectRideSocket(): void {
  socket?.removeAllListeners();
  socket?.disconnect();
  socket = null;
}
