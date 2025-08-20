// src/screens/ResultsScreen.tsx - Basic Implementation
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  ScrollView, 
  Image, 
  Alert 
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import Animated, { FadeIn, SlideInUp, ZoomIn, useSharedValue, useAnimatedStyle, withSpring, withSequence } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { RootState } from '../store';
import { resetGame, startTestGame } from '../store/slices/gameSlice';
import { useNavigation } from '@react-navigation/native';

// Mock results data
const MOCK_RESULTS = [
  {
    id: 'sub_1',
    imageUrl: 'https://picsum.photos/300/300?random=1',
    playerName: 'Player 1',
    votes: 3,
    place: 1,
  },
  {
    id: 'sub_2',
    imageUrl: 'https://picsum.photos/300/300?random=2', 
    playerName: 'Player 2',
    votes: 2,
    place: 2,
  },
  {
    id: 'sub_3',
    imageUrl: 'https://picsum.photos/300/300?random=3',
    playerName: 'Player 3', 
    votes: 1,
    place: 3,
  },
];

export default function ResultsScreen() {
  const [showConfetti, setShowConfetti] = useState(false);
  
  const navigation = useNavigation();
  const dispatch = useDispatch();
  
  const { currentRound, status } = useSelector((state: RootState) => state.game);
  
  // Auto-navigate based on game status
  useEffect(() => {
    if (status === 'waiting') {
      console.log('🎮 Game status changed to waiting, navigating back to main app...');
      // Navigation will be handled by AppNavigator based on Redux state
    }
  }, [status, navigation]);
  
  // Animation values
  const crownScale = useSharedValue(0);
  
  useEffect(() => {
    // Trigger confetti animation
    setShowConfetti(true);
    
    // Animate crown
    crownScale.value = withSequence(
      withSpring(1.2, { damping: 10, stiffness: 200 }),
      withSpring(1, { damping: 10, stiffness: 200 })
    );
  }, []);

  const crownStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: crownScale.value }]
    };
  });

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

  const handleNextRound = () => {
    Alert.alert(
      'Next Round?',
      'Ready for another round of hilarious AI images?',
      [
        {
          text: 'Yes!',
          onPress: () => {
            console.log('🎮 Starting next round...');
            dispatch(startTestGame());
          }
        },
        {
          text: 'End Game',
          style: 'destructive',
          onPress: () => {
            dispatch(resetGame());
          }
        }
      ]
    );
  };

  const handleLeaveGame = () => {
    Alert.alert(
      'Leave Game?',
      'Are you sure you want to leave the game? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: () => {
            console.log('🚪 Leaving game...');
            dispatch(resetGame());
            // Navigation will be handled automatically by AppNavigator
          }
        }
      ]
    );
  };

  const renderResult = (result: typeof MOCK_RESULTS[0], index: number) => (
    <Animated.View 
      key={result.id}
      entering={SlideInUp.delay(index * 200 + 500).duration(500)}
      style={[
        styles.resultCard,
        result.place === 1 && styles.winnerCard
      ]}
    >
      {result.place === 1 && (
        <Animated.View style={[styles.crown, crownStyle]}>
          <Text style={styles.crownText}>👑</Text>
        </Animated.View>
      )}
      
      <View style={styles.placeContainer}>
        <Text style={[styles.placeEmoji, { color: getPlaceColor(result.place) }]}>
          {getPlaceEmoji(result.place)}
        </Text>
        <Text style={[styles.placeText, { color: getPlaceColor(result.place) }]}>
          {result.place === 1 ? 'Winner!' : `${result.place}${result.place === 2 ? 'nd' : 'rd'} Place`}
        </Text>
      </View>
      
      <Image 
        source={{ uri: result.imageUrl }}
        style={styles.resultImage}
      />
      
      <View style={styles.resultInfo}>
        <Text style={styles.playerName}>{result.playerName}</Text>
        <Text style={styles.voteCount}>🗳️ {result.votes} votes</Text>
      </View>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {showConfetti && (
        <View style={styles.confettiContainer}>
          <Text style={styles.confettiText}>🎉</Text>
        </View>
      )}
      
      {/* Header with Back Button */}
      <Animated.View entering={FadeIn.duration(500)} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleLeaveGame}>
          <Ionicons name="close-circle" size={28} color="#ccc" />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.roundText}>Round {currentRound} Results</Text>
          <Text style={styles.title}>🏆 The Winners!</Text>
        </View>
        
        <View style={styles.headerRight} />
      </Animated.View>

      <ScrollView 
        style={styles.resultsContainer}
        contentContainerStyle={styles.resultsContent}
        showsVerticalScrollIndicator={false}
      >
        {MOCK_RESULTS.map(renderResult)}
        
        <Animated.View 
          entering={FadeIn.delay(1500).duration(500)}
          style={styles.actionContainer}
        >
          <TouchableOpacity 
            style={styles.nextButton}
            onPress={handleNextRound}
          >
            <Text style={styles.nextButtonText}>🎮 Next Round</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.endButton}
            onPress={() => {
              console.log('🏁 Ending game...');
              dispatch(resetGame());
              // Navigation will be handled automatically by AppNavigator
            }}
          >
            <Text style={styles.endButtonText}>🏁 End Game</Text>
          </TouchableOpacity>
        </Animated.View>
        
        <View style={styles.statsContainer}>
          <Text style={styles.statsTitle}>🎭 Round Stats</Text>
          <Text style={styles.statsText}>
            • Total votes cast: {MOCK_RESULTS.reduce((sum, r) => sum + r.votes, 0)}{'\n'}
            • Funniest moment: Player 1's superhero image{'\n'}
            • Most creative: Player 2's disco fever{'\n'}
            • Best laugh: Player 3's unexpected twist
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 20,
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
    fontSize: 100,
    opacity: 0.3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 30,
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
  backButtonText: {
    color: 'white',
    fontSize: 14,
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
  resultsContainer: {
    flex: 1,
  },
  resultsContent: {
    paddingBottom: 20,
  },
  resultCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    position: 'relative',
  },
  winnerCard: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderColor: 'rgba(255, 215, 0, 0.3)',
    borderWidth: 2,
  },
  crown: {
    position: 'absolute',
    top: -15,
    fontSize: 30,
  },
  crownText: {
    fontSize: 30,
  },
  placeContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  placeEmoji: {
    fontSize: 40,
    marginBottom: 5,
  },
  placeText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  resultImage: {
    width: 200,
    height: 200,
    borderRadius: 15,
    marginBottom: 15,
  },
  resultInfo: {
    alignItems: 'center',
  },
  playerName: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  voteCount: {
    color: '#ccc',
    fontSize: 16,
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
    marginBottom: 20,
    gap: 15,
  },
  nextButton: {
    flex: 1,
    backgroundColor: '#FF3B30',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: 'center',
  },
  nextButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  endButton: {
    flex: 1,
    backgroundColor: '#666',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: 'center',
  },
  endButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 15,
    padding: 20,
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statsTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  statsText: {
    color: '#ccc',
    fontSize: 14,
    lineHeight: 22,
  },
});