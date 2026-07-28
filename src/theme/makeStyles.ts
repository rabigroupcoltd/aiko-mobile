import { useMemo } from 'react';
import type { ImageStyle, TextStyle, ViewStyle } from 'react-native';

import type { Colors } from './colors';
import { useTheme } from './ThemeProvider';
import { typographyFor, type Typography } from './typography';

type NamedStyles<T> = { [P in keyof T]: ViewStyle | TextStyle | ImageStyle };

/** Everything a style factory is given. */
export interface StyleContext {
  colors: Colors;
  /** Type presets already coloured for the active scheme. */
  type: Typography;
}

/**
 * Builds a `useStyles()` hook from a style factory.
 *
 * `StyleSheet.create` snapshots colour values at module load, so a static
 * stylesheet can never react to a theme change. This keeps the familiar
 * "styles at the bottom of the file" shape while resolving colours at render:
 *
 * ```ts
 * const useStyles = makeStyles(({ colors, type }) => ({
 *   card: { backgroundColor: colors.surface },
 *   title: type.heading,
 * }));
 * ```
 *
 * Results are memoised per palette, so switching schemes rebuilds the sheet
 * once rather than on every render.
 */
export function makeStyles<T extends NamedStyles<T>>(
  factory: (ctx: StyleContext) => T
): () => T {
  const cache = new WeakMap<Colors, T>();

  return function useStyles(): T {
    const { colors } = useTheme();

    return useMemo(() => {
      const cached = cache.get(colors);
      if (cached) return cached;

      const built = factory({ colors, type: typographyFor(colors) });
      cache.set(colors, built);
      return built;
    }, [colors]);
  };
}
