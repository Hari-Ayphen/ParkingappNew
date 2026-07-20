/**
 * SpotKey design tokens — mobile.
 *
 * Generated from docs/design/design-system.md. **Components read roles, never raw values.**
 * If a component needs a colour that isn't a role here, add the role — do not inline a hex.
 *
 * Both themes are complete. There is no light-only screen (CLAUDE.md → Theming).
 */

export type ThemeName = 'light' | 'dark';

export interface Tokens {
  bg: string;
  fg: string;
  card: string;
  muted: string;
  mutedFg: string;
  border: string;
  ring: string;

  primary: string;
  primaryFg: string;
  primaryHover: string;
  primarySubtle: string;
  accent: string;

  destructive: string;
  destructiveSubtle: string;
  success: string;
  successSubtle: string;
  warning: string;
  warningSubtle: string;
  info: string;

  /** Map roles. Green is deliberately absent — see design-system.md. */
  mapAvailable: string;
  mapOccupied: string;
  mapSelf: string;
}

export const light: Tokens = {
  bg: '#f5f7fa',
  fg: '#1a2332',
  card: '#ffffff',
  muted: '#f1f5f9',
  mutedFg: '#64748b',
  border: '#e2e8f0',
  ring: '#0f766e',

  primary: '#0f766e',
  primaryFg: '#ffffff',
  primaryHover: '#14919b',
  primarySubtle: '#ccfbf1',
  accent: '#0891b2',

  destructive: '#dc2626',
  destructiveSubtle: '#fee2e2',
  success: '#047857',
  successSubtle: '#d1fae5',
  warning: '#b45309',
  warningSubtle: '#fef3c7',
  info: '#0e7c86',

  mapAvailable: '#0f766e',
  mapOccupied: '#64748b',
  mapSelf: '#0891b2',
};

export const dark: Tokens = {
  bg: '#0a1929',
  fg: '#f1f5f9',
  card: '#14243a',
  muted: '#14243a',
  mutedFg: '#94a3b8',
  border: '#1e3a52',
  ring: '#2dd4bf',

  primary: '#2dd4bf',
  primaryFg: '#0a1929',
  primaryHover: '#5eead4',
  primarySubtle: '#134e4a',
  accent: '#22d3ee',

  destructive: '#f87171',
  destructiveSubtle: '#450a0a',
  success: '#34d399',
  successSubtle: '#064e3b',
  warning: '#fbbf24',
  warningSubtle: '#451a03',
  info: '#67e8f9',

  mapAvailable: '#2dd4bf',
  mapOccupied: '#94a3b8',
  mapSelf: '#22d3ee',
};

export const themes: Record<ThemeName, Tokens> = { light, dark };

/** 8px base. No arbitrary values. */
export const spacing = { xs: 4, s: 8, m: 12, l: 16, xl: 24, xxl: 32, xxxl: 48 } as const;

export const radius = { sm: 6, md: 8, lg: 12, full: 999 } as const;

/** Elevation is tinted with the ink hue, not neutral black. */
export const elevation = {
  1: {
    shadowColor: '#0a1929',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  2: {
    shadowColor: '#0a1929',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  3: {
    shadowColor: '#0a1929',
    shadowOpacity: 0.15,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  4: {
    shadowColor: '#0a1929',
    shadowOpacity: 0.2,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 16 },
    elevation: 16,
  },
} as const;

export const layout = {
  headerHeight: 56,
  bottomNavHeight: 64,
  screenPaddingX: 16,
  /** No exceptions. */
  touchMin: 44,
} as const;

/**
 * Poppins carries headings AND numeric facts — rate, distance, duration, amount.
 * JetBrains Mono carries anything a human transcribes: plates, OTPs, booking ids.
 */
export const fonts = {
  display: 'Poppins',
  sans: 'Inter',
  mono: 'JetBrainsMono',
} as const;

export const type = {
  display: { fontFamily: fonts.display, fontSize: 32, lineHeight: 38, fontWeight: '700' },
  h1: { fontFamily: fonts.display, fontSize: 24, lineHeight: 29, fontWeight: '700' },
  h2: { fontFamily: fonts.display, fontSize: 20, lineHeight: 26, fontWeight: '600' },
  h3: { fontFamily: fonts.display, fontSize: 16, lineHeight: 21, fontWeight: '600' },
  bodyLg: { fontFamily: fonts.sans, fontSize: 16, lineHeight: 24, fontWeight: '500' },
  body: { fontFamily: fonts.sans, fontSize: 14, lineHeight: 21, fontWeight: '400' },
  label: { fontFamily: fonts.sans, fontSize: 14, lineHeight: 20, fontWeight: '500' },
  caption: { fontFamily: fonts.sans, fontSize: 12, lineHeight: 17, fontWeight: '400' },
  overline: {
    fontFamily: fonts.sans,
    fontSize: 12,
    lineHeight: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  mono: { fontFamily: fonts.mono, fontSize: 14, lineHeight: 20, fontWeight: '400' },
  /** Numeric facts use the display face. See design-system.md → Signature details. */
  numeric: { fontFamily: fonts.display, fontSize: 16, lineHeight: 21, fontWeight: '600' },
} as const;

export const motion = {
  fast: 120,
  base: 200,
  slow: 320,
  easing: [0.2, 0, 0, 1] as const,
} as const;
