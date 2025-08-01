// src/components/ui/AnimatedButton.tsx
import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ViewStyle, 
  TextStyle,
  ActivityIndicator
} from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withSequence, 
  withDelay 
} from 'react-native-reanimated';
import { colors, typography, borderRadius, shadows } from '../../theme';

interface AnimatedButtonProps {
  text: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  text,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
  icon,
  iconPosition = 'left',
}) => {
  // Animation values
  const scale = useSharedValue(1);
  const rotate = useSharedValue(0);
  
  // Button press animation
  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 10, stiffness: 200 });
  };
  
  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 10, stiffness: 200 });
  };
  
  // Success animation (for future use)
  const playSuccessAnimation = () => {
    scale.value = withSequence(
      withSpring(1.1, { damping: 10, stiffness: 200 }),
      withDelay(100, withSpring(1, { damping: 10, stiffness: 200 }))
    );
    
    rotate.value = withSequence(
      withSpring(-5, { damping: 10, stiffness: 200 }),
      withSpring(5, { damping: 10, stiffness: 200 }),
      withSpring(0, { damping: 10, stiffness: 200 })
    );
  };
  
  // Animated styles
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value },
        { rotate: `${rotate.value}deg` }
      ]
    };
  });
  
  // Get button styles based on variant and size
  const getButtonStyles = (): ViewStyle => {
    let variantStyle: ViewStyle = {};
    
    switch (variant) {
      case 'primary':
        variantStyle = {
          backgroundColor: colors.primary,
          borderWidth: 0,
        };
        break;
      case 'secondary':
        variantStyle = {
          backgroundColor: colors.secondary,
          borderWidth: 0,
        };
        break;
      case 'outline':
        variantStyle = {
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderColor: colors.primary,
        };
        break;
      case 'ghost':
        variantStyle = {
          backgroundColor: 'transparent',
          borderWidth: 0,
        };
        break;
    }
    
    let sizeStyle: ViewStyle = {};
    
    switch (size) {
      case 'small':
        sizeStyle = {
          paddingVertical: 8,
          paddingHorizontal: 16,
        };
        break;
      case 'medium':
        sizeStyle = {
          paddingVertical: 12,
          paddingHorizontal: 24,
        };
        break;
      case 'large':
        sizeStyle = {
          paddingVertical: 16,
          paddingHorizontal: 32,
        };
        break;
    }
    
    return {
      ...styles.button,
      ...variantStyle,
      ...sizeStyle,
      ...(disabled ? styles.disabled : {}),
    };
  };
  
  // Get text styles based on variant and size
  const getTextStyles = (): TextStyle => {
    let variantStyle: TextStyle = {};
    
    switch (variant) {
      case 'primary':
      case 'secondary':
        variantStyle = {
          color: colors.text.primary,
        };
        break;
      case 'outline':
      case 'ghost':
        variantStyle = {
          color: colors.primary,
        };
        break;
    }
    
    let sizeStyle: TextStyle = {};
    
    switch (size) {
      case 'small':
        sizeStyle = {
          fontSize: typography.fontSize.sm,
        };
        break;
      case 'medium':
        sizeStyle = {
          fontSize: typography.fontSize.md,
        };
        break;
      case 'large':
        sizeStyle = {
          fontSize: typography.fontSize.lg,
        };
        break;
    }
    
    return {
      ...styles.text,
      ...variantStyle,
      ...sizeStyle,
      ...(disabled ? styles.disabledText : {}),
    };
  };
  
  return (
    <Animated.View style={[animatedStyle, style]}>
      <TouchableOpacity
        style={getButtonStyles()}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator 
            color={variant === 'outline' || variant === 'ghost' ? colors.primary : colors.text.primary} 
            size="small" 
          />
        ) : (
          <>
            {icon && iconPosition === 'left' && icon}
            <Text style={[getTextStyles(), textStyle]}>{text}</Text>
            {icon && iconPosition === 'right' && icon}
          </>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
    ...shadows.small,
  },
  text: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
  disabledText: {
    opacity: 0.7,
  },
});
