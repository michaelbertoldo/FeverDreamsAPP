// src/screens/GameLobbyScreen.tsx - FIXED VERSION
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  Share,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { RootState } from '../store';
import { updatePlayers, startGame, Player } from '../store/slices/gameSlice';

type GameLobbyNavigationProp = StackNavigationProp<RootStackParamList, 'GameLobby'>;

export default function GameLobbyScreen() {
  const navigation = useNavigation<GameLobbyNavigationProp>();
  const route = useRoute();
  const dispatch = useDispatch();
  const { gameCode, players, isHost } = useSelector((state: RootState) => state.game);
  const { user } = useSelector((state: RootState) => state.auth);
  
  // Simulate players joining (in production, this would come from Socket.IO)
  useEffect(() => {
    const mockPlayers: Player[] = [
      { id: user?.id || '1', name: user?.displayName || 'You', score: 0, isHost: true },
    ];
    dispatch(updatePlayers(mockPlayers));
    
    // Simulate other players joining
    const timer = setTimeout(() => {
      const updatedPlayers = [
        ...mockPlayers,
        { id: '2', name: 'Player 2', score: 0, isHost: false },
        { id: '3', name: 'Player 3', score: 0, isHost: false },
      ];
      dispatch(updatePlayers(updatedPlayers));
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);

  const handleShareCode = async () => {
    try {
      await Share.share({
        message: `Join my AI Party Game! Room code: ${gameCode}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleStartGame = () => {
    dispatch(startGame());
    // Navigation will be handled automatically by GameNavigator based on Redux state
    console.log('🚀 Game started, GameNavigator will show GamePlay screen');
  };

  const renderPlayer = ({ item }: { item: Player }) => (
    <View style={styles.playerItem}>
      <View style={styles.playerAvatar}>
        <Text style={styles.avatarText}>{item.name[0]}</Text>
      </View>
      <Text style={styles.playerName}>{item.name}</Text>
      {item.isHost && (
        <View style={styles.hostBadge}>
          <Text style={styles.hostText}>HOST</Text>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Game Lobby</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.codeContainer}>
        <Text style={styles.codeLabel}>Room Code</Text>
        <Text style={styles.gameCode}>{gameCode}</Text>
        <TouchableOpacity style={styles.shareButton} onPress={handleShareCode}>
          <Ionicons name="share-social" size={20} color="#FFF" />
          <Text style={styles.shareText}>Share Code</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.playersSection}>
        <Text style={styles.sectionTitle}>Players ({players.length}/8)</Text>
        <FlatList
          data={players}
          renderItem={renderPlayer}
          keyExtractor={(item) => item.id}
          style={styles.playersList}
        />
      </View>

      {isHost && (
        <TouchableOpacity
          style={[styles.startButton, players.length < 3 && styles.disabledButton]}
          onPress={handleStartGame}
          disabled={players.length < 3}
        >
          <Text style={styles.startButtonText}>
            {players.length < 3 ? `Need ${3 - players.length} more players` : 'Start Game'}
          </Text>
        </TouchableOpacity>
      )}

      {!isHost && (
        <View style={styles.waitingContainer}>
          <Text style={styles.waitingText}>Waiting for host to start...</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  codeContainer: {
    alignItems: 'center',
    padding: 20,
    margin: 20,
    backgroundColor: '#1a1a1a',
    borderRadius: 15,
  },
  codeLabel: {
    fontSize: 16,
    color: '#888',
    marginBottom: 10,
  },
  gameCode: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FF6B6B',
    letterSpacing: 8,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 15,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#333',
    borderRadius: 20,
  },
  shareText: {
    color: '#FFF',
    fontSize: 14,
  },
  playersSection: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 15,
  },
  playersList: {
    flex: 1,
  },
  playerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    marginBottom: 10,
  },
  playerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  playerName: {
    flex: 1,
    fontSize: 16,
    color: '#FFF',
  },
  hostBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  hostText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000',
  },
  startButton: {
    backgroundColor: '#FF6B6B',
    margin: 20,
    padding: 18,
    borderRadius: 30,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#444',
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  waitingContainer: {
    margin: 20,
    padding: 18,
    alignItems: 'center',
  },
  waitingText: {
    fontSize: 16,
    color: '#888',
  },
});