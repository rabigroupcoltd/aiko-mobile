import { getApp } from '@react-native-firebase/app';
import { getMessaging, setBackgroundMessageHandler } from '@react-native-firebase/messaging';

import { createLogger } from '@/utils/logger';
import { ensureNotificationChannel } from './notificationChannel';

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
 * cache, so there is deliberately one job here: make sure the high-importance
 * channel exists.
 *
 * That matters more than it sounds. The very first notification a fresh install
 * receives can arrive in this context, before any screen has mounted — a driver
 * who installs the app, goes online, and pockets the phone. If the channel does
 * not exist yet, Android files the message under its own low-priority fallback,
 * and channel importance is fixed at creation: losing that race once means no
 * heads-up banner and no sound until the app is reinstalled.
 *
 * Everything else is already covered. Messages carrying a `notification` block
 * are drawn by Android itself and must not be drawn again here, and the
 * foreground context refetches on its next resume.
 *
 * One thing this deliberately does NOT do is clear the tray card for an order
 * another driver has just taken. Notifee can only cancel notifications it
 * displayed itself, and these are drawn by the system from the FCM payload, so
 * there is no id to cancel. The stale card survives until the driver opens the
 * app, at which point the grid refetches and the order is gone. Fixing it
 * properly means sending data-only messages and displaying every one through
 * notifee — a bigger change than it is worth before the tray is a real problem.
 */
export function registerPushBackgroundHandler(): void {
  setBackgroundMessageHandler(getMessaging(getApp()), async (message) => {
    log.debug('Background message', String(message.data?.type ?? 'unknown'));

    try {
      await ensureNotificationChannel();
    } catch (error) {
      // A background handler that throws takes the headless task down with it
      // and FCM records a delivery failure. Nothing here is worth that.
      log.warn('Background message handling failed', error);
    }
  });
}
