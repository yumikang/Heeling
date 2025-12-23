import { TextStyle } from 'react-native';

export const Typography: Record<string, TextStyle> = {
  // Headings
  heading1: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
  },
  heading2: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 30,
  },
  heading3: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 26,
  },

  // Body Text
  body: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
  },
  bodyMedium: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 24,
  },
  bodySemiBold: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
  },

  // Small Text
  caption: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  captionMedium: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },

  // Extra Small
  small: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
  },

  // Button Text
  button: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
  },
  buttonSmall: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
} as const;

export type TypographyKey = keyof typeof Typography;
