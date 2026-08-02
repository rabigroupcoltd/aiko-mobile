import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';

import { getRideSocket } from '@/services/rideSocket';
import { createLogger } from '@/utils/logger';

const log = createLogger('location');

/** The server drops a driver from the pool after DRIVER_HEARTBEAT_TTL (15s). */
const HEARTBEAT_INTERVAL_MS = 10_000;
/** Or after this much movement, whichever comes first. */
const HEARTBEAT_DISTANCE_M = 25;

export interface Coords {
  lat: number;
  lng: number;
  heading?: number;
  speedKph?: number;
  accuracyMeters?: number;
}

export interface DriverLocationState {
  coords: Coords | null;
  /** False when the user declined, or the OS refused. */
  granted: boolean | null;
  error: string | null;
  /** Asks again — for a "grant access" button after a refusal. */
  request: () => Promise<boolean>;
}

/**
 * The driver's live position, published to the server while online.
 *
 * Publishing goes over the socket rather than `POST /api/drivers/location`:
 * both write the same Redis keys, but the socket version also broadcasts to
 * whoever is watching this driver on a map, which is what animates the marker
 * on the passenger's screen. The REST route stays the fallback for a client
 * that cannot hold a socket open.
 *
 * A position is also what the server needs to sweep open ride requests towards
 * a driver who just came online — see `driver.available` on the backend.
 */
export function useDriverLocation(enabled: boolean): DriverLocationState {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [granted, setGranted] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  const subscription = useRef<Location.LocationSubscription | null>(null);
  const lastSentAt = useRef(0);

  const request = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      const ok = status === Location.PermissionStatus.GRANTED;

      setGranted(ok);
      setError(ok ? null : 'Location access is needed to receive trips near you.');
      return ok;
    } catch (e: any) {
      log.warn('Permission request failed', e);
      setGranted(false);
      setError('Could not check location permission.');
      return false;
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      subscription.current?.remove();
      subscription.current = null;
      return;
    }

    let cancelled = false;

    (async () => {
      const ok = await request();
      if (!ok || cancelled) return;

      try {
        subscription.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: HEARTBEAT_INTERVAL_MS,
            distanceInterval: HEARTBEAT_DISTANCE_M,
          },
          (position) => {
            const next: Coords = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              heading: position.coords.heading ?? undefined,
              speedKph:
                position.coords.speed != null && position.coords.speed >= 0
                  ? Math.round(position.coords.speed * 3.6 * 10) / 10
                  : undefined,
              accuracyMeters: position.coords.accuracy ?? undefined,
            };

            setCoords(next);
            publish(next, lastSentAt);
          },
        );
      } catch (e: any) {
        log.warn('Could not start location updates', e);
        if (!cancelled) setError('Could not read your location.');
      }
    })();

    return () => {
      cancelled = true;
      subscription.current?.remove();
      subscription.current = null;
    };
  }, [enabled, request]);

  return { coords, granted, error, request };
}

/**
 * Publishes a fix, rate-limited.
 *
 * `watchPositionAsync` fires on distance as well as time, so a driver in
 * traffic can produce several fixes a second. The server only needs one every
 * ten — anything more is battery and bandwidth for a marker that has not
 * visibly moved.
 */
function publish(coords: Coords, lastSentAt: { current: number }) {
  const now = Date.now();
  if (now - lastSentAt.current < HEARTBEAT_INTERVAL_MS) return;

  const socket = getRideSocket();
  if (!socket?.connected) return;

  lastSentAt.current = now;

  // Fire and forget: the ack carries nothing the UI needs, and a dropped
  // heartbeat is corrected by the next one ten seconds later.
  socket.emit('driver-live-location', {
    ...coords,
    recordedAt: new Date(now).toISOString(),
  });
}
