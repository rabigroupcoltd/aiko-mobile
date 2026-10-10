import notifee, { AndroidImportance } from '@notifee/react-native';

import type { PushData } from '@/modules/notifications/notificationsTypes';
import { createLogger } from '@/utils/logger';
import { RIDE_CHANNEL_ID, ensureNotificationChannel } from './notificationChannel';

const log = createLogger('push:orders');

/**
 * The tray entry for one order offer.
 *
 * Offers are drawn by the app rather than by Android, which is the whole point:
 * a card has to be *cancellable*. Another driver claims the order seconds after
 * it appears, and an entry left on the phone advertises work that is already
 * gone — tap it and the reserve endpoint refuses. Android draws a `notification`
 * block itself and hands the app no handle to it, so the server sends offers as
 * data-only messages and they are displayed here under an id derived from the
 * order, which `clearOrderNotification` can then cancel.
 *
 * The cost is that data-only messages depend on the process being alive to
 * receive them. That holds here: a driver who is online is running the
 * background location foreground service, so Android keeps the process up and
 * delivers high-priority data messages promptly.
 */

/**
 * Stable per order, so the widening passes that re-announce the same job
 * replace the entry rather than stacking a second one beside it — and so the
 * removal knows what to cancel without keeping a map anywhere.
 */
const notificationId = (orderId: string) => `order:${orderId}`;

/** Draws an offer. No-op when the payload carries no order id to key it by. */
export async function displayOrderOffer(data: PushData): Promise<void> {
  const orderId = data.orderId;
  if (!orderId) return;

  try {
    // The very first offer on a fresh install can arrive before any screen has
    // mounted, and a channel created late loses its HIGH importance forever.
    await ensureNotificationChannel();

    const detail = [data.description, data.body].filter(Boolean).join('\n');

    await notifee.displayNotification({
      id: notificationId(orderId),
      title: data.title ?? 'New order',
      body: detail || undefined,
      // Notifee's data bag takes no undefined values, and a PushData is full
      // of optional keys — FCM simply omits the ones the server left nullish.
      data: Object.fromEntries(
        Object.entries(data).filter((entry): entry is [string, string] => entry[1] != null),
      ),
      android: {
        channelId: RIDE_CHANNEL_ID,
        importance: AndroidImportance.HIGH,
        // Tapping opens the app; the grid refetches and the card is there.
        pressAction: { id: 'default' },
        // The offer stops being true the moment somebody else takes it, so it
        // should not survive a swipe-away-and-restore.
        autoCancel: true,
      },
    });
  } catch (error) {
    // A missing tray entry costs a driver one offer they can still see in the
    // app. Throwing here would take the whole headless task down with it.
    log.warn('Could not display the order offer', error);
  }
}

/**
 * Clears the tray entry for an order that is no longer available.
 *
 * Called for both halves of losing a race — somebody else won it, or the
 * customer cancelled. Cancelling an id that was never displayed is harmless,
 * which is what makes this safe to call without tracking what is on screen.
 */
export async function clearOrderNotification(orderId?: string): Promise<void> {
  if (!orderId) return;

  try {
    await notifee.cancelNotification(notificationId(orderId));
  } catch (error) {
    log.warn('Could not clear the order notification', error);
  }
}
