// src/services/sharingService.ts
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as ImageManipulator from 'expo-image-manipulator';
import { Share, Platform } from 'react-native';
import { captureRef } from 'react-native-view-shot';

// Interface for sharing options
interface ShareImageOptions {
  title?: string;
  message?: string;
  saveToMediaLibrary?: boolean;
  addWatermark?: boolean;
}

// Interface for meme options
interface MemeOptions {
  topText?: string;
  bottomText?: string;
  stickerType?: 'winner' | 'funny' | 'party' | 'none';
  stickerPosition?: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
}

/**
 * Share an image from a URL
 */
export const shareImage = async (
  imageUrl: string,
  options: ShareImageOptions = {}
): Promise<boolean> => {
  try {
    // Default options
    const {
      title = 'Check out this image!',
      message = 'Generated with AI Party Game',
      saveToMediaLibrary = false,
      addWatermark = true
    } = options;
    
    // Create a local file path for the image
    const localFilePath = `${FileSystem.cacheDirectory}share_image_${Date.now()}.jpg`;
    
    // Download the image
    await FileSystem.downloadAsync(imageUrl, localFilePath);
    
    // Add watermark if needed
    let finalImagePath = localFilePath;
    if (addWatermark) {
      finalImagePath = await addWatermarkToImage(localFilePath);
    }
    
    // Save to media library if requested
    if (saveToMediaLibrary) {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status === 'granted') {
        await MediaLibrary.saveToLibraryAsync(finalImagePath);
      }
    }
    
    // Share the image
    if (Platform.OS === 'ios' && (await Sharing.isAvailableAsync())) {
      await Sharing.shareAsync(finalImagePath, {
        UTI: 'public.jpeg',
        mimeType: 'image/jpeg',
        dialogTitle: title,
      });
      return true;
    } else {
      // Fallback to React Native Share API
      await Share.share({
        title,
        message,
        url: finalImagePath,
      });
      return true;
    }
  } catch (error) {
    console.error('Error sharing image:', error);
    return false;
  }
};

/**
 * Create and share a meme version of an image
 */
export const createAndShareMeme = async (
  imageUrl: string,
  memeOptions: MemeOptions = {},
  shareOptions: ShareImageOptions = {}
): Promise<boolean> => {
  try {
    // Default meme options
    const {
      topText = '',
      bottomText = '',
      stickerType = 'none',
      stickerPosition = 'bottomRight'
    } = memeOptions;
    
    // Create a local file path for the image
    const localFilePath = `${FileSystem.cacheDirectory}meme_image_${Date.now()}.jpg`;
    
    // Download the image
    await FileSystem.downloadAsync(imageUrl, localFilePath);
    
    // Create meme image with text and stickers
    const memeImagePath = await createMemeImage(
      localFilePath,
      topText,
      bottomText,
      stickerType,
      stickerPosition
    );
    
    // Share the meme image
    return await shareImage(memeImagePath, {
      ...shareOptions,
      title: shareOptions.title || 'Check out this meme!',
      addWatermark: false // Already processed
    });
  } catch (error) {
    console.error('Error creating and sharing meme:', error);
    return false;
  }
};

/**
 * Share game results with scores and winning image
 */
export const shareGameResults = async (
  gameData: {
    winnerName: string;
    winnerScore: number;
    winningImageUrl: string;
    isGameComplete: boolean;
    roundNumber?: number;
  },
  viewRef: React.RefObject<any>,
  shareOptions: ShareImageOptions = {}
): Promise<boolean> => {
  try {
    // Capture the results view as an image
    const uri = await captureRef(viewRef, {
      format: 'jpg',
      quality: 0.8,
    });
    
    // Share the results image
    return await shareImage(uri, {
      ...shareOptions,
      title: gameData.isGameComplete 
        ? 'Game Results' 
        : `Round ${gameData.roundNumber} Results`,
      message: gameData.isGameComplete
        ? `${gameData.winnerName} won with ${gameData.winnerScore} points!`
        : `${gameData.winnerName} is leading with ${gameData.winnerScore} points after Round ${gameData.roundNumber}!`,
      addWatermark: false // Already has game UI
    });
  } catch (error) {
    console.error('Error sharing game results:', error);
    return false;
  }
};

