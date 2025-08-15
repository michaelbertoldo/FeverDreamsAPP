// src/services/optimizedAIImages.ts - FIXED VERSION
import { optimizeImage, getCachedImage, manageCacheSize } from './optimizedImageService';

interface AIGenerationOptions {
  prioritizeSpeed?: boolean;
  forceHighQuality?: boolean;
  useCache?: boolean;
}

interface PredictionResponse {
  id: string;
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  output?: string[];
  error?: string;
}

export const generateOptimizedAIImage = async (
  prompt: string,
  userId: string,
  options: AIGenerationOptions = {}
): Promise<{ success: boolean; imageUrl?: string; error?: string }> => {
  try {
    console.log('Generating AI image with prompt:', prompt);
    console.log('User ID:', userId);
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
    
    // Start AI generation
    const predictionId = await startAIGeneration(prompt, options);
    
    if (!predictionId) {
      return {
        success: false,
        error: 'Failed to start AI generation',
      };
    }
    
    // Poll for results
    const result = await pollForResults(predictionId, options.prioritizeSpeed ? 30000 : 60000);
    
    if (!result.success || !result.imageUrl) {
      return {
        success: false,
        error: result.error || 'Failed to generate image',
      };
    }
    
    // Optimize the generated image
    let finalImageUrl = result.imageUrl;
    
    try {
      // FIX 2: Remove the incorrect "ai-input" parameter and use proper optimization options
      const optimizedUri = await optimizeImage(result.imageUrl, {
        width: options.forceHighQuality ? 800 : 400,
        height: options.forceHighQuality ? 800 : 400,
        quality: options.forceHighQuality ? 0.9 : 0.8,
        format: 'jpeg'
      });
      
      finalImageUrl = optimizedUri;
      console.log('Image optimized successfully');
    } catch (optimizeError) {
      console.warn('Image optimization failed, using original:', optimizeError);
      // Continue with original image if optimization fails
    }
    
    // Cache the result if caching is enabled
    if (options.useCache) {
      try {
        await cacheImageResult(userId, prompt, finalImageUrl);
      } catch (cacheError) {
        console.warn('Failed to cache image:', cacheError);
        // Don't fail the whole operation if caching fails
      }
    }
    
    // Manage cache size
    try {
      await manageCacheSize();
    } catch (cacheManageError) {
      console.warn('Failed to manage cache size:', cacheManageError);
    }
    
    return {
      success: true,
      imageUrl: finalImageUrl,
    };
  } catch (error) {
    console.error('AI image generation failed:', error);
    
    // FIX 1: Proper error handling with type checking
    const errorMessage = error instanceof Error 
      ? error.message 
      : typeof error === 'string' 
        ? error 
        : 'An unexpected error occurred';
    
    return {
      success: false,
      error: errorMessage,
    };
  }
};

/**
 * Start AI image generation (mock implementation)
 */
const startAIGeneration = async (
  prompt: string, 
  options: AIGenerationOptions
): Promise<string | null> => {
  try {
    // Mock API call to start generation
    // In real implementation, this would call Replicate API
    
    console.log('Starting AI generation for prompt:', prompt);
    
    // Simulate API response delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Return mock prediction ID
    return `prediction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  } catch (error) {
    console.error('Failed to start AI generation:', error);
    return null;
  }
};

/**
 * Poll for AI generation results
 */
const pollForResults = async (
  predictionId: string, 
  timeoutMs: number = 60000
): Promise<{ success: boolean; imageUrl?: string; error?: string }> => {
  const startTime = Date.now();
  const pollInterval = 2000; // Poll every 2 seconds
  
  while (Date.now() - startTime < timeoutMs) {
    try {
      // Mock polling - in real implementation, this would call Replicate API
      const result = await checkGenerationStatus(predictionId);
      
      if (result.status === 'succeeded') {
        if (result.output && result.output.length > 0) {
          return {
            success: true,
            imageUrl: result.output[0],
          };
        } else {
          return {
            success: false,
            error: 'No output received from AI generation',
          };
        }
      } else if (result.status === 'failed' || result.status === 'canceled') {
        return {
          success: false,
          error: result.error || `Generation ${result.status}`,
        };
      }
      
      // Still processing, wait before next poll
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    } catch (error) {
      console.error('Error polling for results:', error);
      
      // FIX 1: Proper error handling with type checking
      const errorMessage = error instanceof Error 
        ? error.message 
        : typeof error === 'string' 
          ? error 
          : 'Failed to poll for results';
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  }
  
  // Timeout reached
  return {
    success: false,
    error: 'Generation timed out',
  };
};

/**
 * Check generation status (mock implementation)
 */
const checkGenerationStatus = async (predictionId: string): Promise<PredictionResponse> => {
  // Mock implementation - replace with actual Replicate API call
  
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Mock successful generation after some time
  const isReady = Math.random() > 0.3; // 70% chance of being ready
  
  if (isReady) {
    return {
      id: predictionId,
      status: 'succeeded',
      output: [`https://picsum.photos/800/800?random=${Date.now()}`],
    };
  } else {
    return {
      id: predictionId,
      status: 'processing',
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
    const cacheKey = `ai_image_${userId}_${prompt.replace(/\s+/g, '_').toLowerCase()}`;
    
    // For this mock implementation, we'll just return null
    // In real implementation, you'd check AsyncStorage or your cache system
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
    const cacheKey = `ai_image_${userId}_${prompt.replace(/\s+/g, '_').toLowerCase()}`;
    
    console.log('Caching image result for key:', cacheKey);
    
    // Cache the image locally
    await getCachedImage(imageUrl);
    
    console.log('Image cached successfully');
  } catch (error) {
    console.error('Error caching image result:', error);
    throw error;
  }
};