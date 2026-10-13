export const colors = {
  background: '#FAFAFA',
  surface: '#FFFFFF',
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textDisabled: '#9CA3AF',
  accent: '#4F46E5',
  accentLight: '#EEF2FF',
  danger: '#EF4444',
  dangerLight: '#FEF2F2',
  success: '#22C55E',
  successLight: '#F0FDF4',
  warning: '#F59E0B',
  warningLight: '#FFFBEB',
  overlay: 'rgba(0,0,0,0.5)',
};

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
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
};

export const shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
};

export const typography = {
  h1: { fontSize: 24, fontWeight: '700' as const, color: '#111827' },
  h2: { fontSize: 20, fontWeight: '600' as const, color: '#111827' },
  h3: { fontSize: 17, fontWeight: '600' as const, color: '#111827' },
  body: { fontSize: 15, fontWeight: '400' as const, color: '#111827' },
  bodySmall: { fontSize: 13, fontWeight: '400' as const, color: '#6B7280' },
  caption: { fontSize: 11, fontWeight: '400' as const, color: '#9CA3AF' },
  button: { fontSize: 15, fontWeight: '600' as const },
};
