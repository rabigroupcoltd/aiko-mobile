import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';

import { AddressSearchSheet } from '@/components/booking/AddressSearchSheet';
import { PressableScale, PulseDot } from '@/components/motion';
import { MapPanel } from '@/components/booking/MapPanel';
import { VehiclePicker } from '@/components/booking/VehiclePicker';
import { AppHeader, Avatar, Button, Card, Icon, Screen } from '@/components/ui';
import { BOOKING_COPY } from '@/data/copy';
import { useGetTrackingManager } from '@/modules/orders/ordersController';
import { useGetAllFareEstimatesManager } from '@/modules/pricing/pricingController';
import { ROUTES } from '@/navigation/routes';
import { useOpenDrawer } from '@/navigation/useAppNavigation';
import type { PassengerStackParamList } from '@/navigation/types';
import { useAppStore } from '@/store/appStore';
import { useAuthStore } from '@/store/authStore';
import { useBookingStore } from '@/store/bookingStore';
import { makeStyles, spacing, useTheme } from '@/theme';
import type { Place } from '@/types/models';
import { formatNationalNumber, isValidNigerianPhone } from '@/utils/phone';

type Props = NativeStackScreenProps<
  PassengerStackParamList,
  typeof ROUTES.PASSENGER_HOME
>;

type SheetTarget = 'pickup' | 'dropoff' | null;

