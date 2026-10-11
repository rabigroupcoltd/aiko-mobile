export type Role = 'passenger' | 'rider';

export type VehicleType = 'bike' | 'tricycle';

export type CaptureTarget = 'profile' | 'license' | 'nationalId' | 'vehicle' | 'plate';

export type RiderDocumentTarget = Exclude<CaptureTarget, 'profile'>;

export interface GoogleAccount {
  id: string;
  email: string;
  givenName: string | null;
  familyName: string | null;
  photoUrl: string | null;
}

export interface DocumentAsset {
  uri: string;
  capturedAt: string;
  target: CaptureTarget;
  width: number;
  height: number;
}

export type PlaceCategory =
  | 'landmark'
  | 'market'
  | 'campus'
  | 'hospital'
  | 'transport'
  | 'government'
  | 'residential';

export interface Place {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  placeId: string | null;
  category: PlaceCategory | null;
  source: 'SAVED' | 'CACHED' | 'REMOTE';
  isDefault: boolean;
}

