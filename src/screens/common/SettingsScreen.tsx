import Constants from 'expo-constants';
import { Alert, Linking, Switch, Text, View } from 'react-native';

import { AppHeader, Button, Card, ListRow, Screen, ThemeToggle } from '@/components/ui';
import { PRIVACY_URL, SUPPORT_EMAIL, TERMS_URL } from '@/config/env';
import { DeleteAccountManager, useLogoutManager } from '@/modules/auth/authController';
import { useOpenDrawer } from '@/navigation/useAppNavigation';
import { useAppStore } from '@/store/appStore';
import { makeStyles, radius, spacing, useTheme } from '@/theme';

export function SettingsScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const openDrawer = useOpenDrawer();

  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const { logout } = useLogoutManager();
  const { deleteAccount, isLoading: deleting } = DeleteAccountManager();

  const confirmDelete = () => {
    Alert.alert(
      'Delete your account?',
      "This permanently deletes your profile, contact details, photos and documents, and saved addresses. Records of past trips are kept without your details. This can't be undone.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete account',
          style: 'destructive',
          onPress: () => {
            void deleteAccount().catch(() => {});
          },
        },
      ],
    );
  };

  const confirmLogout = () => {
    Alert.alert('Log out?', 'You will need to sign in again to continue.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: () => void logout() },
    ]);
  };

  return (
    <Screen scroll>
      <AppHeader onMenu={openDrawer} title="Settings" />

      <Card style={styles.section}>
        <ThemeToggle />
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <ListRow
          icon="🔔"
          title="Push notifications"
          subtitle="Trip updates and rider arrival"
          chevron={false}
          trailing={
            <Switch
              value={settings.pushEnabled}
              onValueChange={(v) => updateSettings({ pushEnabled: v })}
              trackColor={{ true: colors.green[300], false: colors.border }}
              thumbColor={settings.pushEnabled ? colors.primary : colors.neutral[400]}
            />
          }
        />
        <ListRow
          icon="💬"
          title="SMS alerts"
          subtitle="Booking confirmations by text"
          chevron={false}
          trailing={
            <Switch
              value={settings.smsEnabled}
              onValueChange={(v) => updateSettings({ smsEnabled: v })}
              trackColor={{ true: colors.green[300], false: colors.border }}
              thumbColor={settings.smsEnabled ? colors.primary : colors.neutral[400]}
            />
          }
        />
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <ListRow icon="📄" title="Terms of service" onPress={() => void Linking.openURL(TERMS_URL)} />
        <ListRow icon="🔒" title="Privacy policy" onPress={() => void Linking.openURL(PRIVACY_URL)} />
        <ListRow
          icon="✉️"
          title="Contact support"
          subtitle={SUPPORT_EMAIL}
          onPress={() => void Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=Aiko%20support`)}
        />
        <ListRow
          icon="ℹ️"
          title="Version"
          subtitle={Constants.expoConfig?.version ?? '1.0.0'}
          chevron={false}
        />
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <ListRow icon="🚪" title="Log out" onPress={confirmLogout} chevron={false} />
        <ListRow
          icon="🗑️"
          title={deleting ? 'Deleting account…' : 'Delete account'}
          subtitle="Permanently delete your account and data"
          onPress={deleting ? undefined : confirmDelete}
          chevron={false}
        />
      </Card>
    </Screen>
  );
}

const useStyles = makeStyles(({ colors, type }) => ({
  section: { marginBottom: spacing.base, padding: 0, paddingTop: spacing.md },
  sectionTitle: { ...type.label, paddingHorizontal: spacing.base },
}));
