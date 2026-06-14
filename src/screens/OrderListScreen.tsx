import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Filter, Package, ChevronRight, MapPin, Navigation } from 'lucide-react-native';
import { MapView, Marker } from '../components/MapView';
import { COLORS, SPACING } from '../theme';

const MOCK_ORDERS = [
  { id: 'ORD-8821', pickup: 'Ikeja GRA', dropoff: 'Victoria Island', price: '₦2,400', distance: '4.2 km', time: '2 min', status: 'new', lat: 6.59, lng: 3.34 },
  { id: 'ORD-8822', pickup: 'Lekki Phase 1', dropoff: 'Surulere', price: '₦1,800', distance: '6.5 km', time: '4 min', status: 'new', lat: 6.44, lng: 3.47 },
  { id: 'ORD-8823', pickup: 'Ajah', dropoff: 'Maryland', price: '₦3,100', distance: '10 km', time: '1 min', status: 'hot', lat: 6.47, lng: 3.56 },
];

const FILTERS = ['All', 'Nearby', 'High Pay', 'Quick'];

export const OrderListScreen = () => {
  const navigation = useNavigation<any>();
  const [activeFilter, setActiveFilter] = useState('All');
  const [view, setView] = useState<'list' | 'map'>('list');

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Available Orders</Text>
          <Text style={styles.headerSub}>{MOCK_ORDERS.length} orders near you</Text>
        </View>
        <TouchableOpacity style={styles.viewToggle} onPress={() => setView(v => v === 'list' ? 'map' : 'list')}>
          <MapPin size={18} color={view === 'map' ? COLORS.primary : COLORS.textMuted} />
          <Text style={[styles.viewToggleTxt, view === 'map' && { color: COLORS.primary }]}>
            {view === 'list' ? 'Map' : 'List'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Filter chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, activeFilter === f && styles.filterChipActive]}
            onPress={() => setActiveFilter(f)}
          >
            <Text style={[styles.filterChipText, activeFilter === f && styles.filterChipTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {view === 'map' ? (
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            initialRegion={{ latitude: 6.5244, longitude: 3.3792, latitudeDelta: 0.2, longitudeDelta: 0.2 }}
          >
            {MOCK_ORDERS.map(order => (
              <Marker key={order.id} coordinate={{ latitude: order.lat, longitude: order.lng }}>
                <TouchableOpacity
                  style={styles.mapPin}
                  onPress={() => navigation.navigate('OrderAcceptance', { order })}
                >
                  <Text style={styles.mapPinText}>{order.price}</Text>
                </TouchableOpacity>
              </Marker>
            ))}
          </MapView>
        </View>
      ) : (
        <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
          {MOCK_ORDERS.map(order => (
            <TouchableOpacity
              key={order.id}
              style={styles.orderCard}
              onPress={() => navigation.navigate('OrderAcceptance', { order })}
            >
              {order.status === 'hot' && (
                <View style={styles.hotBadge}><Text style={styles.hotBadgeTxt}>🔥 Hot</Text></View>
              )}
              <View style={styles.cardHeader}>
                <View style={styles.orderIconBox}>
                  <Package size={22} color={COLORS.primary} />
                </View>
                <View style={styles.cardMeta}>
                  <Text style={styles.orderId}>{order.id}</Text>
                  <Text style={styles.orderTime}>{order.time} away</Text>
                </View>
                <Text style={styles.orderPrice}>{order.price}</Text>
              </View>

              <View style={styles.routeSection}>
                <View style={styles.routeRow}>
                  <View style={[styles.dot, { backgroundColor: COLORS.primary }]} />
                  <Text style={styles.routeText} numberOfLines={1}>{order.pickup}</Text>
                </View>
                <View style={styles.routeLine} />
                <View style={styles.routeRow}>
                  <View style={[styles.dot, { backgroundColor: '#FF4B4B' }]} />
                  <Text style={styles.routeText} numberOfLines={1}>{order.dropoff}</Text>
                </View>
              </View>

              <View style={styles.cardFooter}>
                <Text style={styles.distanceTxt}>{order.distance}</Text>
                <View style={styles.acceptTag}>
                  <Text style={styles.acceptTagTxt}>Tap to accept →</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
    paddingTop: Platform.OS === 'android' ? SPACING.xl : SPACING.md,
    paddingBottom: SPACING.md,
  },
  headerTitle: { fontSize: 24, fontWeight: '900', color: COLORS.black },
  headerSub: { fontSize: 13, color: COLORS.textMuted, fontWeight: '600', marginTop: 2 },
  viewToggle: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.surface, padding: SPACING.md,
    borderRadius: 16, borderWidth: 1, borderColor: COLORS.border,
  },
  viewToggleTxt: { fontSize: 13, fontWeight: '700', color: COLORS.textMuted },
  filterRow: { paddingHorizontal: SPACING.xl, gap: SPACING.sm, paddingBottom: SPACING.md },
  filterChip: {
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm,
    borderRadius: 20, backgroundColor: COLORS.surface,
    borderWidth: 1.5, borderColor: COLORS.border,
  },
  filterChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterChipText: { fontSize: 13, fontWeight: '700', color: COLORS.textMuted },
  filterChipTextActive: { color: COLORS.white },
  mapContainer: { flex: 1, margin: SPACING.xl, borderRadius: 28, overflow: 'hidden' },
  map: { flex: 1 },
  mapPin: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 20,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  mapPinText: { fontSize: 13, fontWeight: '900', color: COLORS.white },
  list: { flex: 1, paddingHorizontal: SPACING.xl },
  orderCard: {
    backgroundColor: COLORS.white,
    borderRadius: 28,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  hotBadge: {
    position: 'absolute', top: 12, right: 12,
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20,
  },
  hotBadgeTxt: { fontSize: 11, fontWeight: '800', color: '#E65100' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md },
  orderIconBox: {
    width: 44, height: 44, borderRadius: 16,
    backgroundColor: COLORS.primary + '12',
    alignItems: 'center', justifyContent: 'center',
    marginRight: SPACING.md,
  },
  cardMeta: { flex: 1 },
  orderId: { fontSize: 15, fontWeight: '800', color: COLORS.black },
  orderTime: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600' },
  orderPrice: { fontSize: 18, fontWeight: '900', color: COLORS.primary },
  routeSection: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  dot: { width: 10, height: 10, borderRadius: 5 },
  routeText: { flex: 1, fontSize: 13, fontWeight: '700', color: COLORS.text },
  routeLine: { width: 2, height: 12, backgroundColor: COLORS.border, marginLeft: 4, marginVertical: 4 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  distanceTxt: { fontSize: 12, fontWeight: '700', color: COLORS.textMuted },
  acceptTag: {
    backgroundColor: COLORS.primary + '12',
    paddingHorizontal: SPACING.md, paddingVertical: 6,
    borderRadius: 16,
  },
  acceptTagTxt: { fontSize: 12, fontWeight: '800', color: COLORS.primary },
});
