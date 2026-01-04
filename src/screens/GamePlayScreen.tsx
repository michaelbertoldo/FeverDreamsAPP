import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { submitResponse, updatePlayers, startGame } from '../store/slices/gameSlice';
import { generateAIImage } from '../services/aiService';
import { Ionicons } from '@expo/vector-icons';
import { useGameFlow } from '../hooks/useGameFlow';
import { SafeContainer, SafeHeader } from '../components/SafeContainer';

export default function GamePlayScreen() {
  const insets = useSafeAreaInsets();
  const [userResponse, setUserResponse] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);

  const dispatch = useDispatch();
  const currentPrompt = useSelector((state: RootState) => state.game.currentPrompt);
  const currentRound = useSelector((state: RootState) => state.game.currentRound);
  const user = useSelector((state: RootState) => state.auth.user);
  const players = useSelector((state: RootState) => state.game.players);
  const submissions = useSelector((state: RootState) => state.game.submissions);
  const testMode = useSelector((state: RootState) => state.game.testMode);
  
  // Use the game flow hook
  const { shouldShowVoting, shouldShowRoundResults, shouldShowFinalResults, currentStatus } = useGameFlow();
  
  // Log status changes
  useEffect(() => {
    console.log('🔄 Game status changed to:', currentStatus);
  }, [currentStatus]);
  
  // Add mock players for testing based on test mode
  useEffect(() => {
    console.log('🎮 GamePlayScreen mounted, current state:', { 
      playersCount: players.length, 
      user: !!user, 
      currentStatus: currentStatus,
      currentPrompt: !!currentPrompt,
      testMode: testMode
    });
    
    if (players.length === 0 && user && testMode === 'solo') {
      console.log('🤖 Adding 3 AI players for solo test mode');
      const mockPlayers = [
        { id: user.id, name: user.displayName, score: 0, isHost: true },
        { id: 'mock1', name: 'AI Player 1', score: 0, isHost: false },
        { id: 'mock2', name: 'AI Player 2', score: 0, isHost: false },
        { id: 'mock3', name: 'AI Player 3', score: 0, isHost: false },
      ];
      dispatch(updatePlayers(mockPlayers));
    } else if (players.length === 0 && user && testMode === 'multiplayer') {
      console.log('👥 Multiplayer test mode - no AI players added');
      const userPlayer = { id: user.id, name: user.displayName, score: 0, isHost: true };
      dispatch(updatePlayers([userPlayer]));
    }
  }, [players.length, user, dispatch, currentStatus, currentPrompt, testMode]);
  
  // Auto-submit responses for mock players in solo test mode
  useEffect(() => {
    if (testMode === 'solo' && players.length > 0 && user && currentPrompt && !isGenerating) {
      const timer = setTimeout(() => {
        const mockResponses = [
          'turning into a potato whenever you sneeze',
          'making everyone around you hiccup uncontrollably',
          'summoning rain clouds that only rain on you',
          'making all food taste like expired yogurt'
        ];
        
        players.forEach((player, index) => {
          if (player.id !== user.id) {
            console.log(`🤖 AI player ${player.name} submitting response: ${mockResponses[index]}`);
            dispatch(submitResponse({
              promptResponse: mockResponses[index] || 'Something funny',
              imageUrl: `https://picsum.photos/400/400?random=${index}`,
              playerId: player.id,
              playerName: player.name,
              votes: 0,
            }));
          }
        });
      }, 2000); // Wait 2 seconds after prompt is shown
      
      return () => clearTimeout(timer);
    }
  }, [testMode, players.length, user, currentPrompt, isGenerating, dispatch]);

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

  const handleSubmit = async () => {
    if (!userResponse.trim()) {
      Alert.alert('Error', 'Please enter a response first!');
      return;
    }

    try {
      setIsGenerating(true);
      
      // Generate AI image with the full prompt template
      const imageUrl = await generateAIImage(
        userResponse, 
        user?.selfieUrl || '',
        currentPrompt?.text
      );
      
      // Submit response
      dispatch(submitResponse({
        promptResponse: userResponse,
        imageUrl,
        playerId: user?.id || '',
        playerName: user?.displayName || '',
        votes: 0,
      }));

      Alert.alert(
        'Response Submitted!',
        'Your AI image has been generated. Waiting for other players...',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error submitting response:', error);
      Alert.alert('Error', 'Failed to submit response. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!currentPrompt) {
    return (
      <SafeContainer backgroundColor="#000">
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#FF6B6B" />
          <Text style={styles.loadingText}>Loading prompt...</Text>
        </View>
      </SafeContainer>
    );
  }

  return (
    <SafeContainer backgroundColor="#000">
      <SafeHeader 
        title={`Round ${currentRound}`}
        onBackPress={() => {/* Handle back navigation */}}
        rightAction={{
          icon: "timer-outline",
          onPress: () => {}
        }}
      />
      
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top + 56}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
        <View style={styles.header}>
          <Text style={styles.timerText}>⏰ {timeLeft}s</Text>
          <Text style={styles.statusText}>Status: {currentStatus}</Text>
        </View>
        
        {/* Manual Start Game Button for Testing */}
        {currentStatus === 'lobby' && (
          <TouchableOpacity
            style={styles.startGameButton}
            onPress={() => {
              console.log('🚀 Manually starting game');
              dispatch(startGame());
            }}
          >
            <Text style={styles.startGameButtonText}>🎮 Start Game</Text>
          </TouchableOpacity>
        )}

        <View style={styles.promptContainer}>
          <Text style={styles.promptLabel}>🎨 IMAGE PROMPT</Text>
          <Text style={styles.promptText}>{currentPrompt.text}</Text>
        </View>

        <View style={styles.responseContainer}>
          <Text style={styles.responseLabel}>Describe the image you want AI to create:</Text>
          <TextInput
            style={styles.responseInput}
            placeholder="Enter your creative response..."
            placeholderTextColor="#666"
            value={userResponse}
            onChangeText={setUserResponse}
            multiline
            maxLength={200}
            editable={!isGenerating}
          />
          <Text style={styles.charCount}>{userResponse.length}/200</Text>
        </View>

        <View style={styles.bottomSection}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              (!userResponse.trim() || isGenerating) && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!userResponse.trim() || isGenerating}
          >
            {isGenerating ? (
              <View style={styles.submitContent}>
                <ActivityIndicator size="small" color="white" />
                <Text style={styles.submitText}>Generating AI Image...</Text>
              </View>
            ) : (
              <Text style={styles.submitText}>🎨 Generate AI Image</Text>
            )}
          </TouchableOpacity>

          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>
              💡 Be creative! Describe the funny image you want AI to create. 
              Your selfie will be incorporated into the scene!
            </Text>
          </View>
        </View>
        
        {/* Debug Info */}
        {__DEV__ && (
          <View style={styles.debugContainer}>
            <Text style={styles.debugText}>Players: {players.length}</Text>
            <Text style={styles.debugText}>Submissions: {submissions?.length || 0}</Text>
            <Text style={styles.debugText}>Status: {currentStatus}</Text>
            <Text style={styles.debugText}>Test Mode: {testMode}</Text>
          </View>
        )}
        <View style={{ height: insets.bottom + 24 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeContainer>
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
    paddingTop: 0,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
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
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  roundText: {
    color: '#FF6B6B',
    fontSize: 20,
    fontWeight: 'bold',
  },
  timerText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statusText: {
    color: '#888',
    fontSize: 14,
    marginTop: 5,
  },
  promptContainer: {
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.3)',
  },
  promptLabel: {
    color: '#FF6B6B',
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
    minHeight: 120,
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
  submitButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 20,
  },
  submitButtonDisabled: {
    backgroundColor: '#666',
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
  debugContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    padding: 15,
    marginTop: 20,
  },
  debugText: {
    color: '#888',
    fontSize: 12,
    marginBottom: 5,
  },
  startGameButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 20,
    alignSelf: 'center',
  },
  startGameButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomSection: {
    marginTop: 20,
    gap: 15,
  },
});
