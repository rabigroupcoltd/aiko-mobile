import type { Order } from '@/modules/orders/ordersTypes';
import type { OrderStatus, PaymentMethod, VehicleType } from '@/modules/shared/apiTypes';

/** How well an order fits the driver's current route, as the grid labels it. */
export type RouteMatch = 'GREAT' | 'GOOD' | 'FAIR' | 'POOR';

/**
 * The compatibility engine's verdict on one order for one driver.
 *
 * Scored server-side and never recomputed here — the client has no idea what
 * else the driver is carrying, and a second opinion could only disagree with the
 * one that actually decides whether the reservation is allowed.
 */
export interface OrderCompatibility {
  compatible: boolean;
  additionalDistanceKm: number;
  additionalTimeMinutes: number;
  /** 0–100. Higher is a better fit right now. */
  routeScore: number;
  match: RouteMatch;
  pickupDistanceKm: number;
  existingDelayMinutes: number;
  /** Plain-language explanation, shown to the driver verbatim. */
  reason: string;
}

/**
 * One card in the available-orders grid.
 *
 * Note what is missing: no customer name, no phone, no user id. None of it is
 * needed to decide whether to take the job, and it arrives with the reservation.
 */
export interface MarketplaceOrder {
  id: string;
  vehicleType: VehicleType;
  pickupLocation: string;
  pickupLat: number;
  pickupLng: number;
  dropoffLocation: string;
  dropoffLat: number;
  dropoffLng: number;
  distanceKm: number;
  durationMins: number;
  /** What the driver keeps — not what the customer pays. */
  earnings: number;
  fare: number;
  currency: string;
  paymentMethod: PaymentMethod;
  createdAt: string;
  ageSeconds: number;
  compatibility: OrderCompatibility;
}

export interface MarketplaceGrid {
  orders: MarketplaceOrder[];
  held: number;
  capacity: number;
  atCapacity: boolean;
}

export type StopKind = 'PICKUP' | 'DROPOFF';

export interface PlannedStop {
  orderId: string;
  kind: StopKind;
  lat: number;
  lng: number;
  address: string;
  phone: string | null;
  status: OrderStatus;
  sequence: number;
  legKm: number;
  cumulativeKm: number;
  etaMinutes: number;
}

export interface RoutePlan {
  stops: PlannedStop[];
  totalKm: number;
  totalMinutes: number;
  deliveryEtaByOrder: Record<string, number>;
  pickupEtaByOrder: Record<string, number>;
}

/** An order the driver is holding, with its place in the route. */
export interface ActiveOrder extends Order {
  deliveryEtaMinutes: number | null;
  pickupEtaMinutes: number | null;
}

export interface ActiveOrdersResponse {
  orders: ActiveOrder[];
  route: RoutePlan | null;
  held: number;
  capacity: number;
  status: DispatchStatus;
}

export type DispatchStatus = 'OFFLINE' | 'AVAILABLE' | 'BUSY';

/** The server's dispatch limits, so the client never hard-codes one. */
export interface MarketplaceConfig {
  maxReservedOrdersPerDriver: number;
  initialDriverRadiusKm: number;
  maxDriverRadiusKm: number;
  maxRouteDetourKm: number;
  maxRouteDetourPercent: number;
  maxExistingOrderDelayMinutes: number;
  allowIncompatibleReservation: boolean;
  skipCooldownMinutes: number;
}

export interface ReserveOrderResult {
  order: Order;
  compatibility: OrderCompatibility;
  held: number;
  capacity: number;
}

export interface MarketplaceQuery {
  lat?: number;
  lng?: number;
  radiusKm?: number;
  limit?: number;
}

export interface SkippedOrderAction {
  id: string;
  orderId: string;
  driverId: string;
  action: 'SKIPPED' | 'RESERVED';
  hiddenUntil: string | null;
  createdAt: string;
  updatedAt: string;
  order: {
    id: string;
    pickupLocation: string;
    dropoffLocation: string;
    distanceKm: number;
    fare: number;
    driverEarnings: number;
    currency: string;
    status: OrderStatus;
    createdAt: string;
  };
}

/** The two errors the reserve endpoint answers with, as the server words them. */
export const ORDER_ALREADY_RESERVED = 'ORDER_ALREADY_RESERVED';
export const MAX_ORDER_CAPACITY_REACHED = 'MAX_ORDER_CAPACITY_REACHED';
