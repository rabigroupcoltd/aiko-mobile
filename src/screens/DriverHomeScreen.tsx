import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity, 
  Switch, ScrollView, Dimensions, Platform
} from 'react-native';

import { MapView, Marker } from '../components/MapView';
import { Power, MapPin, Navigation, Package, DollarSign, ChevronRight, Bell } from 'lucide-react-native';
import { COLORS, SPACING, SIZES } from '../theme';
import { Button } from '../components/Button';

const { width } = Dimensions.get('window');

export const DriverHomeScreen = () => {
  const [isOnline, setIsOnline] = useState(false);
  const [showOrder, setShowOrder] = useState(false);

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 6.5244,
          longitude: 3.3792,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {isOnline && (
          <Marker coordinate={{ latitude: 6.53, longitude: 3.38 }}>
            <View style={styles.orderMarker}>
              <Package size={20} color={COLORS.white} />
            </View>
          </Marker>
        )}
      </MapView>

      <SafeAreaView style={styles.overlay}>
        <View style={styles.header}>
           <View style={styles.statsContainer}>
              <View style={styles.stat}>
                 <Text style={styles.statLabel}>Earnings</Text>
                 <Text style={styles.statValue}>₦12,500</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                 <Text style={styles.statLabel}>Trips</Text>
                 <Text style={styles.statValue}>8</Text>
              </View>
           </View>
           <TouchableOpacity style={styles.notifyButton}>
              <Bell size={24} color={COLORS.black} />
              <View style={styles.badge} />
           </TouchableOpacity>
        </View>

        <View style={styles.onlineCard}>
          <View style={styles.onlineInfo}>
            <View style={[styles.statusDot, { backgroundColor: isOnline ? COLORS.primary : COLORS.error }]} />
            <Text style={styles.statusText}>{isOnline ? 'You are Online' : 'You are Offline'}</Text>
          </View>
          <TouchableOpacity 
            style={[styles.onlineButton, isOnline && styles.onlineButtonActive]}
            onPress={() => setIsOnline(!isOnline)}
          >
            <Power size={24} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        {isOnline && (
          <View style={styles.ordersCard}>
            <View style={styles.orderHeader}>
              <Text style={styles.orderTitle}>Orders Near You</Text>
              <TouchableOpacity>
                <Text style={styles.viewAll}>View All</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.orderList} showsVerticalScrollIndicator={false}>
              <OrderCard 
                title="Delivery to Ikeja" 
                distance="2.5 km" 
                price="₦2,400" 
                onPress={() => setShowOrder(true)}
              />
              <OrderCard 
                title="Ride from Lekki" 
                distance="1.2 km" 
                price="₦1,800" 
                onPress={() => {}}
              />
            </ScrollView>
          </View>
        )}
      </SafeAreaView>

      {/* Order Acceptance Modal (Simplified for UI) */}
      {showOrder && (
        <View style={styles.modalOverlay}>
           <View style={styles.acceptanceCard}>
              <View style={styles.acceptanceHeader}>
                 <View style={styles.timerContainer}>
                    <Text style={styles.timerText}>15s</Text>
                 </View>
                 <Text style={styles.newOrderText}>New Delivery Order!</Text>
              </View>
              
              <View style={styles.orderDetails}>
                 <View style={styles.addressRow}>
                    <MapPin size={20} color={COLORS.primary} />
                    <Text style={styles.addressText}>123 Pick-up Point, Lagos</Text>
                 </View>
                 <View style={styles.addressRow}>
                    <Navigation size={20} color="#FF4B4B" />
                    <Text style={styles.addressText}>456 Destination Mall, Ikeja</Text>
                 </View>
              </View>

              <View style={styles.priceContainer}>
                 <Text style={styles.priceLabel}>Your Earnings</Text>
                 <Text style={styles.priceValue}>₦2,400</Text>
              </View>

              <View style={styles.actionButtons}>
                 <Button 
                   title="Decline" 
                   variant="outline" 
                   onPress={() => setShowOrder(false)} 
                   style={{ flex: 1, borderColor: COLORS.error }}
                   textStyle={{ color: COLORS.error }}
                 />
                 <Button 
                   title="Accept" 
                   onPress={() => setShowOrder(false)} 
                   style={{ flex: 2 }}
                 />
              </View>
           </View>
        </View>
      )}
    </View>
  );
};

const OrderCard = ({ title, distance, price, onPress }: any) => (
  <TouchableOpacity style={styles.card} onPress={onPress}>
    <View style={styles.cardInfo}>
       <Text style={styles.cardTitle}>{title}</Text>
       <Text style={styles.cardSubTitle}>{distance} away</Text>
    </View>
    <View style={styles.cardPrice}>
       <Text style={styles.cardPriceText}>{price}</Text>
       <ChevronRight size={18} color={COLORS.textMuted} />
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '100%',
    padding: SPACING.lg,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Platform.OS === 'ios' ? 0 : 40,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: 20,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  stat: {
    paddingHorizontal: SPACING.md,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: '100%',
    backgroundColor: COLORS.border,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.black,
  },
  notifyButton: {
    width: 48,
    height: 48,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  badge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.error,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  onlineCard: {
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    marginBottom: SPACING.md,
  },
  onlineInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.black,
  },
  onlineButton: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: COLORS.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineButtonActive: {
    backgroundColor: COLORS.primary,
  },
  ordersCard: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: SPACING.xl,
    width: width,
    marginLeft: -SPACING.lg,
    marginBottom: -SPACING.lg,
    maxHeight: 300,
  },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  orderTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.black,
  },
  viewAll: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  orderList: {
    gap: SPACING.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.black,
  },
  cardSubTitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  cardPrice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardPriceText: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.primary,
  },
  orderMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    borderWidth: 3,
    borderColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
    padding: SPACING.xl,
  },
  acceptanceCard: {
    backgroundColor: COLORS.white,
    borderRadius: 32,
    padding: SPACING.xl,
    alignItems: 'center',
  },
  acceptanceHeader: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  timerContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 4,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  timerText: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.primary,
  },
  newOrderText: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.black,
  },
  orderDetails: {
    width: '100%',
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
    borderRadius: 24,
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  addressText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
  },
  priceContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  priceLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
  },
  priceValue: {
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.primary,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
    width: '100%',
  }
});
