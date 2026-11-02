import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

import { createLogger } from '@/utils/logger';

const log = createLogger('cropToFrame');

export interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface Size {
  width: number;
  height: number;
}

/** Breathing room around the guide, so edges of the card or plate are never clipped. */
const MARGIN = 0.06;

/**
 * Maps a rectangle drawn over the camera preview onto the captured photo.
 *
 * The preview fills its view the way `resizeMode: cover` does: the photo is
 * scaled until both sides cover the view, then centred, so part of it falls
 * off two edges. Undoing that scale and offset gives the same region in
 * photo pixels.
 */
export function frameToPhotoRect(frame: Rect, view: Size, photo: Size) {
  const scale = Math.max(view.width / photo.width, view.height / photo.height);
  const offsetX = (view.width - photo.width * scale) / 2;
  const offsetY = (view.height - photo.height * scale) / 2;

  const padX = frame.width * MARGIN;
  const padY = frame.height * MARGIN;

  const x = (frame.left - padX - offsetX) / scale;
  const y = (frame.top - padY - offsetY) / scale;
  const w = (frame.width + padX * 2) / scale;
  const h = (frame.height + padY * 2) / scale;

  const originX = Math.max(0, Math.round(x));
  const originY = Math.max(0, Math.round(y));
  return {
    originX,
    originY,
    width: Math.min(photo.width - originX, Math.round(w)),
    height: Math.min(photo.height - originY, Math.round(h)),
  };
}

/** Crops a captured photo to the on-screen guide. Falls back to the original on failure. */
export async function cropToFrame(
  uri: string,
  photo: Size,
  frame: Rect,
  view: Size,
): Promise<{ uri: string; width: number; height: number }> {
  try {
    const rect = frameToPhotoRect(frame, view, photo);
    if (rect.width < 50 || rect.height < 50) return { uri, ...photo };

    const image = await ImageManipulator.manipulate(uri).crop(rect).renderAsync();
    const saved = await image.saveAsync({ compress: 0.85, format: SaveFormat.JPEG });
    return { uri: saved.uri, width: saved.width, height: saved.height };
  } catch (error) {
    log.warn('crop failed, keeping the full photo', error);
    return { uri, ...photo };
  }
}
