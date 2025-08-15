// src/screens/ResultsScreen.tsx - Fixed
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView,
  ScrollView,
  Share,
  TouchableOpacity
} from 'react-native';
import { Image } from 'expo-image';
import { useSelector } from 'react-redux';
import Animated, { 
  FadeIn, 
  FadeOut, 
  SlideInUp,
  ZoomIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  withRepeat
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { AnimatedButton } from '../components/ui/AnimatedButton';
import { AnimatedCard } from '../components/ui/AnimatedCard';
import { ConfettiEffect } from '../components/ui/ConfettiEffect';
import { saveWinningImage } from '../services/gameService';
import { RootState } from '../store';
import { colors, typography, spacing, borderRadius } from '../theme';

export default function ResultsScreen() {
  const [showConfetti, setShowConfetti] = useState(true);
  const [savedImage, setSavedImage] = useState(false);
  
  // Get results data from Redux
  const { 
    gameId,
    roundResults,
    gameResults,
    players,
    status
  } = useSelector((state: RootState) => state.game);
  
  const isGameComplete = status === 'completed';
  
  // Animation values
  const headerScale = useSharedValue(0.8);
  const scoreScale = useSharedValue(1);
  
  // Start animations
  useEffect(() => {
    // Header animation
    headerScale.value = withDelay(
      500,
      withSpring(1, { damping: 12, stiffness: 100 })
    );
    
    // Score animation - fixed withRepeat usage
    scoreScale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 500 }),
        withTiming(1, { duration: 500 })
      ),
      3,  // repeat 3 times
      false  // don't reverse
    );
    
    // Hide confetti after 5 seconds
    const timeout = setTimeout(() => {
      setShowConfetti(false);
    }, 5000);
    
    return () => clearTimeout(timeout);
  }, []);
  
  // Animated styles
  const headerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: headerScale.value }]
    };
  });
  
  const scoreStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scoreScale.value }]
    };
  });
  
  // Get winner data
  const getWinnerData = () => {
    if (isGameComplete && gameResults?.winner) {
      return gameResults.winner;
    }
    
    if (roundResults) {
      // Find player with highest round score
      let highestScore = -1;
      let roundWinner = null;
      
      Object.entries(roundResults.scores).forEach(([playerId, scoreData]) => {
        if (scoreData.roundScore > highestScore) {
          highestScore = scoreData.roundScore;
          roundWinner = {
            playerId,
            displayName: players[playerId]?.displayName || 'Unknown Player',
            score: highestScore
          };
        }
      });
      
      return roundWinner;
    }
    
    return null;
  };
  
  const winner = getWinnerData();
  
  // Get winning image
  const getWinningImage = () => {
    // This would require additional logic to find the highest voted submission
    // For demo purposes, we'll return a placeholder
    return 'https://via.placeholder.com/400';
  };
  
  const winningImage = getWinningImage();
  
  // Share winning image
  const handleShareImage = async () => {
    try {
      await Share.share({
        message: `Check out this winning image from my AI Party Game!`,
        url: winningImage
      });
    } catch (error) {
      console.error('Error sharing image:', error);
    }
  };
  
  // Save winning image
  const handleSaveImage = async () => {
    try {
      if (!gameId) return;
      
      await saveWinningImage(gameId, winningImage);
      setSavedImage(true);
    } catch (error) {
      console.error('Error saving image:', error);
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      {showConfetti && (
        <ConfettiEffect 
          count={150}
          duration={5000}
          onComplete={() => setShowConfetti(false)}
        />
      )}
      
      <Animated.View 
        style={[styles.header, headerStyle]}
      >
        <Text style={styles.title}>
          {isGameComplete ? 'Game Complete!' : `Round ${roundResults?.round} Results`}
        </Text>
      </Animated.View>
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {winner && (
          <Animated.View entering={ZoomIn.delay(800).duration(500)}>
            <AnimatedCard animation="bounce" style={styles.winnerCard}>
              <View style={styles.winnerHeader}>
                <Ionicons name="trophy" size={32} color={colors.tertiary} />
                <Text style={styles.winnerTitle}>
                  {isGameComplete ? 'Game Winner' : 'Round Winner'}
                </Text>
              </View>
              
              <Text style={styles.winnerName}>{winner.displayName}</Text>
              
              <Animated.View style={[styles.scoreContainer, scoreStyle]}>
                <Text style={styles.scoreValue}>{winner.score}</Text>
                <Text style={styles.scoreLabel}>points</Text>
              </Animated.View>
            </AnimatedCard>
          </Animated.View>
        )}
        
        <Animated.View entering={SlideInUp.delay(1200).duration(500)}>
          <AnimatedCard animation="fade" delay={1500} style={styles.imageCard}>
            <Text style={styles.imageTitle}>Winning Image</Text>
            
            <Image
              source={{ uri: winningImage }}
              style={styles.winningImage}
              contentFit="cover"
              transition={500}
            />
            
            <View style={styles.imageActions}>
              <AnimatedButton
                text="Share"
                variant="outline"
                size="medium"
                onPress={handleShareImage}
                icon={<Ionicons name="share-outline" size={20} color={colors.primary} />}
                iconPosition="left"
                style={styles.actionButton}
              />
              
              <AnimatedButton
                text={savedImage ? "Saved" : "Save"}
                variant={savedImage ? "secondary" : "outline"}  // Fixed: changed "success" to "secondary"
                size="medium"
                onPress={handleSaveImage}
                disabled={savedImage}
                icon={
                  <Ionicons 
                    name={savedImage ? "checkmark-circle" : "bookmark-outline"} 
                    size={20} 
                    color={savedImage ? colors.text.primary : colors.primary} 
                  />
                }
                iconPosition="left"
                style={styles.actionButton}
              />
            </View>
          </AnimatedCard>
        </Animated.View>
        
        <Animated.View entering={FadeIn.delay(2000).duration(500)}>
          <Text style={styles.scoresTitle}>All Scores</Text>
          
          {Object.entries(isGameComplete ? gameResults?.scores || {} : roundResults?.scores || {})
            .sort(([, a], [, b]) => (b.totalScore || b.score) - (a.totalScore || a.score))
            .map(([playerId, scoreData], index) => (
              <AnimatedCard 
                key={playerId}
                animation="slide"
                delay={2200 + index * 100}
                style={styles.scoreCard}
              >
                <View style={styles.scoreRow}>
                  <View style={styles.playerInfo}>
                    <Text style={styles.playerRank}>#{index + 1}</Text>
                    <Text style={styles.playerName}>
                      {players[playerId]?.displayName || 'Unknown Player'}
                    </Text>
                  </View>
                  
                  <View style={styles.playerScores}>
                    {!isGameComplete && (
                      <Text style={styles.roundScore}>
                        +{(scoreData as any).roundScore}
                      </Text>
                    )}
                    <Text style={styles.totalScore}>
                      {isGameComplete ? (scoreData as any).score : (scoreData as any).totalScore}
                    </Text>
                  </View>
                </View>
              </AnimatedCard>
            ))}
        </Animated.View>
      </ScrollView>
      
      <View style={styles.footer}>
        <AnimatedButton
          text={isGameComplete ? "Back to Lobby" : "Continue to Next Round"}
          variant="primary"
          size="medium"
          onPress={() => {
            // Navigation logic would go here
          }}
          style={styles.continueButton}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  title: {
    fontSize: typography.fontSize.xxxl,
    fontWeight: 'bold',
    color: colors.text.primary,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  winnerCard: {
    alignItems: 'center',
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  winnerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  winnerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: 'bold',
    color: colors.tertiary,
    marginLeft: spacing.sm,
  },
  winnerName: {
    fontSize: typography.fontSize.xxl,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  scoreContainer: {
    alignItems: 'center',
  },
  scoreValue: {
    fontSize: typography.fontSize.xxxl,
    fontWeight: 'bold',
    color: colors.primary,
  },
  scoreLabel: {
    fontSize: typography.fontSize.md,
    color: colors.text.tertiary,
  },
  imageCard: {
    marginBottom: spacing.lg,
  },
  imageTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  winningImage: {
    width: '100%',
    height: 300,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.tertiary,
  },
  imageActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  actionButton: {
    marginHorizontal: spacing.xs,
  },
  scoresTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  scoreCard: {
    marginBottom: spacing.md,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playerRank: {
    fontSize: typography.fontSize.lg,
    fontWeight: 'bold',
    color: colors.text.tertiary,
    width: 40,
  },
  playerName: {
    fontSize: typography.fontSize.md,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  playerScores: {
    alignItems: 'flex-end',
  },
  roundScore: {
    fontSize: typography.fontSize.sm,
    color: colors.success,
    fontWeight: 'bold',
  },
  totalScore: {
    fontSize: typography.fontSize.lg,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.background.tertiary,
  },
  continueButton: {
    width: '100%',
  },
});