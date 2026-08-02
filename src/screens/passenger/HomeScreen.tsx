import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AddressSearchSheet } from '@/components/booking/AddressSearchSheet';
import { MapPanel } from '@/components/booking/MapPanel';
import { AppHeader, Avatar, Button, Card, Screen } from '@/components/ui';
import { BOOKING_COPY } from '@/data/copy';
import { ROUTES } from '@/navigation/routes';
import { useOpenDrawer } from '@/navigation/useAppNavigation';
import type { PassengerStackParamList } from '@/navigation/types';
import { useAppStore } from '@/store/appStore';
import { useBookingStore } from '@/store/bookingStore';
import { makeStyles, spacing, useTheme } from '@/theme';
import type { Place } from '@/types/models';
import { distanceKm, estimateFare } from '@/utils/geo';

type Props = NativeStackScreenProps<
  PassengerStackParamList,
  typeof ROUTES.PASSENGER_HOME
>;

type SheetTarget = 'pickup' | 'dropoff' | null;

export function HomeScreen({ navigation }: Props) {
  const styles = useStyles();
  const { colors } = useTheme();
  const openDrawer = useOpenDrawer();

  const user = useAppStore((s) => s.user);
  const profilePhoto = useAppStore((s) => s.photos.profile);

  const pickup = useBookingStore((s) => s.pickup);
  const dropoff = useBookingStore((s) => s.dropoff);
  const setPickup = useBookingStore((s) => s.setPickup);
  const setDropoff = useBookingStore((s) => s.setDropoff);

  const [sheet, setSheet] = useState<SheetTarget>(null);

  // TEMPORARY DIAGNOSTIC — remove once the "no screen named 'Matching'" report
  // is resolved. Logs which navigator actually owns this screen and what route
  // names it knows about, walking up the parent chain.
  useEffect(() => {
    type NavNode = {
      getState: () => { type?: string; routeNames?: string[] };
      getParent: () => NavNode | undefined;
    };

    const chain: string[] = [];
    let nav: NavNode | undefined = navigation as unknown as NavNode;
    while (nav) {
      const s = nav.getState();
      chain.push(`${s.type ?? '?'}[${(s.routeNames ?? []).join(',')}]`);
      nav = nav.getParent();
    }
    // eslint-disable-next-line no-console
    console.log('[nav-diag] HomeScreen owner chain:', chain.join('  ->  '));
  }, [navigation]);

  const ready = Boolean(pickup && dropoff);
  const km = pickup && dropoff ? distanceKm(pickup, dropoff) : null;
  const fare = km != null ? estimateFare(km) : null;

  const handleSelect = (place: Place) => {
    if (sheet === 'pickup') setPickup(place);
    else if (sheet === 'dropoff') setDropoff(place);
  };

  return (
    <Screen
      scroll
      footer={
        <Button
          label={BOOKING_COPY.findRider}
          onPress={() =>
            pickup && dropoff && navigation.navigate(ROUTES.MATCHING, { pickup, dropoff })
          }
          disabled={!ready}
          testID="find-rider"
        />
      }>
      <AppHeader
        onMenu={openDrawer}
        trailing={<Avatar uri={profilePhoto?.uri} name={user?.firstName} size={36} />}
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
        <View style={styles.rowDivider} />
        <LocationRow
          dotColor={colors.danger}
          label="Drop-off"
          value={dropoff?.name}
          placeholder={BOOKING_COPY.searchPlaceholder}
          onPress={() => setSheet('dropoff')}
        />
      </Card>

      {ready && km != null && fare != null ? (
        <Card style={styles.estimate}>
          <View style={styles.estimateItem}>
            <Text style={styles.estimateLabel}>Distance</Text>
            <Text style={styles.estimateValue}>{km.toFixed(1)} km</Text>
          </View>
          <View style={styles.estimateDivider} />
          <View style={styles.estimateItem}>
            <Text style={styles.estimateLabel}>Est. fare</Text>
            <Text style={[styles.estimateValue, styles.estimateFare]}>
              ₦{fare.toLocaleString()}
            </Text>
          </View>
          <View style={styles.estimateDivider} />
          <View style={styles.estimateItem}>
            <Text style={styles.estimateLabel}>Est. time</Text>
            <Text style={styles.estimateValue}>{Math.max(4, Math.round(km * 3))} min</Text>
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
  rowDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.divider,
    marginLeft: 42,
  },
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
