import { Platform, type TextStyle } from 'react-native';

import { lightColors, type Colors } from './colors';

/**
 * Type presets. Screens use these rather than hand-rolling fontSize /
 * fontWeight pairs, so headings stay consistent across ~30 screens.
 *
 * Presets carry a colour, so they are built per-palette — call
 * `typographyFor(colors)`, or take `type` from a `makeStyles` factory.
 */

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

/**
 * Android maps numeric weights unreliably across OEM fonts; pairing the
 * `-medium` family with the weight keeps bold text looking bold everywhere.
 */
const semibold = {
  fontFamily: fontFamilyMedium,
  fontWeight: '600' as const,
};

export function typographyFor(c: Colors) {
  return {
    /** Big brand moments only — splash, welcome hero. */
    display: {
      fontFamily: fontFamilyMedium,
      fontSize: 34,
      lineHeight: 40,
      fontWeight: '700',
      color: c.text,
      letterSpacing: -0.5,
    } as TextStyle,

    /** Screen titles. */
    title: {
      ...semibold,
      fontSize: 24,
      lineHeight: 30,
      color: c.text,
      letterSpacing: -0.3,
    } as TextStyle,

    /** Section headers, card titles. */
    heading: {
      ...semibold,
      fontSize: 18,
      lineHeight: 24,
      color: c.text,
    } as TextStyle,

    /** Emphasised body / list item titles. */
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

    /** Form labels, overlines. */
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

    /** Tabular figures for OTP boxes, ETAs, fares. */
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

/**
 * Light-palette presets, for the always-dark camera/liveness surfaces that
 * deliberately don't follow the scheme (they override colour explicitly).
 */
export const typography = typographyFor(lightColors);
