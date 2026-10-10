import { useId } from 'react';
import Svg, {
  Circle,
  Defs,
  G,
  Line,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';

import { green } from '@/theme';

/** The pin's highlight — the one non-green accent in the brand. */
export const BRAND_LIME = '#D4FF3A';

interface AikoMarkProps {
  size?: number;
  /**
   * `tile` — the app icon: gradient rounded square with the glyph on it.
   * `glyph` — the glyph alone, for sitting directly on a green or light surface.
   */
  variant?: 'tile' | 'glyph';
  /** Glyph stroke colour. White on green; use brand green on light surfaces. */
  ink?: string;
}

/**
 * The Aiko mark: a road-shaped "A" converging on a destination pin, with speed
 * lines — "we get it there".
 *
 * Vector rather than the old PNG so it is crisp at every size and has no
 * baked-in background. The same geometry generates the native icon and splash
 * PNGs in /assets, so the launcher, splash and in-app logo always match.
 */
export function AikoMark({ size = 64, variant = 'tile', ink = '#FFFFFF' }: AikoMarkProps) {
  // Gradient ids must be unique per instance, or two marks on screen share one.
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const isTile = variant === 'tile';
  const scale = isTile ? 0.92 : 1;

  return (
    <Svg width={size} height={size} viewBox="0 0 1024 1024">
      {isTile ? (
        <>
          <Defs>
            <LinearGradient id={`bg${id}`} x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#34D46A" />
              <Stop offset="0.55" stopColor="#0E9A47" />
              <Stop offset="1" stopColor="#05582A" />
            </LinearGradient>
            <RadialGradient id={`glow${id}`} cx="0.25" cy="0.15" r="0.7">
              <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.16} />
              <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Rect width="1024" height="1024" rx="232" fill={`url(#bg${id})`} />
          <Rect width="1024" height="1024" rx="232" fill={`url(#glow${id})`} />
        </>
      ) : null}

      <G transform={`translate(512 512) scale(${scale}) translate(-424 -531)`}>
        <G stroke={ink} strokeLinecap="round" strokeWidth={44}>
          <Line x1="150" y1="586" x2="290" y2="586" opacity={0.9} />
          <Line x1="196" y1="672" x2="270" y2="672" opacity={0.9} />
          <Line x1="120" y1="758" x2="236" y2="758" opacity={0.65} />
        </G>
        <Path
          d="M336 800 L512 262 L688 800"
          fill="none"
          stroke={ink}
          strokeWidth={124}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M512 772 C512 772 420 678 420 612 A92 92 0 0 1 604 612 C604 678 512 772 512 772 Z"
          fill={BRAND_LIME}
        />
        <Circle cx="512" cy="612" r="36" fill={green[700]} />
      </G>
    </Svg>
  );
}
