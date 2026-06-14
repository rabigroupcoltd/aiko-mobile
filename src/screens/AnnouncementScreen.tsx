import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Megaphone, ChevronRight, ChevronDown } from 'lucide-react-native';
import { COLORS } from '../theme';

const ANNOUNCEMENTS = [
  {
    id: '1',
    title: 'New Service Area: Ikeja',
    content: 'We are excited to announce that we are now operational in Ikeja and surroundings!',
    date: 'Oct 25, 2023',
    image: 'https://images.unsplash.com/photo-1555899434-94d1368aa7af?q=80&w=500&auto=format&fit=crop',
  },
  {
    id: '2',
    title: 'Driver Bonus Week',
    content: 'Complete 20 rides this week and get a ₦10,000 bonus! Valid till Sunday.',
    date: 'Oct 23, 2023',
    image: 'https://images.unsplash.com/photo-1549463387-92c02abf2c95?q=80&w=500&auto=format&fit=crop',
  },
];

export const AnnouncementScreen = () => {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const renderItem = ({ item }: { item: typeof ANNOUNCEMENTS[0] }) => {
    const expanded = expandedIds.has(item.id);
    return (
      <TouchableOpacity style={styles.card} onPress={() => toggleExpanded(item.id)} activeOpacity={0.9}>
        <Image source={{ uri: item.image }} style={styles.image} />
        <View style={styles.content}>
          <View style={styles.dateBadge}>
            <Text style={styles.dateText}>{item.date}</Text>
          </View>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.description} numberOfLines={expanded ? undefined : 2}>{item.content}</Text>
          <View style={styles.footer}>
            <Text style={styles.readMore}>{expanded ? 'Show Less' : 'Read More'}</Text>
            {expanded ? <ChevronDown size={16} color={COLORS.primary} /> : <ChevronRight size={16} color={COLORS.primary} />}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Announcements</Text>
      </View>

      <FlatList
        data={ANNOUNCEMENTS}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.promoHeader}>
            <View style={styles.promoTextContainer}>
              <Text style={styles.promoTitle}>Stay Updated</Text>
              <Text style={styles.promoSubtitle}>Get the latest news and offers directly from us.</Text>
            </View>
            <Megaphone size={40} color={COLORS.primary} />
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFF',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
  },
  listContent: {
    padding: 20,
  },
  promoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
  },
  promoTextContainer: {
    flex: 1,
  },
  promoTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0D47A1',
    marginBottom: 4,
  },
  promoSubtitle: {
    fontSize: 14,
    color: '#1565C0',
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  image: {
    width: '100%',
    height: 180,
  },
  content: {
    padding: 20,
  },
  dateBadge: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  dateText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: COLORS.textMuted,
    lineHeight: 20,
    marginBottom: 16,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  readMore: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
    marginRight: 4,
  },
});
