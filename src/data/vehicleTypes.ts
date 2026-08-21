import type { VehicleType as ApiVehicleType } from '@/modules/shared/apiTypes';
import type { VehicleType } from '@/types/models';

/**
 * How to render each of the API's vehicle types.
 *
 * Covers the whole server enum, including the three Aiko no longer dispatches.
 * Aiko is a parcel service now — okada and keke only — and the pricing API
 * returns rate cards for nothing else, so CAR, TRUCK and BICYCLE can never
 * appear in a picker. They stay here because an order placed before that scope
 * change still has `vehicleType: 'CAR'` on it, and a trip in someone's history
 * should say what it actually was rather than falling back to a keke.
 */
export const VEHICLE_PRESENTATION: Record<
  ApiVehicleType,
  { label: string; localName: string; emoji: string; capacity: string }
> = {
  BIKE: { label: 'Bike', localName: 'Okada', emoji: '🏍️', capacity: '1 passenger' },
  TRICYCLE: { label: 'Tricycle', localName: 'Keke NAPEP', emoji: '🛺', capacity: 'Up to 3' },
  CAR: { label: 'Car', localName: 'Taxi', emoji: '🚗', capacity: 'Up to 4' },
  BICYCLE: { label: 'Bicycle', localName: 'Bicycle', emoji: '🚲', capacity: 'Small parcels' },
  TRUCK: { label: 'Truck', localName: 'Lorry', emoji: '🚚', capacity: 'Bulky loads' },
};

export const describeVehicle = (type: ApiVehicleType) =>
  VEHICLE_PRESENTATION[type] ?? VEHICLE_PRESENTATION.TRICYCLE;

export interface VehicleDefinition {
  id: VehicleType;
  label: string;
  /** What locals actually call it. */
  localName: string;
  description: string;
  emoji: string;
  capacity: string;
  /** Multiplier applied to the base fare estimate. */
  fareMultiplier: number;
}

/**
 * The local onboarding id as the API spells it.
 *
 * The rider screens work in `'bike' | 'tricycle'` — a UI choice — while every
 * endpoint wants `'BIKE' | 'TRICYCLE'`. One helper rather than a `.toUpperCase()`
 * at each call site, so the two vocabularies meet in exactly one place and the
 * compiler checks the result.
 */
export const toApiVehicleType = (id: VehicleType): Extract<ApiVehicleType, 'BIKE' | 'TRICYCLE'> =>
  id === 'bike' ? 'BIKE' : 'TRICYCLE';

export const VEHICLE_TYPES: VehicleDefinition[] = [
  {
    id: 'bike',
    label: 'Bike',
    localName: 'Okada',
    description: 'Fastest through traffic. One passenger or a small parcel.',
    emoji: '🏍️',
    capacity: '1 passenger',
    fareMultiplier: 1,
  },
  {
    id: 'tricycle',
    label: 'Tricycle',
    localName: 'Keke NAPEP',
    description: 'More room and shelter. Up to three passengers or bulky loads.',
    emoji: '🛺',
    capacity: 'Up to 3 passengers',
    fareMultiplier: 1.4,
  },
];

export const getVehicle = (id: VehicleType): VehicleDefinition =>
  VEHICLE_TYPES.find((v) => v.id === id) ?? VEHICLE_TYPES[0];
