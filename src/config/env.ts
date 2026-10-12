export const HAS_PLACES_KEY = Boolean(process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY);

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://10.0.2.2:3000/api';

export const API_TIMEOUT_MS = 30000;

export const WEBSOCKET_URL = `${API_BASE_URL.replace(/\/api\/?$/, '')}/ride`;

export const MINNA_CENTER = {
  latitude: 9.6139,
  longitude: 6.5569,
  latitudeDelta: 0.09,
  longitudeDelta: 0.09,
} as const;
