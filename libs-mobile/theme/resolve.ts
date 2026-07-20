import { dark, light, type ThemeName, type Tokens } from './tokens';

/**
 * Theme resolution — v0.1-I.
 *
 * Kept pure and free of React so it can be tested without a renderer, and so the same rule
 * can be reused by the admin panel.
 *
 * docs/features/16-settings-flow.md: Light / Dark / System, default System, persisted.
 */

/** What the user chose in Settings. `system` means "follow the OS". */
export type ThemePreference = 'light' | 'dark' | 'system';

export const DEFAULT_PREFERENCE: ThemePreference = 'system';

/**
 * The OS may report null on some platforms before it has settled. Treating that as `light`
 * would flash a bright screen at a driver at night, so an unknown OS scheme resolves to the
 * default the product cares about most — dark.
 */
export function resolveThemeName(
  preference: ThemePreference,
  osScheme: 'light' | 'dark' | null | undefined,
): ThemeName {
  if (preference === 'light') return 'light';
  if (preference === 'dark') return 'dark';
  if (osScheme === 'light') return 'light';
  if (osScheme === 'dark') return 'dark';
  return 'dark';
}

export function resolveTokens(
  preference: ThemePreference,
  osScheme: 'light' | 'dark' | null | undefined,
): Tokens {
  return resolveThemeName(preference, osScheme) === 'dark' ? dark : light;
}

/** Guards a persisted value that may be anything after an app update or a corrupt store. */
export function parsePreference(value: unknown): ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system' ? value : DEFAULT_PREFERENCE;
}

export const THEME_PREFERENCE_STORAGE_KEY = 'spotkey.theme-preference';
