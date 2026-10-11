import { LIVENESS } from './constants';
import type { FaceSnapshot } from './types';

export class RingBuffer {
  private readonly buf: number[] = [];

  constructor(private readonly capacity: number) {}

  push(value: number): void {
    this.buf.push(value);
    if (this.buf.length > this.capacity) this.buf.shift();
  }

  last(n: number): number[] {
    return this.buf.slice(Math.max(0, this.buf.length - n));
  }

  get size(): number {
    return this.buf.length;
  }

  clear(): void {
    this.buf.length = 0;
  }
}

export function median(values: number[]): number {
  if (values.length === 0) return NaN;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

export function fuseEyes(snapshot: FaceSnapshot): number | null {
  const { leftEye, rightEye } = snapshot;
  if (leftEye != null && rightEye != null) return Math.min(leftEye, rightEye);
  if (leftEye != null) return leftEye;
  if (rightEye != null) return rightEye;
  return null;
}

export class Smoother {
  private readonly raw: RingBuffer;
  private ema: number | null = null;

  constructor(
    private readonly medianWindow = LIVENESS.MEDIAN_WINDOW,
    private readonly alpha = LIVENESS.EMA_ALPHA
  ) {
    this.raw = new RingBuffer(Math.max(medianWindow, 1));
  }

  push(value: number | null): number | null {
    if (value == null) return this.ema;

    this.raw.push(value);
    const med = median(this.raw.last(this.medianWindow));

    this.ema = this.ema == null ? med : this.alpha * med + (1 - this.alpha) * this.ema;
    return this.ema;
  }

  get value(): number | null {
    return this.ema;
  }

  reset(): void {
    this.raw.clear();
    this.ema = null;
  }
}

export class AngleSmoother {
  private readonly buf = new RingBuffer(5);

  push(value: number): number {
    this.buf.push(value);
    return median(this.buf.last(5));
  }

  reset(): void {
    this.buf.clear();
  }
}

export function normaliseFace(s: FaceSnapshot) {
  const frameW = s.frameW || 1;
  const frameH = s.frameH || 1;
  return {
    centerX: (s.x + s.w / 2) / frameW,
    centerY: (s.y + s.h / 2) / frameH,
    widthRatio: s.w / frameW,
  };
}

export function angleDelta(a: number, b: number): number {
  let d = a - b;
  while (d > 180) d -= 360;
  while (d < -180) d += 360;
  return d;
}

export const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));
