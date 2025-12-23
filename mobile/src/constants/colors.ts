export const Colors = {
  // Primary Colors
  primary: '#4ADE80',
  primaryDark: '#22C55E',
  primaryLight: '#86EFAC',

  // Background Colors
  background: '#0A1A15',
  surface: '#1B332D',
  surfaceLight: '#2D4A42',

  // Text Colors
  text: '#FFFFFF',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',

  // Accent Colors
  accent: '#6B4EFF',
  accentLight: '#8B7AFF',

  // Status Colors
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',

  // UI Colors
  border: '#374151',
  divider: '#1F2937',
  overlay: 'rgba(0, 0, 0, 0.7)',
  tabBarBackground: '#0A1A15',
  tabBarActive: '#4ADE80',
  tabBarInactive: '#6B7280',

  // Gradient Colors
  gradientStart: '#0A1A15',
  gradientEnd: '#1B332D',
} as const;

export type ColorKey = keyof typeof Colors;
