import { CommonActions, createNavigationContainerRef } from '@react-navigation/native';

import { createLogger } from '@/utils/logger';
import { ROUTES } from './routes';

const log = createLogger('nav');

/**
 * A handle on the navigator, for notification taps only.
 *
 * This app routes from store state on purpose — there is no `reset()`, no
 * effect-driven redirect and no imperative boot navigation anywhere, which is
 * why signing out needs no navigation logic at all. That rule is about which
 * *branch* of the app is mounted, and it stands.
 *
 * A notification tap is a different thing: the branch is already correct, and
 * the user has asked to be taken to one specific order inside it. There is no
 * state that expresses "show order X now" without inventing a pending-deep-link
 * field that every screen would then have to consume and clear — more moving
 * parts than the ref, and easier to leave stale.
 */
export const navigationRef = createNavigationContainerRef();

/**
 * Taps that arrive before the tree is mounted.
 *
 * A cold start from a notification reads the launch message well before
 * NavigationContainer is ready, so the target is parked here and replayed by
 * `onNavigationReady`.
 */
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

/**
 * Dispatches a navigation, swallowing anything that goes wrong.
 *
 * `CommonActions.navigate` rather than the ref's typed `navigate`: the target
 * is a screen inside a nested stack, and the container ref is typed against the
 * root — which knows only `Main` and `CameraCapture`. The action's payload is a
 * plain `{ name, params }`, which React Navigation resolves down the tree at
 * runtime, and that is the only description of "a screen two navigators deep"
 * that survives the type boundary without a cast per call site.
 *
 * A tap must never crash the app. Worst case the user lands wherever they
 * already were and finds the order in their history.
 */
function dispatch(name: string, params: object | undefined, what: string): void {
  whenReady(() => {
    try {
      navigationRef.dispatch(CommonActions.navigate({ name, params }));
    } catch (error) {
      log.warn(`Could not open ${what} from a notification`, error);
    }
  });
}

/**
 * Opens a customer's order tracking screen.
 *
 * No-op for a driver: `RiderFound` is a passenger screen and is not registered
 * in the rider stack, so navigating there would throw. A driver tapping an
 * order notification lands on their dashboard instead — see `openDriverHome`.
 */
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
