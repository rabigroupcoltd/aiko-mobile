import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { Icon } from '@/components/ui/Icon';
import { useTheme } from '@/theme';
import { haptics } from '@/utils/haptics';

/**
 * A green disc that pops in with a tick, a lime ring flashing outward behind
 * it, and a success buzz. For "rider found" and "delivered".
 */
export function SuccessBurst({ size = 96, haptic = true }: { size?: number; haptic?: boolean }) {
  const { colors } = useTheme();
  const disc = useSharedValue(0);
  const tick = useSharedValue(0);
  const ring = useSharedValue(0);

  useEffect(() => {
    disc.value = withSpring(1, { damping: 11, stiffness: 180 });
    tick.value = withDelay(180, withSpring(1, { damping: 12, stiffness: 220 }));
    ring.value = withDelay(120, withSequence(withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) })));
    if (haptic) {
      const t = setTimeout(haptics.success, 160);
      return () => clearTimeout(t);
    }
  }, [disc, haptic, ring, tick]);

  const discStyle = useAnimatedStyle(() => ({ transform: [{ scale: disc.value }] }));
  const tickStyle = useAnimatedStyle(() => ({
    opacity: tick.value,
    transform: [{ scale: 0.4 + tick.value * 0.6 }, { rotate: `${(1 - tick.value) * -25}deg` }],
  }));
  const ringStyle = useAnimatedStyle(() => ({
    opacity: 0.8 * (1 - ring.value),
    transform: [{ scale: 0.8 + ring.value * 0.9 }],
  }));

  const box = { width: size, height: size, borderRadius: size / 2 };

  return (
    <View style={[box, styles.center]}>
      <Animated.View style={[StyleSheet.absoluteFill, box, { borderWidth: 6, borderColor: colors.accent }, ringStyle]} />
      <Animated.View style={[box, styles.center, { backgroundColor: colors.primary }, discStyle]}>
        <Animated.View style={tickStyle}>
          <Icon name="check" size={size * 0.48} color="#FFFFFF" strokeWidth={3} />
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
});
