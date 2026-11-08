import { useEffect, useMemo } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

const BRAND = ['#0D8A41', '#1FB74B', '#D4FF3A', '#5FC77F', '#FFFFFF', '#01311D'];

interface Piece {
  x: number;
  drift: number;
  size: number;
  color: string;
  delay: number;
  spin: number;
  round: boolean;
}

/**
 * A one-shot burst of brand-coloured paper. Plain views on the UI thread, no
 * image or Lottie assets, so it is cheap on low-end phones. Skipped entirely
 * when the phone asks for reduced motion.
 */
export function Confetti({ count = 36, duration = 2200 }: { count?: number; duration?: number }) {
  const reduced = useReducedMotion();
  const { width, height } = useWindowDimensions();
  const progress = useSharedValue(0);

  const pieces = useMemo<Piece[]>(
    () =>
      Array.from({ length: count }, (_, i) => ({
        x: Math.random() * width,
        drift: (Math.random() - 0.5) * 120,
        size: 6 + Math.random() * 7,
        color: BRAND[i % BRAND.length],
        delay: Math.random() * 280,
        spin: (Math.random() - 0.5) * 900,
        round: Math.random() > 0.6,
      })),
    [count, width],
  );

  useEffect(() => {
    if (reduced) return;
    progress.value = withTiming(1, { duration, easing: Easing.out(Easing.quad) });
  }, [duration, progress, reduced]);

  if (reduced) return null;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {pieces.map((piece, i) => (
        <ConfettiPiece key={i} piece={piece} progress={progress} height={height} />
      ))}
    </View>
  );
}

function ConfettiPiece({
  piece,
  progress,
  height,
}: {
  piece: Piece;
  progress: SharedValue<number>;
  height: number;
}) {
  const local = useSharedValue(0);

  useEffect(() => {
    local.value = withDelay(piece.delay, withTiming(1, { duration: 1900, easing: Easing.in(Easing.quad) }));
  }, [local, piece.delay]);

  const style = useAnimatedStyle(() => {
    const t = local.value;
    return {
      opacity: progress.value < 0.85 ? 1 : (1 - progress.value) / 0.15,
      transform: [
        { translateX: piece.x + piece.drift * t },
        { translateY: -40 + t * (height * 0.9) },
        { rotate: `${piece.spin * t}deg` },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: piece.size,
          height: piece.round ? piece.size : piece.size * 0.45,
          borderRadius: piece.round ? piece.size / 2 : 1.5,
          backgroundColor: piece.color,
        },
        style,
      ]}
    />
  );
}
