/** Core domain types shared across the app. */

/** A local UI choice, before it becomes `onboarding.accountType` server-side. */
export type Role = 'passenger' | 'rider';

export type VehicleType = 'bike' | 'tricycle';

/** Everything the camera can be pointed at. Drives CAPTURE_CONFIG. */
export type CaptureTarget = 'profile' | 'license' | 'nationalId' | 'vehicle' | 'plate';

/** The subset stored under `documents` — i.e. everything except the selfie. */
export type RiderDocumentTarget = Exclude<CaptureTarget, 'profile'>;

/**
 * The subset of a Google account we keep, purely to pre-fill the profile form.
 *
 * The ID token itself is deliberately not persisted here — it is exchanged for
 * a Firebase token and then our own session immediately after sign-in (see
 * `services/firebaseAuth`), and storing a one-shot credential we would never
 * reuse is pure liability.
 */
export interface GoogleAccount {
  id: string;
  email: string;
  givenName: string | null;
  familyName: string | null;
  photoUrl: string | null;
}

export interface DocumentAsset {
  /** file:// URI inside the app's document directory (not the evictable cache). */
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

/**
 * A place the user can pick, as the API returns it.
 *
 * The aliases and area that the bundled landmark list carried now live
 * server-side: aliases are folded into the row's search text, and the area is
 * already part of `address`. Neither is needed on the client.
 */
export interface Place {
  /** Stable list key. The saved-address id, the place id, or the address. */
  id: string;
  name: string;
  /** Full label, e.g. "Minna Central Market, Minna City Centre, Minna". */
  address: string;
  lat: number;
  lng: number;
  /** Google place id, when the row came from a remote lookup. */
  placeId: string | null;
  /** Only seeded places have one — fall back to a generic icon. */
  category: PlaceCategory | null;
  /** Which tier it came from: the user's own list, the shared cache, or Google. */
  source: 'SAVED' | 'CACHED' | 'REMOTE';
  isDefault: boolean;
}

/*
 * Riders and ride requests deliberately have no type here.
 *
 * Both are server records now, and their shapes live beside the endpoints that
 * return them — `RideBidWithDriver` and `NearbyRideRequest` in
 * `modules/rideRequests`, `Order` in `modules/orders`. A second definition in
 * this file would be a copy that drifts.
 */
