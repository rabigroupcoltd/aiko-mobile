import { useEffect, useMemo, useRef, useState } from 'react';

import { HAS_PLACES_KEY, MINNA_CENTER } from '@/config/env';
import { useGetAddressesManager } from '@/modules/addresses/addressesController';
import {
  autocomplete,
  newSessionToken,
  type PlacePrediction,
} from '@/services/googlePlaces';
import type { Place } from '@/types/models';
import { useDebouncedValue } from './useDebouncedValue';

export type SearchState = 'idle' | 'searching' | 'results' | 'no-results' | 'error';

interface UsePlaceSearchResult {
  predictions: PlacePrediction[];
  state: SearchState;
  loading: boolean;
  error: string | null;
  sessionToken: string;
  resetSession: () => void;
}

export function usePlaceSearch(query: string): UsePlaceSearchResult {
  const debounced = useDebouncedValue(query, 300);
  const trimmed = debounced.trim();

  const [sessionToken, setSessionToken] = useState(newSessionToken);
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestId = useRef(0);

  useEffect(() => {
    if (!trimmed) {
      setPredictions([]);
      setError(null);
      setLoading(false);
      return;
    }

    if (!HAS_PLACES_KEY) {
      setPredictions([]);
      setError('Search unavailable — Google Places is not configured');
      setLoading(false);
      return;
    }

    const id = (requestId.current += 1);
    setLoading(true);
    setError(null);

    autocomplete(trimmed, sessionToken, {
      lat: MINNA_CENTER.latitude,
      lng: MINNA_CENTER.longitude,
    })
      .then((results) => {
        if (requestId.current !== id) return;
        setPredictions(results);
      })
      .catch((e) => {
        if (requestId.current !== id) return;
        setPredictions([]);
        setError(e?.message ?? 'Search failed');
      })
      .finally(() => {
        if (requestId.current === id) setLoading(false);
      });
  }, [trimmed, sessionToken]);

  const state: SearchState = useMemo(() => {
    if (!trimmed) return 'idle';
    if (loading) return 'searching';
    if (error) return 'error';
    return predictions.length === 0 ? 'no-results' : 'results';
  }, [trimmed, loading, error, predictions.length]);

  return {
    predictions,
    state,
    loading: Boolean(trimmed) && loading,
    error,
    sessionToken,
    resetSession: () => setSessionToken(newSessionToken()),
  };
}

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
