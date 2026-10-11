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

export interface AddressSearchResult {
  id: string | null;
  name: string | null;
  address: string;
  latitude: number | null;
  longitude: number | null;
  placeId: string | null;
  category: string | null;
  source: 'SAVED' | 'CACHED' | 'REMOTE';
  isDefault: boolean;
}

export interface AddressSearchResponse {
  results: AddressSearchResult[];
  source: 'cache' | 'remote';
}

export interface SearchAddressParams {
  q: string;
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

export interface UpdateAddressVariables {
  id: string;
  name?: string;
  isDefault?: boolean;
}

export interface DeleteAddressResult {
  deleted: boolean;
  id: string;
}
