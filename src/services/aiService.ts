const API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-server.com/api' 
  : 'http://localhost:3000/api';

export const generateAIImage = async (
  userResponse: string, 
  selfieUrl: string,
  promptTemplate?: string
): Promise<string> => {
  try {
    // For development/testing, return a mock image
    if (__DEV__) {
      console.log('🎨 Mock AI image generation for:', userResponse);
      
      // Create a more realistic mock image URL based on the response
      const mockImageUrls = [
        'https://picsum.photos/400/400?random=1',
        'https://picsum.photos/400/400?random=2', 
        'https://picsum.photos/400/400?random=3',
        'https://picsum.photos/400/400?random=4',
        'https://picsum.photos/400/400?random=5',
        'https://picsum.photos/400/400?random=6',
        'https://picsum.photos/400/400?random=7',
        'https://picsum.photos/400/400?random=8',
        'https://picsum.photos/400/400?random=9',
        'https://picsum.photos/400/400?random=10',
      ];
      
      return new Promise((resolve) => {
        setTimeout(() => {
          // Pick a random mock image to simulate variety
          const randomIndex = Math.floor(Math.random() * mockImageUrls.length);
          const mockImage = mockImageUrls[randomIndex];
          console.log('🎲 Generated mock image:', mockImage);
          resolve(mockImage);
        }, 2000);
      });
    }

    // Production: Call the actual AI service
    const fullPrompt = promptTemplate 
      ? promptTemplate.replace('{blank}', userResponse)
      : userResponse;
      
    console.log('🎯 Full AI prompt:', fullPrompt);
    
    const response = await fetch(`${API_URL}/generate-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: fullPrompt,
        selfieUrl,
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to generate image');
    }
    
    const data = await response.json();
    return data.imageUrl;
  } catch (error) {
    console.error('Error generating AI image:', error);
    // Return fallback image
    return `https://via.placeholder.com/400x400/FF6B6B/FFFFFF?text=${encodeURIComponent(prompt.slice(0, 20))}`;
  }
};

export const generatePromptResponse = (prompt: string, selfieUrl: string): Promise<string> => {
  // This would integrate with an AI text generation service
  // For now, return the prompt as-is
  return Promise.resolve(prompt);
};
