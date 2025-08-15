// src/screens/PromptScreen.tsx - Fixed missing gameId
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import { useSelector } from 'react-redux';
import Animated, { 
  FadeIn, 
  SlideInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { ImageGenerator } from '../components/ImageGenerator';
import { AnimatedCard } from '../components/ui/AnimatedCard';
import { RootState } from '../store';
import { colors, typography, spacing, borderRadius } from '../theme';

export default function PromptScreen() {
  const [timeLeft, setTimeLeft] = useState(60);
  const [isTimeWarning, setIsTimeWarning] = useState(false);
  
  // Get current prompt data from Redux
  const { 
    gameId,
    currentPromptData: { promptId, promptText, isAssigned },
    currentRound
  } = useSelector((state: RootState) => state.game);
  
  // Animation values
  const timerScale = useSharedValue(1);
  const promptScale = useSharedValue(1);
  
  // Start timer animation
  useEffect(() => {
    // Countdown timer
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        
        // Set warning when 15 seconds left
        if (prev === 16) {
          setIsTimeWarning(true);
          
          // Start warning animation
          timerScale.value = withRepeat(
            withSequence(
              withSpring(1.2, { damping: 10, stiffness: 100 }),
              withSpring(1, { damping: 10, stiffness: 100 })
            ),
            5,
            false
          );
        }
        
        return prev - 1;
      });
    }, 1000);
    
    // Prompt animation
    promptScale.value = withRepeat(
      withSequence(
        withSpring(1.02, { damping: 15, stiffness: 100 }),
        withSpring(1, { damping: 15, stiffness: 100 })
      ),
      3,
      false
    );
    
    return () => clearInterval(timer);
  }, []);
  
  // Animated styles
  const timerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: timerScale.value }]
    };
  });
  
  const promptStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: promptScale.value }]
    };
  });
  
  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoid}
        >
          <Animated.View 
            entering={FadeIn.duration(500)} 
            style={styles.header}
          >
            <View style={styles.roundInfo}>
              <Text style={styles.roundText}>Round {currentRound}</Text>
              <Animated.View 
                style={[
                  styles.timer, 
                  isTimeWarning && styles.timerWarning,
                  timerStyle
                ]}
              >
                <Ionicons 
                  name="time-outline" 
                  size={16} 
                  color={isTimeWarning ? colors.text.primary : colors.text.tertiary} 
                />
                <Text 
                  style={[
                    styles.timerText,
                    isTimeWarning && styles.timerTextWarning
                  ]}
                >
                  {formatTime(timeLeft)}
                </Text>
              </Animated.View>
            </View>
          </Animated.View>
          
          <Animated.View 
            entering={SlideInUp.delay(300).duration(500)}
            style={styles.content}
          >
            <Animated.View style={promptStyle}>
              <AnimatedCard animation="bounce" style={styles.promptCard}>
                <Text style={styles.promptLabel}>YOUR PROMPT</Text>
                <Text style={styles.promptText}>{promptText || 'Loading prompt...'}</Text>
              </AnimatedCard>
            </Animated.View>
            
            {isAssigned ? (
              <ImageGenerator
                gameId={gameId || ''}
                promptId={promptId || ''}
                promptText={promptText || ''}
                onImageGenerated={(imageUrl) => {
                  // Handle image generation completion
                  console.log('Image generated:', imageUrl);
                }}
              />
            ) : (
              <AnimatedCard animation="fade" delay={500} style={styles.waitingCard}>
                <Ionicons name="hourglass-outline" size={48} color={colors.text.tertiary} />
                <Text style={styles.waitingTitle}>Waiting for other players...</Text>
                <Text style={styles.waitingText}>
                  Other players are creating their images for this prompt.
                </Text>
              </AnimatedCard>
            )}
          </Animated.View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  keyboardAvoid: {
    flex: 1,
  },
  header: {
    padding: spacing.lg,
  },
  roundInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roundText: {
    fontSize: typography.fontSize.xl,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  timer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  timerWarning: {
    backgroundColor: colors.warning,
  },
  timerText: {
    fontSize: typography.fontSize.md,
    fontWeight: 'bold',
    color: colors.text.tertiary,
    marginLeft: 4,
  },
  timerTextWarning: {
    color: colors.text.primary,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  promptCard: {
    marginBottom: spacing.lg,
  },
  promptLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
    marginBottom: spacing.xs,
  },
  promptText: {
    fontSize: typography.fontSize.xxl,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  waitingCard: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  waitingTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  waitingText: {
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});