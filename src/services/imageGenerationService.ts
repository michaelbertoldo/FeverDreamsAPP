// src/services/imageGenerationService.ts - COMPLETE UPDATED VERSION
import axios from 'axios';
import { auth } from '../config/firebase';
import { getUserSelfie } from './selfieService';

// Your Firebase Functions URL
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://us-central1-feverdreams-9c94c.cloudfunctions.net/api';

interface GenerationResult {
  success: boolean;
  imageUrl: string;
  generationId: string;
  fallback?: boolean;
  error?: string;
  model?: string;
  quality?: 'high' | 'standard';
}

interface GenerationOptions {
  prioritizeSpeed?: boolean;
  maxRetries?: number;
  gameId?: string;
  promptId?: string;
}

/**
 * Generate AI image with user's face + creative prompt
 * Uses Flux Dev for best quality party game images!
 */
export const generateAIImage = async (
  prompt: string,
  options: GenerationOptions = {}
): Promise<GenerationResult> => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      throw new Error('User not authenticated. Please sign in first.');
    }

    console.log('🎨 Starting AI image generation...', { prompt, userId });

    // Get user's selfie URL from secure storage
    const selfieUrl = await getUserSelfie(userId);
    if (!selfieUrl) {
      throw new Error('Please upload a selfie first! Go to Profile → Upload Selfie');
    }

    // Prepare the request
    const requestData = {
      prompt,
      selfieUrl,
      gameId: options.gameId || `game_${Date.now()}`,
      userId,
      promptId: options.promptId || `prompt_${Date.now()}`
    };

    console.log('🚀 Calling AI generation API...');

    const response = await axios.post(`${API_BASE_URL}/generate-image`, requestData, {
      timeout: options.prioritizeSpeed ? 30000 : 90000, // 30s or 90s timeout
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.data.success) {
      console.log('✅ AI image generated successfully!', {
        imageUrl: response.data.imageUrl,
        model: response.data.model,
        fallback: response.data.fallback
      });

      return {
        success: true,
        imageUrl: response.data.imageUrl,
        generationId: response.data.generationId,
        fallback: response.data.fallback || false,
        model: response.data.model,
        quality: response.data.quality
      };
    } else {
      throw new Error(response.data.error || 'Unknown generation error');
    }

  } catch (error) {
    console.error('❌ AI image generation failed:', error);
    
    // Handle different types of errors
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        return {
          success: false,
          imageUrl: '',
          generationId: '',
          error: 'Generation timed out. The AI is working hard - please try again!'
        };
      }
      
      if (error.response?.status === 429) {
        return {
          success: false,
          imageUrl: '',
          generationId: '',
          error: 'Too many requests. Please wait a moment and try again.'
        };
      }
      
      const errorMessage = error.response?.data?.error || error.message;
      return {
        success: false,
        imageUrl: '',
        generationId: '',
        error: `Generation failed: ${errorMessage}`
      };
    }

    return {
      success: false,
      imageUrl: '',
      generationId: '',
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

/**
 * Generate image for game round
 */
export const generateGameImage = async (
  prompt: string,
  gameId: string,
  promptId: string
): Promise<GenerationResult> => {
  console.log('🎮 Generating image for game round...', { gameId, promptId, prompt });
  
  return generateAIImage(prompt, {
    gameId,
    promptId,
    prioritizeSpeed: false, // Use high quality for game images
    maxRetries: 2
  });
};

/**
 * Generate quick preview image (faster, lower quality)
 */
export const generatePreviewImage = async (
  prompt: string
): Promise<GenerationResult> => {
  console.log('⚡ Generating quick preview...', { prompt });
  
  return generateAIImage(prompt, {
    prioritizeSpeed: true,
    maxRetries: 1
  });
};

/**
 * Retry failed generation with exponential backoff
 */
export const retryGeneration = async (
  prompt: string,
  options: GenerationOptions = {},
  attempt: number = 1
): Promise<GenerationResult> => {
  const maxAttempts = options.maxRetries || 3;
  
  if (attempt > maxAttempts) {
    return {
      success: false,
      imageUrl: '',
      generationId: '',
      error: `Failed after ${maxAttempts} attempts. Please try again later.`
    };
  }

  console.log(`🔄 Retry attempt ${attempt}/${maxAttempts}...`);
  
  // Wait before retrying (exponential backoff)
  if (attempt > 1) {
    const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Max 5 second delay
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  try {
    const result = await generateAIImage(prompt, options);
    
    if (!result.success && attempt < maxAttempts) {
      return retryGeneration(prompt, options, attempt + 1);
    }
    
    return result;
  } catch (error) {
    if (attempt < maxAttempts) {
      return retryGeneration(prompt, options, attempt + 1);
    }
    
    return {
      success: false,
      imageUrl: '',
      generationId: '',
      error: error instanceof Error ? error.message : 'Retry failed'
    };
  }
};

/**
 * Check generation status (for polling if needed)
 */
export const getGenerationStatus = async (generationId: string) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/generation-status/${generationId}`);
    return response.data;
  } catch (error) {
    console.error('Error getting generation status:', error);
    throw error;
  }
};

/**
 * Validate prompt before generation
 */
export const validatePrompt = (prompt: string): { isValid: boolean; error?: string } => {
  if (!prompt || prompt.trim().length === 0) {
    return { isValid: false, error: 'Please enter a creative prompt!' };
  }
  
  if (prompt.length < 3) {
    return { isValid: false, error: 'Prompt too short. Be more creative!' };
  }
  
  if (prompt.length > 200) {
    return { isValid: false, error: 'Prompt too long. Keep it under 200 characters.' };
  }
  
  // Check for inappropriate content (basic filter)
  const inappropriate = ['explicit', 'nsfw', 'nude', 'naked', 'sexual'];
  const lowerPrompt = prompt.toLowerCase();
  
  for (const word of inappropriate) {
    if (lowerPrompt.includes(word)) {
      return { isValid: false, error: 'Please keep prompts family-friendly!' };
    }
  }
  
  return { isValid: true };
};

/**
 * Get suggested prompts for the game
 */
export const getSuggestedPrompts = (): string[] => {
  return [
    "riding a dinosaur",
    "as a superhero flying through the sky",
    "cooking in a chaotic kitchen",
    "as a pirate captain on a ship",
    "surfing on a rainbow",
    "as a wizard casting spells",
    "riding a unicorn through clouds",
    "as a rockstar on stage",
    "in a jungle with monkeys",
    "as an astronaut in space",
    "dancing with aliens",
    "as a ninja in ancient Japan",
    "skiing down a mountain of ice cream",
    "as a cowboy in the wild west",
    "swimming with dolphins",
    "as a detective solving mysteries",
    "flying with dragons",
    "as a chef making pizza",
    "riding a motorcycle through fire",
    "as a scientist in a lab explosion"
  ];
};

/**
 * Get random prompt suggestion
 */
export const getRandomPrompt = (): string => {
  const prompts = getSuggestedPrompts();
  return prompts[Math.floor(Math.random() * prompts.length)];
};