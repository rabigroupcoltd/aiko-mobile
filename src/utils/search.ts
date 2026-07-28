import type { Place } from '@/types/models';

/**
 * Local address matching against the bundled Minna landmark list.
 *
 * This stands in for the "check the cache before calling Google Places" step:
 * anything answered from here is a cache hit, anything that misses falls
 * through to a simulated remote lookup.
 */

const normalise = (s: string): string =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

/** All the text a place can be matched on. */
const haystackOf = (place: Place): string[] => [
  normalise(place.name),
  normalise(place.area),
  ...place.aliases.map(normalise),
];

/**
 * Score a place against a query. Higher is better; 0 means no match.
 *
 * Prefix matches outrank substring matches so typing "tun" surfaces "Tunga
 * Market" above places that merely contain the letters elsewhere.
 */
function scorePlace(place: Place, query: string): number {
  const q = normalise(query);
  if (!q) return 0;

  let best = 0;
  for (const hay of haystackOf(place)) {
    if (hay === q) best = Math.max(best, 100);
    else if (hay.startsWith(q)) best = Math.max(best, 80);
    // Word-boundary prefix — "central" should hit "Minna Central Market".
    else if (hay.split(' ').some((word) => word.startsWith(q)))
      best = Math.max(best, 60);
    else if (hay.includes(q)) best = Math.max(best, 40);
  }
  return best;
}

export function searchPlaces(places: Place[], query: string, limit = 8): Place[] {
  if (!normalise(query)) return [];

  return places
    .map((place) => ({ place, score: scorePlace(place, query) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.place.name.localeCompare(b.place.name))
    .slice(0, limit)
    .map((entry) => entry.place);
}

/** Straight-line distance in km — good enough for a mock fare/ETA. */
export function distanceKm(a: Place, b: Place): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return R * 2 * Math.asin(Math.sqrt(h));
}

/** Rough fare in naira, rounded to the nearest 50. */
export function estimateFare(km: number, multiplier = 1): number {
  const base = 300;
  const perKm = 130;
  const raw = (base + km * perKm) * multiplier;
  return Math.round(raw / 50) * 50;
}
