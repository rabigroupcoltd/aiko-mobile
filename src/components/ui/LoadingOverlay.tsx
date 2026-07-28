import { ActivityIndicator, Modal, Text, View } from 'react-native';

import { makeStyles, radius, shadows, spacing, useTheme } from '@/theme';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

/** Blocking spinner for mocked "server" waits (OTP verify, document submit). */
export function LoadingOverlay({ visible, message }: LoadingOverlayProps) {
  const styles = useStyles();
  const { colors } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.backdrop}>
        <View style={styles.panel}>
          <ActivityIndicator size="large" color={colors.primary} />
          {message ? <Text style={styles.message}>{message}</Text> : null}
        </View>
      </View>
    </Modal>
  );
}

const useStyles = makeStyles(({ colors, type }) => ({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  panel: {
    minWidth: 180,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.xxl,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    alignItems: 'center',
    gap: spacing.base,
    ...shadows.xl,
  },
  message: { ...type.bodySmall, textAlign: 'center' },
}));
