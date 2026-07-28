import type { VehicleType } from '@/types/models';

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
