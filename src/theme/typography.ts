import { Platform, type TextStyle } from 'react-native';

import { lightColors, type Colors } from './colors';

const fontFamily = Platform.select({
  android: 'sans-serif',
  ios: 'System',
  default: 'System',
});

const fontFamilyMedium = Platform.select({
  android: 'sans-serif-medium',
  ios: 'System',
  default: 'System',
});

const semibold = {
  fontFamily: fontFamilyMedium,
  fontWeight: '600' as const,
};

export function typographyFor(c: Colors) {
  return {
    display: {
      fontFamily: fontFamilyMedium,
      fontSize: 34,
      lineHeight: 40,
      fontWeight: '700',
      color: c.text,
      letterSpacing: -0.5,
    } as TextStyle,

    title: {
      ...semibold,
      fontSize: 24,
      lineHeight: 30,
      color: c.text,
      letterSpacing: -0.3,
    } as TextStyle,

    heading: {
      ...semibold,
      fontSize: 18,
      lineHeight: 24,
      color: c.text,
    } as TextStyle,

    subheading: {
      ...semibold,
      fontSize: 16,
      lineHeight: 22,
      color: c.text,
    } as TextStyle,

    body: {
      fontFamily,
      fontSize: 16,
      lineHeight: 24,
      fontWeight: '400',
      color: c.text,
    } as TextStyle,

    bodySmall: {
      fontFamily,
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '400',
      color: c.textSecondary,
    } as TextStyle,

    label: {
      ...semibold,
      fontSize: 13,
      lineHeight: 18,
      color: c.textSecondary,
      letterSpacing: 0.2,
    } as TextStyle,

    caption: {
      fontFamily,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '400',
      color: c.textMuted,
    } as TextStyle,

    button: {
      ...semibold,
      fontSize: 16,
      lineHeight: 20,
      letterSpacing: 0.2,
    } as TextStyle,

    mono: {
      fontFamily: Platform.select({
        android: 'monospace',
        ios: 'Menlo',
        default: 'monospace',
      }),
      fontSize: 16,
      color: c.text,
    } as TextStyle,
  };
}

export type Typography = ReturnType<typeof typographyFor>;

export const typography = typographyFor(lightColors);
