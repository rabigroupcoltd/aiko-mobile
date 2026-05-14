import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MapPin } from 'lucide-react-native';
import { COLORS } from '../theme';

// Web stub — react-native-maps doesn't support web
// This file is loaded only on web via .web.tsx extension pattern

export const MapView = ({ style, children }: any) => (
  <View style={[styles.webMap, style]}>
    <View style={styles.mapGrid}>
      {Array.from({ length: 48 }).map((_, i) => (
        <View key={i} style={styles.gridCell} />
      ))}
    </View>
    <View style={styles.centerContent}>
      <View style={styles.pin}>
        <MapPin size={28} color={COLORS.white} />
      </View>
      <Text style={styles.label}>Map Preview</Text>
      <Text style={styles.sublabel}>Lagos, Nigeria</Text>
    </View>
  </View>
);

export const Marker = (_props: any) => null;
export const Polyline = (_props: any) => null;

const styles = StyleSheet.create({
  webMap: {
    backgroundColor: '#E8F5E9',
    overflow: 'hidden',
    position: 'relative',
  },
  mapGrid: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  gridCell: {
    width: '12.5%',
    aspectRatio: 1,
    borderWidth: 0.5,
    borderColor: '#C8E6C9',
  },
  centerContent: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -70 }, { translateY: -60 }],
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 20,
    padding: 16,
    width: 140,
    borderWidth: 2,
    borderColor: COLORS.primary,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  pin: {
    width: 48, height: 48, borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 13, fontWeight: '800',
    color: COLORS.black,
  },
  sublabel: {
    fontSize: 11, fontWeight: '600',
    color: COLORS.textMuted, marginTop: 2,
  },
});
