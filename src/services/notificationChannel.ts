import notifee, { AndroidImportance, AndroidVisibility } from '@notifee/react-native';
import { Platform } from 'react-native';

import { createLogger } from '@/utils/logger';

const log = createLogger('push:channel');

/**
 * The Android notification channel every Aiko message lands in.
 *
 * Must match `messaging_android_notification_channel_id` in firebase.json and
 * `FCM_RIDE_CHANNEL_ID` on the backend. All three name the same channel and the
 * string has to be identical in all three places.
 */
export const RIDE_CHANNEL_ID = 'aiko-orders';

/**
 * Creates the channel, at an importance that actually interrupts.
 *
 * Android will not let a notification pop over the current screen unless its
 * channel was created at HIGH importance, and a channel's importance is fixed
 * at creation — the user can lower it afterwards, but the app can never raise
 * it. Get this wrong on the first install and the only fix is reinstalling.
 *
 * Notifee is here for exactly this one call. react-native-firebase deliberately
 * does not manage channels ("outside of the scope of the library", per its
 * docs) and points at Notifee; expo-notifications would have done it too, but
 * it registers a second FirebaseMessagingService for `MESSAGING_EVENT` and only
 * one service can win that intent — adding it would silently break the message
 * handlers this app already relies on.
 *
 * Idempotent: creating a channel that exists updates the mutable fields and
 * leaves importance alone, so calling this on every launch is correct and
 * cheap.
 */
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
      // A driver glances at a locked screen at a junction; the order details
      // need to be on it rather than behind an unlock.
      visibility: AndroidVisibility.PUBLIC,
      badge: true,
    });

    log.info(`Notification channel ${RIDE_CHANNEL_ID} ready`);
  } catch (error) {
    // Never fatal. A missing channel costs the heads-up banner, not delivery —
    // the message still arrives and the socket path is untouched.
    log.warn('Could not create the notification channel', error);
  }
}
