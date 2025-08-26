import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { RootState } from '../store';
import { nextRound } from '../store/slices/gameSlice';
import { Ionicons } from '@expo/vector-icons';

type RoundResultsNavigationProp = StackNavigationProp<RootStackParamList, 'RoundResults'>;

export default function RoundResultsScreen() {
  const navigation = useNavigation<RoundResultsNavigationProp>();
  const dispatch = useDispatch();
  const { currentRound, totalRounds, submissions, players } = useSelector(
    (state: RootState) => state.game
  );

  // Sort submissions by votes
  const sortedSubmissions = [...submissions].sort((a, b) => b.votes - a.votes);
  const winner = sortedSubmissions[0];

  const handleNextRound = () => {
    dispatch(nextRound());
    // Navigation will be handled automatically by GameNavigator based on Redux state
    console.log('🔄 Next round or final results - GameNavigator will handle navigation');
  };

  const renderSubmission = ({ item, index }: any) => (
    <View style={styles.submissionItem}>
      <View style={styles.rankContainer}>
        <Text style={styles.rankText}>#{index + 1}</Text>
      </View>
      <Image source={{ uri: item.imageUrl }} style={styles.thumbnail} />
      <View style={styles.submissionInfo}>
        <Text style={styles.playerName}>{item.playerName}</Text>
        <Text style={styles.responseText} numberOfLines={1}>{item.promptResponse}</Text>
      </View>
      <View style={styles.votesContainer}>
        <Ionicons name="heart" size={20} color="#FF6B6B" />
        <Text style={styles.votesText}>{item.votes || 0}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Round {currentRound} Results</Text>
      </View>

      {winner && (
        <View style={styles.winnerSection}>
          <Text style={styles.winnerLabel}>🏆 Round Winner!</Text>
          <Image source={{ uri: winner.imageUrl }} style={styles.winnerImage} />
          <Text style={styles.winnerName}>{winner.playerName}</Text>
          <Text style={styles.winnerResponse}>"{winner.promptResponse}"</Text>
          <View style={styles.winnerVotes}>
            <Ionicons name="heart" size={24} color="#FFD700" />
            <Text style={styles.winnerVotesText}>{winner.votes || 0} votes</Text>
          </View>
        </View>
      )}

      <View style={styles.rankingsSection}>
        <Text style={styles.rankingsTitle}>All Submissions</Text>
        <FlatList
          data={sortedSubmissions}
          renderItem={renderSubmission}
          keyExtractor={(item) => item.playerId}
          style={styles.rankingsList}
        />
      </View>

      <TouchableOpacity style={styles.nextButton} onPress={handleNextRound}>
        <Text style={styles.nextButtonText}>
          {currentRound < totalRounds ? 'Next Round' : 'See Final Results'}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
  },
  winnerSection: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#1a1a1a',
    margin: 20,
    borderRadius: 15,
  },
  winnerLabel: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 15,
  },
  winnerImage: {
    width: 200,
    height: 200,
    borderRadius: 15,
    marginBottom: 15,
  },
  winnerName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 5,
  },
  winnerResponse: {
    fontSize: 16,
    color: '#CCC',
    fontStyle: 'italic',
    marginBottom: 10,
    textAlign: 'center',
  },
  winnerVotes: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  winnerVotesText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  rankingsSection: {
    flex: 1,
    paddingHorizontal: 20,
  },
  rankingsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#888',
    marginBottom: 10,
  },
  rankingsList: {
    flex: 1,
  },
  submissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  rankContainer: {
    width: 30,
    alignItems: 'center',
  },
  rankText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  thumbnail: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginHorizontal: 12,
  },
  submissionInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 2,
  },
  responseText: {
    fontSize: 14,
    color: '#888',
  },
  votesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  votesText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  nextButton: {
    backgroundColor: '#FF6B6B',
    margin: 20,
    padding: 18,
    borderRadius: 30,
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
});
