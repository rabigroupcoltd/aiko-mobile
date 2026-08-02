import { Alert, Platform, ToastAndroid } from 'react-native';

/**
 * Minimal toast shim.
 *
 * `useApiManager` announces every success and failure, and the app has no
 * notification UI yet — so this uses what the platform already provides rather
 * than pulling in a dependency for it. Swap in a real one through
 * `setToastHandler` and every existing call site follows, with no change to the
 * controllers.
 */

export type ToastVariant = 'success' | 'error' | 'info';
export type ToastHandler = (message: string, variant: ToastVariant) => void;

const defaultHandler: ToastHandler = (message, variant) => {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
    return;
  }

  // iOS has no toast primitive. An alert is intrusive for a success, so only
  // failures interrupt — anything else would make every saved form modal.
  if (variant === 'error') Alert.alert('', message);
};

let handler: ToastHandler = defaultHandler;

/** Point toasts at a real UI. Pass nothing to restore the platform default. */
export function setToastHandler(next: ToastHandler | null): void {
  handler = next ?? defaultHandler;
}

export const showToast = {
  success: (message: string) => handler(message, 'success'),
  error: (message: string) => handler(message, 'error'),
  info: (message: string) => handler(message, 'info'),
};

export default showToast;
