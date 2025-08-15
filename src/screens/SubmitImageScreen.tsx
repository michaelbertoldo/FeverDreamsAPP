// src/screens/SubmitImageScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useDispatch, useSelector } from 'react-redux';
import { ImageGenerator } from '../components/ImageGenerator';
import { submitImageToGame } from '../services/gameService';
import { RootState } from '../store';
import Animated, { 
  FadeIn, 
  SlideInRight
} from 'react-native-reanimated';

// Define the navigation param types
type GameStackParamList = {
  SubmitImage: {
    gameId: string;
    promptId: string;
    promptText: string;
  };
  WaitingForVotes: {
    gameId: string;
  };
  Profile: undefined;
  GameLobby: undefined;
};

type SubmitImageScreenNavigationProp = StackNavigationProp<GameStackParamList, 'SubmitImage'>;
type SubmitImageScreenRouteProp = RouteProp<GameStackParamList, 'SubmitImage'>;

export default function SubmitImageScreen() {
  const [submitting, setSubmitting] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const navigation = useNavigation<SubmitImageScreenNavigationProp>();
  const route = useRoute<SubmitImageScreenRouteProp>();
  const dispatch = useDispatch();
  
  // Get game data from route params with fallbacks
  const { gameId, promptId, promptText } = route.params || {
    gameId: 'demo-game',
    promptId: 'demo-prompt',
    promptText: 'Create a funny image!'
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
      
      // Show success message
      Alert.alert(
        'Success!',
        'Your image has been submitted!',
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate to waiting screen or back to lobby
              try {
                navigation.navigate('WaitingForVotes', { gameId });
              } catch (navError) {
                console.log('WaitingForVotes screen not available, going to lobby');
                // Fallback navigation
                navigation.navigate('GameLobby');
              }
            }
          }
        ]
      );
      
    } catch (err) {
      console.error('Submission error:', err);
      setError('Failed to submit your image. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Alternative navigation function for when WaitingForVotes isn't available
  const handleAlternativeNavigation = () => {
    Alert.alert(
      'Image Submitted!',
      'Your funny image has been submitted to the game.',
      [
        {
          text: 'Continue',
          onPress: () => {
            // Navigate back to main app or profile for now
            navigation.navigate('Profile');
          }
        }
      ]
    );
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
          
          {/* Alternative button for demo purposes */}
          <TouchableOpacity
            style={styles.alternativeButton}
            onPress={handleAlternativeNavigation}
          >
            <Text style={styles.alternativeText}>
              Submit & Continue (Demo)
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
    marginBottom: 10,
  },
  submittingButton: {
    backgroundColor: '#2A7A39',
  },
  submitText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  alternativeButton: {
    backgroundColor: '#FF9500',
    borderRadius: 25,
    paddingVertical: 12,
    alignItems: 'center',
  },
  alternativeText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#FF3B30',
    textAlign: 'center',
    marginTop: 16,
    fontSize: 16,
  }
});