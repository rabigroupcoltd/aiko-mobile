import { Platform, type ViewStyle } from 'react-native';

/**
 * Cross-platform elevation. iOS needs the shadow* quartet, Android needs
 * `elevation`; spreading one of these presets gives both.
 */

type Shadow = Pick<
  ViewStyle,
  'shadowColor' | 'shadowOffset' | 'shadowOpacity' | 'shadowRadius' | 'elevation'
>;

const make = (
  elevation: number,
  opacity: number,
  radius: number,
  offsetY: number
): Shadow =>
  Platform.select<Shadow>({
    ios: {
      shadowColor: '#111917',
      shadowOffset: { width: 0, height: offsetY },
      shadowOpacity: opacity,
      shadowRadius: radius,
    },
    android: { elevation },
    default: {},
  }) as Shadow;

export const shadows = {
  none: {} as Shadow,
  /** Resting cards and list rows. */
  sm: make(2, 0.06, 4, 1),
  /** Raised cards, the primary CTA. */
  md: make(4, 0.09, 10, 3),
  /** Bottom sheets, floating panels. */
  lg: make(8, 0.13, 18, 6),
  /** Modals over a scrim. */
  xl: make(16, 0.18, 28, 10),
} as const;

export type Shadows = typeof shadows;
