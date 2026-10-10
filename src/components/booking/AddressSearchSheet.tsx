import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState, TextField } from '@/components/ui';
import { BOOKING_COPY } from '@/data/copy';
import { useDefaultPlaces, usePlaceSearch } from '@/hooks/usePlaceSearch';
import { CreateAddressManager } from '@/modules/addresses/addressesController';
import { getPlaceDetails, type PlacePrediction } from '@/services/googlePlaces';
import { makeStyles, screenGutter, spacing, useTheme } from '@/theme';
import type { Place } from '@/types/models';
import { PlaceRow } from './PlaceRow';

interface AddressSearchSheetProps {
  visible: boolean;
  title: string;
  placeholder: string;
  onSelect: (place: Place) => void;
  onClose: () => void;
}

/**
 * Full-screen address picker.
 *
 * Typing hits Google Places Autocomplete directly. Picking a result resolves
 * its coordinates with one Place Details call, saves it to the caller's
 * address book (so it shows up under "Your saved places" next time), and only
 * then hands the fully-formed `Place` back to the caller.
 */
export function AddressSearchSheet({
  visible,
  title,
  placeholder,
  onSelect,
  onClose,
}: AddressSearchSheetProps) {
  const styles = useStyles();
  const { colors } = useTheme();
  const [query, setQuery] = useState('');
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const { predictions, state, loading, error, sessionToken, resetSession } =
    usePlaceSearch(query);
  const { places: savedPlaces, loading: savedLoading } = useDefaultPlaces();
  const { createAddress } = CreateAddressManager();

  // A fresh session each time the sheet opens, per Google's billing model —
  // the previous session already ended in a pick, a close, or nothing at all.
  useEffect(() => {
    if (visible) resetSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const searching = query.trim().length > 0;

  const handleClose = () => {
    setQuery('');
    onClose();
  };

  const handleSelectSaved = (place: Place) => {
    onSelect(place);
    setQuery('');
    onClose();
  };

  const handleSelectPrediction = async (prediction: PlacePrediction) => {
    if (resolvingId) return;
    setResolvingId(prediction.placeId);

    try {
      const resolved = await getPlaceDetails(prediction.placeId, sessionToken);

      const place: Place = {
        id: resolved.placeId,
        name: resolved.name || prediction.mainText,
        address: resolved.address,
        lat: resolved.lat,
        lng: resolved.lng,
        placeId: resolved.placeId,
        category: null,
        source: 'REMOTE',
        isDefault: false,
      };

      onSelect(place);
      setQuery('');
      resetSession();
      onClose();

      // Fire-and-forget: the booking flow shouldn't stall — or fail — on this.
      createAddress({
        name: place.name,
        address: place.address,
        latitude: place.lat,
        longitude: place.lng,
        placeId: place.placeId ?? undefined,
      }).catch(() => undefined);
    } catch {
      // Leave the sheet open with the existing results — the status row
      // already surfaces a generic error state on the next render if this
      // becomes a pattern; a one-off tap failure isn't worth a toast.
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Pressable onPress={handleClose} hitSlop={12} accessibilityLabel="Close">
            <Text style={styles.close}>✕</Text>
          </Pressable>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.closeSpacer} />
        </View>

        <View style={styles.searchWrap}>
          <TextField
            value={query}
            onChangeText={setQuery}
            placeholder={placeholder}
            autoFocus
            autoCorrect={false}
            containerStyle={styles.searchField}
            trailing={
              loading ? <ActivityIndicator size="small" color={colors.primary} /> : undefined
            }
          />

          <View style={styles.statusRow}>
            {!searching ? (
              <Text style={styles.status}>
                {savedLoading ? 'Loading your places…' : 'Your saved places'}
              </Text>
            ) : state === 'error' ? (
              <Text style={styles.statusMiss}>{error}</Text>
            ) : state === 'searching' ? (
              <Text style={styles.status}>{BOOKING_COPY.remoteSearching}</Text>
            ) : state === 'results' ? (
              <Text style={styles.status}>
                {predictions.length} found
              </Text>
            ) : (
              <Text style={styles.statusMiss}>{BOOKING_COPY.noResults}</Text>
            )}
          </View>
        </View>

        {searching ? (
          <FlatList
            data={predictions}
            keyExtractor={(item) => item.placeId}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <PlaceRow
                place={{
                  id: item.placeId,
                  name: item.mainText,
                  address: item.secondaryText || item.description,
                  lat: 0,
                  lng: 0,
                  placeId: item.placeId,
                  category: null,
                  source: 'REMOTE',
                  isDefault: false,
                }}
                onPress={() => handleSelectPrediction(item)}
                loading={resolvingId === item.placeId}
              />
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListEmptyComponent={
              loading ? null : (
                <EmptyState
                  icon="🔍"
                  title={BOOKING_COPY.noResults}
                  body={BOOKING_COPY.noResultsHint}
                />
              )
            }
          />
        ) : (
          <FlatList
            data={savedPlaces}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <PlaceRow place={item} onPress={() => handleSelectSaved(item)} />
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListEmptyComponent={
              savedLoading ? null : (
                <EmptyState
                  icon="🔍"
                  title="No saved places yet"
                  body="Search for a landmark, market or area to get started."
                />
              )
            }
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}

const useStyles = makeStyles(({ colors, type }) => ({
  container: { flex: 1, backgroundColor: colors.surface },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: screenGutter,
    paddingVertical: spacing.md,
  },
  close: { fontSize: 20, color: colors.text, width: 32 },
  closeSpacer: { width: 32 },
  title: type.subheading,
  searchWrap: { paddingHorizontal: screenGutter },
  searchField: { marginBottom: spacing.xs },
  statusRow: { paddingBottom: spacing.sm },
  status: type.caption,
  statusMiss: { ...type.caption, color: colors.warning },
  list: { paddingHorizontal: screenGutter, paddingBottom: spacing.xxl },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.divider,
    marginLeft: 52,
  },
}));
