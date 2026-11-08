import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Text, type StyleProp, type TextStyle } from 'react-native';

/**
 * A number that rolls up to its value (ease-out). Used for earnings and totals
 * so a new amount feels earned. Jumps straight there with reduced motion.
 */
export function CountUpText({
  value,
  format = (n) => Math.round(n).toLocaleString(),
  duration = 900,
  from = 0,
  style,
}: {
  value: number;
  format?: (n: number) => string;
  duration?: number;
  from?: number;
  style?: StyleProp<TextStyle>;
}) {
  const [shown, setShown] = useState(from);
  const start = useRef(from);

  useEffect(() => {
    let frame = 0;
    let cancelled = false;
    const origin = start.current;

    AccessibilityInfo.isReduceMotionEnabled()
      .catch(() => false)
      .then((reduced) => {
        if (cancelled) return;
        if (reduced || origin === value) {
          setShown(value);
          start.current = value;
          return;
        }
        const began = Date.now();
        const step = () => {
          const t = Math.min(1, (Date.now() - began) / duration);
          const eased = 1 - Math.pow(1 - t, 3);
          setShown(origin + (value - origin) * eased);
          if (t < 1) frame = requestAnimationFrame(step);
          else start.current = value;
        };
        frame = requestAnimationFrame(step);
      });

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, [duration, value]);

  return (
    <Text style={style} accessibilityLabel={format(value)}>
      {format(shown)}
    </Text>
  );
}
