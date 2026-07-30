/** Core domain types shared across the app. */

export type Role = 'passenger' | 'rider';

export type VerificationStatus = 'none' | 'pending' | 'approved';

export type VehicleType = 'bike' | 'tricycle';

/** Everything the camera can be pointed at. Drives CAPTURE_CONFIG. */
export type CaptureTarget = 'profile' | 'license' | 'nationalId' | 'plate';

/** The subset stored under `documents` — i.e. everything except the selfie. */
export type RiderDocumentTarget = Exclude<CaptureTarget, 'profile'>;

export interface UserProfile {
  id: string;
  /** E.164, e.g. "+2348031234567". */
  phone: string;
  email: string;
  firstName: string;
  lastName: string;
  /** ISO 8601 date string (YYYY-MM-DD). */
  dob: string;
  createdAt: string;
}

/** How the user got into the app. */
export type AuthMethod = 'phone' | 'google';

/**
 * The subset of a Google account we keep.
 *
 * Only ever used to pre-fill the profile form and show provenance in the UI —
 * the ID token is deliberately not persisted, since this demo has no backend to
 * exchange it with and storing a credential we can't use is pure liability.
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

/** A searchable Minna landmark from the local "cache". */
export interface Place {
  id: string;
  name: string;
  /** Alternative spellings/nicknames locals actually type. */
  aliases: string[];
  area: string;
  lat: number;
  lng: number;
  category: 'landmark' | 'market' | 'campus' | 'hospital' | 'transport' | 'government' | 'residential';
}

export interface MockRider {
  id: string;
  name: string;
  /** require()'d local image. */
  avatar: number;
  vehicle: VehicleType;
  plate: string;
  rating: number;
  trips: number;
  etaMinutes: number;
}

/** An inbound job shown on the rider dashboard. */
export interface RideRequest {
  id: string;
  passengerName: string;
  pickup: string;
  dropoff: string;
  distanceKm: number;
  fare: number;
  /** Seconds remaining to accept before it auto-expires. */
  expiresInSeconds: number;
}
