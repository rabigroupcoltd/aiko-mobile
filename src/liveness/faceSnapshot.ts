import type { Face } from 'react-native-vision-camera-face-detector';

import type { FaceSnapshot } from './types';

export function toFaceSnapshot(face: Face, now: number): FaceSnapshot {
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
    leftEye: face.leftEyeOpenProbability ?? null,
    rightEye: face.rightEyeOpenProbability ?? null,
    t: now,
  };
}
