import { StyleSheet, Text, View } from 'react-native';

import { LIVENESS } from '@/liveness/constants';
import type { LivenessDebugInfo } from '@/hooks/useLivenessCheck';
import { colors, radius, spacing } from '@/theme';

interface DebugOverlayProps {
  info: LivenessDebugInfo | null;
  phase: string;
}

const fmt = (v: number | null | undefined, digits = 2): string =>
  v == null || Number.isNaN(v) ? '—' : v.toFixed(digits);

/**
 * Raw detector readout, ~5Hz, __DEV__ only.
 *
 * This is the calibration instrument: use it on real hardware to confirm eye
 * probabilities actually arrive (proving runClassifications is wired), to see
 * which yaw sign corresponds to turning left, and to read the real probability
 * ranges under different lighting before tuning EYE_LOW / EYE_HIGH.
 */
export function DebugOverlay({ info, phase }: DebugOverlayProps) {
  if (!info) {
    return (
      <View style={styles.panel}>
        <Text style={styles.title}>DEBUG · {phase}</Text>
        <Text style={styles.row}>no face detected</Text>
      </View>
    );
  }

  const eyeState =
    info.eye == null
      ? 'n/a'
      : info.eye <= LIVENESS.EYE_LOW
        ? 'CLOSED'
        : info.eye >= LIVENESS.EYE_HIGH
          ? 'open'
          : 'mid';

  return (
    <View style={styles.panel}>
      <Text style={styles.title}>
        DEBUG · {phase} · {info.fps} fps · {info.faceCount} face
        {info.faceCount === 1 ? '' : 's'}
      </Text>
      <Text style={styles.row}>
        yaw {fmt(info.yaw, 1)}° roll {fmt(info.roll, 1)}° pitch {fmt(info.pitch, 1)}°
      </Text>
      <Text style={styles.row}>
        eye {fmt(info.eye)} ({eyeState}) L {fmt(info.leftEye)} R {fmt(info.rightEye)}
      </Text>
      <Text style={styles.row}>
        size {fmt(info.widthRatio)} centre {fmt(info.centerX)},{fmt(info.centerY)}
      </Text>
      <Text style={styles.hint}>
        thresholds: low {LIVENESS.EYE_LOW} high {LIVENESS.EYE_HIGH} · yawΔ{' '}
        {LIVENESS.YAW_DELTA_DEG}°
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: 'rgba(0,0,0,0.72)',
    padding: spacing.sm,
    borderRadius: radius.sm,
    gap: 1,
  },
  title: {
    color: colors.green[300],
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'monospace',
    marginBottom: 2,
  },
  row: { color: colors.onPrimary, fontSize: 11, fontFamily: 'monospace' },
  hint: { color: colors.neutral[400], fontSize: 9, fontFamily: 'monospace', marginTop: 2 },
});
