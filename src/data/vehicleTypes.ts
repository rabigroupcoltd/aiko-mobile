import type { VehicleType as ApiVehicleType } from '@/modules/shared/apiTypes';
import type { VehicleType } from '@/types/models';

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
  localName: string;
  description: string;
  emoji: string;
  capacity: string;
  fareMultiplier: number;
}

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
