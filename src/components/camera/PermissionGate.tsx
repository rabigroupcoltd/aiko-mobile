import type { ReactNode } from 'react';
import { Linking, Text, View } from 'react-native';
import { useCameraPermissions } from 'expo-camera';

import { Button } from '@/components/ui';
import { makeStyles, radius, spacing } from '@/theme';

interface PermissionGateProps {
  children: ReactNode;
  onCancel: () => void;
}

/**
 * Blocks the camera UI until permission is granted.
 *
 * Distinguishes "not asked yet" from "denied" — once Android marks a permission
 * as permanently denied, re-requesting silently no-ops, so the only useful
 * action left is deep-linking into Settings.
 */
export function PermissionGate({ children, onCancel }: PermissionGateProps) {
  const styles = useStyles();
  const [permission, requestPermission] = useCameraPermissions();

  if (!permission) {
    // Still resolving the current status.
    return <View style={styles.loading} />;
  }

  if (permission.granted) return <>{children}</>;

  const permanentlyDenied = !permission.granted && !permission.canAskAgain;

  return (
    <View style={styles.container}>
      <View style={styles.iconBadge}>
        <Text style={styles.icon}>📷</Text>
      </View>

      <Text style={styles.title}>Camera access needed</Text>
      <Text style={styles.body}>
        {permanentlyDenied
          ? 'Camera access is turned off for Aiko. Enable it in Settings to continue.'
          : 'Aiko needs your camera to take your photo and capture documents. Nothing is uploaded — this demo keeps everything on your device.'}
      </Text>

      <View style={styles.actions}>
        <Button
          label={permanentlyDenied ? 'Open Settings' : 'Allow camera'}
          onPress={() =>
            permanentlyDenied ? void Linking.openSettings() : void requestPermission()
          }
        />
        <Button label="Not now" variant="ghost" onPress={onCancel} />
      </View>
    </View>
  );
}

const useStyles = makeStyles(({ colors, type }) => ({
  // Matches the camera surface so there's no white flash before the preview.
  loading: { flex: 1, backgroundColor: '#111917' },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
    backgroundColor: colors.background,
  },
  iconBadge: {
    width: 72,
    height: 72,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  icon: { fontSize: 32 },
  title: { ...type.title, textAlign: 'center' },
  body: { ...type.bodySmall, textAlign: 'center', maxWidth: 320 },
  actions: { alignSelf: 'stretch', marginTop: spacing.xl, gap: spacing.sm },
}));
