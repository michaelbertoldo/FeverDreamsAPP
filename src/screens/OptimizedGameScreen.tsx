// src/screens/OptimizedGameScreen.tsx - COMPLETELY FIXED VERSION
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Platform,
  UIManager,
  LayoutAnimation,
  TextInput,
  TouchableOpacity,
  Alert,
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
import { Image } from 'expo-image';
import { RootState, AppDispatch } from '../store';
import { submitImageToGame } from '../services/gameService';

// FIX: Create animated components PROPERLY after all imports
const AnimatedView = Animated.createAnimatedComponent(View);
const AnimatedText = Animated.createAnimatedComponent(Text);

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Mock functions for missing services
const generateOptimizedAIImage = async (
  prompt: string,
  userId: string,
  options: any
): Promise<{ success: boolean; imageUrl?: string; error?: string }> => {
  // Mock AI image generation - replace with actual service
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        imageUrl: `https://picsum.photos/400/400?random=${Date.now()}`,
      });
    }, 2000);
  });
};

const measureTask = async (taskName: string, task: () => Promise<any> | any) => {
  console.log(`Starting task: ${taskName}`);
  try {
    const result = await task();
    console.log(`Completed task: ${taskName}`);
    return result;
  } catch (error) {
    console.error(`Task failed: ${taskName}`, error);
    throw error;
  }
};

const measureRender = (componentName: string, startTime: number) => {
  const renderTime = performance.now() - startTime;
  console.log(`${componentName} render time: ${renderTime}ms`);
};

const shouldApplyPerformanceOptimizations = async (): Promise<boolean> => {
  // Mock performance check - replace with actual implementation
  return false; // For now, don't reduce animations
};

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
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  
  // Fix gameState selector to match your actual game slice structure
  const { 
    currentPromptData,
    status: gameStatus,
    gameId 
  } = useSelector((state: RootState) => state.game);
  
  // Navigation
  const navigation = useNavigation();
  
  // Refs
  const inputRef = useRef<TextInput>(null);
  const isFirstRender = useRef(true);
  
  // Animation values
  const cardScale = useSharedValue(1);
  const promptOpacity = useSharedValue(1);
  
  // Check performance optimizations
  useEffect(() => {
    const checkOptimizations = async () => {
      try {
        const shouldOptimize = await shouldApplyPerformanceOptimizations();
        setShouldReduceAnimations(shouldOptimize);
      } catch (error) {
        console.error('Performance check failed:', error);
        setShouldReduceAnimations(false);
      }
    };
    
    checkOptimizations();
  }, []);
  
  // Set up game state
  useEffect(() => {
    // Measure this task
    measureTask('game_setup', async () => {
      // Use correct game state structure
      if (currentPromptData?.promptText) {
        setCurrentPrompt(currentPromptData.promptText);
        
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
  }, [currentPromptData?.promptText, shouldReduceAnimations, promptOpacity, cardScale]);
  
  // Handle image generation
  const handleGenerateImage = async () => {
    if (!userInput.trim()) {
      Alert.alert('Error', 'Please enter a prompt.');
      return;
    }
    
    if (!user?.uid) {
      Alert.alert('Error', 'Please sign in first.');
      return;
    }
    
    try {
      setIsGenerating(true);
      
      // Use layout animation for smoother transitions
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      
      // Generate image with optimized service
      const result = await measureTask('ai_image_generation', () => 
        generateOptimizedAIImage(
          userInput,
          user.uid!,
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
        
        // Submit to game if we have the required data
        if (gameId && currentPromptData?.promptId) {
          try {
            await submitImageToGame(gameId, currentPromptData.promptId, result.imageUrl);
            Alert.alert('Success!', 'Your image has been submitted to the game!');
          } catch (submitError) {
            console.error('Failed to submit image to game:', submitError);
            Alert.alert('Warning', 'Image generated but failed to submit to game. You can try again.');
          }
        } else {
          console.log('Missing game data for submission:', { gameId, promptId: currentPromptData?.promptId });
          Alert.alert('Success!', 'Image generated! (Demo mode - no game submission)');
        }
      } else {
        // Handle error
        console.error('Image generation failed:', result.error);
        Alert.alert('Error', 'Failed to generate image. Please try again.');
      }
    } catch (error) {
      console.error('Error generating image:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Memoize heavy computations
  const promptDisplay = useMemo(() => {
    return currentPrompt || 'Waiting for prompt...';
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
        <AnimatedView style={[styles.promptCard, cardStyle]}>
          <AnimatedText style={[styles.promptTitle, promptStyle]}>
            <Text>Your Prompt</Text>
          </AnimatedText>
          
          <AnimatedText style={[styles.promptText, promptStyle]}>
            {promptDisplay}
          </AnimatedText>
        </AnimatedView>
        
        {/* Input field for user prompt */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Enter your creative twist:</Text>
          <TextInput
            ref={inputRef}
            style={styles.textInput}
            placeholder="Add your own twist to this prompt..."
            placeholderTextColor="#666"
            value={userInput}
            onChangeText={setUserInput}
            multiline
            numberOfLines={3}
            maxLength={200}
          />
          <Text style={styles.characterCount}>{userInput.length}/200</Text>
        </View>
        
        {/* Generate button */}
        <TouchableOpacity
          style={[
            styles.generateButton,
            (isGenerating || !userInput.trim()) && styles.generateButtonDisabled
          ]}
          onPress={handleGenerateImage}
          disabled={isGenerating || !userInput.trim()}
        >
          <Text style={styles.generateButtonText}>
            {isGenerating ? 'Generating...' : 'Generate Image'}
          </Text>
        </TouchableOpacity>
        
        {/* Generated image display */}
        {generatedImage ? (
          <AnimatedView
            entering={shouldReduceAnimations ? undefined : FadeIn.duration(500)}
            exiting={shouldReduceAnimations ? undefined : FadeOut.duration(300)}
            style={styles.imageContainer}
          >
            <Image
              source={{ uri: generatedImage }}
              style={styles.generatedImage}
              contentFit="cover"
              transition={shouldReduceAnimations ? 0 : 300}
              priority="high"
            />
          </AnimatedView>
        ) : null}
        
        {/* Status indicator */}
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>
            Game Status: {gameStatus || 'Unknown'}
          </Text>
          {currentPromptData?.promptId && (
            <Text style={styles.promptIdText}>
              Prompt ID: {currentPromptData.promptId}
            </Text>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  promptCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 24,
    marginBottom: 32,
  },
  promptTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#EBEBF5',
    marginBottom: 8,
  },
  promptText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    color: '#EBEBF5',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 16,
    color: '#FFFFFF',
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  characterCount: {
    textAlign: 'right',
    color: '#8E8E93',
    fontSize: 12,
    marginTop: 4,
  },
  generateButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
    marginVertical: 32,
  },
  generateButtonDisabled: {
    backgroundColor: '#666',
  },
  generateButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 32,
  },
  generatedImage: {
    width: '100%',
    height: '100%',
  },
  statusContainer: {
    padding: 16,
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
  },
  statusText: {
    color: '#EBEBF5',
    fontSize: 14,
  },
  promptIdText: {
    color: '#8E8E93',
    fontSize: 12,
    marginTop: 4,
  },
});