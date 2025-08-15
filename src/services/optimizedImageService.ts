// src/services/optimizedImageService.ts - FIXED VERSION
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AIGenerationOptions {
  prioritizeSpeed?: boolean;
  forceHighQuality?: boolean;
  useCache?: boolean;
}

export const generateOptimizedAIImage = async (
  prompt: string,
  userId: string,
  options: AIGenerationOptions = {}
): Promise<{ success: boolean; imageUrl?: string; error?: string }> => {
  try {
    console.log('Generating AI image with prompt:', prompt);
    console.log('Options:', options);
    
    // Check cache first if enabled
    if (options.useCache) {
      const cachedImage = await checkImageCache(userId, prompt);
      if (cachedImage) {
        console.log('Using cached image');
        return {
          success: true,
          imageUrl: cachedImage,
        };
      }
    }
    
    // Mock AI generation - replace with actual Replicate API call
    const delay = options.prioritizeSpeed ? 1000 : 2000;
    
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Mock success response with a placeholder image
    const imageUrl = `https://picsum.photos/400/400?random=${Date.now()}&user=${userId}`;
    
    // Cache the result if caching is enabled
    if (options.useCache) {
      await cacheImageResult(userId, prompt, imageUrl);
    }
    
    return {
      success: true,
      imageUrl,
    };
  } catch (error) {
    console.error('AI image generation failed:', error);
    return {
      success: false,
      error: 'Failed to generate image. Please try again.',
    };
  }
};

/**
 * Check if we have a cached result for this prompt and user
 */
const checkImageCache = async (
  userId: string,
  prompt: string
): Promise<string | null> => {
  try {
    // Create a cache key based on user ID and prompt
    const cacheKey = `${userId}_${prompt.replace(/\s+/g, '_').toLowerCase()}`;
    
    // Check if we have this key in AsyncStorage
    const cachedUrl = await AsyncStorage.getItem(`ai_image_${cacheKey}`);
    
    if (cachedUrl) {
      // Verify the cached image still exists
      const cachedImagePath = await getCachedImage(cachedUrl);
      return cachedImagePath;
    }
    
    return null;
  } catch (error) {
    console.error('Error checking image cache:', error);
    return null;
  }
};

/**
 * Cache image result for future use
 */
const cacheImageResult = async (
  userId: string,
  prompt: string,
  imageUrl: string
): Promise<void> => {
  try {
    // Create a cache key based on user ID and prompt
    const cacheKey = `${userId}_${prompt.replace(/\s+/g, '_').toLowerCase()}`;
    
    // Cache the URL
    await AsyncStorage.setItem(`ai_image_${cacheKey}`, imageUrl);
    
    // Download and cache the actual image
    await getCachedImage(imageUrl);
  } catch (error) {
    console.error('Error caching image result:', error);
  }
};

/**
 * Get cached image or download and cache it - NOW EXPORTED
 */
export const getCachedImage = async (imageUrl: string): Promise<string> => {
  try {
    // Create filename from URL
    const filename = `cached_image_${Date.now()}.jpg`;
    const fileUri = `${FileSystem.cacheDirectory}${filename}`;
    
    // Check if already cached by checking if file exists
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    if (fileInfo.exists) {
      return fileUri;
    }
    
    // Download the image
    const downloadResult = await FileSystem.downloadAsync(imageUrl, fileUri);
    
    if (downloadResult.status === 200) {
      return downloadResult.uri;
    } else {
      throw new Error('Failed to download image');
    }
  } catch (error) {
    console.error('Error getting cached image:', error);
    // Return original URL as fallback
    return imageUrl;
  }
};

/**
 * Get cache directory size - FIXED VERSION
 */
export const getCacheSize = async (): Promise<number> => {
  try {
    const cacheDir = FileSystem.cacheDirectory;
    
    // FIX 1: Check if cacheDir is null
    if (!cacheDir) {
      console.warn('Cache directory is not available');
      return 0;
    }
    
    // FIX 2: Get directory info and handle the correct property structure
    const dirInfo = await FileSystem.getInfoAsync(cacheDir);
    
    if (!dirInfo.exists) {
      return 0;
    }
    
    // FIX 3: FileInfo doesn't have a 'size' property for directories
    // We need to calculate the size differently for directories
    if (dirInfo.isDirectory) {
      return await calculateDirectorySize(cacheDir);
    } else {
      // For files, we can get size from FileInfo if it exists
      const fileInfo = dirInfo as FileSystem.FileInfo & { size?: number };
      return fileInfo.size || 0;
    }
  } catch (error) {
    console.error('Error getting cache size:', error);
    return 0;
  }
};

/**
 * Calculate total size of all files in a directory
 */
const calculateDirectorySize = async (directoryUri: string): Promise<number> => {
  try {
    const dirContents = await FileSystem.readDirectoryAsync(directoryUri);
    let totalSize = 0;
    
    for (const item of dirContents) {
      const itemUri = `${directoryUri}${item}`;
      const itemInfo = await FileSystem.getInfoAsync(itemUri);
      
      if (itemInfo.exists && !itemInfo.isDirectory) {
        // For files, try to get size (though it's not always available in FileInfo)
        const fileInfo = itemInfo as FileSystem.FileInfo & { size?: number };
        if (fileInfo.size) {
          totalSize += fileInfo.size;
        }
      }
    }
    
    return totalSize;
  } catch (error) {
    console.error('Error calculating directory size:', error);
    return 0;
  }
};

/**
 * Clear image cache
 */
