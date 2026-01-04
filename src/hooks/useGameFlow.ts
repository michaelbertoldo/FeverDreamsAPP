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
        
        // If only one submission, skip voting and go straight to results
        if (shuffledSubmissions.length === 1) {
          console.log('🎯 Only one submission, skipping voting and going to round results');
          // Calculate scores and move to round results
          const scores: Record<string, number> = {};
          shuffledSubmissions.forEach(submission => {
            scores[submission.playerId] = 1; // Give 1 point for participation
          });
          
          // Update player scores
          const updatedPlayers = players.map(player => ({
            ...player,
            score: (player.score || 0) + (scores[player.id] || 0),
          }));
          
          // Dispatch actions to move to round results
          dispatch({ type: 'game/updatePlayers', payload: updatedPlayers });
          dispatch({ type: 'game/updateScores', payload: scores });
          dispatch({ type: 'game/nextVotingPair' }); // This will set status to roundResults
          return;
        }
        
        // Create normal voting pairs
        for (let i = 0; i < shuffledSubmissions.length; i += 2) {
          if (i + 1 < shuffledSubmissions.length) {
            votingPairs.push({
              pair: [shuffledSubmissions[i], shuffledSubmissions[i + 1]],
              promptId: currentPrompt.id
            });
          } else {
            // Handle odd number of submissions by adding to previous pair
            if (votingPairs.length > 0) {
              votingPairs[votingPairs.length - 1].pair.push(shuffledSubmissions[i]);
            } else {
              // If this is the first and only submission, create a single pair
              votingPairs.push({
                pair: [shuffledSubmissions[i]],
                promptId: currentPrompt.id
              });
            }
          }
        }
        
        console.log('🎲 Created voting pairs:', votingPairs);
        dispatch(startVoting(votingPairs));
      }
    }
  }, [status, currentPrompt, players, submissions, dispatch]);

  // Auto-advance round when voting is complete
  useEffect(() => {
    console.log('🔄 Round Results Check:', { status, currentRound, totalRounds });
    
    if (status === 'roundResults') {
      console.log('⏰ Setting timer to advance round in 3 seconds...');
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

  // Safety timeout to prevent getting stuck in voting
  useEffect(() => {
    if (status === 'voting') {
      const safetyTimer = setTimeout(() => {
        console.log('⚠️ Safety timeout: Voting taking too long, forcing round results');
        // Force move to round results if voting gets stuck
        dispatch({ type: 'game/nextVotingPair' });
      }, 10000); // 10 second safety timeout for faster testing
      
      return () => clearTimeout(safetyTimer);
    }
  }, [status, dispatch]);

  return {
    shouldShowVoting: status === 'voting',
    shouldShowRoundResults: status === 'roundResults',
    shouldShowFinalResults: status === 'finalResults',
    currentStatus: status
  };
};
