import { getApp } from '@react-native-firebase/app';
import { getMessaging, onMessage } from '@react-native-firebase/messaging';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

import { AUTH_QUERY_KEY } from '@/modules/auth/authController';
import { DRIVERS_QUERY_KEY } from '@/modules/drivers/driversController';
import { MARKETPLACE_QUERY_KEY } from '@/modules/marketplace/marketplaceController';
import type { PushData, PushType } from '@/modules/notifications/notificationsTypes';
import { ONBOARDING_QUERY_KEY } from '@/modules/onboarding/onboardingController';
import { ORDERS_QUERY_KEY } from '@/modules/orders/ordersController';
import { RIDE_REQUESTS_QUERY_KEY } from '@/modules/rideRequests/rideRequestsController';
import {
  getInitialPushNotification,
  onPushOpened,
  onPushTokenRefresh,
  readPushData,
  registerPushToken,
  type RemoteMessage,
} from '@/services/pushNotifications';
import { clearOrderNotification } from '@/services/orderNotifications';
import { useAuthStore } from '@/store/authStore';
import { createLogger } from '@/utils/logger';
import showToast from '@/utils/toast';

const log = createLogger('push');

/**
 * Which cached queries each notification invalidates.
 *
 * This is the real job of a foreground notification: the socket already
 * delivers the event, but a client that is on the REST path — or was
 * backgrounded when the socket dropped — needs a nudge to refetch.
 */
const INVALIDATES: Record<PushType, string[]> = {
  RIDE_REQUEST: [RIDE_REQUESTS_QUERY_KEY],
  RIDE_REQUEST_CANCELLED: [RIDE_REQUESTS_QUERY_KEY],
  RIDE_REQUEST_EXPIRED: [RIDE_REQUESTS_QUERY_KEY],
  BID_PLACED: [RIDE_REQUESTS_QUERY_KEY],
  BID_ACCEPTED: [RIDE_REQUESTS_QUERY_KEY, ORDERS_QUERY_KEY],
  TRIP_STATUS: [ORDERS_QUERY_KEY],
  TRIP_CANCELLED: [ORDERS_QUERY_KEY],
  TRIP_MESSAGE: [ORDERS_QUERY_KEY],
  // Approval is what unlocks going online, so the profile and the onboarding
  // step both have to be re-read before the driver's next screen renders.
  KYC_STATUS: [AUTH_QUERY_KEY, DRIVERS_QUERY_KEY, ONBOARDING_QUERY_KEY],

  // Marketplace. ORDER_AVAILABLE only touches the grid; the rest move an order
  // the driver or customer already holds, so the order queries go too.
  ORDER_AVAILABLE: [MARKETPLACE_QUERY_KEY],
  // Losing the race changes only what is on offer, never anything held.
  ORDER_REMOVED: [MARKETPLACE_QUERY_KEY],
  ORDER_RESERVED: [MARKETPLACE_QUERY_KEY, ORDERS_QUERY_KEY],
  ORDER_PICKED_UP: [MARKETPLACE_QUERY_KEY, ORDERS_QUERY_KEY],
  // A delivery settles money as well as freeing a slot.
  ORDER_DELIVERED: [MARKETPLACE_QUERY_KEY, ORDERS_QUERY_KEY, DRIVERS_QUERY_KEY],
  ORDER_NO_DRIVER: [ORDERS_QUERY_KEY],
  // Alert-only — no order field changes, so nothing needs refetching. Admin
  // devices land here too; they have no ORDERS_QUERY_KEY cache to invalidate.
  DRIVER_UNREACHABLE: [],
};

/** Notifications worth interrupting a foreground user for. */
const TOAST_IN_FOREGROUND: PushType[] = [
  'RIDE_REQUEST',
  'BID_PLACED',
  'BID_ACCEPTED',
  'TRIP_STATUS',
  'TRIP_CANCELLED',
  'KYC_STATUS',
  'ORDER_AVAILABLE',
  'ORDER_RESERVED',
  'ORDER_PICKED_UP',
  'ORDER_DELIVERED',
  'ORDER_NO_DRIVER',
  'DRIVER_UNREACHABLE',
];

export interface UsePushNotificationsOptions {
  /**
   * Called when a notification is tapped, including the one that cold-started
   * the app. Routing in this app is derived from store state rather than pushed
   * imperatively, so this is where a consumer translates an opened notification
   * into whatever state change should follow.
   */
  onOpen?: (data: PushData, message: RemoteMessage) => void;
}

/**
 * Wires FCM into the app for the signed-in user.
 *
 * Mount once, above anything that reads ride or order queries. Everything here
 * is additive to the WebSocket path — a device that never gets permission still
 * works, it just stops finding out about trips while backgrounded.
 */
export function usePushNotifications({ onOpen }: UsePushNotificationsOptions = {}) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();

  // Held in refs so the listener effects do not re-subscribe when a caller
  // passes a new inline callback on every render.
  const onOpenRef = useRef(onOpen);
  onOpenRef.current = onOpen;

  /** Cold-start notifications are read once; a re-read returns the same one. */
  const handledLaunch = useRef(false);

  // ------------------------------------------------------------- register

  useEffect(() => {
    if (!accessToken) return;

    void registerPushToken();

    // FCM rotates tokens on its own schedule — on reinstall, on restore to a
    // new device, or when it simply decides to. Without this the server would
    // keep sending to a token that no longer resolves.
    const unsubscribe = onPushTokenRefresh(() => {
      log.info('FCM token refreshed — re-registering');
      void registerPushToken();
    });

    return unsubscribe;
  }, [accessToken]);

  // ------------------------------------------------------------ foreground

  useEffect(() => {
    if (!accessToken) return;

    // Android draws no tray entry while the app is foregrounded, so this is the
    // only chance to surface the message at all.
    return onMessage(getMessaging(getApp()), (message) => {
      const data = readPushData(message);
      invalidate(queryClient, data);

      // An offer drawn while the app was in the background is still in the tray
      // when the driver opens it. Clearing it here means the phone never shows
      // a card for work that has already gone, whichever state the app was in
      // when the news arrived. Offers themselves are not drawn in the
      // foreground: the grid on screen is already the better version of one.
      if (data.type === 'ORDER_REMOVED' || data.type === 'ORDER_RESERVED') {
        void clearOrderNotification(data.orderId);
      }

      if (!message.notification) return; // silent — the refetch was the point
      if (!data.type || !TOAST_IN_FOREGROUND.includes(data.type)) return;

      // The toast shim takes one line, and the body is the informative half —
      // the title is mostly a category ("Trip completed") the user can infer.
      showToast.success(message.notification.body ?? message.notification.title ?? 'Update');
    });
  }, [accessToken, queryClient]);

  // ----------------------------------------------------------------- taps

  useEffect(() => {
    if (!accessToken) return;

    const handle = (message: RemoteMessage) => {
      const data = readPushData(message);
      invalidate(queryClient, data);
      onOpenRef.current?.(data, message);
    };

    // Cold start: the notification that launched the app is not delivered to
    // any listener, it has to be asked for.
    if (!handledLaunch.current) {
      handledLaunch.current = true;
      void getInitialPushNotification().then((message) => {
        if (message) handle(message);
      });
    }

    return onPushOpened(handle);
  }, [accessToken, queryClient]);
}

function invalidate(queryClient: ReturnType<typeof useQueryClient>, data: PushData) {
  const keys = data.type ? INVALIDATES[data.type] : undefined;
  if (!keys) return;

  keys.forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }));
}
