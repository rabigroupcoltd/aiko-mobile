import type { ComponentType, ReactNode } from 'react';
import type { MapViewProps, MarkerProps, PolylineProps } from 'react-native-maps';

// Metro resolves this to MapView.native.tsx or MapView.web.tsx at build time
// based on platform. This declaration only exists so `tsc` can type-check
// the shared, extension-less import path (`../components/MapView`).
export const MapView: ComponentType<MapViewProps & { children?: ReactNode }>;
export const Marker: ComponentType<MarkerProps & { children?: ReactNode }>;
export const Polyline: ComponentType<PolylineProps>;
