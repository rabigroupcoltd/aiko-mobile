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
  vehicleBrand: string | null;
  vehicleModel: string | null;
  vehicleColor: string | null;
  vehicleYear: number | null;
  kycStatus: KycStatus;
  kycRejectionReason: string | null;
  isAvailable: boolean;
  isBlocked: boolean;
  debtLimit: number | null;
  currentDebt: number;
  rating: number;
  ratingCount: number;
  totalTrips: number;
  acceptedTrips: number;
  cancelledTrips: number;
  createdAt: string;
  updatedAt: string;
}

export interface DriverDetail extends DriverProfile {
  user: User;
  wallet: DriverWallet | null;
  vehiclePhotos: VehiclePhoto[];
  location: DriverLocation | null;
}

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

export interface RegisterDriverPayload {
  vehicleType: VehicleType;
  vehiclePlate: string;
  vehicleBrand: string;
  vehicleModel?: string;
  vehicleColor?: string;
  vehicleYear?: number;
  photoTypes?: string;
  photos?: UploadFile[];
}

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

export interface DriverLocationPayload {
  lat: number;
  lng: number;
  heading?: number;
  speedKph?: number;
  accuracyMeters?: number;
  recordedAt?: string;
}

export interface DriverLocationAck {
  driverId: string;
  lat: number;
  lng: number;
  recordedAt: string;
}

export type DispatchStatus = 'OFFLINE' | 'AVAILABLE' | 'BUSY';

export interface ActiveOrderSummary {
  id: string;
  status: string;
  description: string | null;
  pickupLocation: string;
  pickupLat: number;
  pickupLng: number;
  dropoffLocation: string;
  dropoffLat: number;
  dropoffLng: number;
  distanceKm: number;
  fare: number;
  driverEarnings: number;
  currency: string;
  reservedAt: string | null;
  createdAt: string;
}

export interface DriverState {
  driverId: string;
  vehicleType: VehicleType;
  status: DispatchStatus;
  isAvailable: boolean;
  presence: { online: boolean; heartbeatTtlSeconds: number };
  kycStatus: KycStatus;
  isBlocked: boolean;
  canGoOnline: boolean;
  blockReason: string | null;
  debt: DriverDebtStatus;
  held: number;
  capacity: number;
  atCapacity: boolean;
  activeOrders: ActiveOrderSummary[];
  lastLocation: { lat: number; lng: number; recordedAt: string | null } | null;
}

export interface DriverDebtStatus {
  current: number;
  limit: number;
  isOverride: boolean;
  locked: boolean;
  remaining: number | null;
}

export interface HeartbeatAck {
  driverId: string;
  online: boolean;
  expiresInSeconds: number;
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
