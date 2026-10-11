import type { DriverProfile, NearbyDriver } from '@/modules/drivers/driversTypes';
import type { ContactUser, Order } from '@/modules/orders/ordersTypes';
import type { FareQuote } from '@/modules/pricing/pricingTypes';
import type {
  BidStatus,
  PaymentMethod,
  RideRequestStatus,
  TripRoute,
  VehicleType,
} from '@/modules/shared/apiTypes';

export interface RideBid {
  id: string;
  requestId: string;
  driverId: string;
  amount: number;
  note: string | null;
  status: BidStatus;
  createdAt: string;
  updatedAt: string;
}

export interface RideBidWithDriver extends RideBid {
  driver: DriverProfile & { user: ContactUser };
}

export interface RideRequest extends TripRoute {
  id: string;
  userId: string;
  vehicleType: VehicleType;
  distanceKm: number;
  durationMins: number;
  estimatedFare: number;
  paymentMethod: PaymentMethod;
  status: RideRequestStatus;
  expiresAt: string;
  matchedDriverIds: string[];
  orderId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RideRequestWithBids extends RideRequest {
  bids: RideBidWithDriver[];
  user: ContactUser;
}

export interface NearbyRideRequest extends RideRequestWithBids {
  pickupDistanceKm: number;
  secondsRemaining: number;
  hasBid: boolean;
}

export interface NearbyRideRequestsQuery {
  lat: number;
  lng: number;
  radiusKm?: number;
  limit?: number;
}

export interface RideRequestCreated {
  request: RideRequest;
  quote: FareQuote;
  matchedDrivers: NearbyDriver[];
}

export interface CreateRideRequestPayload extends TripRoute {
  vehicleType: VehicleType;
  paymentMethod?: PaymentMethod;
  radiusKm?: number;
}

export interface PlaceBidVariables {
  requestId: string;
  amount?: number;
  note?: string;
}

export interface AcceptDriverVariables {
  requestId: string;
  driverId: string;
}

export interface CancelRideRequestVariables {
  requestId: string;
  reason?: string;
}

export type AcceptDriverResult = Order;
