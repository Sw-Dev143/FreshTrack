// ── Shared (tema bağımsız) ────────────────────────────────────────────────────
const SHARED = {
  primary:      '#4F46E5',
  primaryLight: '#818CF8',
  primaryDark:  '#3730A3',
  safe:         '#10B981',
  safeLight:    '#D1FAE5',
  warning:      '#F59E0B',
  warningLight: '#FEF3C7',
  danger:       '#EF4444',
  dangerLight:  '#FEE2E2',
  deli:         '#F59E0B',
  deliLight:    '#FEF3C7',
  pharmacy:     '#10B981',
  pharmacyLight:'#D1FAE5',
  other:        '#6366F1',
  otherLight:   '#E0E7FF',
  gradientPrimary: ['#4F46E5', '#7C3AED'] as [string, string],
  gradientWarm:    ['#F59E0B', '#EF4444'] as [string, string],
  gradientSafe:    ['#10B981', '#059669'] as [string, string],
};

export const LIGHT_COLORS = {
  ...SHARED,
  secondary:   '#1E293B',
  background:  '#F1F5F9',
  surface:     '#FFFFFF',
  surfaceAlt:  '#F8FAFC',
  text:        '#0F172A',
  textLight:   '#64748B',
  textMuted:   '#94A3B8',
  border:      '#E2E8F0',
};

export const DARK_COLORS = {
  ...SHARED,
  secondary:   '#E2E8F0',
  background:  '#0F172A',
  surface:     '#1E293B',
  surfaceAlt:  '#273548',
  text:        '#F1F5F9',
  textLight:   '#94A3B8',
  textMuted:   '#64748B',
  border:      '#334155',
};

// Geriye dönük uyum — eski import'lar kırılmaz
export const COLORS = LIGHT_COLORS;

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
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
  },
  md: {
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 5,
  },
  lg: {
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.08,
    shadowRadius: 30,
    elevation: 8,
  },
  primary: {
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 10,
  },
};

