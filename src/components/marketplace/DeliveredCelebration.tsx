import { useEffect } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInUp, FadeOut } from 'react-native-reanimated';

import { Confetti, CountUpText, SuccessBurst } from '@/components/motion';
import { makeStyles, radius, spacing } from '@/theme';

const AUTO_DISMISS_MS = 2800;

/**
 * The payoff after "Delivered": a burst, confetti and the earnings rolling up.
 * Closes itself after a few seconds, or on tap.
 */
export function DeliveredCelebration({
  earnings,
  onClose,
}: {
  earnings: number | null;
  onClose: () => void;
}) {
  const styles = useStyles();
  const visible = earnings != null;

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(onClose, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [visible, onClose]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      {visible ? (
        <Pressable style={styles.fill} onPress={onClose} accessibilityLabel="Close">
          <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(180)} style={styles.backdrop} />
          <Confetti />
          <View style={styles.center} pointerEvents="none">
            <Animated.View entering={FadeInUp.springify().damping(14)} style={styles.card}>
              <SuccessBurst size={88} />
              <Text style={styles.title}>Delivered!</Text>
              <CountUpText
                value={earnings}
                format={(n) => `+₦${Math.round(n).toLocaleString()}`}
                style={styles.amount}
              />
              <Text style={styles.caption}>added to today's earnings. Nice one 🙌</Text>
            </Animated.View>
          </View>
        </Pressable>
      ) : null}
    </Modal>
  );
}

const useStyles = makeStyles(({ colors, type }) => ({
  fill: { flex: 1 },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.scrim },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  card: {
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
  },
  title: { ...type.title, marginTop: spacing.sm },
  amount: { ...type.display, color: colors.primary, fontVariant: ['tabular-nums'] },
  caption: { ...type.bodySmall, color: colors.textSecondary, textAlign: 'center' },
}));
