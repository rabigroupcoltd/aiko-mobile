import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { Icon } from '@/components/ui/Icon';
import { makeStyles, radius, useTheme } from '@/theme';
import { haptics } from '@/utils/haptics';

const KNOB = 52;
const PAD = 4;
const THRESHOLD = 0.82;

/**
 * Slide the knob to the end to confirm. Stops a pocket tap from marking an
 * order delivered, and gives the moment some weight. Tapping the track nudges
 * the knob to show what to do; accessibility users get a plain button action.
 */
export function SwipeToConfirm({
  label,
  onConfirm,
  loading = false,
  disabled = false,
  tone = 'primary',
}: {
  label: string;
  onConfirm: () => void;
  loading?: boolean;
  disabled?: boolean;
  tone?: 'primary' | 'accent';
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);
  const x = useSharedValue(0);
  const armed = useSharedValue(false);

  const travel = Math.max(0, width - KNOB - PAD * 2);

  // Snap home once the parent has acted (or after an error).
  useEffect(() => {
    if (!loading) x.value = withSpring(0, { damping: 18, stiffness: 200 });
  }, [loading, x]);

  const fill = tone === 'accent' ? colors.accent : colors.primary;
  const onFill = tone === 'accent' ? colors.onAccent : colors.onPrimary;

  const confirm = () => {
    haptics.success();
    onConfirm();
  };

  const pan = Gesture.Pan()
    .enabled(!disabled && !loading && travel > 0)
    .onBegin(() => {
      armed.value = false;
    })
    .onUpdate((e) => {
      x.value = Math.min(Math.max(0, e.translationX), travel);
      const past = x.value >= travel * THRESHOLD;
      if (past !== armed.value) {
        armed.value = past;
        if (past) runOnJS(haptics.commit)();
      }
    })
    .onEnd(() => {
      if (x.value >= travel * THRESHOLD) {
        x.value = withTiming(travel, { duration: 120 });
        runOnJS(confirm)();
      } else {
        x.value = withSpring(0, { damping: 16, stiffness: 220 });
      }
    });

  const tap = Gesture.Tap()
    .enabled(!disabled && !loading && travel > 0)
    .onEnd(() => {
      x.value = withSpring(Math.min(36, travel), { damping: 8, stiffness: 260 }, () => {
        x.value = withSpring(0, { damping: 12, stiffness: 220 });
      });
    });

  const knobStyle = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  const trailStyle = useAnimatedStyle(() => ({ width: x.value + KNOB + PAD }));
  const labelStyle = useAnimatedStyle(() => ({
    opacity: interpolate(x.value, [0, travel * 0.6 || 1], [1, 0], Extrapolation.CLAMP),
  }));

  return (
    <GestureDetector gesture={Gesture.Exclusive(pan, tap)}>
      <View
        onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
        accessible
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint="Swipe right to confirm, or double tap"
        accessibilityState={{ disabled: disabled || loading, busy: loading }}
        accessibilityActions={[{ name: 'activate' }]}
        onAccessibilityAction={() => !disabled && !loading && confirm()}
        style={[styles.track, { borderColor: fill }, (disabled || loading) && styles.inert]}>
        <Animated.View style={[styles.trail, { backgroundColor: fill }, trailStyle]} />
        <Animated.Text style={[styles.label, labelStyle]} numberOfLines={1}>
          {label}
        </Animated.Text>
        <Animated.View style={[styles.knob, { backgroundColor: fill }, knobStyle]}>
          {loading ? (
            <ActivityIndicator color={onFill} />
          ) : (
            <Icon name="chevrons-right" size={24} color={onFill} strokeWidth={2.6} />
          )}
        </Animated.View>
      </View>
    </GestureDetector>
  );
}

const useStyles = makeStyles(({ colors, type }) => ({
  track: {
    height: KNOB + PAD * 2,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    backgroundColor: colors.primarySubtle,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  trail: { position: 'absolute', left: 0, top: 0, bottom: 0, opacity: 0.18, borderRadius: radius.pill },
  label: {
    ...type.button,
    fontWeight: '700',
    color: colors.primary,
    textAlign: 'center',
    paddingLeft: KNOB,
    paddingRight: 16,
  },
  knob: {
    position: 'absolute',
    left: PAD,
    width: KNOB,
    height: KNOB,
    borderRadius: KNOB / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inert: { opacity: 0.55 },
}));

