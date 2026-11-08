import { useEffect } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import Animated, {
  FadeIn,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { PressableScale, PulseDot } from '@/components/motion';
import { makeStyles, radius, shadows, spacing, useTheme } from '@/theme';

const TRACK_W = 64;
const TRACK_H = 36;
const KNOB = 28;

/**
 * The big go-online card. The whole card is the switch: it fills green with a
 * live pulse when online and greys out when off.
 */
export function ShiftToggle({
  online,
  busy,
  disabled,
  hint,
  onToggle,
}: {
  online: boolean;
  busy?: boolean;
  disabled?: boolean;
  hint?: string;
  onToggle: (next: boolean) => void;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  const on = useSharedValue(online ? 1 : 0);

  useEffect(() => {
    on.value = withSpring(online ? 1 : 0, { damping: 16, stiffness: 220 });
  }, [online, on]);

  const card = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(on.value, [0, 1], [colors.surface, colors.primary]),
    borderColor: interpolateColor(on.value, [0, 1], [colors.border, colors.primary]),
  }));
  const track = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(on.value, [0, 1], [colors.surfaceAlt, 'rgba(255,255,255,0.25)']),
  }));
  const knob = useAnimatedStyle(() => ({
    transform: [{ translateX: on.value * (TRACK_W - KNOB - 8) }],
    backgroundColor: interpolateColor(on.value, [0, 1], [colors.neutral[400], colors.accent]),
  }));

  const fg = online ? colors.onPrimary : colors.text;
  const sub = online ? 'rgba(255,255,255,0.85)' : colors.textSecondary;

  return (
    <PressableScale
      onPress={() => onToggle(!online)}
      disabled={disabled || busy}
      haptic="commit"
      scaleTo={0.98}
      accessibilityRole="switch"
      accessibilityState={{ checked: online, disabled: disabled || busy, busy }}
      accessibilityLabel={online ? 'You are online. Double tap to go offline.' : 'You are offline. Double tap to go online.'}>
      <Animated.View style={[styles.card, online && shadows.md, card]}>
        <View style={styles.body}>
          <View style={styles.titleRow}>
            {online ? <PulseDot color={colors.accent} size={10} /> : <View style={styles.offDot} />}
            <Animated.Text key={String(online)} entering={FadeIn.duration(220)} style={[styles.title, { color: fg }]}>
              {online ? "You're online" : "You're offline"}
            </Animated.Text>
          </View>
          <Text style={[styles.hint, { color: sub }]} numberOfLines={2}>
            {hint ?? (online ? 'Orders near you will pop up here.' : 'Go online to start earning.')}
          </Text>
        </View>

        <Animated.View style={[styles.track, track]}>
          <Animated.View style={[styles.knob, knob]}>
            {busy ? <ActivityIndicator size="small" color={online ? colors.onAccent : colors.surface} /> : null}
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </PressableScale>
  );
}

const useStyles = makeStyles(({ colors, type }) => ({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1.5,
  },
  body: { flex: 1, gap: spacing.xs },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  offDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.neutral[400] },
  title: { ...type.heading, fontSize: 20 },
  hint: { ...type.bodySmall },
  track: { width: TRACK_W, height: TRACK_H, borderRadius: radius.pill, padding: 4, justifyContent: 'center' },
  knob: {
    width: KNOB,
    height: KNOB,
    borderRadius: KNOB / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
