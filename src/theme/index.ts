// src/theme/index.ts
import { DefaultTheme } from '@react-navigation/native';
import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

// Responsive sizing utility
export const hp = (percentage: number) => {
  return height * (percentage / 100);
};

export const wp = (percentage: number) => {
  return width * (percentage / 100);
};

// Color palette
export const colors = {
  primary: '#FF3B30', // Vibrant red
  secondary: '#5AC8FA', // Bright blue
  tertiary: '#FFCC00', // Playful yellow
  success: '#4CD964', // Green
  warning: '#FF9500', // Orange
  info: '#5856D6', // Purple
  background: {
    primary: '#000000',
    secondary: '#1C1C1E',
    tertiary: '#2C2C2E',
  },
  text: {
    primary: '#FFFFFF',
    secondary: '#EBEBF5',
    tertiary: '#8E8E93',
  },
  overlay: 'rgba(0, 0, 0, 0.7)',
  transparent: 'transparent',
};

// Typography
export const typography = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
  },
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  lineHeight: {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 28,
    xl: 32,
    xxl: 36,
    xxxl: 40,
  },
};

// Spacing
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Border radius
export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  round: 9999,
};

// Shadows
export const shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 6,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.37,
    shadowRadius: 7.49,
    elevation: 12,
  },
};

// Navigation theme
export const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    background: colors.background.primary,
    card: colors.background.secondary,
    text: colors.text.primary,
    border: colors.background.tertiary,
  },
};

// Animation durations
export const animationDurations = {
  short: 200,
  medium: 300,
  long: 500,
};

// Z-index
export const zIndex = {
  base: 0,
  above: 1,
  modal: 10,
  toast: 20,
  loader: 30,
};
