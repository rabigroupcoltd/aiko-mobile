import { useState } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';

import { PressableScale } from '@/components/motion';
import { Icon } from '@/components/ui';
import { makeStyles, spacing, useTheme } from '@/theme';
import { haptics } from '@/utils/haptics';

const LABELS = ['', 'Poor', 'Not great', 'Okay', 'Good', 'Excellent!'];

/**
 * Five stars that fill up to the tapped one with a little pop, then call
 * `onRate` after a beat so the customer sees their choice land.
 */
export function RatingStars({
  onRate,
  disabled,
}: {
  onRate: (score: number) => void;
  disabled?: boolean;
}) {
  const styles = useStyles();
  const [score, setScore] = useState(0);

  const choose = (value: number) => {
    if (disabled) return;
    haptics.select();
    setScore(value);
    setTimeout(() => onRate(value), 450);
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {[1, 2, 3, 4, 5].map((value) => (
          <Star key={value} value={value} filled={value <= score} onPress={() => choose(value)} disabled={disabled} />
        ))}
      </View>
      <Text style={styles.label}>{score ? LABELS[score] : 'Tap a star'}</Text>
    </View>
  );
}

function Star({
  value,
  filled,
  onPress,
  disabled,
}: {
  value: number;
  filled: boolean;
  onPress: () => void;
  disabled?: boolean;
}) {
  const { colors } = useTheme();
  const pop = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));

  return (
    <PressableScale
      haptic={false}
      disabled={disabled}
      onPress={() => {
        pop.value = withSequence(withSpring(1.35, { damping: 6, stiffness: 400 }), withSpring(1, { damping: 10 }));
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={`Rate ${value} out of 5`}
      hitSlop={6}>
      <Animated.View style={style}>
        <Icon
          name="star"
          size={38}
          color={filled ? colors.warning : colors.borderStrong}
          fill={filled ? colors.warning : 'none'}
          strokeWidth={filled ? 2.4 : 1.8}
        />
      </Animated.View>
    </PressableScale>
  );
}

const useStyles = makeStyles(({ type }) => ({
  wrap: { alignItems: 'center', gap: spacing.xs },
  row: { flexDirection: 'row', gap: spacing.sm, justifyContent: 'center' },
  label: { ...type.caption, fontWeight: '600' },
}));
