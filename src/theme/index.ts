// src/theme/index.ts - FIXED THEME
export const colors = {
  primary: '#FF3B30',
  secondary: '#8E8E93',
  tertiary: '#FFD60A',
  success: '#4CD964',
  warning: '#FF9500',
  danger: '#FF3B30',
  background: {
    primary: '#000000',
    secondary: '#1C1C1E',
    tertiary: '#2C2C2E'
  },
  text: {
    primary: '#FFFFFF',
    secondary: '#EBEBF5',
    tertiary: '#8E8E93'
  }
};

export const typography = {
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    bold: '700'
  }
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16
};

// FIXED: Convert "large" to actual numeric values
export const buttonSizes = {
  small: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    fontSize: 14,
    height: 36
  },
  medium: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    fontSize: 16,
    height: 44
  },
  large: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    fontSize: 18,
    height: 52
  }
};