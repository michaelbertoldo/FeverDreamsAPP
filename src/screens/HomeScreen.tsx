// src/screens/HomeScreen.tsx - FIXED VERSION WITH GAME CREATION
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useDispatch } from 'react-redux';
import { GameCreationFlow } from '../components/GameCreationFlow';
import { startTestGame } from '../store/slices/gameSlice';

type HomeScreenNavigationProp = StackNavigationProp<any>;

const HomeScreen = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const dispatch = useDispatch();
  const [isPressed, setIsPressed] = useState(false);
  const [showGameCreation, setShowGameCreation] = useState(false);

  const handleStartPlaying = async () => {
    // Prevent multiple rapid button presses
    if (isPressed) {
      console.log('Button already pressed, ignoring...');
      return;
    }

    try {
      setIsPressed(true);
      console.log('✅ Create/Join game pressed');
      
      // Add a small delay to prevent accidental double taps
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Show game creation flow
      setShowGameCreation(true);
      
    } catch (error) {
      console.error('❌ Error starting game:', error);
    } finally {
      // Re-enable button after 1 second
      setTimeout(() => {
        setIsPressed(false);
      }, 1000);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>AI Party Game</Text>
      <Text style={styles.subtitle}>Ready to have some fun?</Text>
      
      <TouchableOpacity 
        style={[
          styles.button, 
          isPressed && styles.buttonPressed 
        ]} 
        onPress={handleStartPlaying}
        disabled={isPressed}
        activeOpacity={0.8}
      >
        {isPressed ? (
          <View style={styles.buttonContent}>
            <ActivityIndicator size="small" color="white" style={styles.spinner} />
            <Text style={styles.buttonText}>Starting...</Text>
          </View>
        ) : (
          <Text style={styles.buttonText}>Start Playing</Text>
        )}
      </TouchableOpacity>
      
      {/* Test Button for Development */}
      <TouchableOpacity 
        style={[styles.testButton, styles.button]} 
        onPress={() => {
          console.log('🧪 Test Game Flow pressed');
          dispatch(startTestGame());
        }}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>🧪 Test Game Flow</Text>
      </TouchableOpacity>
      
      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
          🎨 Create hilarious AI images{'\n'}
          🤳 Use your selfie{'\n'}
          🗳️ Vote on the funniest results{'\n'}
          🏆 Compete with friends
        </Text>
      </View>
      
      {/* Game Creation Modal */}
      <Modal
        visible={showGameCreation}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowGameCreation(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => setShowGameCreation(false)}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          
          <GameCreationFlow 
            onGameCreated={() => {
              setShowGameCreation(false);
              console.log('🎮 Game created, should navigate to GameLobby');
              // TODO: Navigation will be handled by the AppNavigator based on Redux state
            }}
          />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#ccc',
    marginBottom: 50,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    minWidth: 200,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  buttonPressed: {
    backgroundColor: '#CC2B20',
    transform: [{ scale: 0.98 }],
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  spinner: {
    marginRight: 8,
  },
  infoContainer: {
    marginTop: 50,
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  infoText: {
    color: '#ccc',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#000',
    padding: 20,
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  testButton: {
    backgroundColor: '#007AFF',
    marginTop: 15,
  },
});

export default HomeScreen;