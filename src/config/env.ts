import Constants from 'expo-constants';
import { Platform } from 'react-native';

const androidConfig = Constants.expoConfig?.android?.config as
  | { googleMaps?: { apiKey?: string } }
  | undefined;

export const IOS_USES_GOOGLE_MAPS = Boolean(
  (Constants.expoConfig?.extra as { iosGoogleMaps?: boolean } | undefined)?.iosGoogleMaps,
);

export const HAS_MAPS_KEY =
  Platform.OS === 'ios' ? true : Boolean(androidConfig?.googleMaps?.apiKey);

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
