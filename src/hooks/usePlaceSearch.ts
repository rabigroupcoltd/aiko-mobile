import { useMemo } from 'react';

import type { AddressSearchResult } from '@/modules/addresses/addressesTypes';
import {
  useGetAddressesManager,
  useSearchAddressesManager,
} from '@/modules/addresses/addressesController';
import type { Place, PlaceCategory } from '@/types/models';
import { useDebouncedValue } from './useDebouncedValue';

export type SearchState = 'idle' | 'cache-hit' | 'remote-lookup' | 'no-results';

interface UsePlaceSearchResult {
  results: Place[];
  state: SearchState;
  loading: boolean;
  /** Non-null when the lookup failed, so the sheet can say why. */
  error: string | null;
}

/**
 * Address search, served by the API.
 *
 * The two-tier behaviour the bundled landmark list used to simulate is now
 * real: the server checks the caller's saved addresses and the shared place
 * cache before reaching for the Places API, and reports which tier answered.
 * That is surfaced here because the distinction is worth showing.
 *
 * The debounce stays on this side — it saves a request per keystroke, which
 * matters more against a network than it did against a local array.
 */
export function usePlaceSearch(query: string): UsePlaceSearchResult {
  const debounced = useDebouncedValue(query, 220);
  const trimmed = debounced.trim();

  const { data, isFetching, error } = useSearchAddressesManager({ q: trimmed });

  const results = useMemo(() => (data?.results ?? []).map(toPlace), [data]);

  const state: SearchState = !trimmed
    ? 'idle'
    : isFetching
      ? 'remote-lookup'
      : results.length === 0
        ? 'no-results'
        : // `source` is the server's own account of which tier answered.
          data?.source === 'remote'
          ? 'remote-lookup'
          : 'cache-hit';

  return {
    results,
    state,
    loading: Boolean(trimmed) && isFetching,
    error: error ? error.message : null,
  };
}

/**
 * The list shown before anything is typed.
 *
 * Saved addresses, which is what a returning user wants — the old behaviour of
 * listing every bundled landmark went with the JSON file. A new account has
 * none, and the sheet shows an empty state prompting them to search.
 */
export function useDefaultPlaces() {
  const { data, isPending } = useGetAddressesManager();

  const places = useMemo<Place[]>(
    () =>
      (data ?? []).map((row) => ({
        id: row.id,
        name: row.name ?? row.address,
        address: row.address,
        lat: row.latitude ?? 0,
        lng: row.longitude ?? 0,
        placeId: row.placeId,
        category: null,
        source: 'SAVED' as const,
        isDefault: row.isDefault,
      })),
    [data],
  );

  return { places, loading: isPending };
}

const CATEGORIES: PlaceCategory[] = [
  'landmark',
  'market',
  'campus',
  'hospital',
  'transport',
  'government',
  'residential',
];

function toPlace(result: AddressSearchResult): Place {
  return {
    // A cached or remote hit has no id of its own; the address is unique per
    // row, so it is the stable list key.
    id: result.id ?? result.placeId ?? result.address,
    name: result.name ?? result.address,
    address: result.address,
    // The API allows nulls for a saved address entered without coordinates.
    // Zeroes keep the map from crashing; such a row cannot be booked anyway.
    lat: result.latitude ?? 0,
    lng: result.longitude ?? 0,
    placeId: result.placeId,
    category: toCategory(result.category),
    source: result.source,
    isDefault: result.isDefault,
  };
}

/** Narrows the server's free-text category, ignoring anything unrecognised. */
function toCategory(value: string | null): PlaceCategory | null {
  return value && (CATEGORIES as string[]).includes(value) ? (value as PlaceCategory) : null;
}
