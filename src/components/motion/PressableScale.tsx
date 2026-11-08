import type { ReactNode } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { haptics } from '@/utils/haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const SPRING = { damping: 15, stiffness: 320, mass: 0.6 };

/**
 * A Pressable that sinks slightly under the finger and springs back, with an
 * optional haptic. The base of every tappable surface in the app.
 */
export function PressableScale({
  children,
  style,
  scaleTo = 0.96,
  haptic = 'tap',
  onPressIn,
  onPressOut,
  onPress,
  disabled,
  ...rest
}: Omit<PressableProps, 'style' | 'children'> & {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
  haptic?: 'tap' | 'select' | 'commit' | false;
}) {
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      onPressIn={(e) => {
        scale.value = withSpring(scaleTo, SPRING);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.value = withSpring(1, SPRING);
        onPressOut?.(e);
      }}
      onPress={(e) => {
        if (haptic) haptics[haptic]();
        onPress?.(e);
      }}
      style={[style, animated]}>
      {children}
    </AnimatedPressable>
  );
}
