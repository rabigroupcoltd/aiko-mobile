import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
  ScrollView, Dimensions, Platform, Modal, TextInput
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  Search, Clock, MapPin, Navigation, CreditCard, ChevronRight,
  ChevronDown, Car, Bike, Truck, X, ArrowLeft
} from 'lucide-react-native';
import { MapView, Marker } from '../components/MapView';
import { Button } from '../components/Button';
import { COLORS, SPACING, SIZES } from '../theme';

const { width, height } = Dimensions.get('window');

const VEHICLES = [
  { id: 'standard', name: 'Aiko Standard', icon: Car, price: '₦1,200', eta: '3 min', desc: '4 seats, AC' },
  { id: 'xl', name: 'Aiko Premium', icon: Truck, price: '₦2,500', eta: '5 min', desc: '6 seats, Extra Legroom' },
  { id: 'bike', name: 'Aiko Bike', icon: Bike, price: '₦600', eta: '1 min', desc: 'Fastest for traffic' },
];

export const BookingScreen = () => {
  const navigation = useNavigation<any>();
  const [step, setStep] = useState<'search' | 'select' | 'confirm'>('search');
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [pickup, setPickup] = useState('My Current Location');
  const [destination, setDestination] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('standard');

  const handleSelectDestination = (place: string) => {
    setDestination(place);
    setShowSearchModal(false);
    setStep('select');
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{ latitude: 6.5244, longitude: 3.3792, latitudeDelta: 0.05, longitudeDelta: 0.05 }}
      />

      <SafeAreaView style={styles.topOverlay}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.roundBtn}
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft size={24} color={COLORS.black} />
          </TouchableOpacity>
          <View style={styles.searchBarContainer}>
            <TouchableOpacity
              style={styles.searchBar}
              onPress={() => setShowSearchModal(true)}
            >
              <View style={styles.searchDot} />
              <Text style={styles.searchText} numberOfLines={1}>
                {destination || 'Where are you going?'}
              </Text>
              <Search size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <View style={styles.bottomSheet}>
        <View style={styles.sheetHandle} />

        {step === 'search' && (
          <View style={styles.initialSheet}>
            <Text style={styles.welcomeText}>Good afternoon, Samuel</Text>
            <Text style={styles.subText}>Where can we take you today?</Text>

            <TouchableOpacity
              style={styles.destinationInput}
              onPress={() => setShowSearchModal(true)}
            >
              <MapPin size={22} color={COLORS.primary} />
              <Text style={styles.destInputText}>Enter destination</Text>
            </TouchableOpacity>

            <View style={styles.shortcuts}>
              <TouchableOpacity style={styles.shortcutItem} onPress={() => handleSelectDestination('Home')}>
                <View style={styles.shortcutIcon}><Clock size={20} color={COLORS.primary} /></View>
                <View>
                  <Text style={styles.shortcutTitle}>Home</Text>
                  <Text style={styles.shortcutSubtitle}>24, Adeniyi Jones, Ikeja</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={styles.shortcutItem} onPress={() => handleSelectDestination('Office')}>
                <View style={styles.shortcutIcon}><Clock size={20} color={COLORS.primary} /></View>
                <View>
                  <Text style={styles.shortcutTitle}>Office</Text>
                  <Text style={styles.shortcutSubtitle}>Standard Chartered Bank, VI</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {step === 'select' && (
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.selectionHeader}>
              <Text style={styles.sheetTitle}>Select Ride</Text>
              <TouchableOpacity onPress={() => setStep('search')}>
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
                onPress={() => setStep('confirm')}
                style={styles.bookButton}
              />
            </View>
          </ScrollView>
        )}

        {step === 'confirm' && (
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
                <View style={[styles.inputDot, { backgroundColor: '#2E7D32' }]} />
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
            {['Victoria Island, Lagos', 'Ikeja City Mall', 'Murtala Muhammed Airport', 'Lekki Phase 1', 'Maryland Mall'].map((place) => (
              <TouchableOpacity
                key={place}
                style={styles.resultItem}
                onPress={() => handleSelectDestination(place)}
              >
                <MapPin size={20} color={COLORS.textMuted} />
                <Text style={styles.resultText}>{place}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EEE' },
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
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
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
    backgroundColor: '#FFF',
    height: 52,
    borderRadius: 26,
    paddingHorizontal: 20,
    elevation: 4,
    shadowColor: '#000',
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
    backgroundColor: '#FFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 25,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 40 : 25,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    maxHeight: height * 0.7,
  },
  sheetHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#E0E0E0',
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
    backgroundColor: '#F5F5F5',
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
    borderBottomColor: '#F0F0F0',
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
    borderColor: '#F0F0F0',
    backgroundColor: '#FAFAFA',
  },
  vehicleRowActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '05',
  },
  vehicleIconBox: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: '#FFF',
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
    backgroundColor: '#F5F5F5',
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
    color: '#FF3B30',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
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
    backgroundColor: '#FAFAFA',
  },
  locationInputs: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 15,
    elevation: 2,
    shadowColor: '#000',
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
    backgroundColor: '#F0F0F0',
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
    borderBottomColor: '#F0F0F0',
  },
  resultText: {
    marginLeft: 15,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
});
