import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Image, Alert } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import Animated, { FadeIn, SlideInUp, ZoomIn, useSharedValue, useAnimatedStyle, withSpring, withSequence } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { RootState } from '../store';
import { endGame } from '../store/slices/gameSlice';

// Mock final results data
const MOCK_FINAL_RESULTS = [
  { id: 'player_1', name: 'Player 1', score: 15, place: 1, imageUrl: 'https://picsum.photos/300/300?random=1' },
  { id: 'player_2', name: 'Player 2', score: 12, place: 2, imageUrl: 'https://picsum.photos/300/300?random=2' },
  { id: 'player_3', name: 'Player 3', score: 8, place: 3, imageUrl: 'https://picsum.photos/300/300?random=3' },
  { id: 'player_4', name: 'Player 4', score: 5, place: 4, imageUrl: 'https://picsum.photos/300/300?random=4' },
];

export default function FinalResultsScreen() {
  const [showConfetti, setShowConfetti] = useState(false);
  const dispatch = useDispatch();
  
  const { players, currentRound } = useSelector((state: RootState) => state.game);
  
  // Animation values
  const crownScale = useSharedValue(0);
  const winnerScale = useSharedValue(0);
  
  useEffect(() => {
    // Trigger confetti animation
    setShowConfetti(true);
    
    // Animate crown and winner
    crownScale.value = withSequence(
      withSpring(1.2, { damping: 10, stiffness: 200 }),
      withSpring(1, { damping: 10, stiffness: 200 })
    );
    
    winnerScale.value = withSpring(1.1, { damping: 8, stiffness: 150 });
  }, []);

  const crownStyle = useAnimatedStyle(() => ({
    transform: [{ scale: crownScale.value }]
  }));

  const winnerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: winnerScale.value }]
  }));

  const getPlaceEmoji = (place: number) => {
    switch (place) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return '🏆';
    }
  };

  const getPlaceColor = (place: number) => {
    switch (place) {
      case 1: return '#FFD700';
      case 2: return '#C0C0C0';
      case 3: return '#CD7F32';
      default: return '#666';
    }
  };

  const handlePlayAgain = () => {
    Alert.alert(
      'Play Again?',
      'Start a new game with the same players?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Yes!', onPress: () => {
          console.log('🎮 Starting new game...');
          // TODO: Implement new game logic
        }}
      ]
    );
  };

  const handleBackToHome = () => {
    console.log('🏠 Going back to home...');
    dispatch(endGame());
  };

  const winner = MOCK_FINAL_RESULTS[0];

  return (
    <SafeAreaView style={styles.container}>
      {showConfetti && (
        <View style={styles.confettiContainer}>
          <Text style={styles.confettiText}>🎉🎊🎈</Text>
        </View>
      )}
      
      {/* Header */}
      <Animated.View entering={FadeIn.duration(500)} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackToHome}>
          <Ionicons name="close-circle" size={28} color="#ccc" />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.roundText}>Game Complete!</Text>
          <Text style={styles.title}>🏆 Final Results</Text>
        </View>
        
        <View style={styles.headerRight} />
      </Animated.View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Winner Announcement */}
        <Animated.View entering={SlideInUp.delay(200).duration(500)} style={styles.winnerContainer}>
          <Animated.View style={[styles.crown, crownStyle]}>
            <Text style={styles.crownText}>👑</Text>
          </Animated.View>
          
          <Animated.View style={[styles.winnerCard, winnerStyle]}>
            <Image source={{ uri: winner.imageUrl }} style={styles.winnerImage} />
            <Text style={styles.winnerName}>{winner.name}</Text>
            <Text style={styles.winnerScore}>{winner.score} points</Text>
            <Text style={styles.winnerTitle}>CHAMPION!</Text>
          </Animated.View>
        </Animated.View>

        {/* Final Standings */}
        <Animated.View entering={SlideInUp.delay(400).duration(500)} style={styles.standingsContainer}>
          <Text style={styles.standingsTitle}>Final Standings</Text>
          
          {MOCK_FINAL_RESULTS.map((player, index) => (
            <Animated.View 
              key={player.id}
              entering={SlideInUp.delay(600 + index * 100).duration(500)}
              style={[
                styles.playerRow,
                player.place === 1 && styles.winnerRow
              ]}
            >
              <View style={styles.placeContainer}>
                <Text style={[styles.placeEmoji, { color: getPlaceColor(player.place) }]}>
                  {getPlaceEmoji(player.place)}
                </Text>
                <Text style={[styles.placeText, { color: getPlaceColor(player.place) }]}>
                  {player.place === 1 ? '1st' : player.place === 2 ? '2nd' : player.place === 3 ? '3rd' : `${player.place}th`}
                </Text>
              </View>
              
              <View style={styles.playerInfo}>
                <Text style={styles.playerName}>{player.name}</Text>
                <Text style={styles.playerScore}>{player.score} points</Text>
              </View>
              
              <Image source={{ uri: player.imageUrl }} style={styles.playerThumbnail} />
            </Animated.View>
          ))}
        </Animated.View>

        {/* Game Statistics */}
        <Animated.View entering={SlideInUp.delay(800).duration(500)} style={styles.statsContainer}>
          <Text style={styles.statsTitle}>Game Statistics</Text>
          <Text style={styles.statsText}>
            • Total rounds played: {currentRound}{'\n'}
            • Total players: {MOCK_FINAL_RESULTS.length}{'\n'}
            • Highest score: {winner.score} points{'\n'}
            • Average score: {Math.round(MOCK_FINAL_RESULTS.reduce((sum, p) => sum + p.score, 0) / MOCK_FINAL_RESULTS.length)} points
          </Text>
        </Animated.View>

        {/* Action Buttons */}
        <Animated.View entering={FadeIn.delay(1000).duration(500)} style={styles.actionContainer}>
          <TouchableOpacity style={styles.playAgainButton} onPress={handlePlayAgain}>
            <Text style={styles.playAgainButtonText}>🎮 Play Again</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.homeButton} onPress={handleBackToHome}>
            <Text style={styles.homeButtonText}>🏠 Back to Home</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none',
    zIndex: 1,
  },
  confettiText: {
    fontSize: 80,
    opacity: 0.3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerRight: {
    width: 50,
  },
  backButton: {
    padding: 10,
  },
  roundText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: 'bold',
  },
  title: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 5,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  winnerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  crown: {
    marginBottom: 10,
  },
  crownText: {
    fontSize: 40,
  },
  winnerCard: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 25,
    padding: 25,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 215, 0, 0.5)',
  },
  winnerImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 15,
  },
  winnerName: {
    color: '#FFD700',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  winnerScore: {
    color: '#FFD700',
    fontSize: 18,
    marginBottom: 10,
  },
  winnerTitle: {
    color: '#FFD700',
    fontSize: 20,
    fontWeight: 'bold',
  },
  standingsContainer: {
    marginBottom: 30,
  },
  standingsTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
  },
  winnerRow: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderColor: 'rgba(255, 215, 0, 0.3)',
    borderWidth: 2,
  },
  placeContainer: {
    alignItems: 'center',
    marginRight: 15,
    minWidth: 60,
  },
  placeEmoji: {
    fontSize: 24,
    marginBottom: 5,
  },
  placeText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
  },
  playerScore: {
    color: '#ccc',
    fontSize: 14,
  },
  playerThumbnail: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  statsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 30,
  },
  statsTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  statsText: {
    color: '#ccc',
    fontSize: 16,
    lineHeight: 24,
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    gap: 15,
  },
  playAgainButton: {
    flex: 1,
    backgroundColor: '#FF3B30',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: 'center',
  },
  playAgainButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  homeButton: {
    flex: 1,
    backgroundColor: '#666',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: 'center',
  },
  homeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

