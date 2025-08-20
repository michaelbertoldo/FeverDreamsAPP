// src/components/GameCreationFlow.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import Animated, { FadeIn, SlideInUp } from 'react-native-reanimated';
import { RootState } from '../store';
import { setGameId, setJoinCode } from '../store/slices/gameSlice';
import { useSocketStore } from '../services/socketService';

interface GameCreationFlowProps {
  onGameCreated?: () => void;
}

export const GameCreationFlow: React.FC<GameCreationFlowProps> = ({ onGameCreated }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [showJoinInput, setShowJoinInput] = useState(false);
  
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  
  // Use the socket store hook
  const { connect, createGame, joinGame, connected } = useSocketStore();

  const handleCreateGame = async () => {
    if (!user?.uid) {
      Alert.alert('Error', 'Please sign in first.');
      return;
    }

    try {
      setIsCreating(true);
      console.log('🎮 Creating new game...');
      
      // Connect to socket first if not connected
      if (!connected) {
        connect();
        // Wait a bit for connection
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Create the game using socket service
      createGame(user.displayName || 'Host', 8);
      
      console.log('✅ Game creation initiated');
      
      // The socket service will emit 'game-created' event
      // and update the store with gameCode and gameId
      // Navigation will be handled by the AppNavigator based on Redux state
      
    } catch (error) {
      console.error('❌ Error creating game:', error);
      Alert.alert('Error', 'Failed to create game. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinGame = async () => {
    if (!user?.uid) {
      Alert.alert('Error', 'Please sign in first.');
      return;
    }

    if (!joinCodeInput.trim()) {
      Alert.alert('Error', 'Please enter a join code.');
      return;
    }

    try {
      setIsJoining(true);
      console.log('🚪 Joining game with code:', joinCodeInput);
      
      // Connect to socket first if not connected
      if (!connected) {
        connect();
        // Wait a bit for connection
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Join the game using socket service
      joinGame(user.displayName || 'Player', joinCodeInput.trim().toUpperCase());
      
      console.log('✅ Game join initiated');
      
      // The socket service will emit 'game-joined' event
      // and update the store with gameCode and gameId
      // Navigation will be handled by the AppNavigator based on Redux state
      
    } catch (error) {
      console.error('❌ Error joining game:', error);
      Alert.alert('Error', 'Failed to join game. Please check the code and try again.');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeIn.duration(500)} style={styles.content}>
        <Text style={styles.title}>Ready to Play?</Text>
        <Text style={styles.subtitle}>Create a new game or join an existing one</Text>
        
        <Animated.View entering={SlideInUp.delay(200).duration(500)} style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.createButton]} 
            onPress={handleCreateGame}
            disabled={isCreating}
          >
            <Text style={styles.buttonText}>
              {isCreating ? 'Creating...' : '🎨 Create New Game'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.joinButton]} 
            onPress={() => setShowJoinInput(!showJoinInput)}
          >
            <Text style={styles.buttonText}>
              🚪 Join Game
            </Text>
          </TouchableOpacity>
        </Animated.View>
        
        {showJoinInput && (
          <Animated.View entering={FadeIn.duration(300)} style={styles.joinContainer}>
            <TextInput
              style={styles.joinInput}
              placeholder="Enter join code"
              placeholderTextColor="#999"
              value={joinCodeInput}
              onChangeText={setJoinCodeInput}
              autoCapitalize="characters"
              maxLength={6}
            />
            <TouchableOpacity 
              style={[styles.button, styles.submitButton]} 
              onPress={handleJoinGame}
              disabled={isJoining}
            >
              <Text style={styles.buttonText}>
                {isJoining ? 'Joining...' : 'Join'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}
        
        {/* Connection Status */}
        <View style={styles.connectionStatus}>
          <Text style={[styles.statusText, { color: connected ? '#4CAF50' : '#F44336' }]}>
            {connected ? '🟢 Connected' : '🔴 Disconnected'}
          </Text>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#ccc',
    marginBottom: 40,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    gap: 15,
  },
  button: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  createButton: {
    backgroundColor: '#FF3B30',
  },
  joinButton: {
    backgroundColor: '#007AFF',
  },
  submitButton: {
    backgroundColor: '#34C759',
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  joinContainer: {
    width: '100%',
    marginTop: 20,
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  joinInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 15,
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  connectionStatus: {
    marginTop: 20,
    padding: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statusText: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
