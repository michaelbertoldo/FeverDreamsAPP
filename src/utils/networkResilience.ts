// src/utils/networkResilience.ts
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { Platform } from 'react-native';

// Network state cache
let cachedNetworkState: NetInfoState | null = null;
let lastNetworkCheck = 0;
const CACHE_TTL = 10000; // 10 seconds

// Get current network state
export const getNetworkState = async (): Promise<NetInfoState> => {
  try {
    const now = Date.now();
    
    // Use cached value if recent
    if (cachedNetworkState && now - lastNetworkCheck < CACHE_TTL) {
      return cachedNetworkState;
    }
    
    // Get fresh network state
    const state = await NetInfo.fetch();
    
    // Update cache
    cachedNetworkState = state;
    lastNetworkCheck = now;
    
    return state;
  } catch (error) {
    console.error('Error getting network state:', error);
    
    // Return default state if error - Fixed: properly typed return
    return {
      type: 'unknown' as any,
      isConnected: true,
      isInternetReachable: true,
      details: null,
    } as NetInfoState;
  }
};

// Set up network monitoring
export const setupNetworkMonitoring = (): (() => void) => {
  try {
    // Subscribe to network info updates
    const unsubscribe = NetInfo.addEventListener((state) => {
      // Update cache
      cachedNetworkState = state;
      lastNetworkCheck = Date.now();
      
      // Log network changes
      console.log('Network state changed:', state);
    });
    
    return unsubscribe;
  } catch (error) {
    console.error('Error setting up network monitoring:', error);
    // Return a no-op function if setup fails
    return () => {};
  }
};

// Check if we can perform heavy network operations
export const canPerformHeavyNetworkOperations = async (): Promise<boolean> => {
  try {
    const state = await getNetworkState();
    
    // Only allow heavy operations on WiFi with internet
    return (
      state.isConnected === true &&
      state.isInternetReachable === true &&
      state.type === 'wifi'
    );
  } catch (error) {
    console.error('Error checking network operations capability:', error);
    return false;
  }
};

// Retry network operation with exponential backoff
export const retryWithBackoff = async <T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  initialDelay = 1000
): Promise<T> => {
  let retries = 0;
  let delay = initialDelay;
  
  while (true) {
    try {
      return await operation();
    } catch (error) {
      retries++;
      
      if (retries > maxRetries) {
        throw error;
      }
      
      // Wait with exponential backoff
      await new Promise((resolve) => setTimeout(resolve, delay));
      
      // Increase delay for next retry
      delay *= 2;
    }
  }
};

// Prioritize network requests
export const prioritizeRequest = async <T>(
  highPriorityOperation: () => Promise<T>,
  lowPriorityOperations: Array<() => Promise<any>>
): Promise<T> => {
  try {
    // Cancel or pause low priority operations
    // This is a simplified implementation
    
    // Execute high priority operation
    return await highPriorityOperation();
  } catch (error) {
    console.error('Error in prioritized request:', error);
    throw error;
  } finally {
    // Resume low priority operations
    // This is a simplified implementation
    setTimeout(() => {
      lowPriorityOperations.forEach((op) => op().catch(console.error));
    }, 1000);
  }
};