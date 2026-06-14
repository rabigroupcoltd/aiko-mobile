import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ChevronLeft, MapPin, Navigation, Phone, MessageCircle, Clock, DollarSign } from 'lucide-react-native';
import { MapView } from '../components/MapView';
import { Button } from '../components/Button';
import { COLORS, SPACING } from '../theme';

export const OrderViewScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const order = route.params?.order || {
    id: 'ORD-8821',
    pickupAddress: 'Ikeja GRA, Lagos',
    dropoffAddress: 'Victoria Island Mall, VI Lagos',
    distance: '4.2 km',
    duration: '18 min',
    earnings: '₦2,400',
    status: 'ACCEPTED',
    customerName: 'Amara Johnson',
    customerPhone: '+234 802 123 4567',
    packageDesc: 'Electronics – Handle with care',
  };

  return (
    <View style={styles.container}>
      {/* Map showing route */}
      <MapView
        style={styles.map}
        initialRegion={{ latitude: 6.5244, longitude: 3.3792, latitudeDelta: 0.06, longitudeDelta: 0.06 }}
      />

      <SafeAreaView style={styles.headerBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
        <View style={{ width: 44 }} />
      </SafeAreaView>

      {/* Bottom card */}
      <View style={styles.card}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Status pill */}
          <View style={styles.statusRow}>
            <View style={styles.statusPill}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>{order.status}</Text>
            </View>
            <Text style={styles.orderId}>{order.id}</Text>
          </View>

          {/* Customer info */}
          <View style={styles.customerCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{order.customerName.charAt(0)}</Text>
            </View>
            <View style={styles.customerInfo}>
              <Text style={styles.customerName}>{order.customerName}</Text>
              <Text style={styles.packageDesc}>{order.packageDesc}</Text>
            </View>
            <View style={styles.contactBtns}>
              <TouchableOpacity style={styles.contactBtn}>
                <Phone size={18} color={COLORS.primary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.contactBtn}>
                <MessageCircle size={18} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Route */}
          <View style={styles.routeCard}>
            <View style={styles.routeRow}>
              <View style={[styles.routeDot, { backgroundColor: COLORS.primary }]} />
              <View style={styles.routeInfo}>
                <Text style={styles.routeLabel}>PICK UP</Text>
                <Text style={styles.routeAddress}>{order.pickupAddress}</Text>
              </View>
            </View>
            <View style={styles.routeConnector} />
            <View style={styles.routeRow}>
              <View style={[styles.routeDot, { backgroundColor: '#FF4B4B' }]} />
              <View style={styles.routeInfo}>
                <Text style={styles.routeLabel}>DROP OFF</Text>
                <Text style={styles.routeAddress}>{order.dropoffAddress}</Text>
              </View>
            </View>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Clock size={18} color={COLORS.primary} />
              <Text style={styles.statValue}>{order.duration}</Text>
              <Text style={styles.statLabel}>Duration</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Navigation size={18} color={COLORS.primary} />
              <Text style={styles.statValue}>{order.distance}</Text>
              <Text style={styles.statLabel}>Distance</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <DollarSign size={18} color={COLORS.primary} />
              <Text style={[styles.statValue, { color: COLORS.primary }]}>{order.earnings}</Text>
              <Text style={styles.statLabel}>Earnings</Text>
            </View>
          </View>
        </ScrollView>

        <Button
          title="Update Order Status"
          onPress={() => navigation.navigate('UpdateOrderStatus', { order })}
          style={styles.actionBtn}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { ...StyleSheet.absoluteFillObject },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: Platform.OS === 'android' ? SPACING.xxl : 0,
  },
  backBtn: {
    width: 44, height: 44, borderRadius: 16,
    backgroundColor: COLORS.white,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 6,
  },
  headerTitle: {
    fontSize: 17, fontWeight: '800',
    color: COLORS.black,
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 16,
  },
  card: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    padding: SPACING.xl,
    paddingBottom: Platform.OS === 'ios' ? 40 : SPACING.xl,
    maxHeight: '60%',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.primary + '12',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 20,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary },
  statusText: { fontSize: 13, fontWeight: '800', color: COLORS.primary },
  orderId: { fontSize: 13, fontWeight: '700', color: COLORS.textMuted },
  customerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1, borderColor: COLORS.border,
  },
  avatar: {
    width: 48, height: 48, borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
    marginRight: SPACING.md,
  },
  avatarText: { fontSize: 20, fontWeight: '900', color: COLORS.white },
  customerInfo: { flex: 1 },
  customerName: { fontSize: 16, fontWeight: '800', color: COLORS.black },
  packageDesc: { fontSize: 12, color: COLORS.textMuted, marginTop: 2, fontWeight: '600' },
  contactBtns: { flexDirection: 'row', gap: SPACING.sm },
  contactBtn: {
    width: 40, height: 40, borderRadius: 14,
    backgroundColor: COLORS.primary + '12',
    alignItems: 'center', justifyContent: 'center',
  },
  routeCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1, borderColor: COLORS.border,
  },
  routeRow: { flexDirection: 'row', alignItems: 'flex-start' },
  routeDot: { width: 12, height: 12, borderRadius: 6, marginTop: 4, marginRight: SPACING.md },
  routeConnector: { width: 2, height: 16, backgroundColor: COLORS.border, marginLeft: 5, marginVertical: 4 },
  routeInfo: { flex: 1 },
  routeLabel: { fontSize: 10, fontWeight: '800', color: COLORS.textMuted, letterSpacing: 1 },
  routeAddress: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginTop: 2 },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderWidth: 1, borderColor: COLORS.border,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statValue: { fontSize: 15, fontWeight: '900', color: COLORS.black },
  statLabel: { fontSize: 11, color: COLORS.textMuted, fontWeight: '600' },
  statDivider: { width: 1, backgroundColor: COLORS.border },
  actionBtn: { height: 56 },
});