export function HomeScreen({ navigation }: Props) {
  const styles = useStyles();
  const { colors } = useTheme();
  const openDrawer = useOpenDrawer();

  const user = useAuthStore((s) => s.user);
  const localPhoto = useAppStore((s) => s.photos.profile);
  const profilePhotoUri = localPhoto?.uri ?? user?.profilePhotoUrl ?? undefined;

  const pickup = useBookingStore((s) => s.pickup);
  const dropoff = useBookingStore((s) => s.dropoff);
  const pickupPhone = useBookingStore((s) => s.pickupPhone);
  const dropoffPhone = useBookingStore((s) => s.dropoffPhone);
  const vehicleType = useBookingStore((s) => s.vehicleType);
  const setPickup = useBookingStore((s) => s.setPickup);
  const setDropoff = useBookingStore((s) => s.setDropoff);
  const setPickupPhone = useBookingStore((s) => s.setPickupPhone);
  const setDropoffPhone = useBookingStore((s) => s.setDropoffPhone);
  const description = useBookingStore((s) => s.description);
  const setDescription = useBookingStore((s) => s.setDescription);
  const setVehicleType = useBookingStore((s) => s.setVehicleType);

  const [sheet, setSheet] = useState<SheetTarget>(null);

  const { data: quotes, isFetching: quoting, isError } = useGetAllFareEstimatesManager({
    pickupLat: pickup?.lat,
    pickupLng: pickup?.lng,
    dropoffLat: dropoff?.lat,
    dropoffLng: dropoff?.lng,
  });

  const selectedQuote = useMemo(
    () => quotes?.find((quote) => quote.vehicleType === vehicleType),
    [quotes, vehicleType],
  );

  const { data: tracked } = useGetTrackingManager({ refetchInterval: 60_000 });
  const activeOrders = tracked ?? [];
  const withRider = activeOrders.filter((order) => order.driver).length;

  const hasRoute = Boolean(pickup && dropoff);
  const phonesValid =
    isValidNigerianPhone(pickupPhone) && isValidNigerianPhone(dropoffPhone);

  const ready = hasRoute && phonesValid && Boolean(selectedQuote);

  const handleSelect = (place: Place) => {
    if (sheet === 'pickup') setPickup(place);
    else if (sheet === 'dropoff') setDropoff(place);
  };

  return (
    <Screen
      scroll
      footer={
        <Button
          label={
            selectedQuote
              ? `Review order · ₦${selectedQuote.fare.toLocaleString()}`
              : 'Review order'
          }
          onPress={() => navigation.navigate(ROUTES.ORDER_REVIEW)}
          disabled={!ready}
          loading={hasRoute && quoting && !selectedQuote}
          testID="find-rider"
        />
      }>
      <AppHeader
        onMenu={openDrawer}
        trailing={<Avatar uri={profilePhotoUri} name={user?.firstName ?? undefined} size={36} />}
      />

      <Animated.Text entering={FadeInDown.springify().damping(16)} style={styles.greeting}>
        Hi {user?.firstName ?? 'there'} 👋
      </Animated.Text>
      <Animated.Text entering={FadeInDown.delay(60).springify().damping(16)} style={styles.prompt}>
        What are we delivering today?
      </Animated.Text>

      {activeOrders.length > 0 ? (
        <Animated.View entering={FadeInDown.delay(100).springify().damping(16)} layout={LinearTransition}>
          <PressableScale
            onPress={() => navigation.navigate(ROUTES.TRACK_ORDERS)}
            accessibilityRole="button"
            scaleTo={0.98}
            style={styles.trackBanner}>
            <PulseDot color={colors.primary} size={10} />
            <View style={styles.trackText}>
              <Text style={styles.trackTitle}>
                {activeOrders.length === 1
                  ? '1 order on the way'
                  : `${activeOrders.length} orders on the way`}
              </Text>
              <Text style={styles.trackBody}>
                {withRider > 0
                  ? `Watch your ${withRider === 1 ? 'rider' : 'riders'} live on the map`
                  : 'Finding you a rider…'}
              </Text>
            </View>
            <View style={styles.trackCta}>
              <Text style={styles.trackCtaText}>Track</Text>
              <Icon name="chevron-right" size={16} color={colors.primary} strokeWidth={2.6} />
            </View>
          </PressableScale>
        </Animated.View>
      ) : null}

      <Animated.View entering={FadeInDown.delay(140).springify().damping(16)}>
        <MapPanel pickup={pickup} dropoff={dropoff} style={styles.map} />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(200).springify().damping(16)} layout={LinearTransition}>
      <Card style={styles.inputs}>
        <LocationRow
          dotColor={colors.primary}
          label="Pickup"
          value={pickup?.name}
          placeholder={BOOKING_COPY.pickupPlaceholder}
          onPress={() => setSheet('pickup')}
        />
        <ContactRow
          label="Pickup phone"
          placeholder="080 000 0000"
          value={pickupPhone}
          onChange={setPickupPhone}
        />
        <View style={styles.rowDivider} />
        <LocationRow
          dotColor={colors.danger}
          label="Drop-off"
          value={dropoff?.name}
          placeholder={BOOKING_COPY.searchPlaceholder}
          onPress={() => setSheet('dropoff')}
        />
        <ContactRow
          label="Drop-off phone"
          placeholder="080 000 0000"
          value={dropoffPhone}
          onChange={setDropoffPhone}
        />
        <View style={styles.rowDivider} />
        <DescriptionRow value={description} onChange={setDescription} />
      </Card>
      </Animated.View>

      {hasRoute ? (
        <Animated.View entering={FadeInDown.springify().damping(16)} layout={LinearTransition} style={styles.picker}>
          <Text style={styles.pickerLabel}>Choose a vehicle</Text>
          <VehiclePicker
            quotes={quotes ?? []}
            selected={vehicleType}
            onSelect={setVehicleType}
            loading={quoting}
          />
          {isError ? (
            <Text style={styles.pickerError}>
              We could not get prices. Check your connection and try again.
            </Text>
          ) : null}
        </Animated.View>
      ) : null}

      {selectedQuote ? (
        <Animated.View entering={FadeInDown.springify().damping(16)} layout={LinearTransition}>
        <Card style={styles.estimate}>
          <View style={styles.estimateItem}>
            <Text style={styles.estimateLabel}>Distance</Text>
            <Text style={styles.estimateValue}>{selectedQuote.distanceKm.toFixed(1)} km</Text>
          </View>
          <View style={styles.estimateDivider} />
          <View style={styles.estimateItem}>
            <Text style={styles.estimateLabel}>Fare</Text>
            <Text style={[styles.estimateValue, styles.estimateFare]}>
              ₦{selectedQuote.fare.toLocaleString()}
            </Text>
          </View>
          <View style={styles.estimateDivider} />
          <View style={styles.estimateItem}>
            <Text style={styles.estimateLabel}>Est. time</Text>
            <Text style={styles.estimateValue}>
              {Math.max(1, Math.round(selectedQuote.durationMins))} min
            </Text>
          </View>
        </Card>
        </Animated.View>
      ) : null}

      <AddressSearchSheet
        visible={sheet !== null}
        title={sheet === 'pickup' ? 'Where should we pick it up?' : 'Where is it going?'}
        placeholder={
          sheet === 'pickup' ? BOOKING_COPY.pickupPlaceholder : BOOKING_COPY.searchPlaceholder
        }
        onSelect={handleSelect}
        onClose={() => setSheet(null)}
      />
    </Screen>
  );
}

