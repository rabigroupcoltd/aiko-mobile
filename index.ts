import { registerRootComponent } from 'expo';

import App from './App';
// Importing this module is what registers the TaskManager task. It must happen
// at module scope: Android can spin up the JS bundle purely to deliver a
// background location fix, with no React tree, and a task defined inside a
// component would not exist by the time that runs.
import './src/services/backgroundLocation';
import { ensureNotificationChannel } from './src/services/notificationChannel';
import { registerPushBackgroundHandler } from './src/services/pushBackgroundHandler';

// Before registerRootComponent, deliberately. Android delivers a background
// message through a headless JS task that can start before the app component
// ever mounts, so the handler has to exist at module scope — registering it
// inside a component would be too late and FCM would warn on every delivery.
registerPushBackgroundHandler();

// Fire and forget. The channel must exist before the first notification lands,
// and its importance is fixed at creation — a message that arrives first would
// create the low-priority fallback channel instead, and nothing can raise it
// afterwards short of a reinstall.
void ensureNotificationChannel();

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
