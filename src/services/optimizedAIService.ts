// src/services/optimizedAIService.ts
import { replicateApi, FLUX_KONTEXT_MODEL, FALLBACK_MODEL } from '../config/replicate';
import { optimizeImage, getCachedImage } from './optimizedImageService';
import { getUserSelfie } from './selfieService';
import { getNetworkState } from '../utils/networkResilience';
import { getBatteryLevel } from '../utils/deviceInfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Generation quality presets
const QUALITY_PRESETS = {
  HIGH: {
    num_inference_steps: 30,
    guidance_scale: 7.5,
  },
  MEDIUM: {
    num_inference_steps: 20,
    guidance_scale: 7.0,
  },
  LOW: {
    num_inference_steps: 15,
    guidance_scale: 6.5,
  },
};

// Timeout configuration
const TIMEOUT_CONFIG = {
  INITIAL_REQUEST: 10000, // 10 seconds
  POLLING_INTERVAL: 1000, // 1 second
  MAX_POLLING_TIME: 30000, // 30 seconds
};

// Retry configuration
const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  RETRY_DELAY: 2000, // 2 seconds
};

/**
 * Generate AI image with optimized pipeline
 */
export const generateOptimizedAIImage = async (
  prompt: string,
  userId: string,
  options: {
    prioritizeSpeed?: boolean;
    forceHighQuality?: boolean;
    useCache?: boolean;
  } = {}
): Promise<{ success: boolean; imageUrl: string; error?: string }> => {
  try {
    // Default options
    const {
      prioritizeSpeed = false,
      forceHighQuality = false,
      useCache = true,
    } = options;
    
    // Check if we have a cached result for this prompt and user
    if (useCache) {
      const cachedResult = await checkImageCache(userId, prompt);
      if (cachedResult) {
        console.log('Using cached AI image result');
        return { success: true, imageUrl: cachedResult };
      }
    }
    
    // Get and optimize user selfie
    const selfieUrl = await getUserSelfie(userId);
    if (!selfieUrl) {
      return { 
        success: false, 
        imageUrl: '', 
        error: 'No selfie found for user' 
      };
    }
    
    // Optimize selfie for AI processing
    const optimizedSelfie = await optimizeImage(selfieUrl, 'ai-input');
    
    // Determine optimal generation parameters
    const generationParams = await determineOptimalParameters(
      prioritizeSpeed,
      forceHighQuality
    );
    
    // Start generation with timeout
    const generationPromise = startImageGeneration(
      optimizedSelfie,
      prompt,
      generationParams
    );
    
    // Set timeout for initial request
    const timeoutPromise = new Promise<{ success: boolean; imageUrl: string; error: string }>(
      (resolve) => {
        setTimeout(() => {
          resolve({
            success: false,
            imageUrl: '',
            error: 'Initial request timed out',
          });
        }, TIMEOUT_CONFIG.INITIAL_REQUEST);
      }
    );
    
    // Race between generation and timeout
    const result = await Promise.race([generationPromise, timeoutPromise]);
    
    // If successful, cache the result
    if (result.success && result.imageUrl && useCache) {
      await cacheImageResult(userId, prompt, result.imageUrl);
    }
    
    return result;
  } catch (error) {
    console.error('Error in optimized AI image generation:', error);
    return {
      success: false,
      imageUrl: '',
      error: error.message || 'Unknown error in AI generation',
    };
  }
};

/**
 * Start image generation with Replicate API
 */
const startImageGeneration = async (
  selfieUrl: string,
  prompt: string,
  params: any,
  retryCount = 0
): Promise<{ success: boolean; imageUrl: string; error?: string }> => {
  try {
    // Create prediction with Replicate API
    const response = await replicateApi.post('/predictions', {
      version: FLUX_KONTEXT_MODEL,
      input: {
        image: selfieUrl,
        prompt: prompt,
        ...params,
      },
    });
    
    // Get prediction ID
    const predictionId = response.data.id;
    
    // Poll for results
    return await pollForResults(predictionId);
  } catch (error) {
    // Handle retry logic
    if (retryCount < RETRY_CONFIG.MAX_RETRIES) {
      console.log(`Retrying AI generation (${retryCount + 1}/${RETRY_CONFIG.MAX_RETRIES})...`);
      
      // Wait before retrying
      await new Promise((resolve) => 
        setTimeout(resolve, RETRY_CONFIG.RETRY_DELAY)
      );
      
      // Try fallback model on second retry
      if (retryCount === 1) {
        console.log('Trying fallback model...');
        return await startFallbackGeneration(selfieUrl, prompt, params, retryCount + 1);
      }
      
      // Retry with same model
      return await startImageGeneration(selfieUrl, prompt, params, retryCount + 1);
    }
    
    console.error('Error starting image generation:', error);
    return {
      success: false,
      imageUrl: '',
      error: error.message || 'Failed to start image generation',
    };
  }
};

