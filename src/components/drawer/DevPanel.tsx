import { Alert, Text, View } from 'react-native';

import { Button } from '@/components/ui';
import { useAppStore } from '@/store/appStore';
import { approveRider, resetDemo, switchRole, unapproveRider } from '@/store/devActions';
import { makeStyles, radius, spacing } from '@/theme';

interface DevPanelProps {
  /** Close the drawer before mutating state, so remounts happen off-screen. */
  closeDrawer: () => void;
}

/**
 * Demo controls. Role switching lives here (and is the button requested for the
 * walkthrough) alongside the reset and approval shortcuts.
 */
export function DevPanel({ closeDrawer }: DevPanelProps) {
  const styles = useStyles();
  const role = useAppStore((s) => s.role);
  const verificationStatus = useAppStore((s) => s.verificationStatus);

  const nextRole = role === 'rider' ? 'Passenger' : 'Rider';

  const handleSwitchRole = () => {
    closeDrawer();
    // Let the drawer finish closing first — switching role remounts the
    // navigator, and doing that under an open drawer looks broken.
    setTimeout(switchRole, 260);
  };

  const handleReset = () => {
    Alert.alert(
      'Reset demo?',
      'This clears the saved profile, photos and documents, and returns to the welcome screen.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            closeDrawer();
            setTimeout(() => void resetDemo(), 260);
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.badge}>DEV</Text>
        <Text style={styles.title}>Demo controls</Text>
      </View>

      <Button
        label={`Switch to ${nextRole}`}
        variant="secondary"
        size="sm"
        onPress={handleSwitchRole}
        leading={<Text>{role === 'rider' ? '🧍' : '🏍️'}</Text>}
      />

      {role === 'rider' ? (
        verificationStatus === 'approved' ? (
          <Button
            label="Set back to pending"
            variant="ghost"
            size="sm"
            onPress={() => {
              closeDrawer();
              setTimeout(unapproveRider, 260);
            }}
          />
        ) : (
          <Button
            label="Simulate admin approval"
            variant="secondary"
            size="sm"
            onPress={() => {
              closeDrawer();
              setTimeout(approveRider, 260);
            }}
            leading={<Text>✅</Text>}
          />
        )
      ) : null}

      <Button label="Reset demo" variant="danger" size="sm" onPress={handleReset} />
    </View>
  );
}

const useStyles = makeStyles(({ colors, type }) => ({
  container: {
    margin: spacing.base,
    padding: spacing.md,
    gap: spacing.sm,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.base,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.borderStrong,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xxs,
  },
  badge: {
    ...type.caption,
    fontWeight: '700',
    color: colors.warning,
    backgroundColor: colors.warningBg,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  title: type.label,
}));
