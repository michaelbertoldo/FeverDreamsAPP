// src/components/ImageGenerator.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { optimizeImage, cacheImage } from '../utils/imageOptimization';

interface ImageGeneratorProps {
  gameId: string;
  promptId: string;
  promptText: string;
  onImageGenerated: (imageUrl: string) => void;
}

export const ImageGenerator: React.FC<ImageGeneratorProps> = ({
  gameId,
  promptId,
  promptText,
  onImageGenerated
}) => {
  const [userPrompt, setUserPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Animation values
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);
  
  // Generate animated styles
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { rotate: `${rotation.value}deg` },
        { scale: scale.value }
      ]
    };
  });
  
  // Mock AI image generation function
  const generateAIImage = async (prompt: string): Promise<string> => {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // For now, return a placeholder image
      // TODO: Replace with actual AI service call (Replicate, etc.)
      const imageUrl = `https://picsum.photos/400/400?random=${Date.now()}`;
      
      // Cache and optimize the image
      const cachedUrl = await cacheImage(imageUrl);
      const optimizedUrl = await optimizeImage(cachedUrl);
      
      return optimizedUrl;
    } catch (error) {
      console.error('AI generation error:', error);
      throw error;
    }
  };
  
  // Handle prompt submission and image generation
  const handleGenerateImage = async () => {
    if (!userPrompt.trim()) {
      setError('Please enter a creative prompt first!');
      return;
    }
    
    try {
      setGenerating(true);
      setError(null);
      
      // Start animations
      rotation.value = withRepeat(withSequence(
        withSpring(-5),
        withSpring(5),
      ), -1, true);
      
      scale.value = withRepeat(withSequence(
        withSpring(1.05),
        withSpring(0.95),
      ), -1, true);
      
      // Generate the image
      const fullPrompt = `${promptText}: ${userPrompt}`;
      const imageUrl = await generateAIImage(fullPrompt);
      
      // Stop animations
      rotation.value = withSpring(0);
      scale.value = withSpring(1);
      
      // Set the generated image
      setGeneratedImage(imageUrl);
      
      // Call the callback
      onImageGenerated(imageUrl);
      
    } catch (err) {
      console.error('Image generation error:', err);
      setError('Failed to generate image. Please try again.');
      
      // Stop animations
      rotation.value = withSpring(0);
      scale.value = withSpring(1);
    } finally {
      setGenerating(false);
    }
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.promptTitle}>Game Prompt:</Text>
      <Text style={styles.promptText}>{promptText}</Text>
      
      <Text style={styles.instructionText}>
        Enter a creative description to blend with your selfie:
      </Text>
      
      <TextInput
        style={styles.input}
        value={userPrompt}
        onChangeText={setUserPrompt}
        placeholder="e.g., astronaut on the moon, superhero flying"
        placeholderTextColor="#666"
        multiline
        maxLength={100}
        editable={!generating}
      />
      
      {error && (
        <Animated.Text 
          entering={FadeIn.duration(300)}
          style={styles.errorText}
        >
          {error}
        </Animated.Text>
      )}
      
      {!generatedImage ? (
        <TouchableOpacity
          style={[styles.generateButton, generating && styles.generatingButton]}
          onPress={handleGenerateImage}
          disabled={generating || !userPrompt.trim()}
        >
          {generating ? (
            <View style={styles.generatingContainer}>
              <Animated.View style={animatedStyle}>
                <ActivityIndicator size="small" color="#FFF" />
              </Animated.View>
              <Text style={styles.buttonText}>Generating Magic...</Text>
            </View>
          ) : (
            <Text style={styles.buttonText}>Generate Funny Image!</Text>
          )}
        </TouchableOpacity>
      ) : (
        <Animated.View 
          entering={FadeIn.duration(500)}
          style={styles.resultContainer}
        >
          <Image
            source={{ uri: generatedImage }}
            style={styles.generatedImage}
            contentFit="cover"
            transition={500}
          />
          <TouchableOpacity
            style={styles.regenerateButton}
            onPress={() => {
              setGeneratedImage(null);
              setUserPrompt('');
            }}
          >
            <Text style={styles.regenerateText}>Try Another Idea</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
      
      <Text style={styles.tipText}>
        Tip: Be specific and creative! The funnier your description, the better the result.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#111',
    borderRadius: 12,
    marginVertical: 10,
  },
  promptTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF3B30',
    marginBottom: 4,
  },
  promptText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 16,
  },
  instructionText: {
    fontSize: 14,
    color: '#CCC',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#222',
    borderRadius: 8,
    padding: 12,
    color: 'white',
    fontSize: 16,
    marginBottom: 16,
    minHeight: 80,
  },
  errorText: {
    color: '#FF3B30',
    marginBottom: 16,
  },
  generateButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 25,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  generatingButton: {
    backgroundColor: '#992219',
  },
  generatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  resultContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  generatedImage: {
    width: 300,
    height: 300,
    borderRadius: 12,
    marginBottom: 16,
  },
  regenerateButton: {
    backgroundColor: '#333',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  regenerateText: {
    color: 'white',
    fontSize: 16,
  },
  tipText: {
    color: '#999',
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  }
});