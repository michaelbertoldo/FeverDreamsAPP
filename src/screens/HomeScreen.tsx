import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { RootState } from '../store';
import { createGame, joinGame } from '../store/slices/gameSlice';
// Local function to generate game codes
const generateGameCode = (): string => {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += letters[Math.floor(Math.random() * letters.length)];
  }
  return code;
};

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'MainTabs'>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const [joinCode, setJoinCode] = useState('');
  const [showJoinInput, setShowJoinInput] = useState(false);

  const handleCreateGame = () => {
    const gameCode = generateGameCode();
    const gameId = `game_${Date.now()}`;
    
    dispatch(createGame({ gameId, gameCode }));
    navigation.navigate('GameLobby', { gameCode });
  };

  const handleJoinGame = () => {
    if (joinCode.length !== 4) {
      Alert.alert('Invalid Code', 'Please enter a 4-letter game code');
      return;
    }
    
    const gameId = `game_${joinCode}`;
    dispatch(joinGame({ gameId, gameCode: joinCode.toUpperCase() }));
    navigation.navigate('GameLobby', { gameCode: joinCode.toUpperCase() });
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>AI Party Game 🎉</Text>
          <Text style={styles.subtitle}>Welcome back, {user?.displayName}!</Text>
        </View>

        {/* Game Options */}
        <View style={styles.gameOptions}>
          <TouchableOpacity style={styles.createButton} onPress={handleCreateGame}>
            <Ionicons name="add-circle" size={30} color="#FFF" />
            <Text style={styles.buttonText}>Create New Game</Text>
          </TouchableOpacity>

          {!showJoinInput ? (
            <TouchableOpacity 
              style={styles.joinButton} 
              onPress={() => setShowJoinInput(true)}
            >
              <Ionicons name="enter" size={30} color="#FF6B6B" />
              <Text style={styles.joinButtonText}>Join Game</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.joinInputContainer}>
              <TextInput
                style={styles.codeInput}
                placeholder="ABCD"
                placeholderTextColor="#666"
                value={joinCode}
                onChangeText={setJoinCode}
                maxLength={4}
                autoCapitalize="characters"
                autoCorrect={false}
              />
              <TouchableOpacity style={styles.goButton} onPress={handleJoinGame}>
                <Text style={styles.goButtonText}>GO</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* How to Play */}
        <View style={styles.howToPlay}>
          <Text style={styles.howToPlayTitle}>How to Play:</Text>
          <Text style={styles.howToPlayText}>
            1. Answer silly prompts with your funniest responses{'\n'}
            2. AI creates hilarious images with your face{'\n'}
            3. Everyone votes on the funniest image{'\n'}
            4. Most votes wins the round!
          </Text>
        </View>
      </KeyboardAvoidingView>
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
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 50,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#888',
  },
  gameOptions: {
    alignItems: 'center',
    gap: 20,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 30,
    gap: 10,
    width: '80%',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#FF6B6B',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 30,
    gap: 10,
    width: '80%',
    justifyContent: 'center',
  },
  joinButtonText: {
    color: '#FF6B6B',
    fontSize: 18,
    fontWeight: '600',
  },
  joinInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '80%',
  },
  codeInput: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingVertical: 15,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#FF6B6B',
  },
  goButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
  },
  goButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  howToPlay: {
    marginTop: 60,
    padding: 20,
    backgroundColor: '#1a1a1a',
    borderRadius: 15,
  },
  howToPlayTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginBottom: 10,
  },
  howToPlayText: {
    fontSize: 14,
    color: '#CCC',
    lineHeight: 22,
  },
});