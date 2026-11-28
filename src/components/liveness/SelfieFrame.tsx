import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import type { ChallengeKind, LivenessPhase } from '@/liveness/types';
import { colors } from '@/theme';

interface SelfieFrameProps {
  phase: LivenessPhase;
  challenge: ChallengeKind;
  /** A usable face is in view. */
  faceFound: boolean;
}

/** A top-to-bottom fade so text over the live camera stays readable. */
function Scrim({ position }: { position: 'top' | 'bottom' }) {
  const id = `scrim-${position}`;
  const top = position === 'top';
  return (
    <Svg style={top ? styles.scrimTop : styles.scrimBottom} width="100%" height="100%">
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#0B1210" stopOpacity={top ? 0.75 : 0} />
          <Stop offset="1" stopColor="#0B1210" stopOpacity={top ? 0 : 0.85} />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
    </Svg>
  );
}

/**
 * The overlay for the full-screen selfie camera. Nothing is cropped or
 * dimmed in the middle — the whole preview is the photo. The screen edge
 * glows to show progress, and the challenge gets a small animated hint.
 */
export function SelfieFrame({ phase, challenge, faceFound }: SelfieFrameProps) {
  const glow = useSharedValue(0.35);
  const hint = useSharedValue(0);

  const tone =
    phase === 'FAILED'
      ? colors.livenessError
      : phase === 'PASSED' || phase === 'SETTLE'
        ? colors.livenessSuccess
        : faceFound || phase === 'CHALLENGE'
          ? colors.livenessActive
          : 'rgba(255,255,255,0.5)';

  useEffect(() => {
    if (phase === 'FACE_SEARCH' && !faceFound) {
      glow.value = withRepeat(
        withTiming(0.8, { duration: 1100, easing: Easing.inOut(Easing.sin) }),
        -1,
        true,
      );
    } else {
      cancelAnimation(glow);
      glow.value = withTiming(1, { duration: 200 });
    }
  }, [phase, faceFound, glow]);

  useEffect(() => {
    if (phase === 'CHALLENGE') {
      // Acts out what is being asked: an eye closing, or a head tipping down.
      hint.value = withRepeat(
        withSequence(
          withTiming(1, { duration: challenge === 'BLINK' ? 260 : 700, easing: Easing.inOut(Easing.quad) }),
          withTiming(0, { duration: challenge === 'BLINK' ? 260 : 700, easing: Easing.inOut(Easing.quad) }),
          withTiming(0, { duration: 600 }),
        ),
        -1,
      );
    } else {
      cancelAnimation(hint);
      hint.value = 0;
    }
  }, [phase, challenge, hint]);

  const borderStyle = useAnimatedStyle(() => ({ opacity: glow.value }));
  const hintStyle = useAnimatedStyle(() =>
    challenge === 'BLINK'
      ? { transform: [{ scaleY: 1 - hint.value * 0.85 }] }
      : { transform: [{ translateY: hint.value * 14 }, { rotateX: `${hint.value * 25}deg` }] },
  );

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Scrim position="top" />
      <Scrim position="bottom" />

      <Animated.View style={[styles.border, { borderColor: tone }, borderStyle]} />

      {phase === 'CHALLENGE' ? (
        <View style={styles.hintWrap}>
          <View style={styles.hintBubble}>
            <Animated.View style={hintStyle}>
              <Text style={styles.hintGlyph}>{challenge === 'BLINK' ? '👁️' : '🙂'}</Text>
            </Animated.View>
            <Text style={styles.hintLabel}>{challenge === 'BLINK' ? 'Blink' : 'Nod'}</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  scrimTop: { position: 'absolute', top: 0, left: 0, right: 0, height: '28%' },
  scrimBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '42%', top: undefined },
  border: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 4,
    borderRadius: 28,
    margin: 6,
  },
  hintWrap: { position: 'absolute', top: '24%', left: 0, right: 0, alignItems: 'center' },
  hintBubble: {
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(11,18,16,0.55)',
    gap: 2,
  },
  hintGlyph: { fontSize: 40 },
  hintLabel: { color: '#FFFFFF', fontWeight: '700', fontSize: 13, letterSpacing: 0.5 },
});
