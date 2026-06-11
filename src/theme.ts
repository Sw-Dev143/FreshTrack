// ── Shared (tema bağımsız) ────────────────────────────────────────────────────
const SHARED = {
  primary:      '#5F5DEC', // Vibrant premium violet-blue
  primaryLight: '#9392FF',
  primaryDark:  '#3C3AB3',
  safe:         '#10B981', // Clean Emerald
  safeLight:    '#ECFDF5',
  warning:      '#F59E0B', // Amber
  warningLight: '#FEF3C7',
  danger:       '#EF4444', // Rose/Red
  dangerLight:  '#FEE2E2',
  deli:         '#FF8A00', // Rich Orange
  deliLight:    '#FFF4E6',
  pharmacy:     '#059669', // Emerald Pharmacy
  pharmacyLight:'#E6F4EA',
  other:        '#8B5CF6', // Purple Other
  otherLight:   '#F5F3FF',
  
  // High-fidelity gradients
  gradientPrimary:  ['#5F5DEC', '#8B5CF6'] as [string, string],
  gradientWarm:     ['#FF8A00', '#EF4444'] as [string, string],
  gradientSafe:     ['#10B981', '#059669'] as [string, string],
  gradientDeli:     ['#FF8A00', '#FFB800'] as [string, string],
  gradientPharmacy: ['#059669', '#10B981'] as [string, string],
  gradientOther:    ['#8B5CF6', '#A78BFA'] as [string, string],
  gradientGlassy:   ['rgba(255, 255, 255, 0.8)', 'rgba(255, 255, 255, 0.45)'] as [string, string],
  gradientGlassyDark: ['rgba(30, 41, 59, 0.7)', 'rgba(15, 23, 42, 0.45)'] as [string, string],
};

export const LIGHT_COLORS = {
  ...SHARED,
  secondary:   '#0F172A', // Slate 900
  background:  '#F8FAFC', // Slate 50 (brighter for premium clean look)
  surface:     '#FFFFFF',
  surfaceAlt:  '#F1F5F9', // Slate 100
  text:        '#0F172A',
  textLight:   '#475569', // Slate 600
  textMuted:   '#94A3B8', // Slate 400
  border:      '#E2E8F0', // Slate 200
};

export const DARK_COLORS = {
  ...SHARED,
  secondary:   '#F8FAFC', // Slate 50
  background:  '#090D16', // Deeper midnight blue-black
  surface:     '#131B2E', // Premium dark slate card
  surfaceAlt:  '#1E293B', // Slate 800
  text:        '#F1F5F9',
  textLight:   '#94A3B8', // Slate 400
  textMuted:   '#475569', // Slate 600
  border:      '#1F293D', // Sleek dark border
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
  radius_sm: 10,
  radius_lg: 24,
};

export const SHADOWS = {
  sm: {
    shadowColor: '#5F5DEC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  md: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 4,
  },
  lg: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.08,
    shadowRadius: 32,
    elevation: 8,
  },
  primary: {
    shadowColor: '#5F5DEC',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 10,
  },
};

