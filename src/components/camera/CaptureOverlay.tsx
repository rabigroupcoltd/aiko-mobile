import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { colors, radius, spacing, typography } from '@/theme';

export type OverlayShape = 'oval' | 'card' | 'plate';

interface CaptureOverlayProps {
  shape: OverlayShape;
  instruction: string;
}

/**
 * Framing guide drawn over the camera preview.
 *
 * The "cutout" is faked with four solid bars around a transparent window rather
 * than a real mask — no SVG mask or clipping needed, and it renders identically
 * on both platforms.
 */
export function CaptureOverlay({ shape, instruction }: CaptureOverlayProps) {
  const { width, height } = useWindowDimensions();

  const frame = getFrame(shape, width, height);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Dimmed surround */}
      <View style={[styles.dim, { height: frame.top }]} />
      <View style={[styles.dim, { top: frame.top + frame.height, bottom: 0 }]} />
      <View
        style={[
          styles.dim,
          { top: frame.top, height: frame.height, left: 0, width: frame.left },
        ]}
      />
      <View
        style={[
          styles.dim,
          {
            top: frame.top,
            height: frame.height,
            left: frame.left + frame.width,
            right: 0,
          },
        ]}
      />

      {/* The window itself */}
      <View
        style={[
          styles.window,
          {
            top: frame.top,
            left: frame.left,
            width: frame.width,
            height: frame.height,
            borderRadius: frame.radius,
          },
        ]}
      />

      <View style={[styles.instructionWrap, { top: frame.top + frame.height + spacing.xl }]}>
        <Text style={styles.instruction}>{instruction}</Text>
      </View>
    </View>
  );
}

function getFrame(shape: OverlayShape, width: number, height: number) {
  switch (shape) {
    case 'oval': {
      const w = width * 0.68;
      const h = w * 1.3;
      return {
        width: w,
        height: h,
        left: (width - w) / 2,
        top: height * 0.16,
        radius: w / 2,
      };
    }
    case 'card': {
      // ID-1 card aspect ratio (85.6 x 54mm).
      const w = width * 0.86;
      const h = w * 0.63;
      return {
        width: w,
        height: h,
        left: (width - w) / 2,
        top: height * 0.24,
        radius: radius.base,
      };
    }
    case 'plate': {
      // Nigerian plates are roughly 2.2:1.
      const w = width * 0.84;
      const h = w * 0.45;
      return {
        width: w,
        height: h,
        left: (width - w) / 2,
        top: height * 0.28,
        radius: radius.md,
      };
    }
  }
}

const styles = StyleSheet.create({
  dim: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: 'rgba(17, 25, 23, 0.62)',
  },
  window: {
    position: 'absolute',
    borderWidth: 3,
    borderColor: colors.onPrimary,
  },
  instructionWrap: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    alignItems: 'center',
  },
  instruction: {
    ...typography.body,
    color: colors.onPrimary,
    textAlign: 'center',
    backgroundColor: 'rgba(17, 25, 23, 0.55)',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderRadius: radius.base,
    overflow: 'hidden',
  },
});
