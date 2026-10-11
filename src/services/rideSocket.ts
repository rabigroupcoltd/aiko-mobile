import { io, type Socket } from 'socket.io-client';

import { WEBSOCKET_URL } from '@/config/env';
import { useAuthStore } from '@/store/authStore';
import { createLogger } from '@/utils/logger';

const log = createLogger('socket');

let socket: Socket | null = null;

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

export type RemovalReason = 'TAKEN' | 'CANCELLED' | 'NO_DRIVER_FOUND' | 'SKIPPED';

export interface OrderCard {
  id: string;
  vehicleType: string;
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

export function getRideSocket(): Socket | null {
  const token = useAuthStore.getState().accessToken;
  if (!token) return null;

  if (socket?.connected || socket?.active) return socket;

  socket = io(WEBSOCKET_URL, {
    transports: ['websocket'],
    auth: { token },
    forceNew: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 8000,
  });

  socket.on('connect', () => log.info('connected'));
  socket.on('disconnect', (reason) => log.info('disconnected', reason));
  socket.on('connect_error', (error) => log.warn('connect error', error.message));

  socket.on('error', (envelope: SocketErrorEnvelope) => {
    if (envelope?.code === ERROR_CODES.UNAUTHORIZED) {
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
