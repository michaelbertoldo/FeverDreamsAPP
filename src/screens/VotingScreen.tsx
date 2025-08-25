// src/screens/VotingScreen.tsx - Basic Implementation
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { RootState } from '../store';
import { nextVotingPair, updateScores } from '../store/slices/gameSlice';

type VotingNavigationProp = StackNavigationProp<RootStackParamList, 'Voting'>;

const { width: screenWidth } = Dimensions.get('window');

export default function VotingScreen() {
  const navigation = useNavigation<VotingNavigationProp>();
  const dispatch = useDispatch();
  const { votingPairs, currentVotingIndex, currentPrompt, currentRound } = useSelector(
    (state: RootState) => state.game
  );
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [hasVoted, setHasVoted] = useState(false);
  const [votedFor, setVotedFor] = useState<string | null>(null);
  const [timer, setTimer] = useState(15);

  const currentPair = votingPairs[currentVotingIndex];

  useEffect(() => {
    // Reset vote state when new pair loads
    setHasVoted(false);
    setVotedFor(null);
    setTimer(15);
    
    // Countdown timer
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          handleNextPair();
          return 15;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentVotingIndex]);

  const handleVote = (playerId: string) => {
    if (hasVoted) return;
    
    setHasVoted(true);
    setVotedFor(playerId);
    
    // In production, send vote to server
    setTimeout(() => {
      handleNextPair();
    }, 1500);
  };

  const handleNextPair = () => {
    if (currentVotingIndex < votingPairs.length - 1) {
      dispatch(nextVotingPair());
    } else {
      // Move to round results
      navigation.navigate('RoundResults');
    }
  };

  if (!currentPair) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>Loading voting...</Text>
      </SafeAreaView>
    );
  }

  const promptText = currentPrompt?.text.replace('{blank}', '_____') || '';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.roundText}>Round {currentRound} - Voting</Text>
        <View style={styles.timerContainer}>
          <Text style={[styles.timer, timer <= 5 && styles.timerUrgent]}>{timer}s</Text>
        </View>
      </View>

      <View style={styles.promptDisplay}>
        <Text style={styles.promptText}>{promptText}</Text>
      </View>

      <View style={styles.votingContainer}>
        <Text style={styles.instructionText}>Tap the funniest image!</Text>
        
        <View style={styles.imagesContainer}>
          {currentPair.pair.map((submission, index) => (
            <TouchableOpacity
              key={submission.playerId}
              style={[
                styles.imageOption,
                hasVoted && votedFor === submission.playerId && styles.votedOption,
                hasVoted && votedFor !== submission.playerId && styles.notVotedOption,
              ]}
              onPress={() => handleVote(submission.playerId)}
              disabled={hasVoted}
            >
              <Image source={{ uri: submission.imageUrl }} style={styles.image} />
              <View style={styles.responseContainer}>
                <Text style={styles.responseText} numberOfLines={2}>
                  {submission.promptResponse}
                </Text>
              </View>
              {hasVoted && votedFor === submission.playerId && (
                <View style={styles.votedBadge}>
                  <Text style={styles.votedText}>YOUR VOTE</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${((currentVotingIndex + 1) / votingPairs.length) * 100}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {currentVotingIndex + 1} of {votingPairs.length}
          </Text>
        </View>
      </View>
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
  roundText: {
    fontSize: 18,
    color: '#888',
  },
  timerContainer: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  timer: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  timerUrgent: {
    color: '#FF6B6B',
  },
  promptDisplay: {
    backgroundColor: '#1a1a1a',
    margin: 20,
    padding: 20,
    borderRadius: 15,
  },
  promptText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFF',
    textAlign: 'center',
    lineHeight: 28,
  },
  votingContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  instructionText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginBottom: 20,
  },
  imagesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  imageOption: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 15,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  votedOption: {
    borderColor: '#4CAF50',
  },
  notVotedOption: {
    opacity: 0.3,
  },
  image: {
    width: '100%',
    height: screenWidth * 0.4,
    resizeMode: 'cover',
  },
  responseContainer: {
    padding: 10,
  },
  responseText: {
    fontSize: 14,
    color: '#FFF',
    textAlign: 'center',
  },
  votedBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  votedText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFF',
  },
  progressContainer: {
    marginTop: 30,
    marginBottom: 20,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#333',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF6B6B',
  },
  progressText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginTop: 10,
  },
  loadingText: {
    fontSize: 18,
    color: '#888',
    textAlign: 'center',
    marginTop: 50,
  },
});