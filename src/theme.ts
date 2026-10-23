import { Platform } from 'react-native';

export const colors = {
  // Brand Core
  ink: '#151714',
  inkLight: '#2C2E2A',
  muted: '#71756D',
  mutedLight: '#A3A69F',
  paper: '#FAF8F4',
  cream: '#F3EFE7',
  card: '#FFFFFF',
  line: '#E7E3D8',
  lineLight: '#F0ECE3',

  // Gold Brand Accents (from official logo)
  accent: '#C59B27',
  gold: '#C59B27',
  goldBright: '#E3B94D',
  goldDark: '#936D15',
  goldLight: '#F9F4E7',
  goldMuted: '#EDE2C8',

  // Status & Utility
  green: '#396A4B',
  greenLight: '#E8F3EC',
  danger: '#A33C33',
  dangerLight: '#FDF0EF',
  white: '#FFFFFF',
  overlay: 'rgba(18, 20, 16, 0.65)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  page: 20,
  radiusSm: 8,
  radius: 12,
  radiusLg: 18,
  radiusPill: 999,
};

export const shadow = Platform.select({
  android: { elevation: 2 },
  ios: { shadowColor: '#151714', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
  default: {},
});

export const cardShadow = Platform.select({
  android: { elevation: 3 },
  ios: { shadowColor: '#151714', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12 },
  default: {},
});

