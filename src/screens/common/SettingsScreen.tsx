import { Alert, Switch, Text, View } from 'react-native';

import { AppHeader, Button, Card, ListRow, Screen, ThemeToggle } from '@/components/ui';
import { featureFlags } from '@/config/featureFlags';
import { useOpenDrawer } from '@/navigation/useAppNavigation';
import { useAppStore } from '@/store/appStore';
import { approveRider, resetDemo, switchRole, unapproveRider } from '@/store/devActions';
import { makeStyles, radius, spacing, useTheme } from '@/theme';

export function SettingsScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const openDrawer = useOpenDrawer();

  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const role = useAppStore((s) => s.role);
  const verificationStatus = useAppStore((s) => s.verificationStatus);
  const logout = useAppStore((s) => s.logout);

  const nextRole = role === 'rider' ? 'Passenger' : 'Rider';

  const confirmReset = () => {
    Alert.alert(
      'Reset demo?',
      'This clears the saved profile, photos and documents, and returns to the welcome screen.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: () => void resetDemo() },
      ]
    );
  };

  const confirmLogout = () => {
    Alert.alert('Log out?', 'You will need to sign in again to continue.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: logout },
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
        <ListRow icon="📄" title="Terms of service" onPress={() => {}} />
        <ListRow icon="🔒" title="Privacy policy" onPress={() => {}} />
        <ListRow icon="☎️" title="Contact support" subtitle="0800 000 0000" onPress={() => {}} />
        <ListRow icon="ℹ️" title="Version" subtitle="1.0.0 · Demo build" chevron={false} />
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <ListRow icon="🚪" title="Log out" onPress={confirmLogout} chevron={false} />
      </Card>

      {featureFlags.SHOW_DEV_PANEL ? (
        <View style={styles.dev}>
          <View style={styles.devHeader}>
            <Text style={styles.devBadge}>DEV</Text>
            <Text style={styles.devTitle}>Demo controls</Text>
          </View>
          <Text style={styles.devHint}>
            These shortcuts exist so you can walk the whole flow without redoing onboarding.
          </Text>

          <Button
            label={`Switch to ${nextRole}`}
            variant="secondary"
            size="sm"
            onPress={switchRole}
            leading={<Text>{role === 'rider' ? '🧍' : '🏍️'}</Text>}
          />

          {role === 'rider' ? (
            verificationStatus === 'approved' ? (
              <Button
                label="Set rider back to pending"
                variant="ghost"
                size="sm"
                onPress={unapproveRider}
              />
            ) : (
              <Button
                label="Simulate admin approval"
                variant="secondary"
                size="sm"
                onPress={approveRider}
                leading={<Text>✅</Text>}
              />
            )
          ) : null}

          <Button label="Reset demo" variant="danger" size="sm" onPress={confirmReset} />
        </View>
      ) : null}
    </Screen>
  );
}

const useStyles = makeStyles(({ colors, type }) => ({
  section: { marginBottom: spacing.base, padding: 0, paddingTop: spacing.md },
  sectionTitle: { ...type.label, paddingHorizontal: spacing.base },
  dev: {
    marginTop: spacing.sm,
    padding: spacing.base,
    gap: spacing.sm,
    borderRadius: radius.base,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceAlt,
  },
  devHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  devBadge: {
    ...type.caption,
    fontWeight: '700',
    color: colors.warning,
    backgroundColor: colors.warningBg,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  devTitle: { ...type.label },
  devHint: { ...type.caption, marginBottom: spacing.xxs },
}));
