// src/screens/GameLobbyScreen.tsx - FIXED VERSION
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity,
  Alert
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useSelector, useDispatch } from 'react-redux';
import Animated, { 
  FadeIn, 
  SlideInUp,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing
} from 'react-native-reanimated';
import { RootState } from '../store';
import { startTestGame, addPlayer, setIsHost, updatePlayerReady } from '../store/slices/gameSlice';

export default function GameLobbyScreen() {
  const [copied, setCopied] = useState(false);
  const dispatch = useDispatch();
  
  // Get game state from Redux
  const { 
    gameId, 
    joinCode, 
    players, 
    isHost 
  } = useSelector((state: RootState) => state.game);
  
  const { user } = useSelector((state: RootState) => state.auth);
  
  // Animation values
  const pulseValue = useSharedValue(1);
  
  // Start pulse animation
  useEffect(() => {
    pulseValue.value = withRepeat(
      withTiming(1.1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  // Set up initial players and host status
  useEffect(() => {
    if (user && gameId) {
      // Add current user as a player
      dispatch(addPlayer({
        playerId: user.uid,
        displayName: user.displayName || 'You',
        isHost: true
      }));
      
      // Set as host
      dispatch(setIsHost(true));
      
      // Mark current user as ready automatically for testing
      dispatch(updatePlayerReady({
        playerId: user.uid,
        isReady: true
      }));
      
      // Add some mock players for demo
      setTimeout(() => {
        dispatch(addPlayer({
          playerId: 'demo_player_1',
          displayName: 'Alice',
          isHost: false
        }));
        // Auto-ready Alice after a short delay
        setTimeout(() => {
          dispatch(updatePlayerReady({
            playerId: 'demo_player_1',
            isReady: true
          }));
        }, 500);
      }, 1000);
      
      setTimeout(() => {
        dispatch(addPlayer({
          playerId: 'demo_player_2', 
          displayName: 'Bob',
          isHost: false
        }));
        // Auto-ready Bob after a short delay
        setTimeout(() => {
          dispatch(updatePlayerReady({
            playerId: 'demo_player_2',
            isReady: true
          }));
        }, 500);
      }, 2000);
    }
  }, [user, gameId, dispatch]);
  
  // Animated styles
  const pulseStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: pulseValue.value }]
    };
  });
  
  // Copy join code to clipboard
  const handleCopyCode = async () => {
    if (joinCode) {
      await Clipboard.setStringAsync(joinCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Toggle ready status for current user
  const handleToggleReady = () => {
    if (!user?.uid) return;
    
    const currentPlayer = players[user.uid];
    const newReadyStatus = !currentPlayer?.isReady;
    
    dispatch(updatePlayerReady({
      playerId: user.uid,
      isReady: newReadyStatus
    }));
    
    console.log('🔄 Ready status toggled:', newReadyStatus);
  };
  
  // Start the game (test version)
  const handleStartTestGame = () => {
    const playerCount = Object.keys(players).length;
    const playersArray = Object.values(players);
    const readyCount = playersArray.filter((p: any) => p.isReady).length;
    
    console.log('🎮 Start game check:', { playerCount, readyCount, players });
    
    // Need at least 2 ready players
    if (readyCount < 2) {
      Alert.alert(
        'Not Enough Ready Players',
        `Need at least 2 ready players to start. Currently ${readyCount} ready.`,
        [{ text: 'OK' }]
      );
      return;
    }

    // Always allow start if we have enough ready players
    Alert.alert(
      'Start Game?',
      `Ready to start with ${readyCount} players?`,
      [
        {
          text: 'Let\'s Go! 🚀',
          onPress: () => {
            console.log('🚀 Starting game with ready players...');
            // Force start the test game
            dispatch(startTestGame());
          }
        },
        {
          text: 'Wait',
          style: 'cancel'
        }
      ]
    );
  };

  // Check if current user is ready
  const isCurrentUserReady = user?.uid ? players[user.uid]?.isReady : false;
  const playerCount = Object.keys(players).length;
  const readyCount = Object.values(players).filter((p: any) => p.isReady).length;

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View 
        entering={FadeIn.duration(500)} 
        style={styles.header}
      >
        <Text style={styles.title}>Game Lobby</Text>
        {joinCode && (
          <Animated.View style={[styles.codeContainer, pulseStyle]}>
            <Text style={styles.codeLabel}>JOIN CODE</Text>
            <Text style={styles.codeText}>{joinCode}</Text>
            <TouchableOpacity
              style={styles.copyButton}
              onPress={handleCopyCode}
            >
              <Text style={styles.copyButtonText}>
                {copied ? '✅ Copied!' : '📋 Copy'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </Animated.View>
      
      <Animated.View 
        entering={SlideInUp.delay(300).duration(500)}
        style={styles.content}
      >
        <View style={styles.playersHeader}>
          <Text style={styles.playersTitle}>
            Players ({playerCount}/8)
          </Text>
          <Text style={styles.readyStatus}>
            {readyCount}/{playerCount} Ready
          </Text>
        </View>
        
        <View style={styles.playersList}>
          {Object.values(players).map((player: any) => (
            <Animated.View 
              key={player.id}
              entering={FadeIn.duration(500)}
              style={[
                styles.playerCard,
                player.isReady && styles.playerCardReady
              ]}
            >
              <View style={styles.playerInfo}>
                <Text style={styles.playerName}>
                  {player.displayName}
                  {player.isHost && ' 👑'}
                </Text>
                <View style={styles.playerStatusContainer}>
                  <Text style={[
                    styles.playerStatus,
                    player.isReady && styles.playerStatusReady
                  ]}>
                    {player.isReady ? '✅ Ready' : '⏳ Not Ready'}
                  </Text>
                </View>
              </View>
            </Animated.View>
          ))}
          
          {/* Show empty slots */}
          {Array.from({ length: Math.max(0, 4 - playerCount) }).map((_, index) => (
            <View key={`empty_${index}`} style={[styles.playerCard, styles.emptyPlayerCard]}>
              <Text style={styles.emptyPlayerText}>Waiting for player...</Text>
            </View>
          ))}
        </View>
      </Animated.View>
      
      <Animated.View 
        entering={FadeIn.delay(500).duration(500)}
        style={styles.footer}
      >
        {/* Ready Button for ALL Players (including host) */}
        {user?.uid && (
          <TouchableOpacity 
            style={[
              styles.readyButton,
              isCurrentUserReady && styles.readyButtonActive
            ]}
            onPress={handleToggleReady}
          >
            <Text style={[
              styles.readyButtonText,
              isCurrentUserReady && styles.readyButtonTextActive
            ]}>
              {isCurrentUserReady ? '✅ Ready!' : '⏳ Mark as Ready'}
            </Text>
          </TouchableOpacity>
        )}
        
        {/* Start Button for Host */}
        {isHost ? (
          <View style={styles.hostControls}>
            <TouchableOpacity 
              style={[
                styles.startButton,
                readyCount < 2 && styles.startButtonDisabled
              ]}
              onPress={handleStartTestGame}
            >
              <Text style={styles.startButtonText}>
                {readyCount < 2 
                  ? `🎮 Need 2+ Ready (${readyCount}/${playerCount})` 
                  : `🎮 Start Game (${readyCount}/${playerCount} ready)`}
              </Text>
            </TouchableOpacity>
            
            {/* Debug button - remove this later */}
            <TouchableOpacity 
              style={[styles.startButton, { backgroundColor: '#34C759' }]}
              onPress={() => {
                console.log('🧪 Debug: Force starting game...');
                dispatch(startTestGame());
              }}
            >
              <Text style={styles.startButtonText}>🧪 Debug: Force Start</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.waitingContainer}>
            <Text style={styles.waitingText}>
              Waiting for host to start the game...
            </Text>
          </View>
        )}
        
        <View style={styles.gameInfo}>
          <Text style={styles.gameInfoTitle}>🎯 How to Play</Text>
          <Text style={styles.gameInfoText}>
            • Get funny prompts{'\n'}
            • Create AI images with your selfie{'\n'}
            • Vote on the funniest results{'\n'}
            • Win points for votes!
          </Text>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    alignItems: 'center',
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
  },
  codeContainer: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderRadius: 15,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.3)',
    alignItems: 'center',
  },
  codeLabel: {
    color: '#FF3B30',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  codeText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    letterSpacing: 2,
  },
  copyButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  copyButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  playersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  playersTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  readyStatus: {
    color: '#34C759',
    fontSize: 16,
    fontWeight: '600',
  },
  playersList: {
    flex: 1,
  },
  playerCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  playerCardReady: {
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
    borderColor: 'rgba(52, 199, 89, 0.3)',
  },
  emptyPlayerCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderStyle: 'dashed',
  },
  playerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  playerName: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  playerStatusContainer: {
    alignItems: 'center',
  },
  playerStatus: {
    color: '#FF9500',
    fontSize: 14,
    fontWeight: '500',
  },
  playerStatusReady: {
    color: '#34C759',
  },
  emptyPlayerText: {
    color: '#666',
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  footer: {
    padding: 20,
    gap: 15,
  },
  readyButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
  },
  readyButtonActive: {
    backgroundColor: '#34C759',
  },
  readyButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  readyButtonTextActive: {
    color: 'white',
  },
  startButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
  },
  startButtonDisabled: {
    backgroundColor: '#666',
  },
  startButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  waitingContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  waitingText: {
    color: '#ccc',
    fontSize: 16,
    textAlign: 'center',
  },
  gameInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 15,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  gameInfoTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  gameInfoText: {
    color: '#ccc',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
  },
  hostControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
});