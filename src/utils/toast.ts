import { Alert, Platform, ToastAndroid } from 'react-native';

export type ToastVariant = 'success' | 'error' | 'info';
export type ToastHandler = (message: string, variant: ToastVariant) => void;

const defaultHandler: ToastHandler = (message, variant) => {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
    return;
  }

  if (variant === 'error') Alert.alert('', message);
};

let handler: ToastHandler = defaultHandler;

export function setToastHandler(next: ToastHandler | null): void {
  handler = next ?? defaultHandler;
}

export const showToast = {
  success: (message: string) => handler(message, 'success'),
  error: (message: string) => handler(message, 'error'),
  info: (message: string) => handler(message, 'info'),
};

export default showToast;
