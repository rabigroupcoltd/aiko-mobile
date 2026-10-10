import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';

import { API_BASE_URL } from '@/config/env';
import { AUTH_STORAGE_KEY } from '@/store/authStore';
import { createLogger } from '@/utils/logger';

const log = createLogger('location:bg');

export const DRIVER_LOCATION_TASK = 'aiko-driver-location';

/**
 * How often the service asks Android for a fix.
 *
 * The server drops a driver from the dispatch pool after DRIVER_HEARTBEAT_TTL
 * (90s). Twenty seconds leaves room for the OS to defer two or three fixes —
 * a tunnel, a doze window, a cold GPS lock — before that matters. Publishing
 * faster would not make the driver any more findable; it would only cost
 * battery, which is the resource a driver notices most.
 */
const INTERVAL_MS = 20_000;

/** Or this much movement, whichever comes first. */
const DISTANCE_M = 50;

/**
 * The driver's position, published while the app is backgrounded or closed.
 *
 * This is what makes a driver findable at all when their phone is in a pocket.
 * The dispatcher only considers drivers with a live position in Redis, so
 * without a background service an "online" driver silently stops being offered
 * work the moment the screen locks — the worst kind of failure, because the app
 * still says they are available.
 *
 * Two things are deliberately NOT reused here:
 *
 * - The socket. It is gone in the background, and reviving it per fix would
 *   cost a handshake every twenty seconds. `POST /api/drivers/location` writes
 *   the same Redis keys and raises the same DRIVER_LOCATION notification
 *   broadcast, so a passenger watching the map sees no difference.
 *
 * - `AxiosWithToken`. Its interceptor waits on the zustand store to rehydrate,
 *   and this task runs in a JS context where no React tree ever mounts and no
 *   store is created. The token is read straight out of AsyncStorage instead.
 */

interface PersistedAuth {
  state?: { accessToken?: string | null };
}

/**
 * The bearer token, read from the same key zustand persists to.
 *
 * Coupled to the persist config in `authStore` by that key and the `state`
 * wrapper zustand writes around it — hence the shared `AUTH_STORAGE_KEY`
 * import rather than a second copy of the string.
 */
async function readAccessToken(): Promise<string | null> {
  try {
    const raw = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as PersistedAuth;
    return parsed?.state?.accessToken ?? null;
  } catch (error) {
    log.warn('Could not read the stored session', error);
    return null;
  }
}

/**
 * Publishes one fix.
 *
 * `fetch` rather than axios: nothing here needs interceptors, and the fewer
 * modules this task pulls into a cold background context the faster it runs.
 */
async function publish(location: Location.LocationObject): Promise<void> {
  const token = await readAccessToken();
  if (!token) {
    // Signed out while the service was running. Stopping is the right response:
    // an unauthenticated heartbeat can only 401 forever.
    log.info('No session — stopping background updates');
    await stopBackgroundLocation();
    return;
  }

  const { coords, timestamp } = location;

  const response = await fetch(`${API_BASE_URL}/drivers/location`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      lat: coords.latitude,
      lng: coords.longitude,
      heading: coords.heading != null && coords.heading >= 0 ? coords.heading : undefined,
      speedKph:
        coords.speed != null && coords.speed >= 0
          ? Math.round(coords.speed * 3.6 * 10) / 10
          : undefined,
      accuracyMeters: coords.accuracy ?? undefined,
      recordedAt: new Date(timestamp).toISOString(),
    }),
  });

  if (response.status === 401) {
    log.warn('Session rejected — stopping background updates');
    await stopBackgroundLocation();
    return;
  }

  if (!response.ok) {
    // A single failed heartbeat is survivable — the next one is 20s away and
    // the server's TTL is 90s. Logged, not retried.
    log.warn(`Location publish failed: ${response.status}`);
  }
}

/**
 * Registered at module scope, from `index.ts`.
 *
 * TaskManager requires this: Android may spin up the JS bundle purely to run
 * the task, with no React tree, and a `defineTask` inside a component or a hook
 * would not have run by the time the task fires.
 */
