// src/components/ui/AnimatedCard.tsx
import React, { useEffect } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withDelay,
  withTiming,
  Easing,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';
import { colors, borderRadius, shadows } from '../../theme';

interface AnimatedCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  delay?: number;
  animation?: 'fade' | 'slide' | 'scale' | 'flip' | 'bounce';
  onAnimationComplete?: () => void;
}

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  style,
  delay = 0,
  animation = 'fade',
  onAnimationComplete,
}) => {
  // Animation values
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(50);
  const translateX = useSharedValue(0);
  const scale = useSharedValue(0.8);
  const rotateY = useSharedValue(90);
  
  useEffect(() => {
    // Start animation
    const animationConfig = { 
      duration: 500,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1)
    };
    
    opacity.value = withDelay(delay, withTiming(1, animationConfig));
    
    switch (animation) {
      case 'fade':
        // Just fade in, no additional animation
        break;
      case 'slide':
        translateY.value = withDelay(delay, withSpring(0, { 
          damping: 15, 
          stiffness: 100 
        }));
        break;
      case 'scale':
        scale.value = withDelay(delay, withSpring(1, { 
          damping: 15, 
          stiffness: 100 
        }));
        break;
      case 'flip':
        rotateY.value = withDelay(delay, withSpring(0, { 
          damping: 15, 
          stiffness: 100 
        }));
        break;
      case 'bounce':
        scale.value = withDelay(delay, withSpring(1, { 
          damping: 8, 
          stiffness: 100,
          mass: 1
        }));
        translateY.value = withDelay(delay, withSpring(0, { 
          damping: 8, 
          stiffness: 100,
          mass: 1
        }));
        break;
    }
    
    // Notify when animation completes
    const timeout = setTimeout(() => {
      onAnimationComplete?.();
    }, delay + 500);
    
    return () => clearTimeout(timeout);
  }, []);
  
  const animatedStyle = useAnimatedStyle(() => {
    const rotateYDegrees = interpolate(
      rotateY.value,
      [0, 90],
      [0, 90],  // Use numbers instead of strings
      Extrapolate.CLAMP
    );
    
    return {
      opacity: opacity.value,
      transform: [
        { translateY: translateY.value },
        { translateX: translateX.value },
        { scale: scale.value },
        { rotateY: `${rotateYDegrees}deg` }  // Convert to string here
      ]
    };
  });
  
  return (
    <Animated.View style={[styles.card, animatedStyle, style]}>
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: 16,
    ...shadows.medium,
  },
});
