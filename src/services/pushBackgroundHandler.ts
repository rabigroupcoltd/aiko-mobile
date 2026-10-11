import { getApp } from '@react-native-firebase/app';
import { getMessaging, setBackgroundMessageHandler } from '@react-native-firebase/messaging';

import type { PushData } from '@/modules/notifications/notificationsTypes';
import { createLogger } from '@/utils/logger';
import { ensureNotificationChannel } from './notificationChannel';
import { clearOrderNotification, displayOrderOffer } from './orderNotifications';

const log = createLogger('push:bg');

export function registerPushBackgroundHandler(): void {
  setBackgroundMessageHandler(getMessaging(getApp()), async (message) => {
    const data = (message.data ?? {}) as PushData;
    log.debug('Background message', String(data.type ?? 'unknown'));

    try {
      await ensureNotificationChannel();

      switch (data.type) {
        case 'ORDER_AVAILABLE':
          await displayOrderOffer(data);
          break;

        case 'ORDER_REMOVED':
          await clearOrderNotification(data.orderId);
          break;

        case 'ORDER_RESERVED':
          await clearOrderNotification(data.orderId);
          break;

        default:
          break;
      }
    } catch (error) {
      log.warn('Background message handling failed', error);
    }
  });
}
