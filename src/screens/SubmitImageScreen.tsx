// src/screens/SubmitImageScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { ImageGenerator } from '../components/ImageGenerator';
import { submitImageToGame } from '../services/gameService';
import { RootState } from '../store';
import Animated, { 
  FadeIn, 
  SlideInRight,
  SlideOutLeft
} from 'react-native-reanimated';

export default function SubmitImageScreen() {
  const [submitting, setSubmitting] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();
  
  // Get game data from route params
  const { gameId, promptId, promptText } = route.params as {
    gameId: string;
    promptId: string;
    promptText: string;
  };
  
  // Handle image generation completion
  const handleImageGenerated = (imageUrl: string) => {
    setGeneratedImageUrl(imageUrl);
  };
  
  // Handle submission to game
  const handleSubmit = async () => {
    if (!generatedImageUrl) {
      setError('Please generate an image first!');
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      // Submit the image to the game
      await submitImageToGame(gameId, promptId, generatedImageUrl);
      
      // Navigate to waiting screen
      navigation.navigate('WaitingForVotes', { gameId });
    } catch (err) {
      console.error('Submission error:', err);
      setError('Failed to submit your image. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <Animated.View 
        entering={FadeIn.duration(500)} 
        style={styles.header}
      >
        <Text style={styles.title}>Create Your Funny Image</Text>
        <Text style={styles.subtitle}>
          Be creative! Other players will vote on the results.
        </Text>
      </Animated.View>
      
      <Animated.View 
        entering={SlideInRight.duration(500)}
        style={styles.generatorContainer}
      >
        <ImageGenerator
          gameId={gameId}
          promptId={promptId}
          promptText={promptText}
          onImageGenerated={handleImageGenerated}
        />
      </Animated.View>
      
      {generatedImageUrl && (
        <Animated.View 
          entering={FadeIn.delay(300).duration(500)}
          style={styles.submitContainer}
        >
          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.submittingButton]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            <Text style={styles.submitText}>
              {submitting ? 'Submitting...' : 'Submit This Masterpiece!'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      )}
      
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 16,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#CCC',
  },
  generatorContainer: {
    flex: 1,
  },
  submitContainer: {
    marginVertical: 20,
  },
  submitButton: {
    backgroundColor: '#4CD964',
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submittingButton: {
    backgroundColor: '#2A7A39',
  },
  submitText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#FF3B30',
    textAlign: 'center',
    marginTop: 16,
    fontSize: 16,
  }
});