export const clearImageCache = async (): Promise<void> => {
  try {
    const cacheDir = FileSystem.cacheDirectory;
    
    if (!cacheDir) {
      console.warn('Cache directory is not available');
      return;
    }
    
    // Clear AsyncStorage cache keys
    const keys = await AsyncStorage.getAllKeys();
    const imageKeys = keys.filter(key => key.startsWith('ai_image_'));
    await AsyncStorage.multiRemove(imageKeys);
    
    // Clear cached files
    const dirContents = await FileSystem.readDirectoryAsync(cacheDir);
    const imageFiles = dirContents.filter(file => 
      file.startsWith('cached_image_') && 
      (file.endsWith('.jpg') || file.endsWith('.png'))
    );
    
    for (const file of imageFiles) {
      const fileUri = `${cacheDir}${file}`;
      await FileSystem.deleteAsync(fileUri, { idempotent: true });
    }
    
    console.log('Image cache cleared successfully');
  } catch (error) {
    console.error('Error clearing image cache:', error);
  }
};

/**
 * Get cache statistics
 */
export const getCacheStats = async (): Promise<{
  totalSize: number;
  fileCount: number;
  oldestFile: Date | null;
}> => {
  try {
    const cacheDir = FileSystem.cacheDirectory;
    
    if (!cacheDir) {
      return { totalSize: 0, fileCount: 0, oldestFile: null };
    }
    
    const dirContents = await FileSystem.readDirectoryAsync(cacheDir);
    const imageFiles = dirContents.filter(file => 
      file.startsWith('cached_image_') && 
      (file.endsWith('.jpg') || file.endsWith('.png'))
    );
    
    let totalSize = 0;
    let oldestDate: Date | null = null;
    
    for (const file of imageFiles) {
      const fileUri = `${cacheDir}${file}`;
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      
      if (fileInfo.exists && !fileInfo.isDirectory) {
        // Try to get file size
        const fileInfoWithSize = fileInfo as FileSystem.FileInfo & { size?: number };
        if (fileInfoWithSize.size) {
          totalSize += fileInfoWithSize.size;
        }
        
        // Try to get modification time
        const fileInfoWithTime = fileInfo as FileSystem.FileInfo & { modificationTime?: number };
        if (fileInfoWithTime.modificationTime) {
          const fileDate = new Date(fileInfoWithTime.modificationTime * 1000);
          if (!oldestDate || fileDate < oldestDate) {
            oldestDate = fileDate;
          }
        }
      }
    }
    
    return {
      totalSize,
      fileCount: imageFiles.length,
      oldestFile: oldestDate,
    };
  } catch (error) {
    console.error('Error getting cache stats:', error);
    return { totalSize: 0, fileCount: 0, oldestFile: null };
  }
};

/**
 * Manage cache size - clean up old files if cache is too large
 */
export const manageCacheSize = async (maxSizeBytes: number = 50 * 1024 * 1024): Promise<void> => {
  try {
    const currentSize = await getCacheSize();
    
    if (currentSize <= maxSizeBytes) {
      console.log(`Cache size (${currentSize} bytes) is within limit (${maxSizeBytes} bytes)`);
      return;
    }
    
    console.log(`Cache size (${currentSize} bytes) exceeds limit (${maxSizeBytes} bytes). Cleaning up...`);
    
    const cacheDir = FileSystem.cacheDirectory;
    if (!cacheDir) {
      console.warn('Cache directory is not available');
      return;
    }
    
    // Get all cached image files with their modification times
    const dirContents = await FileSystem.readDirectoryAsync(cacheDir);
    const imageFiles = dirContents.filter(file => 
      file.startsWith('cached_image_') && 
      (file.endsWith('.jpg') || file.endsWith('.png'))
    );
    
    // Get file info with modification times
    const filesWithInfo = await Promise.all(
      imageFiles.map(async (file) => {
        const fileUri = `${cacheDir}${file}`;
        const fileInfo = await FileSystem.getInfoAsync(fileUri);
        
        const fileInfoWithTime = fileInfo as FileSystem.FileInfo & { 
          modificationTime?: number;
          size?: number;
        };
        
        return {
          uri: fileUri,
          name: file,
          modificationTime: fileInfoWithTime.modificationTime || 0,
          size: fileInfoWithTime.size || 0,
        };
      })
    );
    
    // Sort by modification time (oldest first)
    const sortedFiles = filesWithInfo.sort((a, b) => a.modificationTime - b.modificationTime);
    
    // Delete oldest files until we're under the size limit
    let deletedSize = 0;
    for (const file of sortedFiles) {
      try {
        await FileSystem.deleteAsync(file.uri, { idempotent: true });
        deletedSize += file.size;
        console.log(`Deleted cached file: ${file.name} (${file.size} bytes)`);
        
        // Check if we've freed up enough space
        if (currentSize - deletedSize <= maxSizeBytes) {
          break;
        }
      } catch (error) {
        console.error(`Failed to delete cached file ${file.name}:`, error);
      }
    }
    
    console.log(`Cache cleanup complete. Freed ${deletedSize} bytes.`);
  } catch (error) {
    console.error('Error managing cache size:', error);
  }
};

/**
 * Optimize image for better performance and smaller file size
 */
export const optimizeImage = async (
  imageUri: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'jpeg' | 'png';
  } = {}
): Promise<string> => {
  try {
    const {
      width = 400,
      height = 400,
      quality = 0.8,
      format = 'jpeg'
    } = options;

    console.log('Optimizing image:', imageUri);

    // Use ImageManipulator to resize and compress
    const result = await ImageManipulator.manipulateAsync(
      imageUri,
      [
        { resize: { width, height } }
      ],
      {
        compress: quality,
        format: format === 'jpeg' ? ImageManipulator.SaveFormat.JPEG : ImageManipulator.SaveFormat.PNG,
        base64: false,
      }
    );

    console.log('Image optimized successfully:', result.uri);
    return result.uri;
  } catch (error) {
    console.error('Error optimizing image:', error);
    // Return original URI as fallback
    return imageUri;
  }
};