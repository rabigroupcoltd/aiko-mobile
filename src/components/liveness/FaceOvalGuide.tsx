import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View, useWindowDimensions } from 'react-native';

import { LIVENESS } from '@/liveness/constants';
import type { LivenessPhase } from '@/liveness/types';
import { colors } from '@/theme';

interface FaceOvalGuideProps {
  phase: LivenessPhase;
  /** True while framing conditions are all met. */
  aligned: boolean;
}

/**
 * The oval framing guide, drawn with four dimmed bars around a transparent
 * window. Its colour tracks the check's state so the user gets feedback
 * without reading the prompt.
 *
 * The window position mirrors the machine's framing targets so what the user
 * lines up against is what the FSM actually tests.
 */
export function FaceOvalGuide({ phase, aligned }: FaceOvalGuideProps) {
  const { width, height } = useWindowDimensions();
  const pulse = useRef(new Animated.Value(0)).current;

  const ovalWidth = width * 0.7;
  const ovalHeight = ovalWidth * 1.32;
  const left = width * LIVENESS.TARGET_CENTER_X - ovalWidth / 2;
  const top = height * LIVENESS.TARGET_CENTER_Y - ovalHeight / 2;

  const color =
    phase === 'PASSED'
      ? colors.livenessSuccess
      : phase === 'FAILED'
        ? colors.livenessError
        : aligned
          ? colors.livenessActive
          : colors.livenessIdle;

  // A gentle pulse while waiting for the user to act; still when idle or done.
  useEffect(() => {
    const active = phase === 'BLINK' || phase === 'HEAD_TURN';
    if (!active) {
      pulse.stopAnimation();
      pulse.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [phase, pulse]);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.03] });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={[styles.dim, { height: top }]} />
      <View style={[styles.dim, { top: top + ovalHeight, bottom: 0 }]} />
      <View style={[styles.dim, { top, height: ovalHeight, left: 0, width: left }]} />
      <View
        style={[styles.dim, { top, height: ovalHeight, left: left + ovalWidth, right: 0 }]}
      />

      <Animated.View
        style={[
          styles.oval,
          {
            top,
            left,
            width: ovalWidth,
            height: ovalHeight,
            borderRadius: ovalWidth / 2,
            borderColor: color,
            transform: [{ scale }],
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  dim: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: 'rgba(17, 25, 23, 0.72)',
  },
  oval: { position: 'absolute', borderWidth: 4 },
});
