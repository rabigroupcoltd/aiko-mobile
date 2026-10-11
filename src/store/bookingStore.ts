import { create } from 'zustand';

import type { VehicleType } from '@/modules/shared/apiTypes';
import type { Place } from '@/types/models';

export type SearchSource = 'idle' | 'cache' | 'remote';

export type MatchState = 'idle' | 'searching' | 'matched' | 'confirmed' | 'cancelled';

export const DEFAULT_VEHICLE_TYPE: VehicleType = 'TRICYCLE';

interface BookingState {
  pickup: Place | null;
  dropoff: Place | null;
  pickupPhone: string;
  dropoffPhone: string;
  description: string;
  vehicleType: VehicleType;
  query: string;
  results: Place[];
  searchSource: SearchSource;
  searching: boolean;

  matchState: MatchState;
  requestId: string | null;
  orderId: string | null;

  setPickup: (p: Place | null) => void;
  setDropoff: (p: Place | null) => void;
  setDescription: (v: string) => void;
  setPickupPhone: (v: string) => void;
  setDropoffPhone: (v: string) => void;
  setVehicleType: (v: VehicleType) => void;
  setQuery: (q: string) => void;
  setResults: (r: Place[], source: SearchSource) => void;
  setSearching: (v: boolean) => void;
  setMatchState: (s: MatchState) => void;
  setRequestId: (id: string | null) => void;
  confirmBooking: (orderId: string) => void;
  reset: () => void;
}

const initial = {
  pickup: null,
  dropoff: null,
  pickupPhone: '',
  dropoffPhone: '',
  description: '',
  vehicleType: DEFAULT_VEHICLE_TYPE,
  query: '',
  results: [],
  searchSource: 'idle' as SearchSource,
  searching: false,
  matchState: 'idle' as MatchState,
  requestId: null,
  orderId: null,
};

export const useBookingStore = create<BookingState>()((set) => ({
  ...initial,

  setPickup: (pickup) => set({ pickup }),
  setDropoff: (dropoff) => set({ dropoff }),
  setDescription: (description) => set({ description }),
  setPickupPhone: (pickupPhone) => set({ pickupPhone }),
  setDropoffPhone: (dropoffPhone) => set({ dropoffPhone }),
  setVehicleType: (vehicleType) => set({ vehicleType }),
  setQuery: (query) => set({ query }),
  setResults: (results, searchSource) => set({ results, searchSource }),
  setSearching: (searching) => set({ searching }),
  setMatchState: (matchState) => set({ matchState }),
  setRequestId: (requestId) => set({ requestId }),

  confirmBooking: (orderId) => set({ orderId, matchState: 'confirmed' }),

  reset: () => set((state) => ({ ...initial, vehicleType: state.vehicleType })),
}));
