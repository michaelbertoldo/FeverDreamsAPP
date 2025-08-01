// src/services/imageGenerationService.ts
import { replicateApi, FLUX_KONTEXT_MODEL, FALLBACK_MODEL } from '../config/replicate';
import { getUserSelfie } from './selfieService';
import { auth } from '../config/firebase';
import { doc, collection, addDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

// Interface for generation parameters
interface GenerationParams {
  prompt: string;
  negative_prompt?: string;
  width?: number;
  height?: number;
  num_inference_steps?: number;
  guidance_scale?: number;
}

// Interface for generation result
interface GenerationResult {
  id: string;
  imageUrl: string;
  prompt: string;
  createdAt: Date;
  status: 'success' | 'failed' | 'fallback';
}

// Start image generation with Replicate
export const generateImage = async (
  prompt: string,
  gameId: string,
  promptId: string
): Promise<GenerationResult> => {
  try {
    // Get current user
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('User not authenticated');
    
    // Get user's selfie URL
    const selfieUrl = await getUserSelfie(userId);
    if (!selfieUrl) throw new Error('User selfie not found');
    
    // Create a record in Firestore to track the generation
    const generationRef = await addDoc(collection(db, 'image_generations'), {
      userId,
      gameId,
      promptId,
      prompt,
      status: 'pending',
      createdAt: Timestamp.now()
    });
    
    // Prepare generation parameters
    const params: GenerationParams = {
      prompt: `${prompt}, cartoon style, funny, colorful, high quality, detailed`,
      negative_prompt: "blurry, low quality, distorted, ugly, bad anatomy",
      width: 768,
      height: 768,
      num_inference_steps: 30,
      guidance_scale: 7.5
    };
    
    // Start the generation with Flux.Kontext
    const response = await replicateApi.post('/predictions', {
      version: FLUX_KONTEXT_MODEL,
      input: {
        prompt: params.prompt,
        negative_prompt: params.negative_prompt,
        image: selfieUrl,
        width: params.width,
        height: params.height,
        num_inference_steps: params.num_inference_steps,
        guidance_scale: params.guidance_scale
      }
    });
    
    // Get the prediction ID
    const predictionId = response.data.id;
    
    // Update the Firestore record with the prediction ID
    await updateDoc(doc(db, 'image_generations', generationRef.id), {
      predictionId,
      status: 'processing'
    });
    
    // Poll for the result
    const result = await pollForResult(predictionId, generationRef.id);
    
    return result;
  } catch (error) {
    console.error('Image generation error:', error);
    
    // Try fallback generation if primary fails
    return await generateFallbackImage(prompt, gameId, promptId);
  }
};

// Poll for generation result
const pollForResult = async (
  predictionId: string,
  generationId: string,
  maxAttempts = 30,
  interval = 1000
): Promise<GenerationResult> => {
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    try {
      // Get prediction status
      const response = await replicateApi.get(`/predictions/${predictionId}`);
      const prediction = response.data;
      
      // Check if the prediction is complete
      if (prediction.status === 'succeeded') {
        // Get the output image URL
        const imageUrl = prediction.output[0];
        
        // Update the Firestore record
        await updateDoc(doc(db, 'image_generations', generationId), {
          status: 'completed',
          imageUrl,
          completedAt: Timestamp.now()
        });
        
        return {
          id: generationId,
          imageUrl,
          prompt: prediction.input.prompt,
          createdAt: new Date(),
          status: 'success'
        };
      }
      
      // Check if the prediction failed
      if (prediction.status === 'failed') {
        throw new Error('Prediction failed');
      }
      
      // Wait before polling again
      await new Promise(resolve => setTimeout(resolve, interval));
      attempts++;
    } catch (error) {
      console.error('Polling error:', error);
      throw error;
    }
  }
  
  throw new Error('Prediction timed out');
};

// Generate fallback image if primary generation fails
const generateFallbackImage = async (
  prompt: string,
  gameId: string,
  promptId: string
): Promise<GenerationResult> => {
  try {
    // Get current user
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('User not authenticated');
    
    // Create a record in Firestore for the fallback generation
    const generationRef = await addDoc(collection(db, 'image_generations'), {
      userId,
      gameId,
      promptId,
      prompt,
      status: 'fallback_pending',
      createdAt: Timestamp.now()
    });
    
    // Use a simpler model without face blending as fallback
    const response = await replicateApi.post('/predictions', {
      version: FALLBACK_MODEL,
      input: {
        prompt: `${prompt}, cartoon style, funny, colorful`,
        negative_prompt: "blurry, low quality, distorted",
        width: 768,
        height: 768,
        num_inference_steps: 25
      }
    });
    
    // Get the prediction ID
    const predictionId = response.data.id;
    
    // Update the Firestore record with the prediction ID
    await updateDoc(doc(db, 'image_generations', generationRef.id), {
      predictionId,
      status: 'fallback_processing'
    });
    
    // Poll for the result
    let attempts = 0;
    const maxAttempts = 30;
    const interval = 1000;
    
    while (attempts < maxAttempts) {
      // Get prediction status
      const statusResponse = await replicateApi.get(`/predictions/${predictionId}`);
      const prediction = statusResponse.data;
      
      // Check if the prediction is complete
      if (prediction.status === 'succeeded') {
        // Get the output image URL
        const imageUrl = prediction.output[0];
        
        // Update the Firestore record
        await updateDoc(doc(db, 'image_generations', generationRef.id), {
          status: 'fallback_completed',
          imageUrl,
          completedAt: Timestamp.now()
        });
        
        return {
          id: generationRef.id,
          imageUrl,
          prompt: prediction.input.prompt,
          createdAt: new Date(),
          status: 'fallback'
        };
      }
      
      // Wait before polling again
      await new Promise(resolve => setTimeout(resolve, interval));
      attempts++;
    }
    
    throw new Error('Fallback prediction timed out');
  } catch (error) {
    console.error('Fallback generation error:', error);
    
    // If all else fails, return a preset funny GIF
    return {
      id: 'fallback-gif',
      imageUrl: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcDd6Y2JjZGRjNGE4MjQ5ZmE5YmQyYmM0MzJlNGIzYTk2MzA3YTBkYyZlcD12MV9pbnRlcm5hbF9naWZzX2dpZklkJmN0PWc/3o7TKEP6YngkCKFofC/giphy.gif',
      prompt,
      createdAt: new Date( ),
      status: 'fallback'
    };
  }
};
