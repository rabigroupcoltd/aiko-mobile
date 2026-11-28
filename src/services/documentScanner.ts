import { Camera } from 'expo-camera';

import { shrinkImage, UPLOAD_SIZES } from '@/services/imageCompression';
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

/**
 * Opens the platform document scanner — ML Kit on Android, VisionKit on iOS.
 * Both find the document's edges live, crop away the background, correct the
 * perspective and enhance the page, and let the user retake or adjust the
 * corners before confirming. Camera only: gallery import is switched off on
 * Android by `patches/react-native-document-scanner-plugin+2.0.4.patch`, and
 * VisionKit has no gallery option.
 */
export async function scanDocument(): Promise<ScanResult> {
  const scanner = loadScanner();
  if (!scanner) return { status: 'unavailable' };

  const permission = await Camera.requestCameraPermissionsAsync();
  if (!permission.granted) return { status: 'denied' };

  try {
    const { scannedImages, status } = await scanner.scanDocument({
      maxNumDocuments: 1,
      croppedImageQuality: 90,
    });

    const uri = scannedImages?.[0];
    if (status === 'cancel' || !uri) return { status: 'cancelled' };

    const fileUri = uri.startsWith('file://') || uri.startsWith('content://') ? uri : `file://${uri}`;
    // Shrunk for mobile data, and copied into app storage as a JPEG.
    return { status: 'scanned', ...(await shrinkImage(fileUri, UPLOAD_SIZES.document)) };
  } catch (error) {
    log.warn('document scan failed', error);
    return { status: 'unavailable' };
  }
}
