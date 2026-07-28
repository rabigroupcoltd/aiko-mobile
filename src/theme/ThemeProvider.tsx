import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useColorScheme } from 'react-native';

import { darkColors, lightColors, type Colors } from './colors';

/** What the user picked. 'system' follows the OS and is the default. */
export type ThemePreference = 'system' | 'light' | 'dark';

const STORAGE_KEY = 'aiko-theme-preference';

interface ThemeContextValue {
  colors: Colors;
  /** The resolved scheme actually in use. */
  scheme: 'light' | 'dark';
  /** What the user selected — 'system' means "follow the OS". */
  preference: ThemePreference;
  setPreference: (p: ThemePreference) => void;
  /** True once the stored preference has been read. */
  ready: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * Theme state.
 *
 * Defaults to `'system'`, so the app follows the device's light/dark setting
 * until the user explicitly overrides it in Settings. The preference is stored
 * separately from the main app store so that a "Reset demo" — which wipes the
 * user's profile — doesn't also throw away their display choice.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (cancelled) return;
        if (stored === 'light' || stored === 'dark' || stored === 'system') {
          setPreferenceState(stored);
        }
      })
      .catch(() => {
        // A missing or unreadable preference just means "use the system default".
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const setPreference = useCallback((next: ThemePreference) => {
    // Update immediately; persistence is best-effort so the toggle never feels
    // like it's waiting on disk.
    setPreferenceState(next);
    void AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  }, []);

  const scheme: 'light' | 'dark' =
    preference === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : preference;

  const value = useMemo<ThemeContextValue>(
    () => ({
      colors: scheme === 'dark' ? darkColors : lightColors,
      scheme,
      preference,
      setPreference,
      ready,
    }),
    [scheme, preference, setPreference, ready]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}

/** Shorthand for the common case of only needing the palette. */
export function useColors(): Colors {
  return useTheme().colors;
}
