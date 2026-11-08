import { useEffect } from 'react';
import { type DimensionValue, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { radius, useTheme } from '@/theme';

/** A placeholder block that gently pulses while content loads. */
export function Shimmer({
  width = '100%',
  height = 16,
  rounded = radius.md,
  style,
}: {
  width?: DimensionValue;
  height?: DimensionValue;
  rounded?: number;
  style?: ViewStyle;
}) {
  const { colors } = useTheme();
  const pulse = useSharedValue(0.55);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 850, easing: Easing.inOut(Easing.quad), reduceMotion: ReduceMotion.System }),
      -1,
      true,
    );
  }, [pulse]);

  const animated = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return (
    <Animated.View
      style={[{ width, height, borderRadius: rounded, backgroundColor: colors.surfaceAlt }, animated, style]}
    />
  );
}
