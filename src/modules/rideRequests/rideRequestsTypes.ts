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

/**
 * A bid as the request endpoints return it — with the driver attached.
 *
 * This is the shape the passenger chooses from, so it has to carry everything
 * that decision needs: who they are, what they drive, and how they rate.
 */
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
  /** After this the matcher gives up, subject to MATCHING_RETRIES. */
  expiresAt: string;
  matchedDriverIds: string[];
  orderId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RideRequestWithBids extends RideRequest {
  bids: RideBidWithDriver[];
  /** The passenger. `phone` is null on the browse endpoint — see `NearbyRideRequest`. */
  user: ContactUser;
}

/**
 * An open request found by browsing rather than by being matched into it.
 *
 * The extra fields are what a driver actually decides on: how far away the
 * pickup is *from them*, how long the offer has left, and whether they already
 * bid — none of which the ordinary request row carries.
 */
export interface NearbyRideRequest extends RideRequestWithBids {
  /** From the position sent with the query, not from the driver's last heartbeat. */
  pickupDistanceKm: number;
  secondsRemaining: number;
  hasBid: boolean;
}

export interface NearbyRideRequestsQuery {
  lat: number;
  lng: number;
  /** Defaults to the server's SEARCH_RADIUS_KM. */
  radiusKm?: number;
  limit?: number;
}

/** What creating a request returns: the row, its quote, and who was pinged. */
export interface RideRequestCreated {
  request: RideRequest;
  quote: FareQuote;
  matchedDrivers: NearbyDriver[];
}

// -------------------------------------------------------------- requests

export interface CreateRideRequestPayload extends TripRoute {
  vehicleType: VehicleType;
  paymentMethod?: PaymentMethod;
  /** How far to look for drivers. Defaults to SEARCH_RADIUS_KM. */
  radiusKm?: number;
}

/**
 * `requestId` comes from the path, so it is not sent in the body — the API
 * validates with forbidNonWhitelisted and would reject it.
 */
export interface PlaceBidVariables {
  requestId: string;
  /** Only becomes the fare when ALLOW_BID_FARE_OVERRIDE is on. */
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

/** The created order — accepting a bid turns the request into a trip. */
export type AcceptDriverResult = Order;
