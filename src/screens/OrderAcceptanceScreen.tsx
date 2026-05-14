import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, Dimensions, Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MapPin, Navigation, X, CheckCircle } from 'lucide-react-native';
import { MapView } from '../components/MapView';
import { Button } from '../components/Button';
import { COLORS, SPACING } from '../theme';

const { width } = Dimensions.get('window');
const TIMER_SECONDS = 20;

export const OrderAcceptanceScreen = () => {
  const navigation = useNavigation<any>();
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const timerAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;

  // Entrance animation
  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, []);

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) { navigation.goBack(); return; }
    const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);

    // Animate timer ring
    Animated.timing(timerAnim, {
      toValue: timeLeft / TIMER_SECONDS,
      duration: 1000,
      useNativeDriver: false,
    }).start();

    return () => clearTimeout(timer);
  }, [timeLeft]);

  const timerColor = timerAnim.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: ['#FF4B4B', '#FFC107', COLORS.primary],
  });

  const mockOrder = {
    id: 'ORD-2026-8821',
    pickupAddress: '123 Luxury Street, Ikeja Lagos',
    dropoffAddress: 'Victoria Island Mall, VI Lagos',
    distance: '4.2 km',
    duration: '18 min',
    earnings: '₦2,400',
    tip: '₦300',
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{ latitude: 6.5244, longitude: 3.3792, latitudeDelta: 0.05, longitudeDelta: 0.05 }}
      />

      {/* Dimmed overlay */}
      <View style={styles.dimOverlay} />

      {/* Bottom acceptance card */}
      <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
        {/* Timer circle */}
        <View style={styles.timerSection}>
          <View style={styles.timerOuter}>
            <Animated.View style={[styles.timerFill, { opacity: timerAnim }]} />
            <View style={styles.timerInner}>
              <Animated.Text style={[styles.timerNumber, { color: timerColor }]}>
                {timeLeft}
              </Animated.Text>
              <Text style={styles.timerSec}>sec</Text>
            </View>
          </View>
          <Text style={styles.cardTitle}>New Order Request</Text>
          <Text style={styles.orderId}>{mockOrder.id}</Text>
        </View>

        {/* Route info */}
        <View style={styles.routeCard}>
          <View style={styles.routeRow}>
            <View style={[styles.routeDot, { backgroundColor: COLORS.primary }]} />
            <View style={styles.routeInfo}>
              <Text style={styles.routeLabel}>PICK UP</Text>
              <Text style={styles.routeAddress}>{mockOrder.pickupAddress}</Text>
            </View>
          </View>
          <View style={styles.routeConnector} />
          <View style={styles.routeRow}>
            <View style={[styles.routeDot, { backgroundColor: '#FF4B4B' }]} />
            <View style={styles.routeInfo}>
              <Text style={styles.routeLabel}>DROP OFF</Text>
              <Text style={styles.routeAddress}>{mockOrder.dropoffAddress}</Text>
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{mockOrder.distance}</Text>
            <Text style={styles.statLabel}>Distance</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{mockOrder.duration}</Text>
            <Text style={styles.statLabel}>Duration</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: COLORS.primary }]}>{mockOrder.earnings}</Text>
            <Text style={styles.statLabel}>Earnings</Text>
          </View>
        </View>

        {/* Action buttons */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.declineBtn} onPress={() => navigation.goBack()}>
            <X size={24} color={COLORS.error} />
            <Text style={styles.declineTxt}>Decline</Text>
          </TouchableOpacity>
          <Button
            title="Accept Order"
            onPress={() => navigation.navigate('OrderView', { order: mockOrder })}
            style={styles.acceptBtn}
            icon={<CheckCircle size={20} color={COLORS.white} />}
            iconPosition="left"
          />
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { ...StyleSheet.absoluteFillObject },
  dimOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  card: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    padding: SPACING.xl,
    paddingBottom: Platform.OS === 'ios' ? 44 : SPACING.xl,
  },
  timerSection: { alignItems: 'center', marginBottom: SPACING.xl },
  timerOuter: {
    width: 80, height: 80, borderRadius: 40,
    borderWidth: 4, borderColor: COLORS.primary + '30',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACING.md,
    position: 'relative',
  },
  timerFill: {
    position: 'absolute',
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: COLORS.primary + '15',
  },
  timerInner: { alignItems: 'center' },
  timerNumber: { fontSize: 26, fontWeight: '900' },
  timerSec: { fontSize: 10, fontWeight: '700', color: COLORS.textMuted, marginTop: -4 },
  cardTitle: { fontSize: 22, fontWeight: '900', color: COLORS.black },
  orderId: { fontSize: 13, color: COLORS.textMuted, fontWeight: '600', marginTop: 2 },
  routeCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
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
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 16, fontWeight: '900', color: COLORS.black },
  statLabel: { fontSize: 11, color: COLORS.textMuted, fontWeight: '600', marginTop: 2 },
  statDivider: { width: 1, backgroundColor: COLORS.border },
  actions: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  declineBtn: {
    width: 64, height: 56,
    borderRadius: 24,
    borderWidth: 2, borderColor: COLORS.error + '40',
    backgroundColor: COLORS.error + '08',
    alignItems: 'center', justifyContent: 'center',
    gap: 2,
  },
  declineTxt: { fontSize: 9, fontWeight: '800', color: COLORS.error },
  acceptBtn: { flex: 1, height: 56 },
});
