// src/screens/VotingScreen.tsx - Basic Implementation
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView,
  ScrollView,
  Alert,
  Image
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import Animated, { FadeIn, SlideInUp } from 'react-native-reanimated';
import { RootState } from '../store';
import { startResultsPhase, resetGame } from '../store/slices/gameSlice';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

// Mock submission data for testing
const MOCK_SUBMISSIONS = [
  {
    id: 'sub_1',
    imageUrl: 'https://picsum.photos/300/300?random=1',
    playerName: 'Player 1',
    votes: 0,
  },
  {
    id: 'sub_2', 
    imageUrl: 'https://picsum.photos/300/300?random=2',
    playerName: 'Player 2',
    votes: 0,
  },
  {
    id: 'sub_3',
    imageUrl: 'https://picsum.photos/300/300?random=3', 
    playerName: 'Player 3',
    votes: 0,
  },
];

export default function VotingScreen() {
  const [selectedSubmission, setSelectedSubmission] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [submissions, setSubmissions] = useState(MOCK_SUBMISSIONS);
  
  const navigation = useNavigation();
  const dispatch = useDispatch();
  
  const { currentPromptData, currentRound, status } = useSelector((state: RootState) => state.game);
  
  // Auto-navigate based on game status
  useEffect(() => {
    if (status === 'results') {
      console.log('🎮 Game status changed to results, navigating...');
      // Navigation will be handled by AppNavigator based on Redux state
    }
  }, [status, navigation]);

  const handleVote = (submissionId: string) => {
    if (hasVoted) return;
    
    setSelectedSubmission(submissionId);
    
    // Update vote count
    setSubmissions(prev => 
      prev.map(sub => 
        sub.id === submissionId 
          ? { ...sub, votes: sub.votes + 1 }
          : sub
      )
    );
    
    setHasVoted(true);
    
    console.log('🗳️ Vote submitted for:', submissionId);
    
    // Show success and move to results after delay
    Alert.alert(
      'Vote Submitted!',
      'Thanks for voting! Waiting for other players...',
      [
        {
          text: 'OK',
          onPress: () => {
            // For demo, go to results after 2 seconds
            setTimeout(() => {
              dispatch(startResultsPhase());
            }, 2000);
          }
        }
      ]
    );
  };

  const handleLeaveGame = () => {
    Alert.alert(
      'Leave Game',
      'Are you sure you want to leave the game? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Leave',
          onPress: () => {
            dispatch(resetGame());
            navigation.navigate('Home' as never);
          },
        },
      ]
    );
  };

  const renderSubmission = (submission: typeof MOCK_SUBMISSIONS[0]) => (
    <Animated.View 
      key={submission.id}
      entering={SlideInUp.delay(300).duration(500)}
      style={styles.submissionCard}
    >
      <Image 
        source={{ uri: submission.imageUrl }} 
        style={styles.submissionImage}
      />
      
      <View style={styles.submissionInfo}>
        <Text style={styles.playerName}>{submission.playerName}</Text>
        <Text style={styles.voteCount}>🗳️ {submission.votes} votes</Text>
      </View>
      
      <TouchableOpacity
        style={[
          styles.voteButton,
          selectedSubmission === submission.id && styles.voteButtonSelected,
          hasVoted && styles.voteButtonDisabled
        ]}
        onPress={() => handleVote(submission.id)}
        disabled={hasVoted}
      >
        <Text style={[
          styles.voteButtonText,
          selectedSubmission === submission.id && styles.voteButtonTextSelected
        ]}>
          {selectedSubmission === submission.id ? '✅ Voted!' : '👍 Vote'}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View entering={FadeIn.duration(500)} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleLeaveGame}
          >
            <Ionicons name="close-circle" size={28} color="#ccc" />
          </TouchableOpacity>
          <Text style={styles.roundText}>Round {currentRound}</Text>
          <Text style={styles.title}>🗳️ Vote Time!</Text>
        </View>
      </Animated.View>

      <Animated.View entering={SlideInUp.delay(200).duration(500)} style={styles.promptContainer}>
        <Text style={styles.promptLabel}>THE PROMPT WAS</Text>
        <Text style={styles.promptText}>
          {currentPromptData?.promptText || 'You as a superhero saving the day'}
        </Text>
      </Animated.View>

      <ScrollView 
        style={styles.submissionsContainer}
        contentContainerStyle={styles.submissionsContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.instructionText}>
          🎨 Vote for the funniest AI-generated image!
        </Text>
        
        {submissions.map(renderSubmission)}
        
        {hasVoted && (
          <Animated.View 
            entering={FadeIn.duration(500)}
            style={styles.waitingContainer}
          >
            <Text style={styles.waitingText}>
              ⏳ Waiting for other players to vote...
            </Text>
            <Text style={styles.nextText}>
              Results coming up next!
            </Text>
          </Animated.View>
        )}
      </ScrollView>

      {!hasVoted && (
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            💡 You can't vote for your own image. Choose the one that made you laugh the most!
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    padding: 10,
  },
  backButtonText: {
    color: '#ccc',
    fontSize: 14,
  },
  roundText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: 'bold',
  },
  title: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 5,
  },
  promptContainer: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.3)',
  },
  promptLabel: {
    color: '#FF3B30',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
  },
  promptText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  submissionsContainer: {
    flex: 1,
  },
  submissionsContent: {
    paddingBottom: 20,
  },
  instructionText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
  },
  submissionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  submissionImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 10,
  },
  submissionInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  playerName: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  voteCount: {
    color: '#ccc',
    fontSize: 14,
  },
  voteButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignItems: 'center',
  },
  voteButtonSelected: {
    backgroundColor: '#34C759',
  },
  voteButtonDisabled: {
    backgroundColor: '#666',
  },
  voteButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  voteButtonTextSelected: {
    color: 'white',
  },
  waitingContainer: {
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
    borderRadius: 15,
    padding: 20,
    marginTop: 20,
    borderWidth: 1,
    borderColor: 'rgba(52, 199, 89, 0.3)',
    alignItems: 'center',
  },
  waitingText: {
    color: '#34C759',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  nextText: {
    color: '#ccc',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 5,
  },
  infoContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    padding: 15,
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  infoText: {
    color: '#ccc',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});