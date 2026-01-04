import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
  ScrollView,
  Modal,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { RootState } from '../store';
import { createGame, joinGame, setTestMode } from '../store/slices/gameSlice';
import { checkAIServiceHealth } from '../services/aiService';

type HomeNavigationProp = StackNavigationProp<any>;

export default function HomeScreen() {
  const [joinCode, setJoinCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [showCreateOptions, setShowCreateOptions] = useState(false);
  const [aiServiceStatus, setAIServiceStatus] = useState<boolean | null>(null);
  
  const navigation = useNavigation<HomeNavigationProp>();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const { status } = useSelector((state: RootState) => state.game);

  // Check AI service health on mount
  useEffect(() => {
    checkAIService();
  }, []);

  const checkAIService = async () => {
    try {
      const isHealthy = await checkAIServiceHealth();
      setAIServiceStatus(isHealthy);
    } catch (error) {
      console.error('Failed to check AI service:', error);
      setAIServiceStatus(false);
    }
  };

  const generateGameCode = (): string => {
    return Math.random().toString(36).substr(2, 6).toUpperCase();
  };

  const handleCreateGame = (testMode: 'disabled' | 'solo' | 'multiplayer' = 'disabled') => {
    const gameCode = generateGameCode();
    
    console.log('🎮 Creating game with test mode:', testMode);
    
    dispatch(createGame({ gameCode, testMode }));
    setShowCreateOptions(false);
    
    // Show appropriate alert based on test mode
    if (testMode === 'solo') {
      Alert.alert(
        'Solo Test Game Created! 🤖',
        `Game Code: ${gameCode}\n\nYou'll play with 3 AI players for testing. Perfect for trying out gameplay mechanics!`,
        [{ text: 'Start Testing', onPress: () => navigation.navigate('GameLobby') }]
      );
    } else if (testMode === 'multiplayer') {
      Alert.alert(
        'Multiplayer Test Game Created! 👥',
        `Game Code: ${gameCode}\n\nShare this code with friends to test multiplayer features. No AI players will be added.`,
        [{ text: 'Go to Lobby', onPress: () => navigation.navigate('GameLobby') }]
      );
    } else {
      Alert.alert(
        'Game Created! 🎉',
        `Game Code: ${gameCode}\n\nShare this code with friends to start playing!`,
        [{ text: 'Go to Lobby', onPress: () => navigation.navigate('GameLobby') }]
      );
    }
  };

  const handleJoinGame = () => {
    if (!joinCode.trim()) {
      Alert.alert('Error', 'Please enter a game code');
      return;
    }

    if (joinCode.length !== 6) {
      Alert.alert('Error', 'Game code must be 6 characters');
      return;
    }

    setIsJoining(true);
    dispatch(joinGame({ gameId: `game_${joinCode}`, gameCode: joinCode.toUpperCase() }));
    
    // Simulate joining process
    setTimeout(() => {
      setIsJoining(false);
      navigation.navigate('GameLobby');
    }, 1000);
  };

  const CreateOptionsModal = () => (
    <Modal
      visible={showCreateOptions}
      transparent
      animationType="fade"
      onRequestClose={() => setShowCreateOptions(false)}
    >
      <TouchableOpacity 
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setShowCreateOptions(false)}
      >
        <TouchableOpacity 
          style={styles.modalContent}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create Game</Text>
            <TouchableOpacity
              onPress={() => setShowCreateOptions(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* Normal Game */}
            <TouchableOpacity
              style={styles.gameTypeOption}
              onPress={() => handleCreateGame('disabled')}
            >
              <View style={styles.gameTypeIcon}>
                <Ionicons name="people" size={32} color="#4ECDC4" />
              </View>
              <View style={styles.gameTypeInfo}>
                <Text style={styles.gameTypeTitle}>Normal Game</Text>
                <Text style={styles.gameTypeDescription}>
                  Create a regular game for you and your friends. Share the code and play together!
                </Text>
              </View>
              <Ionicons name="arrow-forward" size={20} color="#666" />
            </TouchableOpacity>

            {/* Solo Test Mode */}
            <TouchableOpacity
              style={styles.gameTypeOption}
              onPress={() => handleCreateGame('solo')}
            >
              <View style={styles.gameTypeIcon}>
                <Ionicons name="flask" size={32} color="#FFD93D" />
              </View>
              <View style={styles.gameTypeInfo}>
                <Text style={styles.gameTypeTitle}>Solo Test Mode</Text>
                <Text style={styles.gameTypeDescription}>
                  Play with 3 AI players to test the game mechanics. Perfect for trying out prompts and seeing how the game works!
                </Text>
              </View>
              <View style={styles.testBadge}>
                <Text style={styles.testBadgeText}>🤖 +3 AI</Text>
              </View>
            </TouchableOpacity>

            {/* Multiplayer Test Mode */}
            <TouchableOpacity
              style={styles.gameTypeOption}
              onPress={() => handleCreateGame('multiplayer')}
            >
              <View style={styles.gameTypeIcon}>
                <Ionicons name="bug" size={32} color="#FF6B6B" />
              </View>
              <View style={styles.gameTypeInfo}>
                <Text style={styles.gameTypeTitle}>Multiplayer Test Mode</Text>
                <Text style={styles.gameTypeDescription}>
                  Test multiplayer features with friends. No AI players added - invite real people to join your test session.
                </Text>
              </View>
              <View style={styles.testBadge}>
                <Text style={styles.testBadgeText}>👥 Real</Text>
              </View>
            </TouchableOpacity>
                     </ScrollView>
         </TouchableOpacity>
       </TouchableOpacity>
     </Modal>
  );

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>FeverDreams</Text>
          <Text style={styles.subtitle}>AI Party Game</Text>
          
          {/* User info */}
          {user && (
            <View style={styles.userInfo}>
              <Ionicons name="person-circle" size={24} color="#4ECDC4" />
              <Text style={styles.userName}>Welcome, {user.displayName}!</Text>
            </View>
          )}
        </View>

        {/* AI Service Status */}
        <View style={styles.statusContainer}>
          <View style={[styles.statusItem, aiServiceStatus ? styles.statusGood : styles.statusBad]}>
            <Ionicons 
              name={aiServiceStatus ? "checkmark-circle" : "warning"} 
              size={20} 
              color={aiServiceStatus ? "#4ECDC4" : "#FFD93D"} 
            />
            <Text style={styles.statusText}>
              AI Service: {aiServiceStatus === null ? 'Checking...' : aiServiceStatus ? 'Online' : 'Offline'}
            </Text>
            <TouchableOpacity onPress={checkAIService} style={styles.refreshButton}>
              <Ionicons name="refresh" size={16} color="#666" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Main Actions */}
        <View style={styles.actionsContainer}>
          {/* Create Game Button */}
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => setShowCreateOptions(true)}
          >
            <Ionicons name="add-circle" size={24} color="#FFF" />
            <Text style={styles.primaryButtonText}>Create Game</Text>
          </TouchableOpacity>

          {/* Join Game Section */}
          <View style={styles.joinSection}>
            <Text style={styles.joinTitle}>Join Game</Text>
            <View style={styles.joinInputContainer}>
              <TextInput
                style={styles.joinInput}
                value={joinCode}
                onChangeText={setJoinCode}
                placeholder="Enter 6-digit code"
                placeholderTextColor="#666"
                maxLength={6}
                autoCapitalize="characters"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={[styles.joinButton, (!joinCode.trim() || isJoining) && styles.joinButtonDisabled]}
                onPress={handleJoinGame}
                disabled={!joinCode.trim() || isJoining}
              >
                {isJoining ? (
                  <Ionicons name="hourglass" size={20} color="#FFF" />
                ) : (
                  <Ionicons name="log-in" size={20} color="#FFF" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Debug Button - Only in development */}
        {__DEV__ && (
          <TouchableOpacity
            style={styles.debugButton}
            onPress={() => navigation.navigate('AIDebug')}
          >
            <Ionicons name="bug" size={20} color="#FFF" />
            <Text style={styles.debugButtonText}>🔧 Debug AI Generation</Text>
          </TouchableOpacity>
        )}

        {/* Game Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsTitle}>How to Play</Text>
          <View style={styles.instructionStep}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <Text style={styles.stepText}>Get a funny prompt and respond creatively</Text>
          </View>
          <View style={styles.instructionStep}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <Text style={styles.stepText}>AI creates hilarious images using your selfie</Text>
          </View>
          <View style={styles.instructionStep}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <Text style={styles.stepText}>Vote for the funniest images and win points!</Text>
          </View>
        </View>

        {/* Debug Info (only in development) */}
        {__DEV__ && (
          <View style={styles.debugContainer}>
            <Text style={styles.debugTitle}>Debug Info</Text>
            <Text style={styles.debugText}>Game Status: {status}</Text>
            <Text style={styles.debugText}>AI Service: {aiServiceStatus?.toString()}</Text>
          </View>
        )}
        </ScrollView>
      </SafeAreaView>

      <CreateOptionsModal />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A2E',
  },
  safeArea: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FF6B6B',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#4ECDC4',
    marginTop: 5,
    fontWeight: '600',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    backgroundColor: '#16213E',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
  },
  userName: {
    color: '#FFF',
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
  },
  statusContainer: {
    marginBottom: 30,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16213E',
    padding: 15,
    borderRadius: 10,
    borderLeftWidth: 4,
  },
  statusGood: {
    borderLeftColor: '#4ECDC4',
  },
  statusBad: {
    borderLeftColor: '#FFD93D',
  },
  statusText: {
    color: '#FFF',
    marginLeft: 10,
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  refreshButton: {
    padding: 5,
  },
  actionsContainer: {
    marginBottom: 40,
  },
  primaryButton: {
    backgroundColor: '#FF6B6B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 30,
    borderRadius: 15,
    marginBottom: 30,
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  joinSection: {
    backgroundColor: '#16213E',
    padding: 20,
    borderRadius: 15,
  },
  joinTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  joinInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  joinInput: {
    flex: 1,
    backgroundColor: '#1A1A2E',
    color: '#FFF',
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  joinButton: {
    backgroundColor: '#4ECDC4',
    padding: 15,
    borderRadius: 10,
  },
  joinButtonDisabled: {
    backgroundColor: '#666',
  },
  instructionsContainer: {
    backgroundColor: '#16213E',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
  },
  instructionsTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  instructionStep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  stepNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  stepNumberText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  stepText: {
    color: '#FFF',
    fontSize: 16,
    flex: 1,
    lineHeight: 22,
  },
  debugContainer: {
    backgroundColor: '#2A2A2A',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  debugTitle: {
    color: '#FFD93D',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  debugText: {
    color: '#CCC',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1A1A2E',
    borderRadius: 20,
    height: '80%',
    width: '90%',
    maxWidth: 400,
    marginTop: 60,
    marginBottom: 60,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#16213E',
  },
  modalTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  modalBody: {
    flex: 1,
    padding: 20,
    paddingTop: 30,
    paddingBottom: 30,
  },
  gameTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16213E',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
  },
  gameTypeIcon: {
    marginRight: 15,
  },
  gameTypeInfo: {
    flex: 1,
  },
  gameTypeTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  gameTypeDescription: {
    color: '#CCC',
    fontSize: 14,
    lineHeight: 20,
  },
  testBadge: {
    backgroundColor: '#FFD93D',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 10,
  },
  testBadgeText: {
    color: '#1A1A2E',
    fontSize: 12,
    fontWeight: 'bold',
  },
  debugButton: {
    backgroundColor: '#333',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#666',
  },
  debugButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});