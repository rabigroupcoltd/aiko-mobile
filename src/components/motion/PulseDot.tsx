import { useEffect } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

/** A dot with a ring that breathes outward — the "this is live" signal. */
export function PulseDot({
  color,
  size = 10,
  style,
}: {
  color: string;
  size?: number;
  style?: ViewStyle;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 1600, easing: Easing.out(Easing.quad), reduceMotion: ReduceMotion.System }),
      -1,
      false,
    );
  }, [progress]);

  const ring = useAnimatedStyle(() => ({
    opacity: 0.55 * (1 - progress.value),
    transform: [{ scale: 1 + progress.value * 1.6 }],
  }));

  const box = { width: size, height: size, borderRadius: size / 2 };

  return (
    <View style={[box, style]}>
      <Animated.View style={[StyleSheet.absoluteFill, box, { backgroundColor: color }, ring]} />
      <View style={[box, { backgroundColor: color }]} />
    </View>
  );
}
