import { Platform, type ViewStyle } from 'react-native';

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
  sm: make(2, 0.06, 4, 1),
  md: make(4, 0.09, 10, 3),
  lg: make(8, 0.13, 18, 6),
  xl: make(16, 0.18, 28, 10),
} as const;

export type Shadows = typeof shadows;
