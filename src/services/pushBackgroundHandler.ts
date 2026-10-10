import { getApp } from '@react-native-firebase/app';
import { getMessaging, setBackgroundMessageHandler } from '@react-native-firebase/messaging';

import type { PushData } from '@/modules/notifications/notificationsTypes';
import { createLogger } from '@/utils/logger';
import { ensureNotificationChannel } from './notificationChannel';
import { clearOrderNotification, displayOrderOffer } from './orderNotifications';

const log = createLogger('push:bg');

/**
 * The background/quit-state message handler.
 *
 * **Must be registered at module scope, before the app component is
 * registered** — Android starts a headless JS task to deliver these, and if no
 * handler exists by the time that task runs the message is dropped and a
 * warning is logged. That is why this is called from `index.ts` rather than
 * from a component or a hook.
 *
 * It runs in its own JS context with no React tree, no navigation and no query
 * cache, so it can only do things that need none of those: create the channel,
 * draw a tray entry, cancel one.
 *
 * The channel matters more than it sounds. The very first notification a fresh
 * install receives can arrive here, before any screen has mounted — a driver
 * who installs the app, goes online, and pockets the phone. If the channel does
 * not exist yet, Android files the message under its own low-priority fallback,
 * and channel importance is fixed at creation: losing that race once means no
 * heads-up banner and no sound until the app is reinstalled.
 *
 * The order lifecycle is the other job. Offers arrive as data-only messages and
 * are drawn here through Notifee under an id derived from the order, which is
 * what makes them cancellable when somebody else wins the race — see
 * `orderNotifications`. Messages that do carry a `notification` block are drawn
 * by Android and must not be drawn again.
 */
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

        // Somebody else took it, or the customer called it off. The entry on
        // the phone is now advertising work that cannot be claimed.
        case 'ORDER_REMOVED':
          await clearOrderNotification(data.orderId);
          break;

        // Winning also ends the offer — the card becomes a trip, and leaving
        // the "new order" entry up would invite a second tap on it.
        case 'ORDER_RESERVED':
          await clearOrderNotification(data.orderId);
          break;

        default:
          // Everything else either carries its own notification block or is
          // only interesting to a foreground client with a query cache.
          break;
      }
    } catch (error) {
      // A background handler that throws takes the headless task down with it
      // and FCM records a delivery failure. Nothing here is worth that.
      log.warn('Background message handling failed', error);
    }
  });
}
