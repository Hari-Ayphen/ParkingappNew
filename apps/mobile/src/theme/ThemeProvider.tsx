import {
  DEFAULT_PREFERENCE,
  parsePreference,
  resolveThemeName,
  resolveTokens,
  THEME_PREFERENCE_STORAGE_KEY,
  type ThemePreference,
} from '@spotkey/mobile-ui/theme/resolve';
import type { ThemeName, Tokens } from '@spotkey/mobile-ui/theme/tokens';
import * as SecureStore from 'expo-secure-store';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';

/**
 * v0.1-I — the theme mechanism.
 *
 * This ships in v0.1, before the Settings screen that changes it (v1.0-A), because every
 * screen from here on is built against it. Retrofitting dark across forty light-only screens
 * is the retrofit that never lands.
 *
 * Components read `useTokens()`. They never import `light`/`dark` directly and never inline
 * a colour — CLAUDE.md → Theming.
 */

interface ThemeContextValue {
  tokens: Tokens;
  themeName: ThemeName;
  preference: ThemePreference;
  setPreference: (next: ThemePreference) => void;
  /** False until the persisted preference has loaded — used to avoid a wrong-theme flash. */
  ready: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const osScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>(DEFAULT_PREFERENCE);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const stored = await SecureStore.getItemAsync(THEME_PREFERENCE_STORAGE_KEY);
        if (!cancelled) setPreferenceState(parsePreference(stored));
      } catch {
        // A store read failure must not block launch — fall back to the default.
        if (!cancelled) setPreferenceState(DEFAULT_PREFERENCE);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    void SecureStore.setItemAsync(THEME_PREFERENCE_STORAGE_KEY, next).catch(() => {
      // Persisting is best-effort; the in-session choice still applies.
    });
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      tokens: resolveTokens(preference, osScheme),
      themeName: resolveThemeName(preference, osScheme),
      preference,
      setPreference,
      ready,
    }),
    [preference, osScheme, setPreference, ready],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used inside <ThemeProvider>. Wrap the app root.');
  }
  return ctx;
}

/** The common case: a component just wants the colours. */
export function useTokens(): Tokens {
  return useTheme().tokens;
}
