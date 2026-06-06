import { Platform } from 'react-native';

export const UI = {
  screenPadding: 16,
  radius: {
    sm: 10,
    md: 14,
    lg: 18,
    xl: 24,
  },
  shadow: Platform.select({
    ios: {
      shadowColor: '#0f172a',
      shadowOpacity: 0.08,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 8 },
    },
    android: {
      elevation: 3,
    },
    web: {
      boxShadow: '0 8px 14px rgba(15, 23, 42, 0.08)',
    },
    default: {
      shadowColor: '#0f172a',
      shadowOpacity: 0.08,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 8 },
    },
  }),
  softShadow: Platform.select({
    ios: {
      shadowColor: '#0f172a',
      shadowOpacity: 0.05,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 5 },
    },
    android: {
      elevation: 2,
    },
    web: {
      boxShadow: '0 5px 10px rgba(15, 23, 42, 0.05)',
    },
    default: {
      shadowColor: '#0f172a',
      shadowOpacity: 0.05,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 5 },
    },
  }),
};

export const SURFACE = '#fff7fb';
export const SURFACE_MUTED = '#f8fafc';
export const TEXT_DARK = '#0f172a';
export const TEXT_MUTED = '#64748b';
export const BORDER = '#f1d6e2';

export const ROLE_COLORS = {
  customer: {
    primary: '#ec4899',
    primaryDark: '#be185d',
    soft: '#fdf2f8',
    border: '#fbcfe8',
  },
  tailor: {
    primary: '#f472b6',
    primaryDark: '#be185d',
    soft: '#fff1f7',
    border: '#f9c1df',
  },
  admin: {
    primary: '#6366f1',
    primaryDark: '#4338ca',
    soft: '#eef2ff',
    border: '#c7d2fe',
  },
};
