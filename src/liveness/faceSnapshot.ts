import type { Face } from 'react-native-vision-camera-face-detector';

import type { FaceSnapshot } from './types';

/**
 * ────────────────────────────────────────────────────────────────────────────
 * HARD RULES for the `Face` object — read before touching this file.
 *
 * `Face` is a Nitro HybridObject backed by native memory, NOT a plain JS
 * object. The native side may release it the moment the detector callback
 * returns. Therefore you must NEVER:
 *
 *   - spread it            ({ ...face })
 *   - serialize it         (JSON.stringify(face))
 *   - store it             (setState(face), ref.current = face, array.push(face))
 *   - read it later        (anything after onFacesDetected returns)
 *
 * Read the scalars you need immediately, into a plain object. That is the sole
 * purpose of this function, and it must be called synchronously inside the
 * detector callback.
 * ────────────────────────────────────────────────────────────────────────────
 */
export function toFaceSnapshot(face: Face, now: number): FaceSnapshot {
  // Read bounds once — each property access crosses the native bridge.
  const b = face.bounds;

  return {
    x: b.x,
    y: b.y,
    w: b.width,
    h: b.height,
    frameW: face.frameWidth,
    frameH: face.frameHeight,
    yaw: face.yawAngle,
    roll: face.rollAngle,
    pitch: face.pitchAngle,
    // `?? null` is deliberate: an absent probability is a DROPOUT, not a closed
    // eye. Coercing undefined to 0 would read every dropout as a blink — the
    // classic bug in this kind of pipeline.
    leftEye: face.leftEyeOpenProbability ?? null,
    rightEye: face.rightEyeOpenProbability ?? null,
    t: now,
  };
}