function LocationRow({
  dotColor,
  label,
  value,
  placeholder,
  onPress,
}: {
  dotColor: string;
  label: string;
  value?: string;
  placeholder: string;
  onPress: () => void;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <PressableScale
      onPress={onPress}
      haptic="select"
      scaleTo={0.98}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value ?? placeholder}`}
      style={styles.locationRow}>
      <View style={[styles.dot, { backgroundColor: dotColor }]} />
      <View style={styles.locationBody}>
        <Text style={styles.locationLabel}>{label}</Text>
        <Text
          style={[styles.locationValue, !value && styles.locationPlaceholder]}
          numberOfLines={1}>
          {value ?? placeholder}
        </Text>
      </View>
      <Icon name="chevron-right" size={18} color={colors.textDisabled} strokeWidth={2.2} />
    </PressableScale>
  );
}

function DescriptionRow({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  const styles = useStyles();
  const { colors } = useTheme();

  return (
    <View style={styles.contactRow}>
      <Text style={styles.contactLabel}>What are you sending?</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder="Optional, e.g. two cartons of frozen chicken"
        placeholderTextColor={colors.textDisabled}
        maxLength={500}
        multiline
        accessibilityLabel="What are you sending?"
        style={styles.contactInput}
      />
    </View>
  );
}

function ContactRow({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (next: string) => void;
}) {
  const styles = useStyles();
  const { colors } = useTheme();

  const invalid = value.length >= 4 && !isValidNigerianPhone(value);

  return (
    <View style={styles.contactRow}>
      <Text style={styles.contactLabel}>{label}</Text>
      <TextInput
        value={formatNationalNumber(value)}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.textDisabled}
        keyboardType="phone-pad"
        maxLength={13}
        accessibilityLabel={label}
        style={[styles.contactInput, invalid && styles.contactInputError]}
      />
    </View>
  );
}

const useStyles = makeStyles(({ colors, type }) => ({
  greeting: { ...type.title },
  prompt: { ...type.bodySmall, marginTop: spacing.xxs, marginBottom: spacing.base },
  map: { height: 220, marginBottom: spacing.base },
  trackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    marginBottom: spacing.base,
    borderRadius: 14,
    backgroundColor: colors.primarySubtle,
    borderWidth: 1,
    borderColor: colors.primaryLight,
  },
  trackText: { flex: 1, gap: 2 },
  trackTitle: { ...type.subheading, fontSize: 15 },
  trackBody: type.caption,
  trackCta: { flexDirection: 'row', alignItems: 'center' },
  trackCtaText: { ...type.subheading, fontSize: 14, color: colors.primary },
  inputs: { padding: 0, overflow: 'hidden' },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  locationBody: { flex: 1, gap: 1 },
  locationLabel: { ...type.caption },
  locationValue: { ...type.body, fontSize: 15 },
  locationPlaceholder: { color: colors.textDisabled },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingBottom: spacing.md,
    paddingLeft: 42,
    paddingRight: spacing.base,
  },
  contactLabel: { ...type.caption, width: 92 },
  contactInput: {
    flex: 1,
    ...type.body,
    fontSize: 15,
    paddingVertical: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  contactInputError: { borderBottomColor: colors.danger },
  rowDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.divider,
    marginLeft: 42,
  },
  picker: { marginTop: spacing.base, gap: spacing.xs },
  pickerLabel: { ...type.label },
  pickerError: { ...type.caption, color: colors.danger },
  estimate: {
    flexDirection: 'row',
    marginTop: spacing.base,
    alignItems: 'center',
  },
  estimateItem: { flex: 1, alignItems: 'center', gap: 2 },
  estimateLabel: { ...type.caption },
  estimateValue: { ...type.subheading, fontSize: 15 },
  estimateFare: { color: colors.primary },
  estimateDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    backgroundColor: colors.divider,
    marginHorizontal: spacing.sm,
  },
}));
