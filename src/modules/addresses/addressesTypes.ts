export interface Address {
  id: string;
  userId: string;
  name: string | null;
  address: string;
  latitude: number | null;
  longitude: number | null;
  placeId: string | null;
  source: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * A search hit, from any of the three tiers.
 *
 * `source` says which tier it came from and `id` is only set for rows the
 * caller has actually saved — a REMOTE or CACHED hit has none until they do.
 */
export interface AddressSearchResult {
  id: string | null;
  name: string | null;
  address: string;
  latitude: number | null;
  longitude: number | null;
  placeId: string | null;
  /**
   * landmark | market | campus | hospital | transport | government |
   * residential. Only seeded places carry one, so clients need a fallback icon.
   */
  category: string | null;
  source: 'SAVED' | 'CACHED' | 'REMOTE';
  isDefault: boolean;
}

export interface AddressSearchResponse {
  results: AddressSearchResult[];
  /** Whether the answer came from the local cache or a remote lookup. */
  source: 'cache' | 'remote';
}

// -------------------------------------------------------------- requests

export interface SearchAddressParams {
  q: string;
  /** Biases remote results towards the passenger's position. */
  lat?: number;
  lng?: number;
  limit?: number;
}

export interface CreateAddressPayload {
  name?: string;
  address: string;
  latitude?: number;
  longitude?: number;
  placeId?: string;
  isDefault?: boolean;
}

/** Only the label and default flag are editable — save a new row to move it. */
export interface UpdateAddressVariables {
  id: string;
  name?: string;
  isDefault?: boolean;
}

export interface DeleteAddressResult {
  deleted: boolean;
  id: string;
}
