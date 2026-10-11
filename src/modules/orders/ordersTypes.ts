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
  pickupPhone: string | null;
  dropoffPhone: string | null;
  distanceKm: number;
  durationMins: number;
  fare: number;
  currency: string;
  pricingSnapshot: FareBreakdown | null;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  platformFee: number;
  driverEarnings: number;
  cancellationReason: string | null;
  acceptedAt: string | null;
  reservedAt: string | null;
  arrivedAt: string | null;
  startedAt: string | null;
  pickedUpAt: string | null;
  deliveredAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  searchRadiusKm: number | null;
  dispatchAttempts: number;
  createdAt: string;
  updatedAt: string;
  user: ContactUser;
  driver: OrderDriver | null;
}

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

export interface CreateOrderPayload extends TripRoute {
  vehicleType: VehicleType;
  paymentMethod: PaymentMethod;
  description?: string;
  pickupPhone?: string;
  dropoffPhone?: string;
  dispatch?: boolean;
  rideRequestId?: string;
}

export interface ListOrdersParams extends PaginationParams {
  status?: OrderStatus;
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

export interface UnreadCounts {
  counts: Record<string, number>;
  total: number;
}

export interface MarkReadResult {
  orderId: string;
  read: number;
  readAt: string;
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
