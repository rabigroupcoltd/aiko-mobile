import { useEffect, useRef } from 'react';
import { Platform, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';

import { HAS_MAPS_KEY, IOS_USES_GOOGLE_MAPS, MINNA_CENTER } from '@/config/env';
import { makeStyles, radius, spacing, useTheme } from '@/theme';
import type { Place } from '@/types/models';
import { DARK_MAP_STYLE } from './mapStyle';

interface MapPanelProps {
  pickup?: Place | null;
  dropoff?: Place | null;
  style?: ViewStyle;
  showRoute?: boolean;
  driver?: { lat: number; lng: number; heading?: number } | null;
}

export function MapPanel({
  pickup,
  dropoff,
  style,
  showRoute = true,
  driver,
}: MapPanelProps) {
  const styles = useStyles();
  const { colors } = useTheme();
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    if (!HAS_MAPS_KEY || !mapRef.current || !driver) return;

    mapRef.current.animateCamera({ center: { latitude: driver.lat, longitude: driver.lng } }, {
      duration: 500,
    });
  }, [driver]);

  useEffect(() => {
    if (!HAS_MAPS_KEY || !mapRef.current) return;
    if (driver) return;

    const points = [pickup, dropoff].filter(Boolean) as Place[];
    if (points.length === 0) return;

    if (points.length === 1) {
      mapRef.current.animateToRegion(
        {
          latitude: points[0].lat,
          longitude: points[0].lng,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        },
        600
      );
      return;
    }

    mapRef.current.fitToCoordinates(
      points.map((p) => ({ latitude: p.lat, longitude: p.lng })),
      { edgePadding: { top: 70, right: 70, bottom: 70, left: 70 }, animated: true }
    );
  }, [pickup, dropoff, driver]);

  if (!HAS_MAPS_KEY) {
    return <MapFallback pickup={pickup} dropoff={dropoff} style={style} />;
  }

  return (
    <View style={[styles.container, style]}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        provider={Platform.OS === 'ios' && IOS_USES_GOOGLE_MAPS ? PROVIDER_GOOGLE : undefined}
        initialRegion={MINNA_CENTER}
        customMapStyle={colors.isDark ? DARK_MAP_STYLE : undefined}
        showsUserLocation={false}
        showsMyLocationButton={false}
        toolbarEnabled={false}>
        {pickup ? (
          <Marker
            coordinate={{ latitude: pickup.lat, longitude: pickup.lng }}
            title={pickup.name}
            description="Pickup"
            pinColor={colors.primary}
          />
        ) : null}

        {dropoff ? (
          <Marker
            coordinate={{ latitude: dropoff.lat, longitude: dropoff.lng }}
            title={dropoff.name}
            description="Drop-off"
          />
        ) : null}

        {driver ? (
          <Marker
            coordinate={{ latitude: driver.lat, longitude: driver.lng }}
            title="Your driver"
            rotation={driver.heading ?? 0}
            flat
            anchor={{ x: 0.5, y: 0.5 }}>
            <Text style={styles.driverMarker}>🛺</Text>
          </Marker>
        ) : null}

        {showRoute && pickup && dropoff ? (
          <Polyline
            coordinates={[
              { latitude: pickup.lat, longitude: pickup.lng },
              { latitude: dropoff.lat, longitude: dropoff.lng },
            ]}
            strokeColor={colors.primary}
            strokeWidth={4}
          />
        ) : null}
      </MapView>
    </View>
  );
}

function MapFallback({ pickup, dropoff, style }: MapPanelProps) {
  const styles = useStyles();

  return (
    <View style={[styles.container, styles.fallback, style]}>
      <View style={styles.grid} />
      <Text style={styles.pin}>📍</Text>
      <Text style={styles.fallbackTitle}>
        {dropoff?.name ?? pickup?.name ?? 'Minna, Niger State'}
      </Text>
      <Text style={styles.fallbackHint}>
        Map preview — set GOOGLE_MAPS_ANDROID_API_KEY in .env for live tiles
      </Text>
    </View>
  );
}

const useStyles = makeStyles(({ colors, type }) => ({
  container: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surfaceAlt,
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    padding: spacing.base,
  },
  grid: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.primarySubtle,
  },
  pin: { fontSize: 36 },
  driverMarker: { fontSize: 28 },
  fallbackTitle: { ...type.subheading, textAlign: 'center' },
  fallbackHint: {
    ...type.caption,
    textAlign: 'center',
    maxWidth: 260,
  },
}));