TaskManager.defineTask(DRIVER_LOCATION_TASK, async ({ data, error }) => {
  if (error) {
    log.warn('Background location task error', error);
    return;
  }

  const locations = (data as { locations?: Location.LocationObject[] } | undefined)?.locations;
  if (!locations?.length) return;

  // Android batches deferred fixes and hands them over together. Only the
  // newest is worth sending — the server stores one position per driver, so
  // posting the backlog would be four requests to write the same row.
  const latest = locations[locations.length - 1];

  try {
    await publish(latest);
  } catch (e) {
    log.warn('Could not publish a background fix', e);
  }
});

// ---------------------------------------------------------------- lifecycle

/** Whether "allow all the time" is already granted, without prompting. */
export async function hasBackgroundLocationPermission(): Promise<boolean> {
  try {
    const { status } = await Location.getBackgroundPermissionsAsync();
    return status === Location.PermissionStatus.GRANTED;
  } catch {
    return false;
  }
}

/**
 * Asks for the "allow all the time" permission.
 *
 * Foreground has to be granted first — Android refuses the background request
 * outright otherwise — and on Android 11+ the background grant is not a dialog
 * at all: the OS drops the driver into Settings to pick "Allow all the time"
 * themselves.
 *
 * Which is why nothing calls this automatically. Being thrown into Settings the
 * instant you flip a switch reads as a malfunction, and a confused driver taps
 * Back. The dashboard explains what the permission buys them first, and this
 * runs from the button under that explanation.
 */
export async function requestBackgroundLocationPermission(): Promise<boolean> {
  try {
    const foreground = await Location.requestForegroundPermissionsAsync();
    if (foreground.status !== Location.PermissionStatus.GRANTED) return false;

    const background = await Location.requestBackgroundPermissionsAsync();
    return background.status === Location.PermissionStatus.GRANTED;
  } catch (error) {
    log.warn('Background location permission request failed', error);
    return false;
  }
}

export async function isBackgroundLocationRunning(): Promise<boolean> {
  try {
    return await Location.hasStartedLocationUpdatesAsync(DRIVER_LOCATION_TASK);
  } catch {
    return false;
  }
}

/**
 * Starts publishing in the background.
 *
 * `prompt` is off by default so going online never yanks the driver into
 * Settings: the service starts silently if the permission is already there, and
 * the dashboard asks for it explicitly otherwise.
 *
 * Returns false when the permission is missing, so the caller can tell the
 * driver they will only be findable with the app open rather than leaving them
 * to wonder why no orders arrive.
 */
export async function startBackgroundLocation({ prompt = false } = {}): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  try {
    if (await isBackgroundLocationRunning()) return true;

    const granted = prompt
      ? await requestBackgroundLocationPermission()
      : await hasBackgroundLocationPermission();

    if (!granted) {
      log.info('Background location not granted — foreground only');
      return false;
    }

    await Location.startLocationUpdatesAsync(DRIVER_LOCATION_TASK, {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: INTERVAL_MS,
      distanceInterval: DISTANCE_M,
      // Android will otherwise defer a backgrounded app's fixes for tens of
      // minutes under Doze, which is indistinguishable from being offline.
      // The persistent notification this puts up is also the driver's only
      // visible sign that they are still online with the app closed — and the
      // disclosure Play Store review asks to see.
      foregroundService: {
        notificationTitle: 'Aiko — you are online',
        notificationBody: 'Receiving orders nearby. Tap to open, or go offline in the app.',
        notificationColor: '#0E8F4E',
        // False on purpose: swiping the app away must not take the driver
        // offline without them meaning to. Going offline is the switch on the
        // dashboard, and nothing else.
        killServiceOnDestroy: false,
      },
      // iOS only, harmless on Android. A driver is in a vehicle, and the OS
      // tunes its filtering to that.
      activityType: Location.ActivityType.AutomotiveNavigation,
      pausesUpdatesAutomatically: false,
      showsBackgroundLocationIndicator: true,
    });

    log.info('Background location started');
    return true;
  } catch (error) {
    log.warn('Could not start background location', error);
    return false;
  }
}

/** Stops the service. Safe to call when it is not running. */
export async function stopBackgroundLocation(): Promise<void> {
  try {
    if (!(await isBackgroundLocationRunning())) return;

    await Location.stopLocationUpdatesAsync(DRIVER_LOCATION_TASK);
    log.info('Background location stopped');
  } catch (error) {
    log.warn('Could not stop background location', error);
  }
}
