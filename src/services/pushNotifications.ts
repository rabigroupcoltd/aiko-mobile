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

const DEVICE_ID_KEY = 'aiko-device-id-v1';

const messaging = () => getMessaging(getApp());

export type { RemoteMessage };

export function readPushData(message: RemoteMessage | null | undefined): PushData {
  return (message?.data ?? {}) as PushData;
}

const ANDROID_NOTIFICATION_PERMISSION_SDK = 33;

export async function requestPushPermission(): Promise<boolean> {
  try {
    if (Platform.OS === 'android') {
      if (Number(Platform.Version) < ANDROID_NOTIFICATION_PERMISSION_SDK) return true;

      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      );
      return result === PermissionsAndroid.RESULTS.GRANTED;
    }

    const status = await requestPermission(messaging());
    return status === AuthorizationStatus.AUTHORIZED || status === AuthorizationStatus.PROVISIONAL;
  } catch (error) {
    log.warn('Could not request notification permission', error);
    return false;
  }
}

async function getDeviceId(): Promise<string> {
  try {
    const existing = await AsyncStorage.getItem(DEVICE_ID_KEY);
    if (existing) return existing;

    const created = makeId('dev');
    await AsyncStorage.setItem(DEVICE_ID_KEY, created);
    return created;
  } catch (error) {
    log.warn('Could not persist the device id', error);
    return makeId('dev');
  }
}

function describeDevice(): string {
  const model = (Platform.constants as { Model?: string } | undefined)?.Model;
  return model ?? `${Platform.OS} ${String(Platform.Version)}`;
}

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
    log.warn('Push registration failed', error);
    return null;
  }
}

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

export function onPushTokenRefresh(handler: (token: string) => void): () => void {
  return onTokenRefresh(messaging(), handler);
}

export function onPushOpened(handler: (message: RemoteMessage) => void): () => void {
  return onNotificationOpenedApp(messaging(), handler);
}

export async function getInitialPushNotification(): Promise<RemoteMessage | null> {
  try {
    return await getInitialNotification(messaging());
  } catch (error) {
    log.warn('Could not read the launch notification', error);
    return null;
  }
}
