import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Dimensions, Platform, Modal, TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  Search, Clock, MapPin, Navigation, CreditCard,
  ChevronDown, Car, Bike, Truck, X, Menu, Phone, MessageCircle,
  Star, CheckCircle
} from 'lucide-react-native';
import { MapView, Marker, Polyline } from '../components/MapView';
import { Button } from '../components/Button';
import { COLORS, getGreeting } from '../theme';

const { height } = Dimensions.get('window');

type Step = 'search' | 'select' | 'finding' | 'matched' | 'ontrip' | 'completed';
type Coordinate = { latitude: number; longitude: number };

const PICKUP_COORD: Coordinate = { latitude: 6.5244, longitude: 3.3792 };

const SHORTCUTS: { label: string; address: string; coordinate: Coordinate }[] = [
  { label: 'Home', address: '24, Adeniyi Jones, Ikeja', coordinate: { latitude: 6.6059, longitude: 3.3491 } },
  { label: 'Office', address: 'Standard Chartered Bank, VI', coordinate: { latitude: 6.4304, longitude: 3.4219 } },
];

const SEARCH_RESULTS: { label: string; coordinate: Coordinate }[] = [
  { label: 'Victoria Island, Lagos', coordinate: { latitude: 6.4281, longitude: 3.4219 } },
  { label: 'Ikeja City Mall', coordinate: { latitude: 6.6018, longitude: 3.3515 } },
  { label: 'Murtala Muhammed Airport', coordinate: { latitude: 6.5774, longitude: 3.3211 } },
  { label: 'Lekki Phase 1', coordinate: { latitude: 6.4474, longitude: 3.4731 } },
  { label: 'Maryland Mall', coordinate: { latitude: 6.5703, longitude: 3.3654 } },
];

const VEHICLES = [
  { id: 'standard', name: 'Aiko Standard', icon: Car, price: '₦1,200', eta: '3 min', desc: '4 seats, AC' },
  { id: 'xl', name: 'Aiko Premium', icon: Truck, price: '₦2,500', eta: '5 min', desc: '6 seats, Extra Legroom' },
  { id: 'bike', name: 'Aiko Bike', icon: Bike, price: '₦600', eta: '1 min', desc: 'Fastest for traffic' },
];

const DRIVER = {
  name: 'Tunde Bakare',
  rating: 4.9,
  vehicle: 'Toyota Corolla · Silver',
  plate: 'LND 234 XY',
  arrivingIn: '4 min',
};

// Step durations (ms) for the simulated ride lifecycle
const FINDING_DURATION = 2500;
const MATCHED_DURATION = 3000;
const ONTRIP_DURATION = 3500;

