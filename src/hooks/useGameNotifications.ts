// src/hooks/useGameNotifications.ts
import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { AppState, AppStateStatus } from 'react-native';
import {
  notifyPlayerTurn,
  notifyVotingStarted,
  notifyRoundResults,
  notifyGameResults,
  remindInactivePlayer,
  setBadgeCount,
} from '../services/notificationService';
import { RootState } from '../store';

export const useGameNotifications = () => {
  // Get game state from Redux
  const {
    gameId,
    status,
    currentRound,
    currentPromptData,
    players,
    roundResults,
    gameResults,
  } = useSelector((state: RootState) => state.game);
  
  // Get user data with null check
  const user = useSelector((state: RootState) => state.auth.user);
  const userId = user?.uid;
  
  // Refs for tracking state changes
  const prevStatus = useRef(status);
  const prevPromptId = useRef(currentPromptData?.promptId);
  const appState = useRef(AppState.currentState);
  const inactivityTimer = useRef<NodeJS.Timeout | null>(null);
  
  // Handle app state changes (background/foreground)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription.remove();
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
      }
    };
  }, []);
  
  // Handle app state change
  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    // Check if app is going to background
    if (
      appState.current.match(/active/) &&
      nextAppState.match(/inactive|background/)
    ) {
      // App is going to background
      startInactivityTimer();
    } else if (
      appState.current.match(/inactive|background/) &&
      nextAppState === 'active'
    ) {
      // App is coming to foreground
      stopInactivityTimer();
      
      // Reset badge count
      setBadgeCount(0);
    }
    
    appState.current = nextAppState;
  };
  
  // Start inactivity timer
  const startInactivityTimer = () => {
    // Only start timer if we have userId and player is in an active game and it's their turn
    if (
      userId &&
      gameId &&
      status === 'playing' &&
      currentPromptData?.isAssigned &&
      currentPromptData?.assignedPlayers?.includes(userId)
    ) {
      // Set timer for 30 seconds
      inactivityTimer.current = setTimeout(() => {
        // Send reminder notification
        remindInactivePlayer(gameId, 30);
      }, 30000);
    }
  };
  
  // Stop inactivity timer
  const stopInactivityTimer = () => {
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
      inactivityTimer.current = null;
    }
  };
  
  // Watch for game status changes
  useEffect(() => {
    // Skip if we don't have userId or on first render
    if (!userId || prevStatus.current === status) return;
    
    // Handle status changes when app is in background
    if (appState.current.match(/inactive|background/)) {
      switch (status) {
        case 'voting':
          // Notify when voting starts
          notifyVotingStarted();
          break;
        case 'results':
          // Notify when round results are available
          if (roundResults) {
            const winnerData = getWinnerData();
            if (winnerData) {
              notifyRoundResults(
                roundResults.round,
                winnerData.displayName || 'Unknown Player',
                roundResults.scores[userId]?.totalScore || 0
              );
            }
          }
          break;
        case 'completed':
          // Notify when game is completed
          if (gameResults) {
            const isWinner = gameResults.winner?.playerId === userId;
            notifyGameResults(
              gameResults.winner?.displayName || 'Unknown',
              gameResults.scores[userId]?.score || 0,
              isWinner
            );
          }
          break;
      }
    }
    
    // Update previous status
    prevStatus.current = status;
  }, [status, roundResults, gameResults, userId]);
  
  // Watch for prompt changes
  useEffect(() => {
    // Skip if we don't have userId or on first render
    if (!userId || prevPromptId.current === currentPromptData?.promptId) return;
    
    // Handle prompt changes when app is in background
    if (
      appState.current.match(/inactive|background/) &&
      currentPromptData?.isAssigned &&
      currentPromptData?.assignedPlayers?.includes(userId)
    ) {
      // Notify player it's their turn
      notifyPlayerTurn(
        players[userId]?.displayName || 'Player',
        currentPromptData.promptText || 'Create a funny image!'
      );
    }
    
    // Update previous prompt ID
    prevPromptId.current = currentPromptData?.promptId;
  }, [currentPromptData?.promptId, currentPromptData?.isAssigned, userId]);
  
  // Helper function to get winner data
  const getWinnerData = () => {
    if (roundResults && players) {
      // Find player with highest round score
      let highestScore = -1;
      let roundWinner: {
        playerId: string;
        displayName: string;
        score: number;
      } | null = null;
      
      Object.entries(roundResults.scores).forEach(([playerId, scoreData]) => {
        if (scoreData.roundScore > highestScore) {
          highestScore = scoreData.roundScore;
          roundWinner = {
            playerId,
            displayName: players[playerId]?.displayName || 'Unknown Player',
            score: highestScore
          };
        }
      });
      
      return roundWinner;
    }
    
    return null;
  };
  
  // Early return if user is not loaded yet
  if (!userId) {
    return;
  }
};