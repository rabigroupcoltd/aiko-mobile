import type { Place } from '@/types/models';

/**
 * Geometry helpers for the booking screens.
 *
 * What was `utils/search.ts` minus the local matching — address search is now
 * an API call, so the only part still needed on the client is the arithmetic
 * used to draw a route and show an indicative price before a quote comes back.
 */

/** Straight-line distance in km. */
export function distanceKm(a: Place, b: Place): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;

  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return R * 2 * Math.asin(Math.sqrt(h));
}

/**
 * Rough fare in naira, for the moment before a real quote lands.
 *
 * Indicative only — the authoritative figure comes from
 * `POST /api/pricing/estimate`, priced against the active rule and rounded
 * server-side. This exists so the screen has something to show immediately,
 * and must never be what a trip is booked at.
 */
export function estimateFare(km: number, multiplier = 1): number {
  const base = 300;
  const perKm = 130;
  const raw = (base + km * perKm) * multiplier;
  return Math.round(raw / 50) * 50;
}
