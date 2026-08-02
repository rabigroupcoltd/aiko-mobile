import { registerRootComponent } from 'expo';

import App from './App';
import { registerPushBackgroundHandler } from './src/services/pushBackgroundHandler';

// Before registerRootComponent, deliberately. Android delivers a background
// message through a headless JS task that can start before the app component
// ever mounts, so the handler has to exist at module scope — registering it
// inside a component would be too late and FCM would warn on every delivery.
registerPushBackgroundHandler();

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
