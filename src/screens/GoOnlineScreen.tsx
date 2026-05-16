import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
  ScrollView, Platform, Switch
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Power, MapPin, Package, ChevronRight, Star, Bell, RefreshCw, Menu } from 'lucide-react-native';
import { MapView } from '../components/MapView';
import { COLORS, SPACING } from '../theme';

const MOCK_ORDERS = [
  { id: 'ORD-8821', pickup: 'Ikeja GRA', dropoff: 'Victoria Island', price: '₦2,400', distance: '4.2 km', time: '2 min away' },
  { id: 'ORD-8822', pickup: 'Lekki Phase 1', dropoff: 'Surulere', price: '₦1,800', distance: '6.5 km', time: '4 min away' },
  { id: 'ORD-8823', pickup: 'Ajah', dropoff: 'Maryland', price: '₦3,100', distance: '10 km', time: '1 min away' },
];

export const GoOnlineScreen = () => {
  const navigation = useNavigation<any>();
  const [isOnline, setIsOnline] = useState(false);
  const [isDriverMode, setIsDriverMode] = useState(true);

  const toggleMode = () => {
    setIsDriverMode(!isDriverMode);
    if (!isDriverMode) {
      // Logic for switching to Driver
    } else {
      // Logic for switching to Passenger
      navigation.navigate('Main', { screen: 'Home', params: { role: 'PASSENGER' } });
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{ latitude: 6.5244, longitude: 3.3792, latitudeDelta: 0.08, longitudeDelta: 0.08 }}
      />

      <SafeAreaView style={styles.overlay}>
        {/* Top bar with Mode Toggle */}
        <View style={styles.topBar}>
          <TouchableOpacity 
            style={styles.iconBtn}
            onPress={() => navigation.openDrawer()}
          >
            <Menu size={22} color={COLORS.black} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.iconBtn}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Bell size={22} color={COLORS.black} />
            <View style={styles.badge} />
          </TouchableOpacity>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Earnings</Text>
            <Text style={styles.statValue}>₦12,500</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Rating</Text>
            <View style={styles.ratingRow}>
              <Star size={16} color="#FFD700" fill="#FFD700" />
              <Text style={styles.statValue}> 4.8</Text>
            </View>
          </View>
        </View>

        {/* Center Toggle Area */}
        <View style={styles.centerContainer}>
          {!isOnline && (
            <View style={styles.offlinePrompt}>
              <Text style={styles.offlineTitle}>You are currently offline</Text>
              <Text style={styles.offlineSub}>Go online to start receiving ride requests</Text>
            </View>
          )}
        </View>

        {/* Online Toggle Button */}
        <View style={styles.bottomActions}>
          <TouchableOpacity
            style={[styles.goOnlineBtn, isOnline && styles.goOnlineBtnActive]}
            onPress={() => setIsOnline(!isOnline)}
            activeOpacity={0.9}
          >
            <Power size={32} color="#FFF" />
            <Text style={styles.goOnlineText}>{isOnline ? 'GO OFFLINE' : 'GO ONLINE'}</Text>
          </TouchableOpacity>
        </View>

        {/* Orders panel (shown when online) */}
        {isOnline && (
          <View style={styles.ordersPanel}>
            <View style={styles.ordersPanelHeader}>
              <Text style={styles.ordersPanelTitle}>Nearby Requests</Text>
              <TouchableOpacity onPress={() => navigation.navigate('OrderList')}>
                <RefreshCw size={18} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} style={styles.ordersList}>
              {MOCK_ORDERS.map(order => (
                <TouchableOpacity
                  key={order.id}
                  style={styles.orderCard}
                  onPress={() => navigation.navigate('OrderAcceptance', { order })}
                >
                  <View style={styles.orderIcon}>
                    <Package size={22} color={COLORS.primary} />
                  </View>
                  <View style={styles.orderInfo}>
                    <Text style={styles.orderRoute} numberOfLines={1}>
                      {order.pickup} → {order.dropoff}
                    </Text>
                    <Text style={styles.orderMeta}>{order.distance} · {order.time}</Text>
                  </View>
                  <View style={styles.orderRight}>
                    <Text style={styles.orderPrice}>{order.price}</Text>
                    <ChevronRight size={18} color={COLORS.textMuted} />
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F0F0' },
  map: { ...StyleSheet.absoluteFillObject },
  overlay: {
    flex: 1,
    padding: 20,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Platform.OS === 'android' ? 30 : 0,
  },
  modeToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    padding: 4,
    borderRadius: 15,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  modeBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 12,
  },
  modeBtnActive: {
    backgroundColor: COLORS.primary,
  },
  modeBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  modeBtnTextActive: {
    color: '#FFF',
  },
  iconBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  badge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF3B30',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 15,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginBottom: 5,
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  offlinePrompt: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 25,
    borderRadius: 25,
    alignItems: 'center',
    width: '100%',
  },
  offlineTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 8,
  },
  offlineSub: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  bottomActions: {
    alignItems: 'center',
    marginBottom: 20,
  },
  goOnlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF3B30',
    paddingHorizontal: 35,
    paddingVertical: 18,
    borderRadius: 35,
    elevation: 8,
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  goOnlineBtnActive: {
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
  },
  goOnlineText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '900',
    marginLeft: 15,
    letterSpacing: 1,
  },
  ordersPanel: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 25,
    maxHeight: 350,
    marginHorizontal: -20,
    marginBottom: -20,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
  },
  ordersPanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  ordersPanelTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  ordersList: {
    marginBottom: 10,
  },
  orderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  orderIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  orderInfo: {
    flex: 1,
  },
  orderRoute: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  orderMeta: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  orderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  orderPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
  },
});
