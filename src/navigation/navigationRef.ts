import { CommonActions, createNavigationContainerRef } from '@react-navigation/native';

import { createLogger } from '@/utils/logger';
import { ROUTES } from './routes';

const log = createLogger('nav');


export const navigationRef = createNavigationContainerRef();


let pending: (() => void) | null = null;

/** Called from NavigationContainer's `onReady`. */
export function onNavigationReady(): void {
  if (!pending) return;

  const run = pending;
  pending = null;
  run();
}

function whenReady(navigate: () => void): void {
  if (navigationRef.isReady()) {
    navigate();
    return;
  }
  pending = navigate;
}

function dispatch(name: string, params: object | undefined, what: string): void {
  whenReady(() => {
    try {
      navigationRef.dispatch(CommonActions.navigate({ name, params }));
    } catch (error) {
      log.warn(`Could not open ${what} from a notification`, error);
    }
  });
}


export function openOrderTracking(orderId: string): void {
  dispatch(
    ROUTES.HOME_TAB,
    { screen: ROUTES.RIDER_FOUND, params: { orderId } },
    'the order',
  );
}

/** Brings a driver to their dashboard, where the grid refetches on focus. */
export function openDriverHome(): void {
  dispatch(ROUTES.HOME_TAB, undefined, 'the dashboard');
}

/** Opens the chat for one order, from a message notification. */
export function openOrderChat(orderId: string): void {
  dispatch(ROUTES.HOME_TAB, { screen: ROUTES.ORDER_CHAT, params: { orderId } }, 'the chat');
}
