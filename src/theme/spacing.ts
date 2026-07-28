/** 4pt spacing scale, plus radii and the standard screen gutter. */

export const spacing = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
  huge: 56,
} as const;

export const radius = {
  none: 0,
  sm: 6,
  md: 10,
  base: 14,
  lg: 18,
  xl: 24,
  pill: 999,
} as const;

/** Horizontal gutter every screen uses so content lines up across the app. */
export const screenGutter = spacing.lg;

/** Minimum touch target — anything tappable should meet this. */
export const hitSize = 44;

export type Spacing = typeof spacing;
export type Radius = typeof radius;
