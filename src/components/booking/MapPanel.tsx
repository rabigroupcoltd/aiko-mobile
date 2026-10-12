import { Camera, GeoJSONSource, Layer, Map, Marker, type CameraStop } from '@maplibre/maplibre-react-native';
import { useMemo } from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { Icon } from '@/components/ui';
import { MINNA_CENTER } from '@/config/env';
import { green, makeStyles, radius, useTheme } from '@/theme';
import type { Place } from '@/types/models';

const STYLE_LIGHT = 'https://tiles.openfreemap.org/styles/liberty';
const STYLE_DARK = 'https://tiles.openfreemap.org/styles/dark';

const PADDING = { top: 60, right: 60, bottom: 60, left: 60 };

interface MapPanelProps {
  pickup?: Place | null;
  dropoff?: Place | null;
  style?: ViewStyle;
  showRoute?: boolean;
  driver?: { lat: number; lng: number; heading?: number } | null;
  driverTarget?: 'pickup' | 'dropoff';
  driverLabel?: string | null;
}

type LngLat = [number, number];

const toLngLat = (p: { lat: number; lng: number }): LngLat => [p.lng, p.lat];

function cameraFor(points: LngLat[]): CameraStop {
  if (points.length === 0) {
    return { center: [MINNA_CENTER.longitude, MINNA_CENTER.latitude], zoom: 12 };
  }
  const lngs = points.map((p) => p[0]);
  const lats = points.map((p) => p[1]);
  const west = Math.min(...lngs);
  const east = Math.max(...lngs);
  const south = Math.min(...lats);
  const north = Math.max(...lats);

  if (points.length === 1 || (east - west < 0.0005 && north - south < 0.0005)) {
    return { center: points[0], zoom: 15, duration: 600, easing: 'ease' };
  }
  return { bounds: [west, south, east, north], padding: PADDING, duration: 600, easing: 'ease' };
}

function line(from: LngLat, to: LngLat): GeoJSON.Feature<GeoJSON.LineString> {
  return { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [from, to] } };
}

export function MapPanel({
  pickup,
  dropoff,
  style,
  showRoute = true,
  driver,
  driverTarget = 'pickup',
  driverLabel,
}: MapPanelProps) {
  const styles = useStyles();
  const { colors } = useTheme();

  const target = driverTarget === 'dropoff' ? dropoff : pickup;

  const stop = useMemo(
    () => cameraFor([pickup, dropoff, driver].filter(Boolean).map((p) => toLngLat(p!))),
    [pickup?.lat, pickup?.lng, dropoff?.lat, dropoff?.lng, driver?.lat, driver?.lng],
  );

  const trip = showRoute && pickup && dropoff ? line(toLngLat(pickup), toLngLat(dropoff)) : null;
  const approach = driver && target ? line(toLngLat(driver), toLngLat(target)) : null;

  return (
    <View style={[styles.container, style]}>
      <Map
        style={StyleSheet.absoluteFill}
        mapStyle={colors.isDark ? STYLE_DARK : STYLE_LIGHT}
        logo={false}
        attribution
        attributionPosition={{ bottom: 6, right: 6 }}
        compass={false}>
        <Camera {...stop} />

        {trip ? (
          <GeoJSONSource id="trip" data={trip}>
            <Layer
              id="trip-line"
              type="line"
              layout={{ 'line-cap': 'round', 'line-join': 'round' }}
              paint={{ 'line-color': colors.primary, 'line-width': 4, 'line-opacity': 0.85 }}
            />
          </GeoJSONSource>
        ) : null}

        {approach ? (
          <GeoJSONSource id="approach" data={approach}>
            <Layer
              id="approach-line"
              type="line"
              layout={{ 'line-cap': 'round' }}
              paint={{ 'line-color': green[900], 'line-width': 3, 'line-dasharray': [1.5, 1.5] }}
            />
          </GeoJSONSource>
        ) : null}

        {pickup ? (
          <Marker id="pickup" lngLat={toLngLat(pickup)} anchor="center">
            <View style={[styles.pin, styles.pinPickup]} />
          </Marker>
        ) : null}

        {dropoff ? (
          <Marker id="dropoff" lngLat={toLngLat(dropoff)} anchor="bottom">
            <View style={styles.dropoff}>
              <Icon name="map-pin" size={30} color={green[900]} strokeWidth={2.4} />
            </View>
          </Marker>
        ) : null}

        {driver ? (
          <Marker id="driver" lngLat={toLngLat(driver)} anchor={driverLabel ? 'bottom' : 'center'}>
            <View style={styles.driverPin}>
              {driverLabel ? (
                <View style={styles.label}>
                  <Text style={styles.labelText} numberOfLines={1}>
                    {driverLabel}
                  </Text>
                </View>
              ) : null}
              <View style={styles.driver}>
                <Icon name="bike" size={18} color="#FFFFFF" strokeWidth={2.4} />
              </View>
            </View>
          </Marker>
        ) : null}
      </Map>
    </View>
  );
}

const useStyles = makeStyles(({ colors }) => ({
  container: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surfaceAlt,
  },
  pin: { width: 18, height: 18, borderRadius: 9, borderWidth: 4, backgroundColor: '#FFFFFF' },
  pinPickup: { borderColor: colors.primary },
  dropoff: { alignItems: 'center' },
  driverPin: { alignItems: 'center' },
  label: {
    maxWidth: 180,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: green[900],
    marginBottom: 4,
  },
  labelText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },
  driver: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
}));
