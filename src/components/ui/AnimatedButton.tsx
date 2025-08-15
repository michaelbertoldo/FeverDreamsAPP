
import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

interface AnimatedButtonProps {
  text: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  style?: ViewStyle;
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  text,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  style
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }]
    };
  });

  const handlePressIn = () => {
    scale.value = withSpring(0.95);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  // FIXED: Convert size string to actual numeric values
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          paddingVertical: 8,
          paddingHorizontal: 16,
          fontSize: 14,
          height: 36
        };
      case 'medium':
        return {
          paddingVertical: 12,
          paddingHorizontal: 20,
          fontSize: 16,
          height: 44
        };
      case 'large':
        return {
          paddingVertical: 16,
          paddingHorizontal: 24,
          fontSize: 18,
          height: 52
        };
      default:
        return {
          paddingVertical: 12,
          paddingHorizontal: 20,
          fontSize: 16,
          height: 44
        };
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: '#FF3B30',
          borderColor: '#FF3B30',
          textColor: '#FFFFFF'
        };
      case 'secondary':
        return {
          backgroundColor: '#8E8E93',
          borderColor: '#8E8E93',
          textColor: '#FFFFFF'
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderColor: '#FF3B30',
          textColor: '#FF3B30'
        };
      default:
        return {
          backgroundColor: '#FF3B30',
          borderColor: '#FF3B30',
          textColor: '#FFFFFF'
        };
    }
  };

  const sizeStyles = getSizeStyles();
  const variantStyles = getVariantStyles();

  const buttonStyle: ViewStyle = {
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    ...sizeStyles,
    backgroundColor: disabled ? '#666666' : variantStyles.backgroundColor,
    borderColor: disabled ? '#666666' : variantStyles.borderColor,
    opacity: disabled ? 0.6 : 1,
  };

  // FIXED: Separate text styles properly
  const baseTextStyle: TextStyle = {
    fontWeight: 'bold',
    color: disabled ? '#CCCCCC' : variantStyles.textColor,
    fontSize: sizeStyles.fontSize,
  };

  // FIXED: Icon spacing styles
  const getTextWithIconStyle = (): TextStyle => {
    if (!icon) return {};
    
    return {
      marginLeft: iconPosition === 'left' ? 8 : 0,
      marginRight: iconPosition === 'right' ? 8 : 0,
    };
  };

  const textStyle = [baseTextStyle, getTextWithIconStyle()];

  return (
    <Animated.View style={[animatedStyle, style]}>
      <TouchableOpacity
        style={buttonStyle}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator 
            size="small" 
            color={variantStyles.textColor} 
          />
        ) : (
          <>
            {icon && iconPosition === 'left' && icon}
            <Text style={textStyle}>
              {text}
            </Text>
            {icon && iconPosition === 'right' && icon}
          </>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};