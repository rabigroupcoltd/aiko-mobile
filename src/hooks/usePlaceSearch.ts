import { useEffect, useRef, useState } from 'react';

import { featureFlags } from '@/config/featureFlags';
import landmarks from '@/data/minnaLandmarks.json';
import type { Place } from '@/types/models';
import { searchPlaces } from '@/utils/search';
import { useDebouncedValue } from './useDebouncedValue';

const PLACES = landmarks as Place[];

export type SearchState = 'idle' | 'cache-hit' | 'remote-lookup' | 'no-results';

interface UsePlaceSearchResult {
  results: Place[];
  state: SearchState;
  /** True while the simulated remote lookup is in flight. */
  loading: boolean;
}

/**
 * Address search with a visible two-tier lookup.
 *
 * A query that matches the bundled landmark list resolves instantly and is
 * reported as a cache hit. A miss falls through to a simulated remote lookup
 * with a spinner. That distinction is the point of this screen in the demo, so
 * it is surfaced in the return value rather than hidden.
 */
export function usePlaceSearch(query: string): UsePlaceSearchResult {
  const debounced = useDebouncedValue(query, 220);
  const [state, setState] = useState<SearchState>('idle');
  const [results, setResults] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);

  // Guards against an in-flight "remote" lookup resolving after the user has
  // already typed something else.
  const requestId = useRef(0);

  useEffect(() => {
    const id = ++requestId.current;
    const trimmed = debounced.trim();

    if (!trimmed) {
      setResults([]);
      setState('idle');
      setLoading(false);
      return;
    }

    const hits = searchPlaces(PLACES, trimmed);

    if (hits.length > 0) {
      setResults(hits);
      setState('cache-hit');
      setLoading(false);
      return;
    }

    // Cache miss — simulate reaching out to a geocoding service.
    setResults([]);
    setState('remote-lookup');
    setLoading(true);

    const timer = setTimeout(() => {
      if (requestId.current !== id) return; // superseded
      setLoading(false);
      setState('no-results');
    }, featureFlags.REMOTE_LOOKUP_MS);

    return () => clearTimeout(timer);
  }, [debounced]);

  return { results, state, loading };
}

/** The full landmark list, for pickers that show everything by default. */
export const ALL_PLACES = PLACES;
