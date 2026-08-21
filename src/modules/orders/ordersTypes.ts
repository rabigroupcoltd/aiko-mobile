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
  /** Who to call at each end. Often not the account holder on either side. */
  pickupPhone: string | null;
  dropoffPhone: string | null;
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
  /** Stamped when a driver claims it — the RESERVED half of reserved-vs-picked-up. */
  reservedAt: string | null;
  arrivedAt: string | null;
  startedAt: string | null;
  /** Stamped when the driver physically collects it. */
  pickedUpAt: string | null;
  deliveredAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  /** How wide the driver search has reached. Null on non-marketplace orders. */
  searchRadiusKm: number | null;
  dispatchAttempts: number;
  createdAt: string;
  updatedAt: string;
  user: ContactUser;
  driver: OrderDriver | null;
}

/**
 * When the customer's own order lands.
 *
 * `driverHandlingOtherOrders` is deliberately a boolean and nothing more — §20:
 * the customer learns their driver has other work and how long it costs them,
 * never what that work is or whose it is.
 */
export interface OrderEta {
  pickupMinutes: number | null;
  deliveryMinutes: number | null;
  driverHandlingOtherOrders: boolean;
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
  pickupPhone?: string;
  dropoffPhone?: string;
  /**
   * True opens the order at SEARCHING_FOR_DRIVER and announces it to nearby
   * drivers, who claim it themselves. This is what the Confirm Order button
   * sends. Omitted, the order is a direct PENDING booking as before.
   */
  dispatch?: boolean;
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