/**
 * Start generation with fallback model
 */
const startFallbackGeneration = async (
  selfieUrl: string,
  prompt: string,
  params: any,
  retryCount: number
): Promise<{ success: boolean; imageUrl: string; error?: string }> => {
  try {
    // Create prediction with fallback model
    const response = await replicateApi.post('/predictions', {
      version: FALLBACK_MODEL,
      input: {
        prompt: `A cartoon style image of a person with prompt: ${prompt}`,
        negative_prompt: 'blurry, distorted, low quality, disfigured',
        width: 512,
        height: 512,
        num_inference_steps: params.num_inference_steps,
        guidance_scale: params.guidance_scale,
      },
    });
    
    // Get prediction ID
    const predictionId = response.data.id;
    
    // Poll for results
    return await pollForResults(predictionId);
  } catch (error) {
    console.error('Error with fallback generation:', error);
    
    // Try one more time with original model if fallback fails
    if (retryCount < RETRY_CONFIG.MAX_RETRIES) {
      return await startImageGeneration(selfieUrl, prompt, params, retryCount + 1);
    }
    
    return {
      success: false,
      imageUrl: '',
      error: error.message || 'Failed with both primary and fallback models',
    };
  }
};

/**
 * Poll for generation results
 */
const pollForResults = async (
  predictionId: string,
  startTime = Date.now()
): Promise<{ success: boolean; imageUrl: string; error?: string }> => {
  try {
    // Check if we've exceeded maximum polling time
    if (Date.now() - startTime > TIMEOUT_CONFIG.MAX_POLLING_TIME) {
      return {
        success: false,
        imageUrl: '',
        error: 'Generation timed out',
      };
    }
    
    // Get prediction status
    const response = await replicateApi.get(`/predictions/${predictionId}`);
    const status = response.data.status;
    
    // Check status
    if (status === 'succeeded') {
      // Get output image URL
      const imageUrl = response.data.output;
      
      if (Array.isArray(imageUrl) && imageUrl.length > 0) {
        return {
          success: true,
          imageUrl: imageUrl[0],
        };
      } else if (typeof imageUrl === 'string') {
        return {
          success: true,
          imageUrl,
        };
      } else {
        return {
          success: false,
          imageUrl: '',
          error: 'Invalid output format from API',
        };
      }
    } else if (status === 'failed') {
      return {
        success: false,
        imageUrl: '',
        error: response.data.error || 'Generation failed',
      };
    } else {
      // Wait before polling again
      await new Promise((resolve) => 
        setTimeout(resolve, TIMEOUT_CONFIG.POLLING_INTERVAL)
      );
      
      // Poll again
      return await pollForResults(predictionId, startTime);
    }
  } catch (error) {
    console.error('Error polling for results:', error);
    return {
      success: false,
      imageUrl: '',
      error: error.message || 'Failed to poll for results',
    };
  }
};

/**
 * Determine optimal generation parameters based on device and network conditions
 */
const determineOptimalParameters = async (
  prioritizeSpeed: boolean,
  forceHighQuality: boolean
): Promise<any> => {
  // Get network state
  const networkState = await getNetworkState();
  
  // Get battery level
  const batteryLevel = await getBatteryLevel();
  
  // Default to medium quality
  let qualityPreset = QUALITY_PRESETS.MEDIUM;
  
  // Adjust based on conditions
  if (forceHighQuality) {
    // User explicitly requested high quality
    qualityPreset = QUALITY_PRESETS.HIGH;
  } else if (prioritizeSpeed || batteryLevel < 0.2) {
    // Prioritize speed or low battery
    qualityPreset = QUALITY_PRESETS.LOW;
  } else if (!networkState.isConnected || networkState.type !== 'wifi') {
    // Poor network conditions
    qualityPreset = QUALITY_PRESETS.LOW;
  } else if (networkState.type === 'wifi' && batteryLevel > 0.5) {
    // Good conditions
    qualityPreset = QUALITY_PRESETS.HIGH;
  }
  
  return {
    ...qualityPreset,
    // Add any additional parameters here
  };
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
