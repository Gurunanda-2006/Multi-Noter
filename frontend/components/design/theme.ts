// Dark glassmorphism theme inspired by glowing tree background
export const colors = {
  // Backgrounds
  background: 'transparent',
  surface: 'rgba(255, 255, 255, 0.08)',
  surfaceElevated: 'rgba(255, 255, 255, 0.12)',
  surfacePressed: 'rgba(255, 255, 255, 0.16)',
  
  // Glass effects
  glass: 'rgba(255, 255, 255, 0.1)',
  glassBorder: 'rgba(255, 255, 255, 0.18)',
  glassLight: 'rgba(255, 255, 255, 0.05)',
  
  // Borders
  border: 'rgba(255, 255, 255, 0.12)',
  borderLight: 'rgba(255, 255, 255, 0.06)',
  
  // Text
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.65)',
  textDisabled: 'rgba(255, 255, 255, 0.35)',
  textMuted: 'rgba(255, 255, 255, 0.45)',
  
  // Accent - Emerald green matching the tree glow
  accent: '#34D399',
  accentLight: 'rgba(52, 211, 153, 0.15)',
  accentDark: '#059669',
  
  // Semantic
  danger: '#F87171',
  dangerLight: 'rgba(248, 113, 113, 0.15)',
  success: '#34D399',
  successLight: 'rgba(52, 211, 153, 0.15)',
  warning: '#FBBF24',
  warningLight: 'rgba(251, 191, 36, 0.15)',
  info: '#60A5FA',
  infoLight: 'rgba(96, 165, 250, 0.15)',
  
  // Overlay
  overlay: 'rgba(0, 0, 0, 0.6)',
  overlayHeavy: 'rgba(0, 0, 0, 0.75)',
};

export const radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 20,
  xl: 24,
  xxl: 32,
  full: 9999,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
};

export const shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 8,
  },
  glow: {
    shadowColor: '#34D399',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
};

export const typography = {
  h1: { fontSize: 28, fontWeight: '700' as const, color: '#FFFFFF', letterSpacing: -0.5 },
  h2: { fontSize: 22, fontWeight: '600' as const, color: '#FFFFFF', letterSpacing: -0.3 },
  h3: { fontSize: 17, fontWeight: '600' as const, color: '#FFFFFF' },
  body: { fontSize: 15, fontWeight: '400' as const, color: '#FFFFFF' },
  bodySmall: { fontSize: 13, fontWeight: '400' as const, color: 'rgba(255, 255, 255, 0.65)' },
  caption: { fontSize: 11, fontWeight: '400' as const, color: 'rgba(255, 255, 255, 0.45)' },
  button: { fontSize: 15, fontWeight: '600' as const, letterSpacing: 0.3 },
};

// Glassmorphism card styles for reuse
export const glassCard = {
  backgroundColor: colors.glass,
  borderRadius: radius.xl,
  borderWidth: 1,
  borderColor: colors.glassBorder,
  ...shadow.md,
};

export const glassCardLight = {
  backgroundColor: colors.glassLight,
  borderRadius: radius.lg,
  borderWidth: 1,
  borderColor: colors.borderLight,
};
