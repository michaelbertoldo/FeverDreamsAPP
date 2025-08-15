// src/utils/imageOptimization.ts
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { Platform } from 'react-native';
import { Image } from 'react-native';

// Cache generated images locally
export const cacheImage = async (url: string): Promise<string> => {
  try {
    const filename = url.split('/').pop();
    const cacheDir = `${FileSystem.cacheDirectory}images/`;
    const filePath = `${cacheDir}${filename}`;
    
    // Ensure cache directory exists
    await FileSystem.makeDirectoryAsync(cacheDir, { intermediates: true }).catch(() => {});
    
    // Download and cache the file
    await FileSystem.downloadAsync(url, filePath);
    
    return filePath;
  } catch (error) {
    console.error('Image caching error:', error);
    return url; // Return original URL if caching fails
  }
};

// Optimize image for display
export const optimizeImage = async (uri: string, width: number = 600): Promise<string> => {
  try {
    // Check if it's a local file - handle null documentDirectory
    const documentDirectory = FileSystem.documentDirectory || '';
    const isLocalFile = uri.startsWith('file://') || uri.startsWith(documentDirectory);
    
    // Only optimize if it's a local file
    if (!isLocalFile) {
      return uri;
    }
    
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width } }],
      { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
    );
    
    return result.uri;
  } catch (error) {
    console.error('Image optimization error:', error);
    return uri; // Return original URI if optimization fails
  }
};

// Preload images for smoother display
export const preloadImages = async (urls: string[]): Promise<void> => {
  try {
    if (Platform.OS === 'ios') {
      // On iOS, we can use Image.prefetch
      const promises = urls.map(url => Image.prefetch(url));
      await Promise.all(promises);
    } else {
      // On Android, we'll download to cache
      const promises = urls.map(url => cacheImage(url));
      await Promise.all(promises);
    }
  } catch (error) {
    console.error('Image preloading error:', error);
  }
};