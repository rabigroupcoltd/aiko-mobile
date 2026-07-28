/**
 * Aiko palette — green and white, with a dark counterpart.
 *
 * The green ramp is the brand spine and stays constant across schemes; the
 * neutrals and semantic tokens flip. Screens should read semantic tokens from
 * `useTheme()` rather than importing a palette directly, so both schemes stay
 * in sync — see `ThemeProvider.tsx`.
 */

/**
 * Brand green ramp, anchored on colours sampled from the official Aiko assets
 * (logo, icon and splash) rather than chosen by eye:
 *
 *   500 #0D8A41 — primary, from the splash artwork
 *   400 #1FB74B — bright accent, from the splash artwork
 *   700 #0A6727 — mid green, from the horizontal logo
 *   900 #01311D — deep forest green, the dominant logo colour
 *
 * The intermediate steps are interpolated to keep the ramp even.
 */
export const green = {
  50: '#E8F6ED',
  100: '#C4E9D1',
  200: '#97D9B0',
  300: '#5FC77F',
  400: '#1FB74B',
  500: '#0D8A41',
  600: '#0B7537',
  700: '#0A6727',
  800: '#054A22',
  900: '#01311D',
} as const;

export const neutral = {
  0: '#FFFFFF',
  50: '#F7F9F8',
  100: '#EFF2F1',
  200: '#E2E7E5',
  300: '#CBD3D0',
  400: '#9AA5A1',
  500: '#6E7B77',
  600: '#4E5A56',
  700: '#374240',
  800: '#212B29',
  900: '#111917',
} as const;

const support = {
  danger: '#D64545',
  warning: '#C77700',
  info: '#2C6EBB',
} as const;

const supportDark = {
  danger: '#FF6B6B',
  warning: '#E8A33D',
  info: '#6BA6E8',
} as const;

/**
 * The semantic token set both schemes must provide.
 *
 * Declared explicitly rather than inferred from the light palette: the ramps
 * above are `as const`, so `primary: green[500]` would otherwise infer the
 * literal type `"#0E8F4E"` and the dark palette could never hold a different
 * value. Declaring it also means adding a token to one scheme fails to compile
 * until the other defines it too.
 */
export interface Colors {
  green: typeof green;
  neutral: typeof neutral;

  primary: string;
  primaryDark: string;
  primaryDarker: string;
  primaryLight: string;
  primarySubtle: string;
  onPrimary: string;

  background: string;
  surface: string;
  surfaceAlt: string;
  surfaceSunken: string;
  overlay: string;
  scrim: string;

  text: string;
  textSecondary: string;
  textMuted: string;
  textDisabled: string;
  textInverse: string;
  textOnPrimary: string;

  border: string;
  borderStrong: string;
  divider: string;
  focusRing: string;

  danger: string;
  dangerBg: string;
  warning: string;
  warningBg: string;
  info: string;
  infoBg: string;
  success: string;
  successBg: string;

  livenessIdle: string;
  livenessActive: string;
  livenessSuccess: string;
  livenessError: string;

  /** Drives StatusBar content, navigation theme and native map styling. */
  isDark: boolean;
}

export const lightColors: Colors = {
  green,
  neutral,

  // ── brand ────────────────────────────────────────────────────────────────
  primary: green[500],
  primaryDark: green[600],
  primaryDarker: green[700],
  primaryLight: green[100],
  primarySubtle: green[50],
  onPrimary: neutral[0],

  // ── surfaces ─────────────────────────────────────────────────────────────
  background: neutral[50],
  surface: neutral[0],
  surfaceAlt: neutral[100],
  surfaceSunken: neutral[100],
  overlay: 'rgba(17, 25, 23, 0.55)',
  scrim: 'rgba(17, 25, 23, 0.78)',

  // ── text ─────────────────────────────────────────────────────────────────
  text: neutral[900],
  textSecondary: neutral[600],
  textMuted: neutral[500],
  textDisabled: neutral[400],
  textInverse: neutral[0],
  textOnPrimary: neutral[0],

  // ── lines ────────────────────────────────────────────────────────────────
  border: neutral[200],
  borderStrong: neutral[300],
  divider: neutral[200],
  focusRing: green[400],

  // ── status ───────────────────────────────────────────────────────────────
  danger: support.danger,
  dangerBg: '#FCEBEB',
  warning: support.warning,
  warningBg: '#FDF3E3',
  info: support.info,
  infoBg: '#EAF1FA',
  success: green[500],
  successBg: green[50],

  // ── liveness feedback (used by the face oval + prompts) ───────────────────
  livenessIdle: neutral[300],
  livenessActive: green[400],
  livenessSuccess: green[500],
  livenessError: support.danger,

  /** Drives StatusBar content and native map styling. */
  isDark: false,
  // NOTE: deliberately no `as const` here. It would pin every value to its
  // literal type, and `darkColors` could then never hold a different string.
};

export const darkColors: Colors = {
  green,
  neutral,

  // Brand green is lifted a step in dark mode — #0E8F4E on a near-black
  // surface fails contrast for text and reads muddy for fills.
  primary: green[400],
  primaryDark: green[500],
  primaryDarker: green[300],
  primaryLight: '#173A2A',
  primarySubtle: '#12241C',
  onPrimary: '#04140C',

  background: '#0B1210',
  surface: '#151E1B',
  surfaceAlt: '#1E2A26',
  surfaceSunken: '#0E1614',
  overlay: 'rgba(0, 0, 0, 0.62)',
  scrim: 'rgba(0, 0, 0, 0.82)',

  text: '#EAF1EE',
  textSecondary: '#A9B7B2',
  textMuted: '#85938E',
  textDisabled: '#5E6B66',
  textInverse: neutral[900],
  textOnPrimary: '#04140C',

  border: '#2A3833',
  borderStrong: '#3A4A44',
  divider: '#232F2B',
  focusRing: green[300],

  danger: supportDark.danger,
  dangerBg: '#2E1A1A',
  warning: supportDark.warning,
  warningBg: '#2E2415',
  info: supportDark.info,
  infoBg: '#16222E',
  success: green[400],
  successBg: '#12241C',

  livenessIdle: '#3A4A44',
  livenessActive: green[300],
  livenessSuccess: green[400],
  livenessError: supportDark.danger,

  isDark: true,
};


/**
 * Light palette exported directly for the handful of always-dark surfaces
 * (camera and liveness screens) that intentionally do not follow the scheme.
 */
export const colors = lightColors;
