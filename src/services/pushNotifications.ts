import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp } from '@react-native-firebase/app';
import {
  AuthorizationStatus,
  deleteToken,
  getInitialNotification,
  getMessaging,
  getToken,
  onNotificationOpenedApp,
  onTokenRefresh,
  requestPermission,
  type RemoteMessage,
} from '@react-native-firebase/messaging';
import Constants from 'expo-constants';
import { PermissionsAndroid, Platform } from 'react-native';

import { registerDevice, unregisterDevice } from '@/modules/notifications/notificationsController';
import type { PushData } from '@/modules/notifications/notificationsTypes';
import { createLogger } from '@/utils/logger';
import { makeId } from '@/utils/id';

const log = createLogger('push');

/**
 * Firebase Cloud Messaging.
 *
 * Deliberately a different SDK from `firebaseAuth.ts`. That one uses the
 * `firebase` JS package because minting an ID token needs no native code; FCM
 * has no JS-only path on React Native, so this half is
 * `@react-native-firebase/*` and does require a rebuild.
 *
 * The two do not conflict: the JS SDK initialises its own app from
 * `FIREBASE_CONFIG`, while `getApp()` here returns the native default app that
 * the Google Services Gradle plugin set up from `google-services.json`. Same
 * Firebase project, two independent clients.
 */

const DEVICE_ID_KEY = 'aiko-device-id-v1';

/** The messaging instance for the native default app. */
const messaging = () => getMessaging(getApp());

export type { RemoteMessage };

/** The data half of a message, typed. FCM guarantees string values only. */
export function readPushData(message: RemoteMessage | null | undefined): PushData {
  return (message?.data ?? {}) as PushData;
}

// ------------------------------------------------------------- permission

/** POST_NOTIFICATIONS landed in Android 13. Below it, notifications are implicit. */
const ANDROID_NOTIFICATION_PERMISSION_SDK = 33;

/**
 * Asks for notification permission.
 *
 * Android goes through React Native's own `PermissionsAndroid` rather than
 * `messaging().requestPermission()`: react-native-firebase deprecated its
 * permission API in v22 and will drop it in a future major, and this needs no
 * extra dependency to replace it.
 *
 * iOS still uses the Firebase call — it is the only one of the two that can
 * raise the APNs prompt without pulling in another package, and this project
 * does not currently build for iOS. Swap it for `expo-notifications` or
 * `react-native-permissions` when it does.
 */
export async function requestPushPermission(): Promise<boolean> {
  try {
    if (Platform.OS === 'android') {
      if (Number(Platform.Version) < ANDROID_NOTIFICATION_PERMISSION_SDK) return true;

      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      );
      return result === PermissionsAndroid.RESULTS.GRANTED;
    }

    // PROVISIONAL is iOS's quiet delivery — notifications arrive silently in
    // the notification centre, which still counts as permission to send.
    const status = await requestPermission(messaging());
    return status === AuthorizationStatus.AUTHORIZED || status === AuthorizationStatus.PROVISIONAL;
  } catch (error) {
    log.warn('Could not request notification permission', error);
    return false;
  }
}

// ------------------------------------------------------------ registration

/**
 * A stable id for this install.
 *
 * Lets the server replace a rotated token instead of accumulating a dead row
 * per rotation, and lets it drop the previous owner's registration when a
 * handset changes hands. Generated once and persisted; clearing app storage
 * makes a new install, which is exactly right.
 */
async function getDeviceId(): Promise<string> {
  try {
    const existing = await AsyncStorage.getItem(DEVICE_ID_KEY);
    if (existing) return existing;

    const created = makeId('dev');
    await AsyncStorage.setItem(DEVICE_ID_KEY, created);
    return created;
  } catch (error) {
    // Storage failed — a random id still works for this session, it just will
    // not survive a restart. Better than refusing to register at all.
    log.warn('Could not persist the device id', error);
    return makeId('dev');
  }
}

function describeDevice(): string {
  const model = (Platform.constants as { Model?: string } | undefined)?.Model;
  return model ?? `${Platform.OS} ${String(Platform.Version)}`;
}

/**
 * Registers this device against the signed-in account.
 *
 * Returns the FCM token, mostly so a caller can log or display it — the
 * unregister path reads the current token itself.
 */
export async function registerPushToken(): Promise<string | null> {
  try {
    const granted = await requestPushPermission();
    if (!granted) {
      log.info('Notification permission denied — skipping registration');
      return null;
    }

    const token = await getToken(messaging());
    if (!token) return null;

    await registerDevice({
      token,
      platform: Platform.OS === 'ios' ? 'IOS' : 'ANDROID',
      deviceId: await getDeviceId(),
      deviceName: describeDevice(),
      appVersion: Constants.expoConfig?.version ?? undefined,
    });

    log.info('Device registered for push');
    return token;
  } catch (error) {
    // Never fatal. Everything push carries is also a socket event, so a device
    // that failed to register degrades to foreground-only rather than broken.
    log.warn('Push registration failed', error);
    return null;
  }
}

/**
 * Stops push to this device.
 *
 * Must run *before* the session is cleared — the DELETE is authenticated by the
 * very token being forgotten.
 *
 * The local FCM token is deleted too, which is the belt to that braces: even if
 * the server call failed, the old token stops resolving and the server prunes
 * the row on its next attempt to use it. The next sign-in on this handset then
 * mints a fresh token rather than inheriting the previous account's.
 */
export async function unregisterPushToken(): Promise<void> {
  try {
    const token = await getToken(messaging());
    if (token) await unregisterDevice({ token });
  } catch (error) {
    log.warn('Could not unregister the device server-side', error);
  }

  try {
    await deleteToken(messaging());
  } catch (error) {
    log.warn('Could not delete the local FCM token', error);
  }
}

// --------------------------------------------------------------- listeners

/** Fires when FCM rotates the token. Re-registering is the whole response. */
export function onPushTokenRefresh(handler: (token: string) => void): () => void {
  return onTokenRefresh(messaging(), handler);
}

/**
 * Fires when a notification is tapped and the app was backgrounded but alive.
 *
 * Its cold-start counterpart is `getInitialPushNotification`, which is a
 * one-shot read rather than a subscription — between them they cover every way
 * a notification can open the app.
 */
export function onPushOpened(handler: (message: RemoteMessage) => void): () => void {
  return onNotificationOpenedApp(messaging(), handler);
}

/**
 * The notification that launched the app from a quit state, if any.
 *
 * Read once on startup. Reading it again later returns the same message, so the
 * caller is responsible for not acting on it twice.
 */
export async function getInitialPushNotification(): Promise<RemoteMessage | null> {
  try {
    return await getInitialNotification(messaging());
  } catch (error) {
    log.warn('Could not read the launch notification', error);
    return null;
  }
}
