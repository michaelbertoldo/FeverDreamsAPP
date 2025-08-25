const API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-server.com/api' 
  : 'http://localhost:3000/api';

export const generateAIImage = async (
  prompt: string, 
  selfieUrl: string
): Promise<string> => {
  try {
    // For development/testing, return a mock image
    if (__DEV__) {
      console.log('🎨 Mock AI image generation for:', prompt);
      return new Promise((resolve) => {
        setTimeout(() => {
          // Return a placeholder image with the prompt
          const encodedPrompt = encodeURIComponent(prompt.slice(0, 30));
          resolve(`https://via.placeholder.com/400x400/FF6B6B/FFFFFF?text=${encodedPrompt}`);
        }, 2000);
      });
    }

    // Production: Call the actual AI service
    const response = await fetch(`${API_URL}/generate-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
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
