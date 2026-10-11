import notifee, { AndroidImportance } from '@notifee/react-native';

import type { PushData } from '@/modules/notifications/notificationsTypes';
import { createLogger } from '@/utils/logger';
import { RIDE_CHANNEL_ID, ensureNotificationChannel } from './notificationChannel';

const log = createLogger('push:orders');

const notificationId = (orderId: string) => `order:${orderId}`;

export async function displayOrderOffer(data: PushData): Promise<void> {
  const orderId = data.orderId;
  if (!orderId) return;

  try {
    await ensureNotificationChannel();

    const detail = [data.description, data.body].filter(Boolean).join('\n');

    await notifee.displayNotification({
      id: notificationId(orderId),
      title: data.title ?? 'New order',
      body: detail || undefined,
      data: Object.fromEntries(
        Object.entries(data).filter((entry): entry is [string, string] => entry[1] != null),
      ),
      android: {
        channelId: RIDE_CHANNEL_ID,
        importance: AndroidImportance.HIGH,
        pressAction: { id: 'default' },
        autoCancel: true,
      },
    });
  } catch (error) {
    log.warn('Could not display the order offer', error);
  }
}

export async function clearOrderNotification(orderId?: string): Promise<void> {
  if (!orderId) return;

  try {
    await notifee.cancelNotification(notificationId(orderId));
  } catch (error) {
    log.warn('Could not clear the order notification', error);
  }
}
