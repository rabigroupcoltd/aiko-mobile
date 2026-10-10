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

/**
 * How often a foregrounded driver publishes.
 *
 * Faster than the background service: this is what animates the marker on the
 * passenger's map, and a driver with the app open is the one being watched.
 */
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
  /**
   * True once the OS is delivering fixes with the app closed. False means the
   * driver is only findable while Aiko is on screen — worth telling them.
   */
  backgroundGranted: boolean;
  error: string | null;
  /** Asks again — for a "grant access" button after a refusal. */
  request: () => Promise<boolean>;
  /** Asks for "allow all the time", after the driver has been told why. */
  enableBackground: () => Promise<boolean>;
}

/**
 * The driver's live position, published to the server while online.
 *
 * Two publishers, one purpose. In the foreground a `watchPositionAsync`
 * subscription pushes over the socket, which also fans the position out to
 * whoever is watching this driver on a map. In the background an Android
 * foreground service posts the same fixes to `POST /api/drivers/location` —
 * see `services/backgroundLocation`.
 *
 * Both matter, and neither replaces the other. The dispatcher only considers
 * drivers with a live position in Redis, so the background half is what stops
 * an online driver silently falling out of the pool the moment their screen
 * locks. The foreground half is what makes the marker move smoothly for the
 * passenger currently watching them.
 */
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

  /**
   * Turns on background publishing, prompting for the permission.
   *
   * Separate from `request` because the two prompts differ in kind: the
   * foreground one is a dialog, while on Android 11+ the background one drops
   * the driver into Settings to pick "Allow all the time". Springing that on
   * someone without explaining it first is how it gets refused — so this is
   * wired to a button under the explanation, never to going online.
   */
  const enableBackground = useCallback(async () => {
    const started = await startBackgroundLocation({ prompt: true });
    setBackgroundGranted(started);
    return started;
  }, []);

  // Reflects a permission the driver may have granted — or revoked — in
  // Settings between sessions, so the dashboard is not left claiming a state
  // the OS no longer agrees with.
  useEffect(() => {
    let cancelled = false;

    void isBackgroundLocationRunning().then((running) => {
      if (!cancelled) setBackgroundGranted(running);
    });

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  // ------------------------------------------------------------- foreground

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

      // Started alongside the foreground watch rather than only when the app
      // backgrounds: there is no reliable "about to be killed" moment to hook,
      // and the service is idempotent, so claiming it early is the only way to
      // guarantee it is running by the time the screen locks.
      //
      // Silent — no `prompt`. If the driver has already granted "allow all the
      // time" this just starts; if not, the dashboard shows the explanation and
      // the button that asks.
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

  // -------------------------------------------------------------- teardown

  /**
   * Going offline stops the background service too.
   *
   * Deliberately keyed on `enabled` — the driver's own online switch — and not
   * on unmount. Unmounting happens whenever they navigate away, and stopping
   * there would take them out of the dispatch pool for opening a chat.
   */
  useEffect(() => {
    if (enabled) return;

    void stopBackgroundLocation().then(() => setBackgroundGranted(false));
  }, [enabled]);

  return { coords, granted, backgroundGranted, error, request, enableBackground };
}

/**
 * Publishes a fix, rate-limited.
 *
 * `watchPositionAsync` fires on distance as well as time, so a driver in
 * traffic can produce several fixes a second. The server only needs one every
 * ten — anything more is battery and bandwidth for a marker that has not
 * visibly moved.
 *
 * Over REST, not the socket. The socket is receive-only: it exists to tell the
 * app what changed, and every write the app makes is an HTTP call. That also
 * makes this identical to what `backgroundLocation` does when the app is not on
 * screen, so a driver's position is published the same way whether or not
 * anyone is looking at the phone.
 */
function publish(coords: Coords, lastSentAt: { current: number }) {
  const now = Date.now();
  if (now - lastSentAt.current < HEARTBEAT_INTERVAL_MS) return;

  lastSentAt.current = now;

  // Fire and forget: the response carries nothing the UI needs, and a dropped
  // fix is corrected by the next one ten seconds later. Caught rather than left
  // to float — an unhandled rejection every ten seconds while a tunnel drops
  // the connection would bury everything else in the log.
  void AxiosWithToken.post('/drivers/location', {
    ...coords,
    recordedAt: new Date(now).toISOString(),
  }).catch((error) => log.debug('location publish failed', error?.message));
}
