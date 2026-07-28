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
import { ALL_PLACES, usePlaceSearch } from '@/hooks/usePlaceSearch';
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
  const { results, state, loading } = usePlaceSearch(query);

  // With no query we show the full list, which doubles as a "popular places"
  // browser and keeps the screen from ever looking empty.
  const showing = query.trim() ? results : ALL_PLACES;
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
            {query.trim() === '' ? (
              <Text style={styles.status}>All saved Minna locations</Text>
            ) : isCacheHit ? (
              <Text style={styles.statusCache}>
                ✓ {results.length} match{results.length === 1 ? '' : 'es'} from local cache
              </Text>
            ) : loading ? (
              <Text style={styles.status}>{BOOKING_COPY.remoteSearching}</Text>
            ) : (
              <Text style={styles.statusMiss}>Cache miss — no wider results</Text>
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
            loading ? null : (
              <EmptyState
                icon="🔍"
                title={BOOKING_COPY.noResults}
                body={BOOKING_COPY.noResultsHint}
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
