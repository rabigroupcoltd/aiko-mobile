import { useEffect, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { useTheme } from '@/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/**
 * A ring that drains from full to empty over the time left, turning amber in
 * the last fifth. `remainingMs` and `totalMs` let it pick up mid-way when an
 * offer is already part-expired by the time it is shown.
 */
export function CountdownRing({
  totalMs,
  remainingMs,
  size = 44,
  stroke = 4,
  children,
}: {
  totalMs: number;
  remainingMs: number;
  size?: number;
  stroke?: number;
  children?: ReactNode;
}) {
  const { colors } = useTheme();
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const start = Math.max(0, Math.min(1, remainingMs / totalMs));
  const progress = useSharedValue(start);

  useEffect(() => {
    progress.value = start;
    progress.value = withTiming(0, { duration: Math.max(0, remainingMs), easing: Easing.linear });
  }, [progress, remainingMs, start]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
    stroke: progress.value < 0.2 ? colors.warning : colors.primary,
  }));

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.border} strokeWidth={stroke} fill="none" />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          animatedProps={animatedProps}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>{children}</View>
    </View>
  );
}
