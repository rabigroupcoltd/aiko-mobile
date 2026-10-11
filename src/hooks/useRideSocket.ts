import { useEffect, useRef } from 'react';

import {
  disconnectRideSocket,
  getRideSocket,
  type InfoCode,
  type InfoEnvelope,
  type InfoPayloads,
} from '@/services/rideSocket';
import { useAuthStore } from '@/store/authStore';

export function useRideSocketConnection() {
  const accessToken = useAuthStore((state) => state.accessToken);

  useEffect(() => {
    if (!accessToken) {
      disconnectRideSocket();
      return;
    }

    getRideSocket();

    return () => disconnectRideSocket();
  }, [accessToken]);
}

export function useRideEvent<K extends InfoCode & keyof InfoPayloads>(
  code: K,
  handler: (data: InfoPayloads[K], message: string) => void,
  enabled = true,
) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!enabled) return;

    const socket = getRideSocket();
    if (!socket) return;

    const listener = (envelope: InfoEnvelope) => {
      if (envelope?.code !== code) return;
      handlerRef.current(envelope.data as InfoPayloads[K], envelope.message);
    };

    socket.on('info', listener);

    return () => {
      socket.off('info', listener);
    };
  }, [code, enabled]);
}

export function useRideEvents<K extends InfoCode & keyof InfoPayloads>(
  codes: readonly K[],
  handler: (data: InfoPayloads[K], code: K, message: string) => void,
  enabled = true,
) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  const key = codes.join('|');

  useEffect(() => {
    if (!enabled) return;

    const socket = getRideSocket();
    if (!socket) return;

    const watched = new Set<string>(key.split('|'));

    const listener = (envelope: InfoEnvelope) => {
      if (!envelope?.code || !watched.has(envelope.code)) return;
      handlerRef.current(envelope.data as InfoPayloads[K], envelope.code as K, envelope.message);
    };

    socket.on('info', listener);

    return () => {
      socket.off('info', listener);
    };
  }, [key, enabled]);
}
