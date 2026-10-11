import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  isBackgroundLocationRunning,
  startBackgroundLocation,
  stopBackgroundLocation,
} from '@/services/backgroundLocation';
import AxiosWithToken from '@/constants/api_management/MyHttpHelperWithToken';
import { createLogger } from '@/utils/logger';

const log = createLogger('location');

const HEARTBEAT_INTERVAL_MS = 10_000;
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
  granted: boolean | null;
  backgroundGranted: boolean;
  error: string | null;
  request: () => Promise<boolean>;
  enableBackground: () => Promise<boolean>;
}

export function useDriverLocation(enabled: boolean): DriverLocationState {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [granted, setGranted] = useState<boolean | null>(null);
  const [backgroundGranted, setBackgroundGranted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subscription = useRef<Location.LocationSubscription | null>(null);
  const lastSentAt = useRef(0);

  const request = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      const ok = status === Location.PermissionStatus.GRANTED;

      setGranted(ok);
      setError(ok ? null : 'Location access is needed to receive orders near you.');
      return ok;
    } catch (e: any) {
      log.warn('Permission request failed', e);
      setGranted(false);
      setError('Could not check location permission.');
      return false;
    }
  }, []);

  const enableBackground = useCallback(async () => {
    const started = await startBackgroundLocation({ prompt: true });
    setBackgroundGranted(started);
    return started;
  }, []);

  useEffect(() => {
    let cancelled = false;

    void isBackgroundLocationRunning().then((running) => {
      if (!cancelled) setBackgroundGranted(running);
    });

    return () => {
      cancelled = true;
    };
  }, [enabled]);

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

      void startBackgroundLocation().then(setBackgroundGranted);

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

  useEffect(() => {
    if (enabled) return;

    void stopBackgroundLocation().then(() => setBackgroundGranted(false));
  }, [enabled]);

  return { coords, granted, backgroundGranted, error, request, enableBackground };
}

function publish(coords: Coords, lastSentAt: { current: number }) {
  const now = Date.now();
  if (now - lastSentAt.current < HEARTBEAT_INTERVAL_MS) return;

  lastSentAt.current = now;

  void AxiosWithToken.post('/drivers/location', {
    ...coords,
    recordedAt: new Date(now).toISOString(),
  }).catch((error) => log.debug('location publish failed', error?.message));
}
