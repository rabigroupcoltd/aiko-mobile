import type { MockRider, RideRequest, VehicleType } from '@/types/models';

/**
 * Riders returned by the fake geo-matching step.
 *
 * Avatars are rendered as coloured initials by `<Avatar />` rather than bundled
 * photos — stock headshots of people who aren't real riders would be misleading
 * in a stakeholder demo, and initials read as obviously placeholder.
 */
export const MOCK_RIDERS: Omit<MockRider, 'avatar'>[] = [
  {
    id: 'rider-01',
    name: 'Ibrahim Musa',
    vehicle: 'bike',
    plate: 'NGR-482-MNA',
    rating: 4.8,
    trips: 1204,
    etaMinutes: 4,
  },
  {
    id: 'rider-02',
    name: 'Aisha Bello',
    vehicle: 'tricycle',
    plate: 'MNA-119-KEK',
    rating: 4.9,
    trips: 863,
    etaMinutes: 6,
  },
  {
    id: 'rider-03',
    name: 'Sunday Adeyemi',
    vehicle: 'bike',
    plate: 'NGR-777-BSO',
    rating: 4.7,
    trips: 2145,
    etaMinutes: 3,
  },
  {
    id: 'rider-04',
    name: 'Hauwa Danjuma',
    vehicle: 'tricycle',
    plate: 'MNA-305-KEK',
    rating: 4.6,
    trips: 512,
    etaMinutes: 8,
  },
  {
    id: 'rider-05',
    name: 'Yusuf Garba',
    vehicle: 'bike',
    plate: 'NGR-091-TNG',
    rating: 5.0,
    trips: 340,
    etaMinutes: 5,
  },
];

/** Pick a rider, preferring one matching the requested vehicle type. */
export function pickRider(preferred?: VehicleType) {
  const pool = preferred
    ? MOCK_RIDERS.filter((r) => r.vehicle === preferred)
    : MOCK_RIDERS;
  const list = pool.length > 0 ? pool : MOCK_RIDERS;
  return list[Math.floor(Math.random() * list.length)];
}

/** Inbound jobs shown on the rider dashboard. */
export const MOCK_RIDE_REQUESTS: RideRequest[] = [
  {
    id: 'req-01',
    passengerName: 'Fatima A.',
    pickup: 'Mobil Roundabout',
    dropoff: 'FUT Minna, Bosso Campus',
    distanceKm: 5.2,
    fare: 1200,
    expiresInSeconds: 20,
  },
  {
    id: 'req-02',
    passengerName: 'Chidi O.',
    pickup: 'Minna Central Market',
    dropoff: 'Tunga Market',
    distanceKm: 2.1,
    fare: 700,
    expiresInSeconds: 20,
  },
  {
    id: 'req-03',
    passengerName: 'Zainab M.',
    pickup: 'Kpakungu Roundabout',
    dropoff: 'IBB Specialist Hospital',
    distanceKm: 4.4,
    fare: 1000,
    expiresInSeconds: 20,
  },
];
