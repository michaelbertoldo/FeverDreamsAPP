// src/hooks/useGameNotifications.ts - FIXED VERSION
import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import * as Notifications from 'expo-notifications';
import { RootState } from '../store';

export const useGameNotifications = () => {
  const gameState = useSelector((state: RootState) => state.game);
  
  useEffect(() => {
    const handleGameStateChange = async () => {
      try {
        // Handle different game states
        switch (gameState.status) {
          case 'playing':
            if (gameState.currentPromptData?.promptText) {
              await sendNotification(
                'New Prompt!',
                `Your prompt: ${gameState.currentPromptData.promptText}`
              );
            }
            break;
            
          case 'voting':
            await sendNotification(
              'Time to Vote!',
              'Vote for the funniest image!'
            );
            break;
            
          case 'results':
            if (gameState.roundResults) {
              await sendNotification(
                'Round Complete!',
                'Check out the results!'
              );
            }
            break;
            
          case 'completed':
            await handleGameComplete(gameState);
            break;
        }
      } catch (error) {
        console.error('Error handling game notification:', error);
      }
    };
    
    handleGameStateChange();
  }, [gameState.status, gameState.currentPromptData, gameState.roundResults, gameState.gameResults]);
  
  const handleGameComplete = async (gameData: typeof gameState) => {
    try {
      if (gameData.gameResults?.winner) {
        const winnerData = gameData.gameResults.winner;
        
        // Safe property access
        const winnerName = winnerData?.displayName || 'Unknown Player';
        const winnerScore = winnerData?.score || 0;
        
        await sendNotification(
          'Game Complete! 🎉',
          `${winnerName} wins with ${winnerScore} points!`
        );
      } else {
        await sendNotification(
          'Game Complete!',
          'Thanks for playing!'
        );
      }
    } catch (error) {
      console.error('Error sending game complete notification:', error);
    }
  };
  
  const sendNotification = async (title: string, body: string) => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: true,
        },
        trigger: null, // Show immediately
      });
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  };
};

// Alternative: Even safer approach using defensive programming
export const useGameNotificationsSafe = () => {
  const gameState = useSelector((state: RootState) => state.game);
  
  useEffect(() => {
    if (gameState.status === 'completed') {
      handleGameCompleteSafe();
    }
  }, [gameState.status, gameState.gameResults]);
  
  const handleGameCompleteSafe = async () => {
    try {
      // Defensive programming - handle any possible type issues
      const gameResults = gameState?.gameResults;
      const winner = gameResults?.winner;
      
      if (winner && typeof winner === 'object') {
        // Safe property access with type checking
        const displayName = 'displayName' in winner && typeof winner.displayName === 'string' 
          ? winner.displayName 
          : 'Unknown Player';
          
        const score = 'score' in winner && typeof winner.score === 'number' 
          ? winner.score 
          : 0;
        
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Game Complete! 🎉',
            body: `${displayName} wins with ${score} points!`,
            sound: true,
          },
          trigger: null,
        });
      } else {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Game Complete!',
            body: 'Thanks for playing!',
            sound: true,
          },
          trigger: null,
        });
      }
    } catch (error) {
      console.error('Error sending game complete notification:', error);
    }
  };
};