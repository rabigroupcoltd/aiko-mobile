import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Runtime access to build-time config.
 *
 * The Maps key itself is injected natively into AndroidManifest.xml by prebuild
 * (via `android.config.googleMaps.apiKey`), so the JS side never needs the value
 * — only whether one was configured, so `MapPanel` can fall back to a static
 * placeholder instead of rendering a blank grey tile.
 */
const androidConfig = Constants.expoConfig?.android?.config as
  | { googleMaps?: { apiKey?: string } }
  | undefined;

/**
 * Whether iOS was built with a Google Maps key (GOOGLE_MAPS_IOS_API_KEY). Without
 * one, iOS uses Apple Maps, which needs no key at all.
 */
export const IOS_USES_GOOGLE_MAPS = Boolean(
  (Constants.expoConfig?.extra as { iosGoogleMaps?: boolean } | undefined)?.iosGoogleMaps,
);

export const HAS_MAPS_KEY =
  Platform.OS === 'ios' ? true : Boolean(androidConfig?.googleMaps?.apiKey);

/**
 * Whether the app can call Google Places directly.
 *
 * Separate from HAS_MAPS_KEY: that one is baked into AndroidManifest.xml for
 * map tiles and is restricted to this app's package + SHA-1, which a plain
 * HTTPS call from JS does not present. This key has to be usable from a bare
 * fetch, so it's restricted by API instead — see .env.example.
 */
export const HAS_PLACES_KEY = Boolean(process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY);

/**
 * Where the API lives.
 *
 * The default targets the Android emulator: `10.0.2.2` is the host machine as
 * seen from inside it, and `localhost` there would resolve to the emulator
 * itself. On a physical device set EXPO_PUBLIC_API_BASE_URL to your machine's
 * LAN address — the phone cannot reach the host any other way.
 */
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://10.0.2.2:3000/api';

/** Long enough for a cold start on the API, short enough to fail visibly. */
export const API_TIMEOUT_MS = 30000;

/** The Socket.IO namespace, derived so it always follows the API host. */
export const WEBSOCKET_URL = `${API_BASE_URL.replace(/\/api\/?$/, '')}/ride`;

/** Minna city centre — the default map camera. */
export const MINNA_CENTER = {
  latitude: 9.6139,
  longitude: 6.5569,
  latitudeDelta: 0.09,
  longitudeDelta: 0.09,
} as const;
