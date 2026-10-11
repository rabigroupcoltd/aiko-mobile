import { Directory, File, Paths } from 'expo-file-system';

import type { CaptureTarget } from '@/types/models';
import { createLogger } from './logger';

const log = createLogger('fileStore');

const FOLDER = 'aiko';

function ensureDir(): Directory {
  const dir = new Directory(Paths.document, FOLDER);
  dir.create({ idempotent: true });
  return dir;
}

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

export function deleteAsset(uri?: string | null): void {
  if (!uri) return;
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch (err) {
    log.warn('failed to delete', uri, err);
  }
}

export function clearAllAssets(): void {
  try {
    const dir = new Directory(Paths.document, FOLDER);
    if (dir.exists) dir.delete();
    log.info('cleared all assets');
  } catch (err) {
    log.warn('failed to clear assets', err);
  }
}
