import Constants from 'expo-constants';

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

export const HAS_MAPS_KEY = Boolean(androidConfig?.googleMaps?.apiKey);

/** Minna city centre — the default map camera. */
export const MINNA_CENTER = {
  latitude: 9.6139,
  longitude: 6.5569,
  latitudeDelta: 0.09,
  longitudeDelta: 0.09,
} as const;
