import { create } from 'zustand';

import type { VehicleType } from '@/modules/shared/apiTypes';
import type { Place } from '@/types/models';

/** Where an address result came from — surfaced in the UI as a "Cached" badge. */
export type SearchSource = 'idle' | 'cache' | 'remote';

/**
 * Booking lifecycle, mirroring the server's own.
 *
 * `searching` covers PENDING and MATCHED — the request is open and drivers may
 * bid. `matched` means at least one bid has arrived, which is a set of
 * proposals, not a booking. `confirmed` means the passenger accepted one and an
 * Order exists.
 *
 * There is deliberately no client-side notion of a trip being under way: once
 * confirmed, the Order's own `status` is the truth and comes from the server.
 */
export type MatchState = 'idle' | 'searching' | 'matched' | 'confirmed' | 'cancelled';

/** Minna is keke country — the sensible default before anyone picks. */
export const DEFAULT_VEHICLE_TYPE: VehicleType = 'TRICYCLE';

interface BookingState {
  pickup: Place | null;
  dropoff: Place | null;
  /**
   * Who to call at each end.
   *
   * Separate from the account phone because they usually are: the person
   * sending a parcel is rarely the person receiving it, and the driver needs
   * both numbers.
   */
  pickupPhone: string;
  dropoffPhone: string;
  /** What the customer is sending. Optional — an empty string means unsaid. */
  description: string;
  vehicleType: VehicleType;
  query: string;
  results: Place[];
  searchSource: SearchSource;
  searching: boolean;

  matchState: MatchState;
  /** The open `RideRequest`. Bids are read from the server, never cached here. */
  requestId: string | null;
  /** Set once a bid is accepted and the request becomes a trip. */
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
  /** The passenger accepted a bid; the request is now this order. */
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

/**
 * Deliberately NOT persisted.
 *
 * A ride request expires server-side after RIDE_REQUEST_TTL (120s), so a
 * persisted `requestId` would almost always be dead by the next launch and the
 * screen would open onto a request that no longer exists. Anything still live
 * is recovered from the server instead: the socket re-joins in-flight trip
 * rooms on connect, and `GET /api/ride-requests` returns any open request.
 */
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

  // Keeps the vehicle type: it is a standing preference, not part of one
  // booking, and re-picking it on every trip would be tedious.
  reset: () => set((state) => ({ ...initial, vehicleType: state.vehicleType })),
}));
