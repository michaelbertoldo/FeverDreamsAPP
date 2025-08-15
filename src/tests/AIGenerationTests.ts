// 1. FIXED: src/tests/AIGenerationTests.ts
import { generateOptimizedAIImage } from '../services/optimizedAIService';

// Mock the selfie service
jest.mock('../services/selfieService', () => ({
  getUserSelfie: jest.fn(),
}));

// Import the mocked module
const { getUserSelfie } = require('../services/selfieService');

describe('AI Image Generation', () => {
  // Mock user ID for testing
  const testUserId = 'test-user-123';
  
  // Mock selfie URL
  const mockSelfieUrl = 'https://example.com/test-selfie.jpg';
  
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    // Set default mock implementation
    (getUserSelfie as jest.MockedFunction<typeof getUserSelfie>).mockResolvedValue(mockSelfieUrl);
  });
  
  test('should generate image successfully with valid inputs', async () => {
    // Arrange
    const prompt = 'A funny cartoon character with a big smile';
    const options = {
      prioritizeSpeed: false,
      forceHighQuality: false,
      useCache: true,
    };
    
    // Act
    const result = await generateOptimizedAIImage(prompt, testUserId, options);
    
    // Assert
    expect(result.success).toBe(true);
    expect(result.imageUrl).toBeTruthy();
    expect(typeof result.imageUrl).toBe('string');
    expect(result.error).toBeUndefined();
  });
  
  test('should handle empty prompt', async () => {
    // Arrange
    const prompt = '';
    
    // Act
    const result = await generateOptimizedAIImage(prompt, testUserId);
    
    // Assert
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
  
  test('should handle invalid user ID', async () => {
    // Arrange
    const prompt = 'A funny cartoon character';
    const invalidUserId = '';
    
    // Act
    const result = await generateOptimizedAIImage(prompt, invalidUserId);
    
    // Assert
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
  
  test('should use cache when enabled', async () => {
    // Arrange
    const prompt = 'A funny cartoon character';
    const options = { useCache: true };
    
    // Act
    const result1 = await generateOptimizedAIImage(prompt, testUserId, options);
    const result2 = await generateOptimizedAIImage(prompt, testUserId, options);
    
    // Assert
    expect(result1.success).toBe(true);
    expect(result2.success).toBe(true);
  });
  
  test('should prioritize speed when option is enabled', async () => {
    // Arrange
    const prompt = 'A funny cartoon character';
    const options = { prioritizeSpeed: true };
    
    // Track timing
    const startTime = Date.now();
    
    // Act
    const result = await generateOptimizedAIImage(prompt, testUserId, options);
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Assert
    expect(result.success).toBe(true);
    // Should be faster when prioritizing speed (mock returns in ~1 second)
    expect(duration).toBeLessThan(1500);
  });
});
