import { useState } from 'react';
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
 * The cache-hit vs remote-lookup distinction is surfaced explicitly here —
 * that two-tier behaviour is the point of this screen in the demo, so it has to
 * be legible rather than hidden behind an instant result.
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
  const { results, state, loading, error } = usePlaceSearch(query);
  const { places: savedPlaces, loading: savedLoading } = useDefaultPlaces();

  // With no query we show the caller's saved addresses. The old "browse every
  // landmark" list went with the bundled JSON — those places are on the server
  // now and reached by typing.
  const searching = query.trim().length > 0;
  const showing = searching ? results : savedPlaces;
  const isCacheHit = state === 'cache-hit';

  const handleSelect = (place: Place) => {
    onSelect(place);
    setQuery('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Pressable onPress={onClose} hitSlop={12} accessibilityLabel="Close">
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
            {error ? (
              <Text style={styles.statusMiss}>{error}</Text>
            ) : !searching ? (
              <Text style={styles.status}>
                {savedLoading ? 'Loading your places…' : 'Your saved places'}
              </Text>
            ) : loading ? (
              <Text style={styles.status}>{BOOKING_COPY.remoteSearching}</Text>
            ) : isCacheHit ? (
              <Text style={styles.statusCache}>
                ✓ {results.length} match{results.length === 1 ? '' : 'es'} from local cache
              </Text>
            ) : results.length > 0 ? (
              <Text style={styles.status}>{results.length} found</Text>
            ) : (
              <Text style={styles.statusMiss}>No matches</Text>
            )}
          </View>
        </View>

        <FlatList
          data={showing}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <PlaceRow place={item} cached={isCacheHit} onPress={() => handleSelect(item)} />
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            loading || savedLoading ? null : (
              <EmptyState
                icon="🔍"
                title={searching ? BOOKING_COPY.noResults : 'No saved places yet'}
                body={
                  searching
                    ? BOOKING_COPY.noResultsHint
                    : 'Search for a landmark, market or area to get started.'
                }
              />
            )
          }
        />
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
  statusCache: { ...type.caption, color: colors.primary, fontWeight: '600' },
  statusMiss: { ...type.caption, color: colors.warning },
  list: { paddingHorizontal: screenGutter, paddingBottom: spacing.xxl },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.divider,
    marginLeft: 52,
  },
}));
