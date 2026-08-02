import { useEffect, useRef } from 'react';

import {
  disconnectRideSocket,
  getRideSocket,
  type ServerEvents,
} from '@/services/rideSocket';
import { useAuthStore } from '@/store/authStore';

/**
 * Keeps one socket alive for as long as there is a session.
 *
 * Mount once, near the root. Screens do not call this — they use
 * `useRideEvent` to listen, which does not own the connection.
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
 * Subscribes to one server event for the lifetime of a screen.
 *
 * The handler is held in a ref so an inline arrow function — which is what
 * every call site will pass — does not resubscribe on every render.
 */
export function useRideEvent<K extends keyof ServerEvents>(
  event: K,
  handler: (payload: ServerEvents[K]) => void,
  enabled = true,
) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!enabled) return;

    const socket = getRideSocket();
    if (!socket) return;

    const listener = (payload: ServerEvents[K]) => handlerRef.current(payload);
    socket.on(event as string, listener);

    return () => {
      socket.off(event as string, listener);
    };
  }, [event, enabled]);
}
