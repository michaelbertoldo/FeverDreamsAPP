// src/services/performanceMonitoring.ts
import { InteractionManager } from 'react-native';
import { getOptimalSettings } from '../utils/deviceInfo';
import { manageCacheSize } from './optimizedImageService';

// Performance metrics
interface PerformanceMetrics {
  frameDrops: number;
  longTasks: number;
  memoryWarnings: number;
  apiLatency: Record<string, number>;
  renderTimes: Record<string, number>;
}

// Initialize metrics
const metrics: PerformanceMetrics = {
  frameDrops: 0,
  longTasks: 0,
  memoryWarnings: 0,
  apiLatency: {},
  renderTimes: {},
};

// Performance thresholds
const THRESHOLDS = {
  LONG_TASK_MS: 50, // 50ms
  RENDER_WARNING_MS: 16, // 16ms (60fps)
  FRAME_DROP_THRESHOLD: 5, // 5 frame drops
  MEMORY_WARNING_THRESHOLD: 3, // 3 memory warnings
};

// Start performance monitoring
export const startPerformanceMonitoring = (): () => void => {
  // Set up periodic cache management
  const cacheInterval = setInterval(() => {
    manageCacheSize().catch(console.error);
  }, 5 * 60 * 1000); // Every 5 minutes
  
  // Return cleanup function
  return () => {
    clearInterval(cacheInterval);
  };
};

// Measure task execution time
export const measureTask = async <T>(
  taskName: string,
  task: () => Promise<T> | T
): Promise<T> => {
  try {
    const startTime = performance.now();
    const result = await task();
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    // Record API latency if it's an API call
    if (taskName.startsWith('api_')) {
      metrics.apiLatency[taskName] = duration;
    }
    
    // Check if this was a long task
    if (duration > THRESHOLDS.LONG_TASK_MS) {
      metrics.longTasks++;
      console.warn(`Long task detected: ${taskName} took ${duration.toFixed(2)}ms`);
    }
    
    return result;
  } catch (error) {
    console.error(`Error in task ${taskName}:`, error);
    throw error;
  }
};

// Measure component render time
export const measureRender = (
  componentName: string,
  startTime: number
): void => {
  const endTime = performance.now();
  const duration = endTime - startTime;
  
  // Record render time
  metrics.renderTimes[componentName] = duration;
  
  // Check if render was slow
  if (duration > THRESHOLDS.RENDER_WARNING_MS) {
    console.warn(`Slow render detected: ${componentName} took ${duration.toFixed(2)}ms`);
  }
};

// Run task after interactions
export const runAfterInteractions = async <T>(
  task: () => Promise<T> | T
): Promise<T> => {
  return new Promise<T>((resolve, reject) => {
    InteractionManager.runAfterInteractions(() => {
      try {
        const result = task();
        if (result instanceof Promise) {
          result.then(resolve).catch(reject);
        } else {
          resolve(result);
        }
      } catch (error) {
        reject(error);
      }
    });
  });
};

// Get current performance metrics
export const getPerformanceMetrics = (): PerformanceMetrics => {
  return { ...metrics };
};

// Reset performance metrics
export const resetPerformanceMetrics = (): void => {
  metrics.frameDrops = 0;
  metrics.longTasks = 0;
  metrics.memoryWarnings = 0;
  metrics.apiLatency = {};
  metrics.renderTimes = {};
};

// Check if performance optimizations should be applied
export const shouldApplyPerformanceOptimizations = async (): Promise<boolean> => {
  try {
    const settings = await getOptimalSettings();
    
    // Check if we should reduce animations or image quality
    return settings.shouldReduceAnimations || settings.shouldReduceImageQuality;
  } catch (error) {
    console.error('Error checking performance optimizations:', error);
    return false;
  }
};

// Get recommended batch size for operations
export const getRecommendedBatchSize = async (): Promise<number> => {
  try {
    const settings = await getOptimalSettings();
    return settings.maxConcurrentOperations;
  } catch (error) {
    console.error('Error getting recommended batch size:', error);
    return 2; // Default to 2 if error
  }
};
