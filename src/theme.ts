export const COLORS = {
  primary: '#4F46E5',       // Premium Indigo
  primaryLight: '#818CF8',  // Light Indigo
  primaryDark: '#3730A3',   // Dark Indigo
  secondary: '#1E293B',     // Sleek dark blue/gray
  background: '#F1F5F9',    // Slightly deeper cool gray
  surface: '#FFFFFF',
  surfaceAlt: '#F8FAFC',
  text: '#0F172A',
  textLight: '#64748B',
  textMuted: '#94A3B8',
  border: '#E2E8F0',

  // Status
  safe: '#10B981',
  safeLight: '#D1FAE5',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  danger: '#EF4444',
  dangerLight: '#FEE2E2',

  // Categories
  deli: '#F59E0B',          // Amber (warmer)
  deliLight: '#FEF3C7',
  pharmacy: '#10B981',      // Emerald
  pharmacyLight: '#D1FAE5',
  other: '#6366F1',         // Indigo
  otherLight: '#E0E7FF',

  // Premium gradient stops (used as string pairs)
  gradientPrimary: ['#4F46E5', '#7C3AED'] as [string, string],
  gradientWarm:    ['#F59E0B', '#EF4444'] as [string, string],
  gradientSafe:    ['#10B981', '#059669'] as [string, string],
};

export const SIZES = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  radius: 16,
  radius_sm: 8,
  radius_lg: 24,
};

export const SHADOWS = {
  sm: {
    shadowColor: '#1E293B' as string,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  md: {
    shadowColor: '#1E293B' as string,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  lg: {
    shadowColor: '#1E293B' as string,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.10,
    shadowRadius: 24,
    elevation: 8,
  },
  primary: {
    shadowColor: '#4F46E5' as string,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
};

