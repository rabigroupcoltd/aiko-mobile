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

const INVALIDATES: Record<PushType, string[]> = {
  RIDE_REQUEST: [RIDE_REQUESTS_QUERY_KEY],
  RIDE_REQUEST_CANCELLED: [RIDE_REQUESTS_QUERY_KEY],
  RIDE_REQUEST_EXPIRED: [RIDE_REQUESTS_QUERY_KEY],
  BID_PLACED: [RIDE_REQUESTS_QUERY_KEY],
  BID_ACCEPTED: [RIDE_REQUESTS_QUERY_KEY, ORDERS_QUERY_KEY],
  TRIP_STATUS: [ORDERS_QUERY_KEY],
  TRIP_CANCELLED: [ORDERS_QUERY_KEY],
  TRIP_MESSAGE: [ORDERS_QUERY_KEY],
  KYC_STATUS: [AUTH_QUERY_KEY, DRIVERS_QUERY_KEY, ONBOARDING_QUERY_KEY],

  ORDER_AVAILABLE: [MARKETPLACE_QUERY_KEY],
  ORDER_REMOVED: [MARKETPLACE_QUERY_KEY],
  ORDER_RESERVED: [MARKETPLACE_QUERY_KEY, ORDERS_QUERY_KEY],
  ORDER_PICKED_UP: [MARKETPLACE_QUERY_KEY, ORDERS_QUERY_KEY],
  ORDER_DELIVERED: [MARKETPLACE_QUERY_KEY, ORDERS_QUERY_KEY, DRIVERS_QUERY_KEY],
  ORDER_NO_DRIVER: [ORDERS_QUERY_KEY],
  DRIVER_UNREACHABLE: [],
};

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
  onOpen?: (data: PushData, message: RemoteMessage) => void;
}

export function usePushNotifications({ onOpen }: UsePushNotificationsOptions = {}) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();

  const onOpenRef = useRef(onOpen);
  onOpenRef.current = onOpen;

  const handledLaunch = useRef(false);

  useEffect(() => {
    if (!accessToken) return;

    void registerPushToken();

    const unsubscribe = onPushTokenRefresh(() => {
      log.info('FCM token refreshed — re-registering');
      void registerPushToken();
    });

    return unsubscribe;
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken) return;

    return onMessage(getMessaging(getApp()), (message) => {
      const data = readPushData(message);
      invalidate(queryClient, data);

      if (data.type === 'ORDER_REMOVED' || data.type === 'ORDER_RESERVED') {
        void clearOrderNotification(data.orderId);
      }

      if (!message.notification) return; // silent — the refetch was the point
      if (!data.type || !TOAST_IN_FOREGROUND.includes(data.type)) return;

      showToast.success(message.notification.body ?? message.notification.title ?? 'Update');
    });
  }, [accessToken, queryClient]);

  useEffect(() => {
    if (!accessToken) return;

    const handle = (message: RemoteMessage) => {
      const data = readPushData(message);
      invalidate(queryClient, data);
      onOpenRef.current?.(data, message);
    };

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
