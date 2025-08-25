import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { startVoting, nextRound, endGame } from '../store/slices/gameSlice';

export const useGameFlow = () => {
  const dispatch = useDispatch();
  const { 
    status, 
    currentRound, 
    totalRounds, 
    players, 
    submissions, 
    currentPrompt 
  } = useSelector((state: RootState) => state.game);

  // Auto-start voting when all players have submitted
  useEffect(() => {
    console.log('🔄 Game Flow Check:', { status, currentPrompt: !!currentPrompt, playersCount: players.length, submissionsCount: submissions.length });
    
    if (status === 'playing' && currentPrompt && players.length > 0) {
      const allPlayersSubmitted = players.every(player => 
        submissions.some(sub => sub.playerId === player.id)
      );
      
      console.log('📊 Submission Status:', { allPlayersSubmitted, submissionsCount: submissions.length, expectedCount: players.length });
      
      if (allPlayersSubmitted && submissions.length === players.length) {
        console.log('🎯 All players submitted, starting voting phase');
        
        // Create voting pairs from submissions
        const votingPairs = [];
        const shuffledSubmissions = [...submissions].sort(() => Math.random() - 0.5);
        
        for (let i = 0; i < shuffledSubmissions.length; i += 2) {
          if (i + 1 < shuffledSubmissions.length) {
            votingPairs.push({
              pair: [shuffledSubmissions[i], shuffledSubmissions[i + 1]],
              promptId: currentPrompt.id
            });
          } else {
            // Handle odd number of submissions
            votingPairs.push({
              pair: [shuffledSubmissions[i]],
              promptId: currentPrompt.id
            });
          }
        }
        
        console.log('🎲 Created voting pairs:', votingPairs);
        dispatch(startVoting(votingPairs));
      }
    }
  }, [status, currentPrompt, players, submissions, dispatch]);

  // Auto-advance round when voting is complete
  useEffect(() => {
    if (status === 'roundResults') {
      const timer = setTimeout(() => {
        if (currentRound < totalRounds) {
          console.log('🔄 Advancing to next round');
          dispatch(nextRound());
        } else {
          console.log('🏆 Game complete, showing final results');
          dispatch(endGame());
        }
      }, 3000); // Wait 3 seconds before advancing

      return () => clearTimeout(timer);
    }
  }, [status, currentRound, totalRounds, dispatch]);

  return {
    shouldShowVoting: status === 'voting',
    shouldShowRoundResults: status === 'roundResults',
    shouldShowFinalResults: status === 'finalResults',
    currentStatus: status
  };
};
