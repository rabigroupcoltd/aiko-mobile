import { DarkTheme, DefaultTheme, type Theme } from '@react-navigation/native';

import type { Colors } from './colors';

/**
 * React Navigation theme derived from our palette, so navigator chrome
 * (card backgrounds, the drawer) matches the app instead of defaulting to
 * React Navigation blue-on-white — or, in dark mode, flashing white between
 * screen transitions.
 */
export function navigationThemeFor(c: Colors): Theme {
  const base = c.isDark ? DarkTheme : DefaultTheme;
  return {
    ...base,
    colors: {
      ...base.colors,
      primary: c.primary,
      background: c.background,
      card: c.surface,
      text: c.text,
      border: c.border,
      notification: c.danger,
    },
  };
}
