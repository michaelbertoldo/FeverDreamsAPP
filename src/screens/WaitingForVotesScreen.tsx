// src/screens/WaitingForVotesScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import Animated, { 
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  FadeIn,
  SlideInUp
} from 'react-native-reanimated';

export default function WaitingForVotesScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { gameId } = route.params as { gameId: string };
  
  const [playersSubmitted, setPlayersSubmitted] = useState(2);
  const [totalPlayers, setTotalPlayers] = useState(4);
  
  // Animation values
  const dotScale1 = useSharedValue(1);
  const dotScale2 = useSharedValue(1);
  const dotScale3 = useSharedValue(1);
  
  // Start dot animations
  useEffect(() => {
    const startDotAnimation = () => {
      dotScale1.value = withRepeat(
        withSequence(
          withTiming(1.3, { duration: 600 }),
          withTiming(1, { duration: 600 })
        ),
        -1,
        false
      );
      
      setTimeout(() => {
        dotScale2.value = withRepeat(
          withSequence(
            withTiming(1.3, { duration: 600 }),
            withTiming(1, { duration: 600 })
          ),
          -1,
          false
        );
      }, 200);
      
      setTimeout(() => {
        dotScale3.value = withRepeat(
          withSequence(
            withTiming(1.3, { duration: 600 }),
            withTiming(1, { duration: 600 })
          ),
          -1,
          false
        );
      }, 400);
    };
    
    startDotAnimation();
  }, []);
  
  // Animated styles for dots
  const dot1Style = useAnimatedStyle(() => ({
    transform: [{ scale: dotScale1.value }]
  }));
  
  const dot2Style = useAnimatedStyle(() => ({
    transform: [{ scale: dotScale2.value }]
  }));
  
  const dot3Style = useAnimatedStyle(() => ({
    transform: [{ scale: dotScale3.value }]
  }));
  
  // Mock: Simulate other players submitting
  useEffect(() => {
    const interval = setInterval(() => {
      setPlayersSubmitted(prev => {
        if (prev < totalPlayers) {
          return prev + 1;
        } else {
          // All players have submitted, navigate to voting
          clearInterval(interval);
          setTimeout(() => {
            navigation.navigate('Profile' as never); // Navigate to existing screen for now
          }, 2000);
          return prev;
        }
      });
    }, 3000); // Add a player every 3 seconds
    
    return () => clearInterval(interval);
  }, [totalPlayers, navigation]);
  
  const allSubmitted = playersSubmitted >= totalPlayers;
  
  return (
    <SafeAreaView style={styles.container}>
      <Animated.View 
        entering={FadeIn.duration(500)}
        style={styles.content}
      >
        <Text style={styles.title}>Waiting for Others</Text>
        
        <Animated.View 
          entering={SlideInUp.delay(300).duration(500)}
          style={styles.statusContainer}
        >
          <Text style={styles.statusText}>
            {playersSubmitted} of {totalPlayers} players have submitted their images
          </Text>
          
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <Animated.View 
                style={[
                  styles.progressFill,
                  { width: `${(playersSubmitted / totalPlayers) * 100}%` }
                ]}
              />
            </View>
          </View>
        </Animated.View>
        
        {!allSubmitted ? (
          <Animated.View 
            entering={FadeIn.delay(600).duration(500)}
            style={styles.waitingContainer}
          >
            <Text style={styles.waitingText}>
              Other players are creating their masterpieces
            </Text>
            
            <View style={styles.dotsContainer}>
              <Animated.View style={[styles.dot, dot1Style]} />
              <Animated.View style={[styles.dot, dot2Style]} />
              <Animated.View style={[styles.dot, dot3Style]} />
            </View>
          </Animated.View>
        ) : (
          <Animated.View 
            entering={FadeIn.duration(500)}
            style={styles.completeContainer}
          >
            <Text style={styles.completeText}>All images submitted!</Text>
            <Text style={styles.nextText}>Starting voting round...</Text>
          </Animated.View>
        )}
        
        <Animated.View 
          entering={FadeIn.delay(800).duration(500)}
          style={styles.tipContainer}
        >
          <Text style={styles.tipText}>
            💡 Get ready to vote on the funniest images!
          </Text>
        </Animated.View>
      </Animated.View>
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 40,
    textAlign: 'center',
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  statusText: {
    fontSize: 18,
    color: '#CCC',
    textAlign: 'center',
    marginBottom: 20,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
  },
  progressBar: {
    width: 200,
    height: 8,
    backgroundColor: '#333',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF3B30',
    borderRadius: 4,
  },
  waitingContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  waitingText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginBottom: 30,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF3B30',
    marginHorizontal: 4,
  },
  completeContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  completeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CD964',
    marginBottom: 10,
  },
  nextText: {
    fontSize: 16,
    color: '#CCC',
  },
  tipContainer: {
    backgroundColor: '#1C1C1E',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
  },
  tipText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});