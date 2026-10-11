import { useMemo } from 'react';
import type { ImageStyle, TextStyle, ViewStyle } from 'react-native';

import type { Colors } from './colors';
import { useTheme } from './ThemeProvider';
import { typographyFor, type Typography } from './typography';

type NamedStyles<T> = { [P in keyof T]: ViewStyle | TextStyle | ImageStyle };

export interface StyleContext {
  colors: Colors;
  type: Typography;
}

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