export const BookingScreen = () => {
  const navigation = useNavigation<any>();
  const [step, setStep] = useState<Step>('search');
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [pickup, setPickup] = useState('My Current Location');
  const [destination, setDestination] = useState('');
  const [destinationCoord, setDestinationCoord] = useState<Coordinate | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState('standard');
  const [rating, setRating] = useState(0);

  const vehicle = VEHICLES.find(v => v.id === selectedVehicle) ?? VEHICLES[0];

  // Drive the ride lifecycle forward automatically (simulated backend)
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (step === 'finding') timer = setTimeout(() => setStep('matched'), FINDING_DURATION);
    if (step === 'matched') timer = setTimeout(() => setStep('ontrip'), MATCHED_DURATION);
    if (step === 'ontrip') timer = setTimeout(() => setStep('completed'), ONTRIP_DURATION);
    return () => { if (timer) clearTimeout(timer); };
  }, [step]);

  const handleSelectDestination = (place: { label: string; coordinate: Coordinate }) => {
    setDestination(place.label);
    setDestinationCoord(place.coordinate);
    setShowSearchModal(false);
    setStep('select');
  };

  // Generates a plausible nearby coordinate for free-text destinations
  // that aren't in SEARCH_RESULTS, so the route/map still renders.
  const generateNearbyCoordinate = (): Coordinate => ({
    latitude: PICKUP_COORD.latitude + (Math.random() - 0.5) * 0.08,
    longitude: PICKUP_COORD.longitude + (Math.random() - 0.5) * 0.08,
  });

  const handleReset = () => {
    setStep('search');
    setDestination('');
    setDestinationCoord(null);
    setRating(0);
  };

  const mapRegion = destinationCoord
    ? {
        latitude: (PICKUP_COORD.latitude + destinationCoord.latitude) / 2,
        longitude: (PICKUP_COORD.longitude + destinationCoord.longitude) / 2,
        latitudeDelta: Math.abs(PICKUP_COORD.latitude - destinationCoord.latitude) * 1.8 + 0.03,
        longitudeDelta: Math.abs(PICKUP_COORD.longitude - destinationCoord.longitude) * 1.8 + 0.03,
      }
    : { ...PICKUP_COORD, latitudeDelta: 0.05, longitudeDelta: 0.05 };

  const trimmedDestination = destination.trim();
  const filteredResults = trimmedDestination
    ? SEARCH_RESULTS.filter((place) => place.label.toLowerCase().includes(trimmedDestination.toLowerCase()))
    : SEARCH_RESULTS;
  const showCustomDestination =
    trimmedDestination.length > 2 &&
    !SEARCH_RESULTS.some((place) => place.label.toLowerCase() === trimmedDestination.toLowerCase());

  return (
    <View style={styles.container}>
      <MapView style={styles.map} region={mapRegion}>
        {destinationCoord && step !== 'search' && (
          <>
            <Marker coordinate={PICKUP_COORD}>
              <View style={styles.pickupMarker}>
                <Navigation size={14} color={COLORS.white} fill={COLORS.white} />
              </View>
            </Marker>
            <Marker coordinate={destinationCoord}>
              <View style={styles.dropoffMarker}>
                <MapPin size={16} color={COLORS.white} />
              </View>
            </Marker>
            <Polyline
              coordinates={[PICKUP_COORD, destinationCoord]}
              strokeColor={COLORS.primary}
              strokeWidth={4}
            />
          </>
        )}
      </MapView>

      <SafeAreaView style={styles.topOverlay}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.roundBtn}
            onPress={() => navigation.openDrawer()}
          >
            <Menu size={24} color={COLORS.black} />
          </TouchableOpacity>
          <View style={styles.searchBarContainer}>
            <TouchableOpacity
              style={styles.searchBar}
              onPress={() => step === 'search' && setShowSearchModal(true)}
              disabled={step !== 'search'}
            >
              <View style={styles.searchDot} />
              <Text style={styles.searchText} numberOfLines={1}>
                {destination || 'Where are you going?'}
              </Text>
              {step === 'search' && <Search size={20} color={COLORS.textMuted} />}
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <View style={styles.bottomSheet}>
        <View style={styles.sheetHandle} />

        {step === 'search' && (
          <View>
            <Text style={styles.welcomeText}>{getGreeting()}</Text>
            <Text style={styles.subText}>Where can we take you today?</Text>

            <TouchableOpacity
              style={styles.destinationInput}
              onPress={() => setShowSearchModal(true)}
            >
              <MapPin size={22} color={COLORS.primary} />
              <Text style={styles.destInputText}>Enter destination</Text>
            </TouchableOpacity>

            <View style={styles.shortcuts}>
              {SHORTCUTS.map((shortcut) => (
                <TouchableOpacity
                  key={shortcut.label}
                  style={styles.shortcutItem}
                  onPress={() => handleSelectDestination(shortcut)}
                >
                  <View style={styles.shortcutIcon}><Clock size={20} color={COLORS.primary} /></View>
                  <View>
                    <Text style={styles.shortcutTitle}>{shortcut.label}</Text>
                    <Text style={styles.shortcutSubtitle}>{shortcut.address}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {step === 'select' && (
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.selectionHeader}>
              <Text style={styles.sheetTitle}>Select Ride</Text>
              <TouchableOpacity onPress={() => setShowSearchModal(true)}>
                <Text style={styles.changeBtn}>Change</Text>
              </TouchableOpacity>
            </View>

            {VEHICLES.map((v) => {
              const Icon = v.icon;
              const active = selectedVehicle === v.id;
              return (
                <TouchableOpacity
                  key={v.id}
                  style={[styles.vehicleRow, active && styles.vehicleRowActive]}
                  onPress={() => setSelectedVehicle(v.id)}
                >
                  <View style={[styles.vehicleIconBox, active && styles.vehicleIconBoxActive]}>
                    <Icon size={24} color={active ? COLORS.white : COLORS.primary} />
                  </View>
                  <View style={styles.vehicleInfo}>
                    <Text style={styles.vehicleName}>{v.name}</Text>
                    <Text style={styles.vehicleDesc}>{v.desc} · {v.eta}</Text>
                  </View>
                  <Text style={[styles.vehiclePrice, active && { color: COLORS.primary }]}>{v.price}</Text>
                </TouchableOpacity>
              );
            })}

            <View style={styles.paymentSection}>
              <TouchableOpacity style={styles.payMethod}>
                <CreditCard size={20} color={COLORS.primary} />
                <Text style={styles.payText}>Personal • • • • 4242</Text>
                <ChevronDown size={16} color={COLORS.textMuted} />
              </TouchableOpacity>
              <Button
                title="Book Now"
                onPress={() => setStep('finding')}
                style={styles.bookButton}
              />
            </View>
          </ScrollView>
        )}

        {step === 'finding' && (
          <View style={styles.confirmSection}>
            <View style={styles.loaderContainer}>
              <View style={styles.loaderRing} />
              <Car size={40} color={COLORS.primary} />
            </View>
            <Text style={styles.searchingTitle}>Finding your ride...</Text>
            <Text style={styles.searchingSub}>Wait a moment while we connect you to the nearest driver.</Text>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setStep('select')}
            >
              <Text style={styles.cancelText}>Cancel Request</Text>
            </TouchableOpacity>
          </View>
        )}

        {(step === 'matched' || step === 'ontrip') && (
          <View style={styles.tripSection}>
            <View style={styles.statusBanner}>
              <View style={styles.statusDotPulse} />
              <Text style={styles.statusText}>
                {step === 'matched'
                  ? `Your driver is arriving in ${DRIVER.arrivingIn}`
                  : 'On the way to your destination'}
              </Text>
            </View>

            <View style={styles.driverCard}>
              <View style={styles.driverAvatar}>
                <Text style={styles.driverAvatarText}>{DRIVER.name.charAt(0)}</Text>
              </View>
              <View style={styles.driverInfo}>
                <Text style={styles.driverName}>{DRIVER.name}</Text>
                <View style={styles.driverMetaRow}>
                  <Star size={14} color="#FFD700" fill="#FFD700" />
                  <Text style={styles.driverMetaText}>{DRIVER.rating}</Text>
                  <Text style={styles.driverMetaDot}>·</Text>
                  <Text style={styles.driverMetaText}>{DRIVER.vehicle}</Text>
                </View>
                <Text style={styles.driverPlate}>{DRIVER.plate}</Text>
              </View>
              <View style={styles.driverActions}>
                <TouchableOpacity style={styles.driverActionBtn}>
                  <Phone size={18} color={COLORS.primary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.driverActionBtn}>
                  <MessageCircle size={18} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.routeCard}>
              <View style={styles.routeRow}>
                <View style={[styles.routeDot, { backgroundColor: COLORS.pickup }]} />
                <Text style={styles.routeText} numberOfLines={1}>{pickup}</Text>
              </View>
              <View style={styles.routeConnector} />
              <View style={styles.routeRow}>
                <View style={[styles.routeDot, { backgroundColor: COLORS.dropoff }]} />
                <Text style={styles.routeText} numberOfLines={1}>{destination}</Text>
              </View>
            </View>

            {step === 'matched' && (
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setStep('select')}>
                <Text style={styles.cancelText}>Cancel Ride</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {step === 'completed' && (
          <View style={styles.confirmSection}>
            <View style={styles.completedIcon}>
              <CheckCircle size={56} color={COLORS.primary} />
            </View>
            <Text style={styles.searchingTitle}>Trip Completed</Text>
            <Text style={styles.searchingSub}>You've arrived at {destination}.</Text>

            <View style={styles.fareCard}>
              <Text style={styles.fareLabel}>Total Fare</Text>
              <Text style={styles.fareValue}>{vehicle.price}</Text>
            </View>

            <Text style={styles.rateLabel}>Rate your trip with {DRIVER.name.split(' ')[0]}</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((i) => (
                <TouchableOpacity key={i} onPress={() => setRating(i)}>
                  <Star size={32} color="#FFD700" fill={i <= rating ? '#FFD700' : 'transparent'} />
                </TouchableOpacity>
              ))}
            </View>

            <Button title="Done" onPress={handleReset} style={styles.bookButton} />
          </View>
        )}
      </View>

      {/* Search Modal */}
      <Modal visible={showSearchModal} animationType="slide" transparent={false}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowSearchModal(false)} style={styles.closeBtn}>
              <X size={24} color={COLORS.black} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Set Destination</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.modalSearchBox}>
            <View style={styles.locationInputs}>
              <View style={styles.inputWrapper}>
                <View style={[styles.inputDot, { backgroundColor: COLORS.pickup }]} />
                <TextInput
                  style={styles.textInput}
                  value={pickup}
                  onChangeText={setPickup}
                  placeholder="Pickup Location"
                />
              </View>
              <View style={styles.inputLine} />
              <View style={styles.inputWrapper}>
                <View style={[styles.inputDot, { backgroundColor: COLORS.primary }]} />
                <TextInput
                  style={styles.textInput}
                  value={destination}
                  onChangeText={setDestination}
                  placeholder="Where to?"
                  autoFocus
                />
              </View>
            </View>
          </View>

          <ScrollView style={styles.resultsList}>
            <Text style={styles.resultsLabel}>Recent Results</Text>
            {showCustomDestination && (
              <TouchableOpacity
                style={styles.resultItem}
                onPress={() => handleSelectDestination({ label: trimmedDestination, coordinate: generateNearbyCoordinate() })}
              >
                <Search size={20} color={COLORS.primary} />
                <Text style={styles.resultText}>Search for "{trimmedDestination}"</Text>
              </TouchableOpacity>
            )}
            {filteredResults.map((place) => (
              <TouchableOpacity
                key={place.label}
                style={styles.resultItem}
                onPress={() => handleSelectDestination(place)}
              >
                <MapPin size={20} color={COLORS.textMuted} />
                <Text style={styles.resultText}>{place.label}</Text>
              </TouchableOpacity>
            ))}
            {filteredResults.length === 0 && !showCustomDestination && (
              <Text style={styles.noResultsText}>No matches found</Text>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  map: { ...StyleSheet.absoluteFillObject },
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  roundBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchBarContainer: {
    flex: 1,
    marginLeft: 15,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    height: 52,
    borderRadius: 26,
    paddingHorizontal: 20,
    elevation: 4,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginRight: 12,
  },
  searchText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 25,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 40 : 25,
    elevation: 20,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    maxHeight: height * 0.7,
  },
  sheetHandle: {
    width: 40,
    height: 5,
    backgroundColor: COLORS.border,
    borderRadius: 2.5,
    alignSelf: 'center',
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 4,
  },
  subText: {
    fontSize: 15,
    color: COLORS.textMuted,
    marginBottom: 25,
  },
  destinationInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 18,
    borderRadius: 18,
    marginBottom: 25,
  },
  destInputText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  shortcuts: {
    marginBottom: 10,
  },
  shortcutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  shortcutIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  shortcutTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  shortcutSubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  selectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
  },
  changeBtn: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  vehicleRowActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '05',
  },
  vehicleIconBox: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    elevation: 2,
  },
  vehicleIconBoxActive: {
    backgroundColor: COLORS.primary,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },
  vehicleDesc: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  vehiclePrice: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },
  paymentSection: {
    marginTop: 20,
  },
  payMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: COLORS.surface,
    borderRadius: 15,
    marginBottom: 15,
  },
  payText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  bookButton: {
    height: 60,
    borderRadius: 18,
  },
  confirmSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loaderContainer: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 25,
  },
  loaderRing: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: COLORS.primary,
    borderTopColor: 'transparent',
  },
  searchingTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 10,
  },
  searchingSub: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  cancelBtn: {
    padding: 15,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.error,
  },
  tripSection: {
    paddingVertical: 10,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '10',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    gap: 10,
  },
  statusDotPulse: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  statusText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  driverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  driverAvatar: {
    width: 50,
    height: 50,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  driverAvatarText: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.white,
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },
  driverMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  driverMetaText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  driverMetaDot: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  driverPlate: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '700',
    marginTop: 2,
    letterSpacing: 1,
  },
  driverActions: {
    flexDirection: 'row',
    gap: 8,
  },
  driverActionBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: COLORS.primary + '12',
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  routeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  routeConnector: {
    width: 2,
    height: 16,
    backgroundColor: COLORS.border,
    marginLeft: 4,
    marginVertical: 4,
  },
  routeText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  completedIcon: {
    marginBottom: 16,
  },
  fareCard: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  fareLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  fareValue: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.primary,
  },
  rateLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  pickupMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.pickup,
    borderWidth: 3,
    borderColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropoffMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.dropoff,
    borderWidth: 3,
    borderColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  closeBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  modalSearchBox: {
    padding: 20,
    backgroundColor: COLORS.surface,
  },
  locationInputs: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 15,
    elevation: 2,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 15,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    height: 45,
  },
  inputLine: {
    width: 2,
    height: 25,
    backgroundColor: COLORS.border,
    marginLeft: 4,
    marginVertical: 4,
  },
  resultsList: {
    flex: 1,
    padding: 20,
  },
  resultsLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginBottom: 15,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  resultText: {
    marginLeft: 15,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  noResultsText: {
    textAlign: 'center',
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 20,
  },
});
