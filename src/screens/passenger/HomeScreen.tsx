import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AddressSearchSheet } from '@/components/booking/AddressSearchSheet';
import { MapPanel } from '@/components/booking/MapPanel';
import { VehiclePicker } from '@/components/booking/VehiclePicker';
import { AppHeader, Avatar, Button, Card, Screen } from '@/components/ui';
import { BOOKING_COPY } from '@/data/copy';
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

  /**
   * One quote per active vehicle type, priced server-side for this exact route.
   *
   * There is deliberately no local fare arithmetic left here. The server owns
   * pricing — a number computed on the client could only ever disagree with
   * what the trip actually costs, and showing a passenger a price we do not
   * honour is worse than showing them a spinner for a moment.
   */
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

  const hasRoute = Boolean(pickup && dropoff);
  const phonesValid =
    isValidNigerianPhone(pickupPhone) && isValidNigerianPhone(dropoffPhone);

  // Only bookable once the server has priced the selected vehicle: the order is
  // created against that quote, so leaving before it lands would book blind.
  // Both numbers are required — the driver has to reach someone at each end.
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
          // Confirmation is its own screen — §5. Nothing is created or
          // dispatched until the customer taps Confirm there.
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

      <Text style={styles.greeting}>
        Hi {user?.firstName ?? 'there'} 👋
      </Text>
      <Text style={styles.prompt}>Where are you going today?</Text>

      <MapPanel pickup={pickup} dropoff={dropoff} style={styles.map} />

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

      {hasRoute ? (
        <View style={styles.picker}>
          <Text style={styles.pickerLabel}>Choose a ride</Text>
          <VehiclePicker
            quotes={quotes ?? []}
            selected={vehicleType}
            onSelect={setVehicleType}
            loading={quoting}
          />
          {isError ? (
            <Text style={styles.pickerError}>
              Could not get prices. Check your connection and try again.
            </Text>
          ) : null}
        </View>
      ) : null}

      {selectedQuote ? (
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
      ) : null}

      <AddressSearchSheet
        visible={sheet !== null}
        title={sheet === 'pickup' ? 'Set pickup location' : 'Where to?'}
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
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value ?? placeholder}`}
      style={({ pressed }) => [styles.locationRow, pressed && styles.locationPressed]}>
      <View style={[styles.dot, { backgroundColor: dotColor }]} />
      <View style={styles.locationBody}>
        <Text style={styles.locationLabel}>{label}</Text>
        <Text
          style={[styles.locationValue, !value && styles.locationPlaceholder]}
          numberOfLines={1}>
          {value ?? placeholder}
        </Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

/**
 * A phone number tied to one end of the order.
 *
 * Kept inside the same card as the address it belongs to, rather than in a
 * separate contacts block: the driver calls "the person at the pickup", so the
 * number reads as part of that leg.
 */
/**
 * What is being sent.
 *
 * Optional, and deliberately not validated. The driver reads it to decide
 * whether they can carry the thing, and the range of answers people give — "my
 * daughter's lunchbox", "50kg of rice", "documents, urgent" — is exactly what a
 * category picker would have flattened. Free text is the honest shape until
 * there is enough of it to learn categories from.
 */
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
        placeholder="Optional — e.g. two cartons of frozen chicken"
        placeholderTextColor={colors.textDisabled}
        // Matches the column, so the server never has to reject what was typed.
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

  // Only complained about once there is enough typed to be wrong — nagging an
  // empty field the moment it is focused is noise.
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
  inputs: { padding: 0, overflow: 'hidden' },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
  },
  locationPressed: { backgroundColor: colors.surfaceAlt },
  dot: { width: 10, height: 10, borderRadius: 5 },
  locationBody: { flex: 1, gap: 1 },
  locationLabel: { ...type.caption },
  locationValue: { ...type.body, fontSize: 15 },
  locationPlaceholder: { color: colors.textDisabled },
  chevron: { fontSize: 22, color: colors.textDisabled },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingBottom: spacing.md,
    // Aligned with the location value above, past the 10px dot and its gap.
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
