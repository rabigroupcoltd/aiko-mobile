import type { VehicleType } from '@/modules/shared/apiTypes';

export interface PricingRule {
  id: string;
  vehicleType: VehicleType;
  baseFare: number;
  perKm: number;
  perMinute: number;
  minimumFare: number;
  bookingFee: number;
  surgeMultiplier: number;
  /** Turns distance into an ETA — a bicycle and a car quote very differently. */
  avgSpeedKph: number;
  platformFeePercent: number;
  currency: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** How a fare was arrived at. Frozen into the order at booking time. */
export interface FareBreakdown {
  baseFare: number;
  distanceCharge: number;
  timeCharge: number;
  bookingFee: number;
  surgeMultiplier: number;
  minimumFareApplied: boolean;
  /** Only present on orders created from a bid. */
  fareOverridden?: boolean;
}

export interface FareQuote {
  vehicleType: VehicleType;
  currency: string;
  distanceKm: number;
  durationMins: number;
  fare: number;
  platformFee: number;
  driverEarnings: number;
  breakdown: FareBreakdown;
}

// -------------------------------------------------------------- requests

export interface FareEstimatePayload {
  vehicleType: VehicleType;
  pickupLat: number;
  pickupLng: number;
  dropoffLat: number;
  dropoffLng: number;
}

/** `vehicleType` is ignored by estimate/all, but the DTO still requires it. */
export type FareEstimateAllPayload = FareEstimatePayload;

export interface UpsertPricingRulePayload {
  baseFare: number;
  perKm: number;
  perMinute: number;
  minimumFare: number;
  bookingFee?: number;
  surgeMultiplier?: number;
  avgSpeedKph?: number;
  platformFeePercent?: number;
  currency?: string;
  isActive?: boolean;
}

export interface UpsertPricingRuleVariables extends UpsertPricingRulePayload {
  vehicleType: VehicleType;
}

export type UpdatePricingRulePayload = Partial<UpsertPricingRulePayload>;

export interface UpdatePricingRuleVariables extends UpdatePricingRulePayload {
  vehicleType: VehicleType;
}
