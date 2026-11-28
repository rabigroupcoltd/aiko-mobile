import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { Image } from 'react-native';

import { createLogger } from '@/utils/logger';

const log = createLogger('imageCompression');

export interface ShrunkImage {
  uri: string;
  width: number;
  height: number;
}

/**
 * Upload sizes, chosen for mobile data: a phone camera photo is 3–6 MB, which
 * is slow and costly on a 3G connection. These keep every image sharp enough
 * for an admin to read, at a few hundred KB each.
 */
export const UPLOAD_SIZES = {
  /** Profile selfie — shown small in the app; a face needs little detail. */
  selfie: { maxEdge: 1280, quality: 0.8 },
  /** Whole-vehicle photo. */
  photo: { maxEdge: 1600, quality: 0.8 },
  /** ID, licence and plate scans — text must stay readable. */
  document: { maxEdge: 2000, quality: 0.85 },
} as const;

export function imageSize(uri: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    Image.getSize(
      uri,
      (width, height) => resolve({ width, height }),
      () => resolve({ width: 0, height: 0 }),
    );
  });
}

/**
 * Re-encodes an image as JPEG, scaling it down so its longest edge is at most
 * `maxEdge`. Never fails: on any error the original is returned unchanged.
 */
export async function shrinkImage(
  uri: string,
  { maxEdge, quality }: { maxEdge: number; quality: number },
  known?: { width: number; height: number },
): Promise<ShrunkImage> {
  const size = known?.width && known?.height ? known : await imageSize(uri);
  try {
    const context = ImageManipulator.manipulate(uri);
    if (Math.max(size.width, size.height) > maxEdge) {
      context.resize(size.width >= size.height ? { width: maxEdge } : { height: maxEdge });
    }
    const image = await context.renderAsync();
    const saved = await image.saveAsync({ compress: quality, format: SaveFormat.JPEG });
    return { uri: saved.uri, width: saved.width, height: saved.height };
  } catch (error) {
    log.warn('could not shrink the image, keeping the original', error);
    return { uri, ...size };
  }
}
