import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

export interface GlidePoint {
  lat: number;
  lng: number;
}

/** Compass bearing from a to b, degrees clockwise from north. */
export function bearing(a: GlidePoint, b: GlidePoint): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const y = Math.sin(toRad(b.lng - a.lng)) * Math.cos(toRad(b.lat));
  const x =
    Math.cos(toRad(a.lat)) * Math.sin(toRad(b.lat)) -
    Math.sin(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.cos(toRad(b.lng - a.lng));
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

const MIN_MOVE_DEG = 0.00002; // ~2 m — ignore GPS jitter for the heading

/**
 * Turns location pings that arrive every few seconds into smooth movement: the
 * returned point eases from where it was to each new target, and `heading`
 * follows the direction of travel. Frames run at ~30 fps and stop between
 * pings, so an idle map costs nothing. Jumps straight there with reduced motion.
 */
export function useGlidingPosition(
  target: GlidePoint | null,
  { duration = 1500 }: { duration?: number } = {},
): { point: GlidePoint | null; heading: number | null } {
  const [point, setPoint] = useState<GlidePoint | null>(target);
  const [heading, setHeading] = useState<number | null>(null);
  const current = useRef<GlidePoint | null>(target);
  const reduced = useRef(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => {
        reduced.current = value;
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!target) {
      current.current = null;
      setPoint(null);
      return;
    }
    const from = current.current;
    if (!from || reduced.current) {
      current.current = target;
      setPoint(target);
      return;
    }

    const dLat = target.lat - from.lat;
    const dLng = target.lng - from.lng;
    if (Math.abs(dLat) > MIN_MOVE_DEG || Math.abs(dLng) > MIN_MOVE_DEG) {
      setHeading(bearing(from, target));
    }
    // A jump across town (reconnect, first fix) should not crawl across the map.
    if (Math.abs(dLat) > 0.02 || Math.abs(dLng) > 0.02) {
      current.current = target;
      setPoint(target);
      return;
    }

    const began = Date.now();
    let last = 0;
    let frame = 0;
    const step = () => {
      const t = Math.min(1, (Date.now() - began) / duration);
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      const next = { lat: from.lat + dLat * eased, lng: from.lng + dLng * eased };
      current.current = next;
      const now = Date.now();
      if (now - last >= 33 || t === 1) {
        last = now;
        setPoint(next);
      }
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [duration, target?.lat, target?.lng]); // eslint-disable-line react-hooks/exhaustive-deps

  return { point, heading };
}
