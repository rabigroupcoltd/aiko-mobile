import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';

import { API_BASE_URL } from '@/config/env';
import { AUTH_STORAGE_KEY } from '@/store/authStore';
import { createLogger } from '@/utils/logger';

const log = createLogger('location:bg');

export const DRIVER_LOCATION_TASK = 'aiko-driver-location';

const INTERVAL_MS = 20_000;

const DISTANCE_M = 50;

interface PersistedAuth {
  state?: { accessToken?: string | null };
}

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

async function publish(location: Location.LocationObject): Promise<void> {
  const token = await readAccessToken();
  if (!token) {
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
    log.warn(`Location publish failed: ${response.status}`);
  }
}

TaskManager.defineTask(DRIVER_LOCATION_TASK, async ({ data, error }) => {
  if (error) {
    log.warn('Background location task error', error);
    return;
  }

  const locations = (data as { locations?: Location.LocationObject[] } | undefined)?.locations;
  if (!locations?.length) return;

  const latest = locations[locations.length - 1];

  try {
    await publish(latest);
  } catch (e) {
    log.warn('Could not publish a background fix', e);
  }
});

export async function hasBackgroundLocationPermission(): Promise<boolean> {
  try {
    const { status } = await Location.getBackgroundPermissionsAsync();
    return status === Location.PermissionStatus.GRANTED;
  } catch {
    return false;
  }
}

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
      foregroundService: {
        notificationTitle: 'Aiko — you are online',
        notificationBody: 'Receiving orders nearby. Tap to open, or go offline in the app.',
        notificationColor: '#0E8F4E',
        killServiceOnDestroy: false,
      },
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

export async function stopBackgroundLocation(): Promise<void> {
  try {
    if (!(await isBackgroundLocationRunning())) return;

    await Location.stopLocationUpdatesAsync(DRIVER_LOCATION_TASK);
    log.info('Background location stopped');
  } catch (error) {
    log.warn('Could not stop background location', error);
  }
}
