/**
 * The envelope every endpoint answers with, and the enums shared across
 * modules.
 *
 * Mirrors the backend's `ApiSuccessResponse` / `ApiErrorResponse`: `code` is
 * always the HTTP status, and the server's StatusInterceptor keeps the status
 * line and the body in agreement — so axios throws for anything >= 400 and a
 * resolved response is always the success shape.
 */

export interface ApiResponse<TData = unknown> {
  code: number;
  message: string;
  data: TData;
}

export interface ApiErrorResponse {
  code: number;
  message: string;
  /** A single string, or the list of validation messages. */
  error: string | string[];
}

/** What `data` holds for any paginated list. */
export interface PaginatedResponse<TItem> {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  result: TItem[];
}

/** Query params every paginated endpoint accepts. */
export interface PaginationParams {
  limit?: number;
  offset?: number;
}

/** Lets any hook be held back until its inputs exist. */
export interface QueryOptions {
  enabled?: boolean;
}

// ---------------------------------------------------------------- enums

export const VEHICLE_TYPES = ['CAR', 'BIKE', 'TRUCK', 'TRICYCLE', 'BICYCLE'] as const;
export type VehicleType = (typeof VEHICLE_TYPES)[number];

export const ORDER_STATUSES = [
  'PENDING',
  'ACCEPTED',
  'ARRIVED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_METHODS = ['CASH', 'BANK_TRANSFER'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED';

export const KYC_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'] as const;
export type KycStatus = (typeof KYC_STATUSES)[number];

export type UserRole = 'USER' | 'RIDER' | 'ADMIN';

export type AuthProvider = 'FIREBASE_GOOGLE' | 'FIREBASE_PHONE' | 'PASSWORD';

export const ACCOUNT_TYPES = ['PASSENGER', 'RIDER'] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];

export const RIDE_REQUEST_STATUSES = [
  'PENDING',
  'MATCHED',
  'ACCEPTED',
  'EXPIRED',
  'CANCELLED',
] as const;
export type RideRequestStatus = (typeof RIDE_REQUEST_STATUSES)[number];

export type BidStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';

export const VEHICLE_PHOTO_TYPES = [
  'FRONT',
  'BACK',
  'SIDE',
  'INTERIOR',
  'PLATE_NUMBER',
  'OTHER',
] as const;
export type VehiclePhotoType = (typeof VEHICLE_PHOTO_TYPES)[number];

export type StorageProvider = 'LOCAL' | 'CLOUDINARY' | 'S3' | 'CLOUDFLARE_R2';

export type TransactionType =
  | 'RIDE_EARNINGS'
  | 'PLATFORM_FEE'
  | 'WITHDRAWAL'
  | 'DEBT_PAYMENT'
  | 'ADJUSTMENT';

// ------------------------------------------------------------ geography

export interface Coordinates {
  lat: number;
  lng: number;
}

/** Pickup and drop-off, as the trip endpoints expect them. */
export interface TripRoute {
  pickupLocation: string;
  dropoffLocation: string;
  pickupLat: number;
  pickupLng: number;
  dropoffLat: number;
  dropoffLng: number;
}
