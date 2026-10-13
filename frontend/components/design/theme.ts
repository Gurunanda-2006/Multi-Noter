export const colors = {
  background: '#FAFAFA',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  surfacePressed: '#F3F4F6',
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textDisabled: '#9CA3AF',
  textMuted: '#9CA3AF',

  // Light orange accent for buttons & icons
  accent: '#FF8A3D',
  accentLight: '#FFF7ED',
  accentDark: '#EA580C',

  // Semantic
  danger: '#EF4444',
  dangerLight: '#FEF2F2',
  success: '#22C55E',
  successLight: '#F0FDF4',
  warning: '#F59E0B',
  warningLight: '#FFFBEB',
  info: '#3B82F6',
  infoLight: '#EFF6FF',

  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayHeavy: 'rgba(0, 0, 0, 0.75)',

  // Backward compatibility aliases
  glass: '#FFFFFF',
  glassBorder: '#E5E7EB',
  glassLight: '#F9FAFB',
};

// Perfectly square: NO rounded corners or edge smoothing anywhere
export const radius = {
  xs: 0,
  sm: 0,
  md: 0,
  lg: 0,
  xl: 0,
  xxl: 0,
  full: 0,
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
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  glow: {
    shadowColor: '#FF8A3D',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
};

export const typography = {
  h1: { fontSize: 26, fontWeight: '700' as const, color: '#111827', letterSpacing: -0.3 },
  h2: { fontSize: 20, fontWeight: '600' as const, color: '#111827', letterSpacing: -0.2 },
  h3: { fontSize: 17, fontWeight: '600' as const, color: '#111827' },
  body: { fontSize: 15, fontWeight: '400' as const, color: '#111827' },
  bodySmall: { fontSize: 13, fontWeight: '400' as const, color: '#6B7280' },
  caption: { fontSize: 11, fontWeight: '400' as const, color: '#9CA3AF' },
  button: { fontSize: 15, fontWeight: '600' as const, letterSpacing: 0.2 },
};

// Clean square card styles
export const glassCard = {
  backgroundColor: colors.surface,
  borderRadius: 0,
  borderWidth: 1,
  borderColor: colors.border,
  ...shadow.sm,
};

export const glassCardLight = {
  backgroundColor: colors.surface,
  borderRadius: 0,
  borderWidth: 1,
  borderColor: colors.borderLight,
};
