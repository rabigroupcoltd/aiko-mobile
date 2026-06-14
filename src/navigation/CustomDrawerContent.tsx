import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { User, Car, LogOut, HelpCircle, Settings, Repeat } from 'lucide-react-native';
import { COLORS } from '../theme';
import { useNavigation } from '@react-navigation/native';

export const CustomDrawerContent = (props: any) => {
  const navigation = useNavigation<any>();
  const isDriver = props.role === 'DRIVER';

  const handleRoleSwitch = () => {
    // Navigate back to Main with flipped role, or however state is managed.
    // For now we assume we just navigate with params to force reload MainTabs
    navigation.reset({
      index: 0,
      routes: [{ name: 'Main', params: { role: isDriver ? 'PASSENGER' : 'DRIVER' } }],
    });
  };

  const handleLogout = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Welcome' }],
    });
  };

  return (
    <View style={styles.container}>
      <DrawerContentScrollView {...props} contentContainerStyle={{ paddingTop: 0 }}>
        {/* Header Profile Section */}
        <View style={styles.header}>
          <Image
            source={{ uri: 'https://i.pravatar.cc/150?img=32' }}
            style={styles.profileImage}
          />
          <Text style={styles.name}>John Doe</Text>
          <Text style={styles.email}>johndoe@example.com</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{isDriver ? 'Driver Account' : 'Passenger Account'}</Text>
          </View>
        </View>

        <View style={styles.menuContainer}>
          {/* Switch Role Button */}
          <TouchableOpacity style={styles.menuItem} onPress={handleRoleSwitch}>
            <Repeat size={22} color={COLORS.primary} />
            <Text style={styles.menuItemText}>
              Switch to {isDriver ? 'Passenger' : 'Driver'}
            </Text>
          </TouchableOpacity>

          {/* Profile & Vehicle Info */}
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('ProfileSetup')}>
            <User size={22} color={COLORS.text} />
            <Text style={styles.menuItemText}>Update Profile {isDriver ? '& Vehicle' : ''}</Text>
          </TouchableOpacity>

          {/* Help Center */}
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('HelpCenter')}>
            <HelpCircle size={22} color={COLORS.text} />
            <Text style={styles.menuItemText}>Help Center</Text>
          </TouchableOpacity>

          {/* Settings */}
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Settings')}>
            <Settings size={22} color={COLORS.text} />
            <Text style={styles.menuItemText}>Settings</Text>
          </TouchableOpacity>
        </View>
      </DrawerContentScrollView>

      {/* Footer / Logout */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={22} color={COLORS.error} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
        <Text style={styles.versionText}>App Version 1.0.0</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    backgroundColor: COLORS.primary,
    padding: 24,
    paddingTop: 60,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#FFF',
    marginBottom: 12,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 12,
  },
  roleBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  roleText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  menuContainer: {
    paddingHorizontal: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  menuItemText: {
    fontSize: 16,
    color: COLORS.text,
    marginLeft: 16,
    fontWeight: '500',
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoutText: {
    fontSize: 16,
    color: COLORS.error,
    marginLeft: 16,
    fontWeight: '600',
  },
  versionText: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
});
