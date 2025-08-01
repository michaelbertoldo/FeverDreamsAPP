// src/utils/networkResilience.ts
import NetInfo from '@react-native-community/netinfo';
import { connectSocket, disconnectSocket } from '../services/socketService';

// Monitor network state
export const setupNetworkMonitoring = () => {
  // Subscribe to network state updates
  const unsubscribe = NetInfo.addEventListener(state => {
    if (state.isConnected) {
      // Reconnect Socket.IO when network is available
      connectSocket();
    } else {
      // Disconnect Socket.IO when network is lost
      disconnectSocket();
    }
  });
  
  return unsubscribe;
};

// Check if network is available
export const isNetworkAvailable = async (): Promise<boolean> => {
  const state = await NetInfo.fetch();
  return state.isConnected || false;
};

// Retry function with exponential backoff
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  retries = 5,
  delay = 300,
  backoff = 2
): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) {
      throw error;
    }
    
    await new Promise(resolve => setTimeout(resolve, delay));
    
    return retryWithBackoff(fn, retries - 1, delay * backoff, backoff);
  }
};
