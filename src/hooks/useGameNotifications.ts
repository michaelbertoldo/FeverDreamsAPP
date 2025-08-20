// src/hooks/useGameNotifications.ts
import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import * as Notifications from 'expo-notifications';
import { RootState } from '../store';

export const useGameNotifications = () => {
  const gameState = useSelector((state: RootState) => state.game);
  
  useEffect(() => {
    const handleGameStateChange = async () => {
      try {
        switch (gameState.status) {
          case 'waiting':
            await sendNotification(
              'Game Ready!',
              'Waiting for players to join...'
            );
            break;
            
          case 'playing':
            if (gameState.currentPromptData?.promptText) {
              await sendNotification(
                'Your Turn!',
                `New prompt: ${gameState.currentPromptData.promptText}`
              );
            }
            break;
            
          case 'voting':
            await sendNotification(
              'Vote Time!',
              'Time to vote on the funniest images!'
            );
            break;
            
          case 'results':
            await sendNotification(
              'Round Complete!',
              'Check out the results!'
            );
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
  }, [gameState.status, gameState.currentPromptData]);
  
  const handleGameComplete = async (gameData: typeof gameState) => {
    try {
      // Get the player with the highest score
      const players = Object.values(gameData.players);
      if (players.length > 0) {
        const winner = players.reduce((prev, current) => 
          (prev.score > current.score) ? prev : current
        );
        
        await sendNotification(
          'Game Complete! 🎉',
          `${winner.displayName} wins with ${winner.score} points!`
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