import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Bell, Mail, MapPin, Moon, Globe, LogOut, ChevronRight } from 'lucide-react-native';
import { COLORS, SPACING } from '../theme';
import { useNavigation } from '@react-navigation/native';

const LANGUAGES = ['English', 'Yoruba', 'Igbo', 'Hausa'];

export const SettingsScreen = () => {
  const navigation = useNavigation<any>();
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [languageIndex, setLanguageIndex] = useState(0);

  const cycleLanguage = () => {
    setLanguageIndex((prev) => (prev + 1) % LANGUAGES.length);
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: () => navigation.reset({ index: 0, routes: [{ name: 'PhoneInput' }] }),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>Preferences</Text>
        <View style={styles.card}>
          <SettingRow
            icon={<Bell size={20} color={COLORS.primary} />}
            label="Push Notifications"
            value={pushEnabled}
            onValueChange={setPushEnabled}
          />
          <SettingRow
            icon={<Mail size={20} color={COLORS.primary} />}
            label="Email Updates"
            value={emailEnabled}
            onValueChange={setEmailEnabled}
          />
          <SettingRow
            icon={<MapPin size={20} color={COLORS.primary} />}
            label="Location Services"
            value={locationEnabled}
            onValueChange={setLocationEnabled}
          />
          <SettingRow
            icon={<Moon size={20} color={COLORS.primary} />}
            label="Dark Mode"
            value={darkMode}
            onValueChange={setDarkMode}
            isLast
          />
        </View>

        <Text style={styles.sectionLabel}>General</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.row} onPress={cycleLanguage}>
            <View style={styles.rowLeft}>
              <Globe size={20} color={COLORS.primary} />
              <Text style={styles.rowLabel}>Language</Text>
            </View>
            <View style={styles.rowRight}>
              <Text style={styles.rowValue}>{LANGUAGES[languageIndex]}</Text>
              <ChevronRight size={18} color={COLORS.textMuted} />
            </View>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionLabel}>Account</Text>
        <View style={styles.card}>
          <TouchableOpacity style={[styles.row, styles.lastRow]} onPress={handleLogout}>
            <View style={styles.rowLeft}>
              <LogOut size={20} color={COLORS.error} />
              <Text style={[styles.rowLabel, { color: COLORS.error }]}>Log Out</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const SettingRow = ({
  icon,
  label,
  value,
  onValueChange,
  isLast,
}: {
  icon: React.ReactNode;
  label: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  isLast?: boolean;
}) => (
  <View style={[styles.row, isLast && styles.lastRow]}>
    <View style={styles.rowLeft}>
      {icon}
      <Text style={styles.rowLabel}>{label}</Text>
    </View>
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: COLORS.border, true: COLORS.primary }}
      thumbColor={COLORS.white}
    />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  content: {
    padding: SPACING.xl,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.sm,
    marginTop: SPACING.lg,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  rowValue: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
});
