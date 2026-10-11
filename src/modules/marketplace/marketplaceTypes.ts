import type { Order } from '@/modules/orders/ordersTypes';
import type { OrderStatus, PaymentMethod, VehicleType } from '@/modules/shared/apiTypes';

export type RouteMatch = 'GREAT' | 'GOOD' | 'FAIR' | 'POOR';

export interface OrderCompatibility {
  compatible: boolean;
  additionalDistanceKm: number;
  additionalTimeMinutes: number;
  routeScore: number;
  match: RouteMatch;
  pickupDistanceKm: number;
  existingDelayMinutes: number;
  reason: string;
}

export interface MarketplaceOrder {
  id: string;
  vehicleType: VehicleType;
  description: string | null;
  pickupLocation: string;
  pickupLat: number;
  pickupLng: number;
  dropoffLocation: string;
  dropoffLat: number;
  dropoffLng: number;
  distanceKm: number;
  durationMins: number;
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

export const ORDER_ALREADY_RESERVED = 'ORDER_ALREADY_RESERVED';
export const MAX_ORDER_CAPACITY_REACHED = 'MAX_ORDER_CAPACITY_REACHED';
