import type { DriverProfile } from '@/modules/drivers/driversTypes';
import type { FareBreakdown } from '@/modules/pricing/pricingTypes';
import type {
  OrderStatus,
  PaginationParams,
  PaymentMethod,
  PaymentStatus,
  TripRoute,
  VehicleType,
} from '@/modules/shared/apiTypes';

/** Only the columns a counterparty on a trip is allowed to see. */
export interface ContactUser {
  id: string;
  name: string | null;
  phone: string | null;
}

export interface OrderDriver extends DriverProfile {
  user: ContactUser;
}

export interface Order extends TripRoute {
  id: string;
  userId: string;
  driverId: string | null;
  vehicleType: VehicleType;
  distanceKm: number;
  durationMins: number;
  fare: number;
  currency: string;
  /** The fare breakdown, frozen at booking so a later price change cannot rewrite it. */
  pricingSnapshot: FareBreakdown | null;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  platformFee: number;
  driverEarnings: number;
  cancellationReason: string | null;
  acceptedAt: string | null;
  arrivedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  user: ContactUser;
  driver: OrderDriver | null;
}

export interface RideMessage {
  id: string;
  orderId: string;
  senderId: string;
  content: string;
  readAt: string | null;
  createdAt: string;
}

export interface RideRating {
  id: string;
  orderId: string;
  raterId: string;
  rateeId: string;
  score: number;
  comment: string | null;
  createdAt: string;
}

// -------------------------------------------------------------- requests

/**
 * `fare` is deliberately absent — it is computed server-side from the active
 * pricing rule, so a client cannot set its own price.
 */
export interface CreateOrderPayload extends TripRoute {
  vehicleType: VehicleType;
  paymentMethod: PaymentMethod;
  /** Set when the order comes out of an accepted bid, so the quote is reused. */
  rideRequestId?: string;
}

export interface ListOrdersParams extends PaginationParams {
  status?: OrderStatus;
  /** Admin only — everyone else is scoped to their own trips regardless. */
  userId?: string;
  driverId?: string;
  vehicleType?: VehicleType;
}

export interface UpdateOrderStatusVariables {
  id: string;
  status: OrderStatus;
  reason?: string;
}

export interface CancelOrderVariables {
  id: string;
  reason?: string;
}

export interface SendMessageVariables {
  id: string;
  content: string;
}

export interface RateOrderVariables {
  id: string;
  score: number;
  comment?: string;
}
