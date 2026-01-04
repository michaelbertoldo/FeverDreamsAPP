import { Platform } from 'react-native';

// 🔧 NETWORK FIX: Use correct URL for React Native
const getApiUrl = () => {
  if (process.env.NODE_ENV === 'production') {
    return 'https://your-server.com/api';
  }
  
  // For development - React Native networking fix
  if (Platform.OS === 'ios') {
    // Your computer's actual IP address (from ifconfig)
    return 'http://172.20.10.2:3000/api';
  }
  
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000/api';  // Android emulator special IP
  }
  
  return 'http://localhost:3000/api';  // Web fallback
};

const API_URL = getApiUrl();

// Enable real AI generation even in development
const FORCE_REAL_AI = true;

console.log('🔗 API URL configured as:', API_URL);

export const generateAIImage = async (
  userResponse: string, 
  selfieUrl: string,
  promptTemplate?: string
): Promise<string> => {
  try {
    // Only use mock in development AND when FORCE_REAL_AI is false
    if (__DEV__ && !FORCE_REAL_AI) {
      console.log('🎨 Mock AI image generation for:', userResponse);
      
      const mockImageUrls = [
        'https://picsum.photos/400/400?random=1',
        'https://picsum.photos/400/400?random=2', 
        'https://picsum.photos/400/400?random=3',
        'https://picsum.photos/400/400?random=4',
        'https://picsum.photos/400/400?random=5',
      ];
      
      return new Promise((resolve) => {
        setTimeout(() => {
          const randomIndex = Math.floor(Math.random() * mockImageUrls.length);
          const mockImage = mockImageUrls[randomIndex];
          console.log('🎲 Generated mock image:', mockImage);
          resolve(mockImage);
        }, 2000);
      });
    }

    // REAL AI GENERATION with better error handling
    const fullPrompt = constructOptimalPrompt(userResponse, promptTemplate);
    
    console.log('🎯 Full AI prompt:', fullPrompt);
    console.log('🖼️ Using selfie URL:', selfieUrl);
    console.log('🌐 API URL:', API_URL);
    
    // Add timeout for better error handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    const response = await fetch(`${API_URL}/generate-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: fullPrompt,
        selfieUrl,
        width: 768,
        height: 768,
        strength: 0.8,
        guidance_scale: 7.5,
        num_inference_steps: 30,
      }),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error:', response.status, errorText);
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log('✅ AI Generation successful:', data);
    
    if (!data.success || !data.imageUrl) {
      throw new Error('Invalid response from AI service');
    }
    
    return data.imageUrl;
  } catch (error) {
    console.error('❌ Error generating AI image:', error);
    
    // Better error messages
    if (error.name === 'AbortError') {
      console.error('❌ Request timed out after 30 seconds');
    } else if (error.message.includes('Network request failed')) {
      console.error('❌ Network connection failed - check server and IP address');
      console.error('💡 Try: 1) Check server is running, 2) Update IP address in aiService.ts');
    }
    
    // Return a better fallback image with the prompt text
    const fallbackText = encodeURIComponent(userResponse.slice(0, 20));
    return `https://via.placeholder.com/400x400/FF6B6B/FFFFFF?text=Network+Error:+${fallbackText}`;
  }
};

/**
 * Construct optimal prompt for AI generation
 */
const constructOptimalPrompt = (userResponse: string, promptTemplate?: string): string => {
  // If we have a template, use it properly
  const basePrompt = promptTemplate 
    ? promptTemplate.replace('{blank}', userResponse).replace('[blank]', userResponse)
    : userResponse;
  
  // Add style and quality modifiers for better comedic results
  const styleModifiers = [
    'cartoon style',
    'funny',
    'exaggerated expression', 
    'comedic',
    'colorful',
    'high quality',
    'detailed',
    'vibrant colors',
    'meme-style'
  ].join(', ');
  
  // Construct final prompt
  const finalPrompt = `A person as ${basePrompt}, ${styleModifiers}`;
  
  return finalPrompt;
};

export const generatePromptResponse = (prompt: string, selfieUrl: string): Promise<string> => {
  // This would integrate with an AI text generation service
  // For now, return the prompt as-is
  return Promise.resolve(prompt);
};

/**
 * Test AI generation endpoint
 */
export const testAIGeneration = async (): Promise<boolean> => {
  try {
    console.log('🔧 Testing API connection to:', API_URL);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(`${API_URL}/test`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    const data = await response.json();
    console.log('🔧 API Test Response:', data);
    
    if (response.ok) {
      console.log('✅ API connection successful!');
      return true;
    } else {
      console.error('❌ API returned error:', response.status, data);
      return false;
    }
  } catch (error) {
    console.error('❌ API Test failed:', error);
    
    if (error.name === 'AbortError') {
      console.error('💡 API test timed out - server may be down');
    } else if (error.message.includes('Network request failed')) {
      console.error('💡 Network connection failed - check:');
      console.error('   1. Server is running (npm run dev)');
      console.error('   2. IP address is correct in aiService.ts');
      console.error('   3. Try using your computer IP instead of localhost');
    }
    
    return false;
  }
};

export const checkAIServiceHealth = async (): Promise<boolean> => {
  try {
    console.log('🏥 Checking AI service health at:', API_URL);
    
    // Actually check the server health
    const response = await fetch(`${API_URL}/health`, {
      method: 'GET',
    });
    
    const isHealthy = response.ok;
    console.log('🏥 AI service health:', isHealthy ? '✅ Healthy' : '❌ Unhealthy');
    return isHealthy;
  } catch (error) {
    console.error('🏥 AI service health check failed:', error);
    return false;
  }
};

// Export the API URL for debugging
export const getDebugInfo = () => ({
  apiUrl: API_URL,
  platform: Platform.OS,
  environment: process.env.NODE_ENV,
  forceRealAI: FORCE_REAL_AI,
});
