import type { KycStatus, VehicleType } from '@/modules/shared/apiTypes';

/**
 * Platform-wide reporting. Admin only — a passenger or rider app will get 403
 * from every one of these. A driver's own numbers come from the drivers module.
 *
 * Rates come back as strings with one decimal place, not numbers.
 */

export interface AnalyticsOverview {
  totalUsers: number;
  totalDrivers: number;
  activeDrivers: number;
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  completionRate: string;
  cancellationRate: string;
  cashRevenue: number;
  transferRevenue: number;
  totalRevenue: number;
  platformEarnings: number;
  outstandingDebt: number;
}

export interface DriverAnalyticsRow {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  vehicleType: VehicleType;
  /** Model and plate, pre-formatted. */
  vehicle: string;
  status: KycStatus;
  isAvailable: boolean;
  isBlocked: boolean;
  totalTrips: number;
  completedTrips: number;
  cancelledTrips: number;
  earnings: number;
  platformFeePaid: number;
  currentDebt: number;
  debtLimit: number;
  rating: number;
  acceptanceRate: string;
  cancellationRate: string;
}

export interface OrderPeriodStats {
  total: number;
  completed: number;
  cancelled: number;
  pending: number;
  revenue: number;
}

export interface OrderAnalytics {
  today: OrderPeriodStats;
  thisWeek: OrderPeriodStats;
  thisMonth: OrderPeriodStats;
  /** Counted in the database rather than from a capped page of rows. */
  allTime: { total: number; revenue: number };
}

export interface RevenueChartPoint {
  /** YYYY-MM-DD. Days with no completed trip are absent, not zero-filled. */
  date: string;
  cash: number;
  transfer: number;
  total: number;
}

export interface RevenueAnalytics {
  chartData: RevenueChartPoint[];
  summary: {
    totalRevenue: number;
    cashRevenue: number;
    transferRevenue: number;
    averageOrderValue: number;
  };
}

export interface VehicleTypeAnalytics {
  vehicleType: VehicleType;
  isActive: boolean;
  baseFare: number;
  perKm: number;
  drivers: number;
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  revenue: number;
  platformEarnings: number;
}

export interface TopDriver {
  id: string;
  name: string | null;
  vehicleType: VehicleType;
  totalTrips: number;
  totalEarnings: number;
  rating: number;
}

export interface LowPerformingDriver {
  id: string;
  name: string | null;
  vehicleType: VehicleType;
  totalTrips: number;
  rating: number;
  currentDebt: number;
}
