import { registerRootComponent } from 'expo';

import App from './App';
import './src/services/backgroundLocation';
import { ensureNotificationChannel } from './src/services/notificationChannel';
import { registerPushBackgroundHandler } from './src/services/pushBackgroundHandler';

registerPushBackgroundHandler();

void ensureNotificationChannel();

registerRootComponent(App);
