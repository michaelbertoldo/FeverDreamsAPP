// src/components/OptimizedImage.tsx
import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, StyleProp, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { getCachedImage } from '../services/optimizedImageService';
import { shouldApplyPerformanceOptimizations } from '../services/performanceMonitoring';
import { colors } from '../theme';

interface OptimizedImageProps {
  source: { uri: string } | number;
  style?: StyleProp<ViewStyle>;
  contentFit?: 'cover' | 'contain' | 'fill' | 'none';
  placeholder?: { uri: string } | number;
  transition?: number;
  priority?: 'low' | 'normal' | 'high';
  onLoad?: () => void;
  onError?: () => void;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  source,
  style,
  contentFit = 'cover',
  placeholder,
  transition = 300,
  priority = 'normal',
  onLoad,
  onError,
}) => {
  // State
  const [optimizedSource, setOptimizedSource] = useState<{ uri: string } | number>(source);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [shouldOptimize, setShouldOptimize] = useState(false);
  
  // Animation values
  const opacity = useSharedValue(0);
  
  // Refs
  const isMounted = useRef(true);
  
  // Check if we should apply performance optimizations
  useEffect(() => {
    const checkOptimizations = async () => {
      const shouldOptimize = await shouldApplyPerformanceOptimizations();
      if (isMounted.current) {
        setShouldOptimize(shouldOptimize);
      }
    };
    
    checkOptimizations();
    
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  // Optimize image source
  useEffect(() => {
    const optimizeSource = async () => {
      try {
        // Only optimize remote images with URI
        if (typeof source === 'object' && source.uri) {
          setIsLoading(true);
          
          // Get cached or optimized image
          const cachedUri = await getCachedImage(source.uri);
          
          if (isMounted.current) {
            setOptimizedSource({ uri: cachedUri });
            setIsLoading(false);
          }
        } else {
          // Local image, use as is
          setOptimizedSource(source);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error optimizing image source:', error);
        
        if (isMounted.current) {
          setOptimizedSource(source); // Use original source on error
          setIsLoading(false);
        }
      }
    };
    
    optimizeSource();
  }, [source]);
  
  // Handle image load
  const handleLoad = () => {
    opacity.value = withTiming(1, { duration: transition });
    onLoad?.();
  };
  
  // Handle image error
  const handleError = () => {
    setHasError(true);
    onError?.();
  };
  
  // Animated styles
  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });
  
  // Determine image quality based on optimization settings and priority
  const imageQuality = shouldOptimize && priority !== 'high' ? 'low' : 'auto';
  
  return (
    <View style={[styles.container, style]}>
      {(isLoading || hasError) && placeholder && (
        <Image
          source={placeholder}
          style={StyleSheet.absoluteFill}
          contentFit={contentFit}
        />
      )}
      
      {hasError && !placeholder && (
        <View style={[StyleSheet.absoluteFill, styles.errorContainer]}>
          {/* Error placeholder */}
        </View>
      )}
      
      {!isLoading && !hasError && (
        <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
          <Image
            source={optimizedSource}
            style={StyleSheet.absoluteFill}
            contentFit={contentFit}
            onLoad={handleLoad}
            onError={handleError}
            cachePolicy={priority === 'high' ? 'memory-disk' : 'disk'}
            transition={transition}
            recyclingKey={typeof source === 'object' ? source.uri : undefined}
            contentPosition="center"
          />
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: colors.background.tertiary,
  },
  errorContainer: {
    backgroundColor: colors.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
