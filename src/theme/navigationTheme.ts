import { DarkTheme, DefaultTheme, type Theme } from '@react-navigation/native';

import type { Colors } from './colors';

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
