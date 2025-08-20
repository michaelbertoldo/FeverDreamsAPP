// src/components/ui/ConfettiEffect.tsx
import React, { useEffect } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  Easing,
  cancelAnimation,
  runOnJS
} from 'react-native-reanimated';
import { colors as themeColors } from '../../theme';

const { width, height } = Dimensions.get('window');

interface ConfettiPieceProps {
  index: number;
  color: string;
  size: number;
  onAnimationComplete: () => void;
}

const ConfettiPiece: React.FC<ConfettiPieceProps> = ({ 
  index, 
  color, 
  size,
  onAnimationComplete
}) => {
  // Random starting position
  const startX = useSharedValue(Math.random() * width);
  const startY = useSharedValue(-50);
  
  // Animation values
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(1);
  
  useEffect(() => {
    // Random horizontal movement
    const randomX = (Math.random() - 0.5) * 200;
    
    // Start animation with delay based on index
    const delay = index * 100;
    
    // Horizontal movement
    translateX.value = withDelay(
      delay,
      withSequence(
        withTiming(randomX / 2, { duration: 500 }),
        withTiming(randomX, { duration: 1000 }),
        withTiming(randomX * 1.5, { duration: 1000 })
      )
    );
    
    // Vertical movement (falling)
    translateY.value = withDelay(
      delay,
      withTiming(height + 100, { 
        duration: 2000 + Math.random() * 1000,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1)
      }, (finished) => {
        if (finished) {
          runOnJS(onAnimationComplete)();
        }
      })
    );
    
    // Rotation
    rotate.value = withDelay(
      delay,
      withRepeat(
        withTiming(360, { 
          duration: 1000 + Math.random() * 1000,
          easing: Easing.linear
        }),
        -1
      )
    );
    
    // Fade out near the end
    opacity.value = withDelay(
      delay + 1500,
      withTiming(0, { duration: 500 })
    );
    
    return () => {
      // Clean up animations
      cancelAnimation(translateX);
      cancelAnimation(translateY);
      cancelAnimation(rotate);
      cancelAnimation(opacity);
    };
  }, []);
  
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: startX.value + translateX.value },
        { translateY: startY.value + translateY.value },
        { rotate: `${rotate.value}deg` }
      ],
      opacity: opacity.value
    };
  });
  
  return (
    <Animated.View
      style={[
        styles.confetti,
        animatedStyle,
        { 
          backgroundColor: color,
          width: size,
          height: size * (Math.random() * 2 + 1) // Random height
        }
      ]}
    />
  );
};

interface ConfettiEffectProps {
  count?: number;
  duration?: number;
  colors?: string[];
  onComplete?: () => void;
}

export const ConfettiEffect: React.FC<ConfettiEffectProps> = ({
  count = 50,
  duration = 3000,
  colors = [
    themeColors.primary,    // Fixed: use themeColors instead of colors
    themeColors.secondary,
    themeColors.tertiary,
    themeColors.success,
    themeColors.warning,
    themeColors.danger
  ],
  onComplete
}) => {
  const [pieces, setPieces] = React.useState<number[]>([]);
  const completedPieces = React.useRef(0);
  
  useEffect(() => {
    // Create confetti pieces
    setPieces(Array.from({ length: count }, (_, i) => i));
    
    // Clean up after duration
    const timeout = setTimeout(() => {
      onComplete?.();
    }, duration);
    
    return () => clearTimeout(timeout);
  }, [count, duration, onComplete]);
  
  const handlePieceComplete = () => {
    completedPieces.current += 1;
    if (completedPieces.current >= count && onComplete) {
      onComplete();
    }
  };
  
  return (
    <View style={styles.container} pointerEvents="none">
      {pieces.map((i) => (
        <ConfettiPiece
          key={i}
          index={i}
          color={colors[i % colors.length]}
          size={Math.random() * 10 + 5}
          onAnimationComplete={handlePieceComplete}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  confetti: {
    position: 'absolute',
  },
});