import { io, type Socket } from 'socket.io-client';

import { WEBSOCKET_URL } from '@/config/env';
import type { ApiResponse } from '@/modules/shared/apiTypes';
import { useAuthStore } from '@/store/authStore';
import { createLogger } from '@/utils/logger';

const log = createLogger('socket');

/**
 * The `/ride` gateway.
 *
 * One socket for the whole app, not one per screen: the server joins you to
 * your user room, your driver room and any in-flight trip room on connect, and
 * a second connection would duplicate every broadcast. Screens subscribe to
 * events through `useRideSocket`; nothing else touches this module.
 *
 * Acks use the same `{ code, message, data | error }` envelope as REST, so
 * `emitWithAck` below can raise the same `Error` shape the axios controllers do
 * and callers need no separate error path for the socket.
 */

let socket: Socket | null = null;

/** Server → client events, as the gateway names them. */
export interface ServerEvents {
  connected: ApiResponse<{ userId: string; driverId: string | null }>;
  'ride-request': RideOffer;
  'driver-bid-placed': unknown;
  'driver-accepted': unknown;
  'ride-request-cancelled': { requestId: string };
  'ride-request-expired': unknown;
  'ride-stage-changed': unknown;
  'trip-cancelled': unknown;
  'new-message': unknown;
  'driver-location-update': DriverPosition;
}

/** What a driver receives when a job is offered to them. */
export interface RideOffer {
  requestId: string;
  vehicleType: string;
  pickup: { location: string; lat: number; lng: number };
  dropoff: { location: string; lat: number; lng: number };
  distanceKm: number;
  fare: number;
  expiresAt: string;
}

export interface DriverPosition {
  driverId: string;
  lat: number;
  lng: number;
  heading?: number;
  speedKph?: number;
  recordedAt: string;
}

/**
 * Connects, or returns the live socket.
 *
 * Reconnection is left to socket.io — it backs off on its own, and the gateway
 * re-joins every room on each successful handshake, so a dropped connection
 * needs no resubscription here.
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

  socket.on('connected', (response: ServerEvents['connected']) => {
    if (response.code >= 400) {
      // The server closes the socket right after this. Reconnecting would loop
      // on the same rejected token, so the session is dropped instead and the
      // navigator falls back to the auth stack on its next render.
      log.warn('handshake rejected — clearing session');
      disconnectRideSocket();
      useAuthStore.getState().clearSession();
    }
  });

  return socket;
}

export function disconnectRideSocket(): void {
  socket?.removeAllListeners();
  socket?.disconnect();
  socket = null;
}

/**
 * Emits and unwraps the ack.
 *
 * Throws on a `code >= 400` envelope so a caller can `try`/`catch` exactly as
 * it would around an axios call — the whole point of the server using one
 * envelope for both transports.
 */
export async function emitWithAck<TData>(
  event: string,
  payload: unknown,
  timeoutMs = 10_000,
): Promise<TData> {
  const active = getRideSocket();
  if (!active) throw new Error('Not connected');

  const response = await active
    .timeout(timeoutMs)
    .emitWithAck(event, payload)
    .catch(() => {
      // A timeout here means the server never acked. The REST mirror is always
      // available, so callers are expected to fall back rather than retry.
      throw new Error('The server did not respond, please try again');
    });

  const envelope = response as ApiResponse<TData> & { error?: string | string[] };

  if (envelope?.code >= 400) {
    const message = Array.isArray(envelope.error)
      ? envelope.error.join(', ')
      : envelope.error;
    throw new Error(message || envelope.message || 'Request failed');
  }

  return envelope.data;
}
