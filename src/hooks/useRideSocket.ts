import { useEffect, useRef } from 'react';

import {
  disconnectRideSocket,
  getRideSocket,
  type InfoCode,
  type InfoEnvelope,
  type InfoPayloads,
} from '@/services/rideSocket';
import { useAuthStore } from '@/store/authStore';

/**
 * Keeps one socket alive for as long as there is a session.
 *
 * Mount once, near the root. Screens do not call this — they use `useRideEvent`
 * to listen, which does not own the connection.
 */
export function useRideSocketConnection() {
  const accessToken = useAuthStore((state) => state.accessToken);

  useEffect(() => {
    if (!accessToken) {
      disconnectRideSocket();
      return;
    }

    getRideSocket();

    // Torn down on sign-out and on unmount. Not on every token read — the
    // handshake is the expensive part and the token rarely changes.
    return () => disconnectRideSocket();
  }, [accessToken]);
}

/**
 * Subscribes to one notification code for the lifetime of a screen.
 *
 * The server sends a single `info` event and distinguishes what happened by its
 * `code`, so every subscriber attaches the same listener and filters. That is
 * why this hook takes a code rather than an event name: screens should never
 * see the transport-level event, only the thing that happened.
 *
 * The handler is held in a ref so an inline arrow function — which is what
 * every call site will pass — does not resubscribe on every render.
 */
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

/**
 * Subscribes to several codes with one handler.
 *
 * For the case where two codes mean the same thing to a screen — a card leaving
 * the grid is REQUEST_LOST or REQUEST_CLOSED depending on why, and the grid
 * removes it either way.
 */
export function useRideEvents<K extends InfoCode & keyof InfoPayloads>(
  codes: readonly K[],
  handler: (data: InfoPayloads[K], code: K, message: string) => void,
  enabled = true,
) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  // Joined so a caller passing an inline array literal does not resubscribe on
  // every render — the identity changes, the contents almost never do.
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
