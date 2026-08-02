import type {
  KycStatus,
  StorageProvider,
  VehiclePhotoType,
  VehicleType,
} from '@/modules/shared/apiTypes';
import type { User } from '@/modules/users/usersTypes';
import type { DriverWallet } from '@/modules/wallet/walletTypes';

export interface VehiclePhoto {
  id: string;
  driverId: string;
  type: VehiclePhotoType;
  url: string;
  key: string;
  provider: StorageProvider;
  mimeType: string | null;
  sizeBytes: number | null;
  createdAt: string;
}

export interface DriverLocation {
  driverId: string;
  latitude: number;
  longitude: number;
  heading: number | null;
  speedKph: number | null;
  accuracyMeters: number | null;
  recordedAt: string;
  updatedAt: string;
}

export interface DriverProfile {
  id: string;
  userId: string;
  vehicleType: VehicleType;
  vehiclePlate: string;
  vehicleModel: string;
  vehicleColor: string | null;
  vehicleYear: number | null;
  kycStatus: KycStatus;
  kycRejectionReason: string | null;
  isAvailable: boolean;
  isBlocked: boolean;
  debtLimit: number;
  currentDebt: number;
  rating: number;
  ratingCount: number;
  totalTrips: number;
  acceptedTrips: number;
  cancelledTrips: number;
  createdAt: string;
  updatedAt: string;
}

/** `GET /api/drivers/{id}` and `/me` — every relation loaded. */
export interface DriverDetail extends DriverProfile {
  user: User;
  wallet: DriverWallet | null;
  vehiclePhotos: VehiclePhoto[];
  location: DriverLocation | null;
}

/** Live presence from Redis, not a database read. */
export interface NearbyDriver {
  driverId: string;
  lat: number | null;
  lng: number | null;
  distanceKm: number | null;
  heading?: number;
  speedKph?: number;
  accuracyMeters?: number;
  recordedAt: string | null;
}

export interface DriverAnalytics {
  totalEarnings: number;
  todayEarnings: number;
  weekEarnings: number;
  tripsCompleted: number;
  activeTrips: number;
  rating: number;
  acceptanceRate: number;
  cancellationRate: number;
  currentDebt: number;
  debtLimit: number;
}

// -------------------------------------------------------------- requests

/**
 * Vehicle registration — the RIDER_DOCS onboarding step.
 *
 * Sent as multipart/form-data, because the photos ride along in the same
 * request. On success the account becomes a RIDER and moves to
 * AWAITING_APPROVAL.
 */
export interface RegisterDriverPayload {
  vehicleType: VehicleType;
  vehiclePlate: string;
  vehicleModel: string;
  vehicleColor?: string;
  vehicleYear?: number;
  /** Comma-separated labels matched positionally, e.g. "FRONT,BACK". */
  photoTypes?: string;
  photos?: UploadFile[];
}

/** A local file, in the shape React Native's FormData expects. */
export interface UploadFile {
  uri: string;
  name: string;
  type: string;
}

export interface UpdateDriverPayload {
  vehicleType?: VehicleType;
  vehiclePlate?: string;
  vehicleModel?: string;
  vehicleColor?: string;
  vehicleYear?: number;
}

export interface UpdateDriverVariables extends UpdateDriverPayload {
  id: string;
}

export interface NearbyDriversParams {
  lat: number;
  lng: number;
  radiusKm?: number;
  limit?: number;
  vehicleType?: VehicleType;
}

/** Heartbeat, expected roughly every 10s while online. */
export interface DriverLocationPayload {
  lat: number;
  lng: number;
  heading?: number;
  speedKph?: number;
  accuracyMeters?: number;
  /** ISO 8601. Defaults to server time. */
  recordedAt?: string;
}

export interface DriverLocationAck {
  driverId: string;
  lat: number;
  lng: number;
  recordedAt: string;
}

export interface ListDriversParams {
  vehicleType?: VehicleType;
  kycStatus?: KycStatus;
  isAvailable?: boolean;
}

export interface UploadPhotosVariables {
  id: string;
  photos: UploadFile[];
  photoTypes?: string;
}

export interface RemovePhotoVariables {
  id: string;
  photoId: string;
}

export interface SetAvailabilityVariables {
  id: string;
  isAvailable: boolean;
}

export interface PayDebtVariables {
  id: string;
  amount: number;
}

export interface KycRejectVariables {
  id: string;
  reason?: string;
}

export interface UpdateDebtLimitVariables {
  id: string;
  debtLimit: number;
}

export interface BlockDriverVariables {
  id: string;
  isBlocked: boolean;
}

export interface RemovePhotoResult {
  deleted: boolean;
  id: string;
}
