// src/screens/GameLobbyScreen.tsx - Fixed clipboard import
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  FlatList,
  Share,
  Alert
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useNavigation } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import Animated, { 
  FadeIn, 
  FadeOut, 
  SlideInUp,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { AnimatedButton } from '../components/ui/AnimatedButton';
import { AnimatedCard } from '../components/ui/AnimatedCard';
import { setPlayerReady, startGame } from '../services/socketService';
import { RootState } from '../store';
import { colors, typography, spacing } from '../theme';

export default function GameLobbyScreen() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const [copied, setCopied] = useState(false);
  
  // Get game state from Redux
  const { 
    gameId, 
    joinCode, 
    players, 
    isHost 
  } = useSelector((state: RootState) => state.game);
  
  const userId = useSelector((state: RootState) => state.auth.user?.uid);
  
  // Animation values
  const pulseValue = useSharedValue(1);
  const rotateValue = useSharedValue(0);
  
  // Start pulse animation
  useEffect(() => {
    pulseValue.value = withRepeat(
      withTiming(1.1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    
    rotateValue.value = withRepeat(
      withTiming(360, { duration: 10000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);
  
  // Animated styles
  const pulseStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: pulseValue.value }]
    };
  });
  
  const rotateStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotateValue.value}deg` }]
    };
  });
  
  // Share join code
  const handleShareCode = async () => {
    try {
      await Share.share({
        message: `Join my AI Party Game! Use code: ${joinCode}`,
      });
    } catch (error) {
      console.error('Error sharing code:', error);
    }
  };
  
  // Copy join code to clipboard
  const handleCopyCode = async () => {
    try {
      await Clipboard.setStringAsync(joinCode || '');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };
  
  // Toggle ready status
  const handleToggleReady = () => {
    if (!gameId || !userId) return;
    
    const isCurrentlyReady = players[userId]?.isReady || false;
    setPlayerReady(gameId, !isCurrentlyReady);
  };
  
  // Start the game (host only)
  const handleStartGame = () => {
    if (!gameId || !isHost) return;
    
    // Check if we have at least 2 players
    const playerCount = Object.keys(players).length;
    if (playerCount < 2) {
      Alert.alert(
        'Not Enough Players',
        'You need at least 2 players to start the game.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    // Check if all players are ready
    const allReady = Object.values(players).every(player => player.isReady);
    if (!allReady) {
      Alert.alert(
        'Players Not Ready',
        'All players must be ready to start the game.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    // Start the game
    startGame(gameId);
  };
  
  // Render player item
  const renderPlayerItem = ({ item, index }: { item: any; index: number }) => {
    const isCurrentUser = item.id === userId;
    
    return (
      <AnimatedCard 
        animation="slide" 
        delay={200 * index}
        style={styles.playerCard}
      >
        <View style={styles.playerRow}>
          <View style={styles.playerInfo}>
            <Text style={styles.playerName}>
              {item.displayName} {isCurrentUser && '(You)'} {item.isHost && '👑'}
            </Text>
            {item.isReady ? (
              <View style={styles.readyBadge}>
                <Text style={styles.readyText}>Ready!</Text>
              </View>
            ) : (
              <View style={styles.notReadyBadge}>
                <Text style={styles.notReadyText}>Not Ready</Text>
              </View>
            )}
          </View>
          
          {isCurrentUser && !isHost && (
            <AnimatedButton
              text={item.isReady ? 'Not Ready' : 'Ready'}
              variant={item.isReady ? 'outline' : 'primary'}
              size="small"
              onPress={handleToggleReady}
            />
          )}
        </View>
      </AnimatedCard>
    );
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <Animated.View 
        entering={FadeIn.duration(500)} 
        style={styles.header}
      >
        <Text style={styles.title}>Game Lobby</Text>
        <Animated.View style={[styles.codeContainer, pulseStyle]}>
          <Text style={styles.codeLabel}>JOIN CODE</Text>
          <Text style={styles.codeText}>{joinCode}</Text>
          <View style={styles.codeActions}>
            <AnimatedButton
              text={copied ? 'Copied!' : 'Copy'}
              variant="outline"
              size="small"
              onPress={handleCopyCode}
              icon={<Ionicons name="copy-outline" size={16} color={colors.primary} />}
              iconPosition="left"
              style={styles.codeButton}
            />
            <AnimatedButton
              text="Share"
              variant="outline"
              size="small"
              onPress={handleShareCode}
              icon={<Ionicons name="share-outline" size={16} color={colors.primary} />}
              iconPosition="left"
              style={styles.codeButton}
            />
          </View>
        </Animated.View>
      </Animated.View>
      
      <Animated.View 
        entering={SlideInUp.delay(300).duration(500)}
        style={styles.content}
      >
        <View style={styles.playersHeader}>
          <Text style={styles.playersTitle}>Players ({Object.keys(players).length}/8)</Text>
          <Animated.View style={rotateStyle}>
            <Ionicons name="people" size={24} color={colors.secondary} />
          </Animated.View>
        </View>
        
        <FlatList
          data={Object.values(players)}
          keyExtractor={(item: any) => item.id}
          renderItem={renderPlayerItem}
          contentContainerStyle={styles.playersList}
          showsVerticalScrollIndicator={false}
        />
      </Animated.View>
      
      <Animated.View 
        entering={FadeIn.delay(500).duration(500)}
        style={styles.footer}
      >
        {isHost ? (
          <AnimatedButton
            text="Start Game"
            variant="primary"
            size="medium"
            onPress={handleStartGame}
            disabled={Object.keys(players).length < 2 || !Object.values(players).every((p: any) => p.isReady)}
            style={styles.startButton}
          />
        ) : (
          <Text style={styles.waitingText}>
            Waiting for host to start the game...
          </Text>
        )}
      </Animated.View>
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
    marginBottom: spacing.md,
  },
  codeContainer: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: spacing.lg,
    alignItems: 'center',
    width: '100%',
  },
  codeLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
    marginBottom: spacing.xs,
  },
  codeText: {
    fontSize: typography.fontSize.xxxl,
    fontWeight: 'bold',
    color: colors.primary,
    letterSpacing: 8,
    marginBottom: spacing.md,
  },
  codeActions: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  codeButton: {
    marginHorizontal: spacing.xs,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  playersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  playersTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  playersList: {
    paddingBottom: spacing.lg,
  },
  playerCard: {
    marginBottom: spacing.md,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: typography.fontSize.md,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  readyBadge: {
    backgroundColor: colors.success,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  readyText: {
    fontSize: typography.fontSize.xs,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  notReadyBadge: {
    backgroundColor: colors.background.tertiary,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  notReadyText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.background.tertiary,
  },
  startButton: {
    width: '100%',
  },
  waitingText: {
    fontSize: typography.fontSize.md,
    color: colors.text.tertiary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});