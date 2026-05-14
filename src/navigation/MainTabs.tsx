import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Package, User, Wallet as WalletIcon, Megaphone } from 'lucide-react-native';
import { GoOnlineScreen } from '../screens/GoOnlineScreen';
import { OrderListScreen } from '../screens/OrderListScreen';
import { BookingScreen } from '../screens/BookingScreen';
import { WalletScreen } from '../screens/WalletScreen';
import { AnnouncementScreen } from '../screens/AnnouncementScreen';
import { COLORS } from '../theme';
import { View, Text, StyleSheet, Platform } from 'react-native';

const Tab = createBottomTabNavigator();

export const MainTabs = ({ route }: any) => {
  const role = route.params?.role || 'PASSENGER';
  const isDriver = role === 'DRIVER';

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700', marginBottom: 4 },
        tabBarStyle: {
          height: Platform.OS === 'ios' ? 90 : 70,
          paddingBottom: Platform.OS === 'ios' ? 30 : 10,
          paddingTop: 10,
          borderTopLeftRadius: 30,
          borderTopRightRadius: 30,
          backgroundColor: '#FFF',
          borderTopWidth: 0,
          elevation: 25,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -10 },
          shadowOpacity: 0.1,
          shadowRadius: 15,
        }
      }}
    >
      <Tab.Screen
        name="Home"
        component={isDriver ? GoOnlineScreen : BookingScreen}
        options={{ 
          tabBarIcon: ({ color }) => <Home size={24} color={color} />, 
          tabBarLabel: 'Home' 
        }}
      />
      <Tab.Screen
        name="Wallet"
        component={WalletScreen}
        options={{ 
          tabBarIcon: ({ color }) => <WalletIcon size={24} color={color} />, 
          tabBarLabel: 'Wallet' 
        }}
      />
      <Tab.Screen
        name="Orders"
        component={OrderListScreen}
        options={{ 
          tabBarIcon: ({ color }) => <Package size={24} color={color} />, 
          tabBarLabel: 'Rides' 
        }}
      />
      <Tab.Screen
        name="Announcements"
        component={AnnouncementScreen}
        options={{ 
          tabBarIcon: ({ color }) => <Megaphone size={24} color={color} />, 
          tabBarLabel: 'News' 
        }}
      />
    </Tab.Navigator>
  );
};
