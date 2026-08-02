import { getApp } from '@react-native-firebase/app';
import { getMessaging, setBackgroundMessageHandler } from '@react-native-firebase/messaging';

import { createLogger } from '@/utils/logger';

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
 * cache, so there is deliberately very little for it to do:
 *
 * - Messages carrying a `notification` block are drawn by Android itself. This
 *   handler does not need to — and must not — draw them again.
 * - Silent messages (a withdrawn ride offer) only need the app to forget the
 *   offer, and the app refetches on its next foreground anyway. Acting here
 *   would write to a cache the foreground context does not share.
 *
 * It stays because registering it is what stops FCM warning on every delivery,
 * and because it is the hook to extend if this ever needs to display its own
 * notification — which would mean adding notifee, since react-native-firebase
 * no longer ships a display API.
 */
export function registerPushBackgroundHandler(): void {
  setBackgroundMessageHandler(getMessaging(getApp()), async (message) => {
    log.debug('Background message', message.data?.type ?? 'unknown');
  });
}
