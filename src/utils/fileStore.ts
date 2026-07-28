import { Directory, File, Paths } from 'expo-file-system';

import type { CaptureTarget } from '@/types/models';
import { createLogger } from './logger';

const log = createLogger('fileStore');

/** All captured photos live here, outside the evictable cache directory. */
const FOLDER = 'aiko';

/**
 * expo-camera writes captures into the cache directory, which the OS is free to
 * purge when storage runs low. A demo device sitting in a drawer for a week
 * would come back with a missing profile photo and broken document thumbnails.
 *
 * Everything we persist a URI for therefore gets copied into the document
 * directory first, which the system does not evict.
 */
function ensureDir(): Directory {
  const dir = new Directory(Paths.document, FOLDER);
  dir.create({ idempotent: true });
  return dir;
}

/**
 * Copy a freshly captured photo into permanent storage.
 * Returns the new `file://` URI to persist.
 *
 * Filenames are timestamped so a re-capture never collides with the file it is
 * replacing — the old one is removed separately via {@link deleteAsset}.
 */
export async function persistCapture(
  sourceUri: string,
  target: CaptureTarget
): Promise<string> {
  const dir = ensureDir();
  const ext = sourceUri.split('.').pop()?.split('?')[0] || 'jpg';
  const dest = new File(dir, `${target}-${Date.now()}.${ext}`);

  const source = new File(sourceUri);
  await source.copy(dest);

  log.debug('persisted', target, '->', dest.uri);
  return dest.uri;
}

/** Best-effort delete of a previously persisted asset. Never throws. */
export function deleteAsset(uri?: string | null): void {
  if (!uri) return;
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch (err) {
    // A missing file is not worth surfacing — the caller is replacing it anyway.
    log.warn('failed to delete', uri, err);
  }
}

/** Wipe every stored photo. Used by the DEV "Reset Demo" action. */
export function clearAllAssets(): void {
  try {
    const dir = new Directory(Paths.document, FOLDER);
    if (dir.exists) dir.delete();
    log.info('cleared all assets');
  } catch (err) {
    log.warn('failed to clear assets', err);
  }
}
