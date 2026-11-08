import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PressableScale, Shimmer } from '@/components/motion';
import { EmptyState, Icon, TextField } from '@/components/ui';
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

      createAddress({
        name: place.name,
        address: place.address,
        latitude: place.lat,
        longitude: place.lng,
        placeId: place.placeId ?? undefined,
      }).catch(() => undefined);
    } catch {
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <PressableScale onPress={handleClose} hitSlop={12} accessibilityLabel="Close" style={styles.closeButton}>
            <Icon name="x" size={22} color={colors.text} />
          </PressableScale>
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
                {savedLoading ? 'Loading your places…' : 'Places you have used'}
              </Text>
            ) : state === 'error' ? (
              <Text style={styles.statusMiss}>{error}</Text>
            ) : state === 'searching' ? (
              <Text style={styles.status}>{BOOKING_COPY.remoteSearching}</Text>
            ) : state === 'results' ? (
              <Text style={styles.status}>
                {predictions.length} {predictions.length === 1 ? 'place' : 'places'} found
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
            renderItem={({ item, index }) => (
              <Animated.View entering={FadeIn.delay(Math.min(index, 8) * 30)}>
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
              </Animated.View>
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListEmptyComponent={
              loading ? (
                <PlaceSkeleton />
              ) : (
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
            renderItem={({ item, index }) => (
              <Animated.View entering={FadeIn.delay(Math.min(index, 8) * 30)}>
                <PlaceRow place={item} onPress={() => handleSelectSaved(item)} />
              </Animated.View>
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListEmptyComponent={
              savedLoading ? (
                <PlaceSkeleton />
              ) : (
                <EmptyState
                  icon="🔍"
                  title="No places yet"
                  body="Search for a landmark, market or street, like Kpakungu or Bosso Market."
                />
              )
            }
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}

function PlaceSkeleton() {
  const styles = useStyles();
  return (
    <View style={styles.skeleton} accessibilityLabel="Loading places">
      {[0, 1, 2, 3].map((i) => (
        <View key={i} style={styles.skeletonRow}>
          <Shimmer width={40} height={40} />
          <View style={styles.skeletonText}>
            <Shimmer width="55%" height={14} />
            <Shimmer width="80%" height={11} />
          </View>
        </View>
      ))}
    </View>
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
  closeButton: { width: 32 },
  skeleton: { gap: spacing.md, paddingTop: spacing.sm },
  skeletonRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  skeletonText: { flex: 1, gap: 6 },
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
