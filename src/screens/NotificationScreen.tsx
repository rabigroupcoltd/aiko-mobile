import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, Package, Info, CheckCircle, ChevronLeft } from 'lucide-react-native';
import { COLORS } from '../theme';

const INITIAL_NOTIFICATIONS = [
  {
    id: '1',
    title: 'Ride Completed',
    description: 'You have completed your ride to Lagos Island. ₦3,500 has been added to your wallet.',
    time: '2 mins ago',
    type: 'ride',
    read: false,
  },
  {
    id: '2',
    title: 'Wallet Topped Up',
    description: 'Your wallet has been credited with ₦10,000 via Paystack.',
    time: '1 hour ago',
    type: 'wallet',
    read: true,
  },
  {
    id: '3',
    title: 'System Update',
    description: 'We have updated our terms and conditions. Please review them in the settings.',
    time: 'Yesterday',
    type: 'info',
    read: true,
  },
];

export const NotificationScreen = ({ navigation }: any) => {
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);

  const handlePress = (item: typeof INITIAL_NOTIFICATIONS[0]) => {
    setNotifications((prev) => prev.map((n) => (n.id === item.id ? { ...n, read: true } : n)));
    if (item.type === 'ride' || item.type === 'wallet') {
      navigation.navigate('Wallet');
    }
  };

  const renderItem = ({ item }: { item: typeof INITIAL_NOTIFICATIONS[0] }) => {
    const Icon = item.type === 'ride' ? Package : item.type === 'wallet' ? CheckCircle : Info;
    const iconColor = item.type === 'ride' ? COLORS.primary : item.type === 'wallet' ? '#2E7D32' : '#1565C0';

    return (
      <TouchableOpacity style={[styles.notificationItem, !item.read && styles.unreadItem]} onPress={() => handlePress(item)}>
        <View style={[styles.iconContainer, { backgroundColor: iconColor + '10' }]}>
          <Icon size={24} color={iconColor} />
        </View>
        <View style={styles.textContainer}>
          <View style={styles.titleRow}>
            <Text style={styles.itemTitle}>{item.title}</Text>
            <Text style={styles.itemTime}>{item.time}</Text>
          </View>
          <Text style={styles.itemDescription} numberOfLines={2}>{item.description}</Text>
        </View>
        {!item.read && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft size={28} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 28 }} />
      </View>

      <FlatList
        data={notifications}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Bell size={64} color="#E0E0E0" />
            <Text style={styles.emptyText}>No notifications yet</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 15,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  listContent: {
    padding: 16,
  },
  notificationItem: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    position: 'relative',
  },
  unreadItem: {
    backgroundColor: '#FFF',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  itemTime: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  itemDescription: {
    fontSize: 14,
    color: COLORS.textMuted,
    lineHeight: 20,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    position: 'absolute',
    top: 16,
    right: 16,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
});
