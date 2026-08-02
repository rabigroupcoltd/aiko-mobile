import type { VehicleType as ApiVehicleType } from '@/modules/shared/apiTypes';
import type { VehicleType } from '@/types/models';

/**
 * How to render each of the API's vehicle types.
 *
 * Keyed on the server's enum, not the local `'bike' | 'tricycle'` union below.
 * The two are separate on purpose: `VEHICLE_TYPES` is the *rider onboarding*
 * choice, which is deliberately limited to what Aiko signs drivers up for in
 * Minna, while a passenger sees whatever the pricing API says is active — so
 * this map has to cover every enum member, including ones no local driver
 * registers as.
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
