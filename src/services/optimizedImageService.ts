// src/services/optimizedImageService.ts
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { Platform } from 'react-native';
import { getNetworkState } from '../utils/networkResilience';

// Image processing constants
const IMAGE_QUALITY = {
  HIGH: 0.9,
  MEDIUM: 0.7,
  LOW: 0.5,
};

const IMAGE_SIZE = {
  LARGE: { width: 1024, height: 1024 },
  MEDIUM: { width: 768, height: 768 },
  SMALL: { width: 512, height: 512 },
  TINY: { width: 256, height: 256 },
};

// Cache configuration
const CACHE_CONFIG = {
  MAX_SIZE_MB: 50, // Maximum cache size in MB
  TTL_MS: 24 * 60 * 60 * 1000, // 24 hours
};

/**
 * Optimize image based on network conditions and device capabilities
 */
export const optimizeImage = async (
  imageUri: string,
  purpose: 'upload' | 'display' | 'ai-input'
): Promise<string> => {
  try {
    // Get current network state
    const networkState = await getNetworkState();
    
    // Determine optimal settings based on network and purpose
    const settings = getOptimalSettings(networkState, purpose);
    
    // Process image with optimal settings
    const result = await ImageManipulator.manipulateAsync(
      imageUri,
      [{ resize: settings.size }],
      {
        compress: settings.quality,
        format: settings.format,
      }
    );
    
    return result.uri;
  } catch (error) {
    console.error('Error optimizing image:', error);
    return imageUri; // Return original if optimization fails
  }
};

/**
 * Get optimal image processing settings based on network and purpose
 */
const getOptimalSettings = (
  networkState: { type: string; isConnected: boolean; isInternetReachable: boolean },
  purpose: 'upload' | 'display' | 'ai-input'
) => {
  // Default settings
  let quality = IMAGE_QUALITY.MEDIUM;
  let size = IMAGE_SIZE.MEDIUM;
  let format = ImageManipulator.SaveFormat.JPEG;
  
  // Adjust based on network type
  if (!networkState.isConnected || !networkState.isInternetReachable) {
    // Offline or poor connection - use lowest quality
    quality = IMAGE_QUALITY.LOW;
    size = IMAGE_SIZE.SMALL;
  } else if (networkState.type === 'wifi') {
    // WiFi - can use higher quality
    quality = IMAGE_QUALITY.HIGH;
    size = IMAGE_SIZE.LARGE;
  } else if (networkState.type === 'cellular') {
    // Cellular - use medium quality
    quality = IMAGE_QUALITY.MEDIUM;
    size = IMAGE_SIZE.MEDIUM;
  }
  
  // Adjust based on purpose
  switch (purpose) {
    case 'upload':
      // For uploading selfies
      size = IMAGE_SIZE.MEDIUM; // 768x768 is sufficient for face detection
      break;
    case 'display':
      // For displaying in the app
      // Use device-specific optimizations
      if (Platform.OS === 'ios' && Platform.Version >= '14.0') {
        format = ImageManipulator.SaveFormat.WEBP; // Better compression on newer iOS
      }
      break;
    case 'ai-input':
      // For AI processing
      size = IMAGE_SIZE.SMALL; // 512x512 is standard for many AI models
      quality = IMAGE_QUALITY.HIGH; // Need good quality for AI
      break;
  }
  
  return { quality, size, format };
};

/**
 * Cache management utilities
 */

// Get cache size
export const getCacheSize = async (): Promise<number> => {
  try {
    const cacheDir = FileSystem.cacheDirectory;
    const dirInfo = await FileSystem.getInfoAsync(cacheDir);
    return dirInfo.size || 0;
  } catch (error) {
    console.error('Error getting cache size:', error);
    return 0;
  }
};

// Clear cache if it exceeds maximum size
export const manageCacheSize = async (): Promise<void> => {
  try {
    const cacheSize = await getCacheSize();
    const maxSizeBytes = CACHE_CONFIG.MAX_SIZE_MB * 1024 * 1024;
    
    if (cacheSize > maxSizeBytes) {
      // Clear cache
      await FileSystem.deleteAsync(`${FileSystem.cacheDirectory}images/`, { idempotent: true });
      await FileSystem.makeDirectoryAsync(`${FileSystem.cacheDirectory}images/`, { intermediates: true });
    }
  } catch (error) {
    console.error('Error managing cache size:', error);
  }
};

/**
 * Prefetch and cache images
 */
export const prefetchImages = async (imageUrls: string[]): Promise<void> => {
  try {
    // Create cache directory if it doesn't exist
    const cacheDir = `${FileSystem.cacheDirectory}images/`;
    await FileSystem.makeDirectoryAsync(cacheDir, { intermediates: true });
    
    // Prefetch images in parallel with limits
    const batchSize = 3; // Process 3 images at a time
    
    for (let i = 0; i < imageUrls.length; i += batchSize) {
      const batch = imageUrls.slice(i, i + batchSize);
      await Promise.all(
        batch.map(async (url) => {
          const filename = url.split('/').pop();
          const filePath = `${cacheDir}${filename}`;
          
          // Check if file already exists in cache
          const fileInfo = await FileSystem.getInfoAsync(filePath);
          
          if (!fileInfo.exists) {
            // Download and cache the image
            await FileSystem.downloadAsync(url, filePath);
          }
        })
      );
    }
  } catch (error) {
    console.error('Error prefetching images:', error);
  }
};

/**
 * Get cached image URI or download if not cached
 */
export const getCachedImage = async (url: string): Promise<string> => {
  try {
    const cacheDir = `${FileSystem.cacheDirectory}images/`;
    const filename = url.split('/').pop();
    const filePath = `${cacheDir}${filename}`;
    
    // Check if file exists in cache
    const fileInfo = await FileSystem.getInfoAsync(filePath);
    
    if (fileInfo.exists) {
      // Check if cache is expired
      const now = new Date().getTime();
      const fileTime = fileInfo.modificationTime * 1000;
      
      if (now - fileTime < CACHE_CONFIG.TTL_MS) {
        // Cache is valid
        return filePath;
      }
    }
    
    // Download and cache the image
    await FileSystem.downloadAsync(url, filePath);
    return filePath;
  } catch (error) {
    console.error('Error getting cached image:', error);
    return url; // Return original URL if caching fails
  }
};
