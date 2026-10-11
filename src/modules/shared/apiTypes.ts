export interface ApiResponse<TData = unknown> {
  code: number;
  message: string;
  data: TData;
}

export interface ApiErrorResponse {
  code: number;
  message: string;
  error: string | string[];
}

export interface PaginatedResponse<TItem> {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  result: TItem[];
}

export interface PaginationParams {
  limit?: number;
  offset?: number;
}

export interface QueryOptions {
  enabled?: boolean;
}

export const VEHICLE_TYPES = ['CAR', 'BIKE', 'TRUCK', 'TRICYCLE', 'BICYCLE'] as const;
export type VehicleType = (typeof VEHICLE_TYPES)[number];

export const ORDER_STATUSES = [
  'PENDING',
  'ACCEPTED',
  'ARRIVED',
  'IN_PROGRESS',
  'COMPLETED',
  'SEARCHING_FOR_DRIVER',
  'RESERVED',
  'DRIVER_ARRIVING_PICKUP',
  'PICKED_UP',
  'IN_TRANSIT',
  'DELIVERED',
  'NO_DRIVER_FOUND',
  'CANCELLED',
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const DRIVER_ACTIVE_ORDER_STATUSES: OrderStatus[] = [
  'RESERVED',
  'DRIVER_ARRIVING_PICKUP',
  'PICKED_UP',
  'IN_TRANSIT',
];

export const CLOSED_ORDER_STATUSES: OrderStatus[] = [
  'COMPLETED',
  'DELIVERED',
  'CANCELLED',
  'NO_DRIVER_FOUND',
];

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

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface TripRoute {
  pickupLocation: string;
  dropoffLocation: string;
  pickupLat: number;
  pickupLng: number;
  dropoffLat: number;
  dropoffLng: number;
}
