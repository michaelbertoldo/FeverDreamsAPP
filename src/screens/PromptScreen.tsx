// src/screens/PromptScreen.tsx - FIXED VERSION
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Alert,
  SafeAreaView,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import Animated, { FadeIn, SlideInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { RootState } from '../store';
import { startVotingPhase, resetGame } from '../store/slices/gameSlice';

export default function PromptScreen() {
  const [userResponse, setUserResponse] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60); // 60 seconds to respond
  
  const navigation = useNavigation();
  const dispatch = useDispatch();
  
  const { currentPromptData, currentRound, status } = useSelector((state: RootState) => state.game);
  const { user } = useSelector((state: RootState) => state.auth);

  // Auto-navigate based on game status
  useEffect(() => {
    if (status === 'voting') {
      console.log('🎮 Game status changed to voting, navigating...');
      // Navigation will be handled by AppNavigator based on Redux state
    }
  }, [status, navigation]);

  // Timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleAutoSubmit = () => {
    if (!userResponse.trim()) {
      setUserResponse('I ran out of time!');
    }
    handleSubmit();
  };

  const handleBackPress = () => {
    Alert.alert(
      'Leave Game?',
      'Are you sure you want to leave the current game?',
      [
        {
          text: 'Stay',
          style: 'cancel'
        },
        {
          text: 'Leave Game',
          style: 'destructive',
          onPress: () => {
            dispatch(resetGame());
          }
        }
      ]
    );
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const handleSubmit = async () => {
    if (!userResponse.trim()) {
      Alert.alert('Error', 'Please enter a response first!');
      return;
    }

    // Dismiss keyboard before proceeding
    Keyboard.dismiss();

    try {
      setIsSubmitting(true);
      console.log('📝 Submitting response:', userResponse);
      
      // Simulate AI image generation delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // For demo purposes, create a mock image URL
      const mockImageUrl = `https://picsum.photos/400/400?random=${Date.now()}`;
      
      console.log('🎨 Mock image generated:', mockImageUrl);
      
      // Navigate to voting phase (simplified flow)
      Alert.alert(
        'Response Submitted!', 
        'Your AI image has been generated. Waiting for other players...',
        [
          {
            text: 'OK',
            onPress: () => {
              // For demo, go straight to voting
              dispatch(startVotingPhase());
            }
          }
        ]
      );
      
    } catch (error) {
      console.error('❌ Error submitting response:', error);
      Alert.alert('Error', 'Failed to submit response. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentPromptData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#FF3B30" />
          <Text style={styles.loadingText}>Loading prompt...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView 
          style={styles.keyboardContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          {/* Header with Back Button */}
          <Animated.View entering={FadeIn.duration(500)} style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            
            <View style={styles.headerCenter}>
              <Text style={styles.roundText}>Round {currentRound}</Text>
              <Text style={styles.timeText}>⏰ {timeLeft}s</Text>
            </View>
            
            <View style={styles.headerRight} />
          </Animated.View>

          <Animated.View entering={SlideInUp.delay(200).duration(500)} style={styles.promptContainer}>
            <Text style={styles.promptLabel}>YOUR PROMPT</Text>
            <Text style={styles.promptText}>{currentPromptData.promptText}</Text>
          </Animated.View>

          <Animated.View entering={SlideInUp.delay(400).duration(500)} style={styles.responseContainer}>
            <Text style={styles.responseLabel}>How would you complete this prompt?</Text>
            <TextInput
              style={styles.responseInput}
              placeholder="Enter your creative response..."
              placeholderTextColor="#666"
              value={userResponse}
              onChangeText={setUserResponse}
              multiline
              maxLength={200}
              editable={!isSubmitting}
              returnKeyType="done"
              onSubmitEditing={dismissKeyboard}
              blurOnSubmit={true}
            />
            <Text style={styles.charCount}>{userResponse.length}/200</Text>
          </Animated.View>

          <Animated.View entering={FadeIn.delay(600).duration(500)} style={styles.submitContainer}>
            <TouchableOpacity 
              style={[
                styles.submitButton,
                (!userResponse.trim() || isSubmitting) && styles.submitButtonDisabled
              ]}
              onPress={handleSubmit}
              disabled={!userResponse.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <View style={styles.submitContent}>
                  <ActivityIndicator size="small" color="white" style={styles.spinner} />
                  <Text style={styles.submitText}>Generating AI Image...</Text>
                </View>
              ) : (
                <Text style={styles.submitText}>🎨 Generate AI Image</Text>
              )}
            </TouchableOpacity>
          </Animated.View>

          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>
              💡 Be creative! Your response will be used to generate a funny AI image with your selfie.
            </Text>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  keyboardContainer: {
    flex: 1,
    padding: 20,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
    marginTop: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    paddingTop: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerRight: {
    width: 44, // To balance the layout
  },
  roundText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: 'bold',
  },
  timeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 2,
  },
  promptContainer: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.3)',
  },
  promptLabel: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  promptText: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 28,
  },
  responseContainer: {
    flex: 1,
    marginBottom: 20,
  },
  responseLabel: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  responseInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 15,
    color: 'white',
    fontSize: 16,
    minHeight: 100,
    maxHeight: 150,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    textAlignVertical: 'top',
  },
  charCount: {
    color: '#666',
    fontSize: 12,
    textAlign: 'right',
    marginTop: 5,
  },
  submitContainer: {
    marginBottom: 20,
  },
  submitButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  submitButtonDisabled: {
    backgroundColor: '#666',
    shadowOpacity: 0,
  },
  submitContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  submitText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  spinner: {
    marginRight: 10,
  },
  infoContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    padding: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  infoText: {
    color: '#ccc',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});