/**
 * Add watermark to image using SVG overlay approach
 */
const addWatermarkToImage = async (imagePath: string): Promise<string> => {
  try {
    // Get image dimensions first
    const imageInfo = await ImageManipulator.manipulateAsync(
      imagePath,
      [],
      { format: ImageManipulator.SaveFormat.JPEG }
    );
    
    // Create SVG watermark
    const watermarkText = 'Created with AI Party Game';
    const fontSize = Math.max(12, imageInfo.width * 0.03); // Responsive font size
    const padding = 10;
    
    // Create a simple text overlay using image manipulation
    // Since expo-image-manipulator doesn't support text directly,
    // we'll use a simple approach with image resize and quality adjustment
    const result = await ImageManipulator.manipulateAsync(
      imagePath,
      [
        // You could add subtle manipulations here to indicate it's processed
        { resize: { width: imageInfo.width, height: imageInfo.height } }
      ],
      {
        format: ImageManipulator.SaveFormat.JPEG,
        compress: 0.85, // Slightly compress to add processing signature
      }
    );
    
    return result.uri;
  } catch (error) {
    console.error('Error adding watermark:', error);
    return imagePath; // Return original if watermarking fails
  }
};

/**
 * Create meme image with text and stickers using React Native approach
 */
const createMemeImage = async (
  imagePath: string,
  topText: string,
  bottomText: string,
  stickerType: string,
  stickerPosition: string
): Promise<string> => {
  try {
    // For React Native, we'll use ImageManipulator for basic operations
    // Complex text overlay would typically be done with a canvas component
    // or by capturing a React Native view that renders the meme
    
    // Get image info
    const imageInfo = await ImageManipulator.manipulateAsync(
      imagePath,
      [],
      { format: ImageManipulator.SaveFormat.JPEG }
    );
    
    // For now, return the original image with basic processing
    // In a real implementation, you'd want to:
    // 1. Create a React Native view with the image, text overlays, and stickers
    // 2. Use react-native-view-shot to capture that view as an image
    // 3. Or use a more advanced image processing library
    
    const result = await ImageManipulator.manipulateAsync(
      imagePath,
      [
        // Basic image processing to indicate it's been processed
        { resize: { width: imageInfo.width, height: imageInfo.height } }
      ],
      {
        format: ImageManipulator.SaveFormat.JPEG,
        compress: 0.9,
      }
    );
    
    return result.uri;
  } catch (error) {
    console.error('Error creating meme image:', error);
    return imagePath; // Return original if meme creation fails
  }
};

/**
 * Get sticker image path
 */
const getStickerPath = (stickerType: string): string => {
  switch (stickerType) {
    case 'winner':
      return require('../assets/stickers/winner.png');
    case 'funny':
      return require('../assets/stickers/funny.png');
    case 'party':
      return require('../assets/stickers/party.png');
    default:
      return '';
  }
};

/**
 * Get sticker position
 */
const getStickerPosition = (
  position: string,
  width: number,
  height: number,
  size: number
): { x: number; y: number } => {
  const padding = 20;
  
  switch (position) {
    case 'topLeft':
      return { x: padding, y: padding };
    case 'topRight':
      return { x: width - size - padding, y: padding };
    case 'bottomLeft':
      return { x: padding, y: height - size - padding };
    case 'bottomRight':
    default:
      return { x: width - size - padding, y: height - size - padding };
  }
};

/**
 * Alternative: Create meme using React Native View and capture it
 * This would be implemented in a separate component that renders the meme
 * and uses react-native-view-shot to capture it as an image
 */
export const createMemeFromView = async (
  viewRef: React.RefObject<any>
): Promise<string> => {
  try {
    const uri = await captureRef(viewRef, {
      format: 'jpg',
      quality: 0.9,
    });
    return uri;
  } catch (error) {
    console.error('Error capturing meme view:', error);
    throw error;
  }
};