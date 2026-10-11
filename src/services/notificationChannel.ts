import notifee, { AndroidImportance, AndroidVisibility } from '@notifee/react-native';
import { Platform } from 'react-native';

import { createLogger } from '@/utils/logger';

const log = createLogger('push:channel');

export const RIDE_CHANNEL_ID = 'aiko-orders';

export async function ensureNotificationChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;

  try {
    await notifee.createChannel({
      id: RIDE_CHANNEL_ID,
      name: 'Orders and trips',
      description: 'New orders, driver assignments and delivery updates.',
      importance: AndroidImportance.HIGH,
      sound: 'default',
      vibration: true,
      visibility: AndroidVisibility.PUBLIC,
      badge: true,
    });

    log.info(`Notification channel ${RIDE_CHANNEL_ID} ready`);
  } catch (error) {
    log.warn('Could not create the notification channel', error);
  }
}
