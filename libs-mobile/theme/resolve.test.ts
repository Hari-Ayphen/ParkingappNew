import { describe, expect, it } from 'vitest';
import { parsePreference, resolveThemeName, resolveTokens } from './resolve';
import { dark, light } from './tokens';

describe('resolveThemeName', () => {
  it('honours an explicit choice regardless of the OS', () => {
    expect(resolveThemeName('light', 'dark')).toBe('light');
    expect(resolveThemeName('dark', 'light')).toBe('dark');
  });

  it('follows the OS when the preference is system', () => {
    expect(resolveThemeName('system', 'light')).toBe('light');
    expect(resolveThemeName('system', 'dark')).toBe('dark');
  });

  it('falls back to dark when the OS scheme is unknown', () => {
    // Not arbitrary: flashing a bright screen at a driver at night is the worse failure.
    expect(resolveThemeName('system', null)).toBe('dark');
    expect(resolveThemeName('system', undefined)).toBe('dark');
  });
});

describe('resolveTokens', () => {
  it('returns a complete token set for both themes', () => {
    expect(resolveTokens('light', null)).toBe(light);
    expect(resolveTokens('dark', null)).toBe(dark);
  });

  it('defines every role in both themes — no theme may be missing a token', () => {
    const lightKeys = Object.keys(light).sort();
    const darkKeys = Object.keys(dark).sort();
    expect(darkKeys).toEqual(lightKeys);
  });

  it('has no token identical across themes that should differ', () => {
    // bg and fg must actually change, or "dark mode" is decorative.
    expect(dark.bg).not.toBe(light.bg);
    expect(dark.fg).not.toBe(light.fg);
    expect(dark.primary).not.toBe(light.primary);
  });

  it('keeps green off the map in both themes', () => {
    // The available pin is the brand colour, never a green that collides with it.
    expect(light.mapAvailable).toBe(light.primary);
    expect(dark.mapAvailable).toBe(dark.primary);
    expect(light.mapAvailable).not.toBe(light.success);
    expect(dark.mapAvailable).not.toBe(dark.success);
  });
});

describe('parsePreference', () => {
  it('accepts the three valid values', () => {
    expect(parsePreference('light')).toBe('light');
    expect(parsePreference('dark')).toBe('dark');
    expect(parsePreference('system')).toBe('system');
  });

  it('falls back to system for anything else', () => {
    // A corrupt or upgraded store must not brick the app on launch.
    expect(parsePreference(undefined)).toBe('system');
    expect(parsePreference(null)).toBe('system');
    expect(parsePreference('midnight')).toBe('system');
    expect(parsePreference(42)).toBe('system');
  });
});
