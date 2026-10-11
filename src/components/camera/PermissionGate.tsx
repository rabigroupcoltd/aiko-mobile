import type { ReactNode } from 'react';
import { Linking, Text, View } from 'react-native';
import { useCameraPermissions } from 'expo-camera';

import { Button } from '@/components/ui';
import { makeStyles, radius, spacing } from '@/theme';

interface PermissionGateProps {
  children: ReactNode;
  onCancel: () => void;
}

export function PermissionGate({ children, onCancel }: PermissionGateProps) {
  const styles = useStyles();
  const [permission, requestPermission] = useCameraPermissions();

  if (!permission) {
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
