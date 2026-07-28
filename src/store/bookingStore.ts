import { create } from 'zustand';

import type { MockRider, Place } from '@/types/models';

/** Where an address result came from — surfaced in the UI as a "Cached" badge. */
export type SearchSource = 'idle' | 'cache' | 'remote';

export type MatchState = 'idle' | 'searching' | 'matched' | 'cancelled';

interface BookingState {
  pickup: Place | null;
  dropoff: Place | null;
  query: string;
  results: Place[];
  searchSource: SearchSource;
  searching: boolean;

  matchState: MatchState;
  matchedRider: (Omit<MockRider, 'avatar'> & { etaMinutes: number }) | null;

  setPickup: (p: Place | null) => void;
  setDropoff: (p: Place | null) => void;
  setQuery: (q: string) => void;
  setResults: (r: Place[], source: SearchSource) => void;
  setSearching: (v: boolean) => void;
  setMatchState: (s: MatchState) => void;
  setMatchedRider: (r: BookingState['matchedRider']) => void;
  reset: () => void;
}

/**
 * Deliberately NOT persisted.
 *
 * Search results and a matched rider are session state. Persisting them would
 * mean reopening the app days later resurrects a stale "your rider is 4 minutes
 * away", which is exactly the kind of thing that derails a live demo.
 */
export const useBookingStore = create<BookingState>()((set) => ({
  pickup: null,
  dropoff: null,
  query: '',
  results: [],
  searchSource: 'idle',
  searching: false,
  matchState: 'idle',
  matchedRider: null,

  setPickup: (pickup) => set({ pickup }),
  setDropoff: (dropoff) => set({ dropoff }),
  setQuery: (query) => set({ query }),
  setResults: (results, searchSource) => set({ results, searchSource }),
  setSearching: (searching) => set({ searching }),
  setMatchState: (matchState) => set({ matchState }),
  setMatchedRider: (matchedRider) => set({ matchedRider }),

  reset: () =>
    set({
      pickup: null,
      dropoff: null,
      query: '',
      results: [],
      searchSource: 'idle',
      searching: false,
      matchState: 'idle',
      matchedRider: null,
    }),
}));
