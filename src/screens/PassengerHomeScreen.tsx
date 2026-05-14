import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  Dimensions,
  ScrollView,
  Image
} from 'react-native';
import { MapView, Marker } from '../components/MapView';
import { Search, MapPin, Navigation, Clock, CreditCard, ChevronRight, Star } from 'lucide-react-native';
import { COLORS, SPACING, SIZES } from '../theme';
import { Button } from '../components/Button';
import { Input } from '../components/Input';

const { width, height } = Dimensions.get('window');

export const PassengerHomeScreen = () => {
  const [showBooking, setShowBooking] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState('Standard');

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 6.5244,
          longitude: 3.3792,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
      >
        <Marker coordinate={{ latitude: 6.5244, longitude: 3.3792 }}>
           <View style={styles.markerContainer}>
             <View style={styles.markerInner} />
           </View>
        </Marker>
      </MapView>

      <SafeAreaView style={styles.overlay}>
        {!showBooking ? (
          <View style={styles.searchBarContainer}>
            <TouchableOpacity 
              style={styles.searchBar}
              onPress={() => setShowBooking(true)}
            >
              <View style={styles.searchIcon}>
                 <Search size={20} color={COLORS.primary} />
              </View>
              <Text style={styles.searchPlaceholder}>Where to?</Text>
              <View style={styles.clockIcon}>
                <Clock size={18} color={COLORS.textMuted} />
              </View>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.bookingCard}>
             <View style={styles.bookingHeader}>
                <TouchableOpacity onPress={() => setShowBooking(false)}>
                  <ChevronRight size={24} color={COLORS.black} style={{ transform: [{ rotate: '180deg' }] }} />
                </TouchableOpacity>
                <Text style={styles.bookingTitle}>Plan your ride</Text>
                <View style={{ width: 24 }} />
             </View>

             <View style={styles.addressContainer}>
                <View style={styles.dotContainer}>
                   <View style={styles.dotGreen} />
                   <View style={styles.line} />
                   <View style={styles.dotRed} />
                </View>
                <View style={styles.inputsContainer}>
                   <TouchableOpacity style={styles.addressInput}>
                      <Text style={styles.addressText}>123 Luxury Street, Ikeja</Text>
                   </TouchableOpacity>
                   <View style={styles.separator} />
                   <TouchableOpacity style={styles.addressInput}>
                      <Text style={styles.addressPlaceholder}>Enter destination</Text>
                   </TouchableOpacity>
                </View>
             </View>

             <Text style={styles.vehicleTitle}>Select Vehicle</Text>
             <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.vehicleList}>
                <VehicleOption 
                  title="Aiko Standard" 
                  price="₦1,200" 
                  time="3 mins"
                  active={selectedVehicle === 'Standard'}
                  onPress={() => setSelectedVehicle('Standard')}
                />
                <VehicleOption 
                  title="Aiko XL" 
                  price="₦2,500" 
                  time="5 mins"
                  active={selectedVehicle === 'XL'}
                  onPress={() => setSelectedVehicle('XL')}
                />
                <VehicleOption 
                  title="Aiko Bike" 
                  price="₦600" 
                  time="1 min"
                  active={selectedVehicle === 'Bike'}
                  onPress={() => setSelectedVehicle('Bike')}
                />
             </ScrollView>

             <View style={styles.paymentContainer}>
                <View style={styles.paymentMethod}>
                   <CreditCard size={20} color={COLORS.primary} />
                   <Text style={styles.paymentText}>Cash</Text>
                   <ChevronRight size={16} color={COLORS.textMuted} />
                </View>
                <Button 
                  title="Book Aiko" 
                  onPress={() => {}} 
                  style={styles.bookButton}
                />
             </View>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
};

const VehicleOption = ({ title, price, time, active, onPress }: any) => (
  <TouchableOpacity 
    style={[styles.vehicleCard, active && styles.vehicleCardActive]}
    onPress={onPress}
  >
    <View style={styles.vehicleIcon}>
       <Image source={require('../../assets/icon.png')} style={{ width: 40, height: 40 }} />
    </View>
    <Text style={styles.vehicleName}>{title}</Text>
    <Text style={styles.vehiclePrice}>{price}</Text>
    <Text style={styles.vehicleTime}>{time}</Text>
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
    bottom: 0,
    width: '100%',
  },
  searchBarContainer: {
    padding: SPACING.xl,
    paddingBottom: SPACING.xxl,
  },
  searchBar: {
    backgroundColor: COLORS.white,
    height: 60,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  searchIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  clockIcon: {
    paddingLeft: SPACING.sm,
    borderLeftWidth: 1,
    borderLeftColor: COLORS.border,
  },
  bookingCard: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: SPACING.xl,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 20,
    maxWidth: 500,
    alignSelf: 'center',
    width: '100%',
  },
  bookingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  bookingTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.black,
  },
  addressContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: SPACING.md,
    marginBottom: SPACING.xl,
  },
  dotContainer: {
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    marginRight: SPACING.md,
  },
  dotGreen: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: COLORS.border,
    marginVertical: 4,
  },
  dotRed: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF4B4B',
  },
  inputsContainer: {
    flex: 1,
    gap: 8,
  },
  addressInput: {
    height: 40,
    justifyContent: 'center',
  },
  addressText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.black,
  },
  addressPlaceholder: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.border,
  },
  vehicleTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.black,
    marginBottom: SPACING.md,
  },
  vehicleList: {
    paddingBottom: SPACING.md,
    gap: SPACING.md,
  },
  vehicleCard: {
    width: 120,
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  vehicleCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '05',
  },
  vehicleIcon: {
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  vehicleName: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.black,
    textAlign: 'center',
  },
  vehiclePrice: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.primary,
    marginTop: 2,
  },
  vehicleTime: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  paymentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.md,
    gap: SPACING.md,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: 20,
    gap: 8,
  },
  paymentText: {
    fontSize: 14,
    fontWeight: '700',
  },
  bookButton: {
    flex: 1,
    height: 56,
  },
  markerContainer: {
    width: 30,
    height: 30,
    backgroundColor: COLORS.primary + '20',
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerInner: {
    width: 12,
    height: 12,
    backgroundColor: COLORS.primary,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
});
