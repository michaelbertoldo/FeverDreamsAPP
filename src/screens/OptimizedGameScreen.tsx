// src/screens/OptimizedGameScreen.tsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Platform,
  UIManager,
  LayoutAnimation,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { OptimizedImage } from '../components/OptimizedImage';
import { AnimatedButton } from '../components/ui/AnimatedButton';
import { generateOptimizedAIImage } from '../services/optimizedAIService';
import { 
  measureTask, 
  measureRender, 
  runAfterInteractions,
  shouldApplyPerformanceOptimizations,
} from '../services/performanceMonitoring';
import { RootState } from '../store';
import { colors, typography, spacing } from '../theme';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function OptimizedGameScreen() {
  // Component render measurement
  const renderStartTime = performance.now();
  
  // State
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [shouldReduceAnimations, setShouldReduceAnimations] = useState(false);
  
  // Redux
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const { gameState } = useSelector((state: RootState) => state.game);
  
  // Navigation
  const navigation = useNavigation();
  
  // Refs
  const inputRef = useRef(null);
  const isFirstRender = useRef(true);
  
  // Animation values
  const cardScale = useSharedValue(1);
  const promptOpacity = useSharedValue(1);
  
  // Check performance optimizations
  useEffect(() => {
    const checkOptimizations = async () => {
      const shouldOptimize = await shouldApplyPerformanceOptimizations();
      setShouldReduceAnimations(shouldOptimize);
    };
    
    checkOptimizations();
  }, []);
  
  // Set up game state
  useEffect(() => {
    // Measure this task
    measureTask('game_setup', async () => {
      // Get current prompt from game state
      if (gameState?.currentPrompt) {
        setCurrentPrompt(gameState.currentPrompt);
        
        // Animate prompt in
        if (!shouldReduceAnimations) {
          promptOpacity.value = withTiming(1, { duration: 500 });
          cardScale.value = withTiming(1, { duration: 300 });
        }
      }
    });
    
    // Measure first render
    if (isFirstRender.current) {
      isFirstRender.current = false;
      measureRender('OptimizedGameScreen', renderStartTime);
    }
  }, [gameState?.currentPrompt]);
  
  // Handle image generation
  const handleGenerateImage = async () => {
    if (!userInput.trim() || !user?.uid) return;
    
    try {
      setIsGenerating(true);
      
      // Use layout animation for smoother transitions
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      
      // Generate image with optimized service
      const result = await measureTask('ai_image_generation', () => 
        generateOptimizedAIImage(
          userInput,
          user.uid,
          {
            prioritizeSpeed: shouldReduceAnimations,
            forceHighQuality: false,
            useCache: true,
          }
        )
      );
      
      if (result.success && result.imageUrl) {
        setGeneratedImage(result.imageUrl);
        
        // Animate card
        if (!shouldReduceAnimations) {
          cardScale.value = withTiming(1.05, { duration: 300 });
          setTimeout(() => {
            cardScale.value = withTiming(1, { duration: 300 });
          }, 300);
        }
        
        // Submit to game state
        dispatch(submitImageToGame({
          promptId: gameState?.currentPromptId,
          imageUrl: result.imageUrl,
          promptText: userInput,
        }));
      } else {
        // Handle error
        console.error('Image generation failed:', result.error);
        // Show error UI
      }
    } catch (error) {
      console.error('Error generating image:', error);
      // Show error UI
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Memoize heavy computations
  const promptDisplay = useMemo(() => {
    return `${currentPrompt}`;
  }, [currentPrompt]);
  
  // Animated styles
  const cardStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: cardScale.value }],
    };
  });
  
  const promptStyle = useAnimatedStyle(() => {
    return {
      opacity: promptOpacity.value,
    };
  });
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Animated.View style={[styles.promptCard, cardStyle]}>
          <Animated.Text style={[styles.promptTitle, promptStyle]}>
            Your Prompt
          </Animated.Text>
          
          <Animated.Text style={[styles.promptText, promptStyle]}>
            {promptDisplay}
          </Animated.Text>
        </Animated.View>
        
        {/* Input field for user prompt */}
        {/* ... */}
        
        {/* Generate button */}
        <AnimatedButton
          text="Generate Image"
          variant="primary"
          size="large"
          onPress={handleGenerateImage}
          loading={isGenerating}
          disabled={isGenerating || !userInput.trim()}
          style={styles.generateButton}
          useReducedAnimations={shouldReduceAnimations}
        />
        
        {/* Generated image display */}
        {generatedImage ? (
          <Animated.View
            entering={shouldReduceAnimations ? undefined : FadeIn.duration(500)}
            exiting={shouldReduceAnimations ? undefined : FadeOut.duration(300)}
            style={styles.imageContainer}
          >
            <OptimizedImage
              source={{ uri: generatedImage }}
              style={styles.generatedImage}
              contentFit="cover"
              transition={shouldReduceAnimations ? 0 : 300}
              priority="high"
            />
          </Animated.View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  promptCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  promptTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: 'bold',
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  promptText: {
    fontSize: typography.fontSize.xl,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  generateButton: {
    marginVertical: spacing.xl,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: spacing.xl,
  },
  generatedImage: {
    width: '100%',
    height: '100%',
  },
});
