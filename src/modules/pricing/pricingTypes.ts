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
  avgSpeedKph: number;
  platformFeePercent: number;
  currency: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FareBreakdown {
  baseFare: number;
  distanceCharge: number;
  timeCharge: number;
  bookingFee: number;
  surgeMultiplier: number;
  minimumFareApplied: boolean;
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

export interface FareEstimatePayload {
  vehicleType: VehicleType;
  pickupLat: number;
  pickupLng: number;
  dropoffLat: number;
  dropoffLng: number;
}

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
