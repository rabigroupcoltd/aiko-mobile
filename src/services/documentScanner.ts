import { Camera } from 'expo-camera';
import { Image } from 'react-native';

import { createLogger } from '@/utils/logger';

const log = createLogger('docScanner');

export type ScanResult =
  | { status: 'scanned'; uri: string; width: number; height: number }
  | { status: 'cancelled' }
  | { status: 'unavailable' }
  | { status: 'denied' };

type ScannerModule = typeof import('react-native-document-scanner-plugin').default;

function loadScanner(): ScannerModule | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('react-native-document-scanner-plugin').default as ScannerModule;
  } catch (error) {
    log.warn('document scanner not in this build', error);
    return null;
  }
}

function sizeOf(uri: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    Image.getSize(
      uri,
      (width, height) => resolve({ width, height }),
      () => resolve({ width: 0, height: 0 }),
    );
  });
}

export async function scanDocument(): Promise<ScanResult> {
  const scanner = loadScanner();
  if (!scanner) return { status: 'unavailable' };

  const permission = await Camera.requestCameraPermissionsAsync();
  if (!permission.granted) return { status: 'denied' };

  try {
    const { scannedImages, status } = await scanner.scanDocument({
      maxNumDocuments: 1,
      croppedImageQuality: 85,
    });

    const uri = scannedImages?.[0];
    if (status === 'cancel' || !uri) return { status: 'cancelled' };

    const fileUri = uri.startsWith('file://') || uri.startsWith('content://') ? uri : `file://${uri}`;
    return { status: 'scanned', uri: fileUri, ...(await sizeOf(fileUri)) };
  } catch (error) {
    log.warn('document scan failed', error);
    return { status: 'unavailable' };
  }
}
