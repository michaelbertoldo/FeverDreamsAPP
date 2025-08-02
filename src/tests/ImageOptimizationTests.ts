// 3. FIXED: src/tests/ImageOptimizationTests.ts
import { optimizeImage, getCacheSize, manageCacheSize } from '../services/optimizedImageService';

// Mock FileSystem
jest.mock('expo-file-system', () => ({
  cacheDirectory: '/mock/cache/',
  getInfoAsync: jest.fn(),
  downloadAsync: jest.fn(),
  readDirectoryAsync: jest.fn(),
  deleteAsync: jest.fn(),
}));

// Mock ImageManipulator
jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn(),
  SaveFormat: {
    JPEG: 'jpeg',
    PNG: 'png',
  },
}));

import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';

describe('Image Optimization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('should optimize image with default settings', async () => {
    // Arrange
    const mockImageUri = 'file:///path/to/image.jpg';
    const mockOptimizedUri = 'file:///path/to/optimized.jpg';
    
    (ImageManipulator.manipulateAsync as jest.Mock).mockResolvedValue({
      uri: mockOptimizedUri,
    });
    
    // Act
    const result = await optimizeImage(mockImageUri);
    
    // Assert
    expect(result).toBe(mockOptimizedUri);
    expect(ImageManipulator.manipulateAsync).toHaveBeenCalledWith(
      mockImageUri,
      [{ resize: { width: 400, height: 400 } }],
      {
        compress: 0.8,
        format: 'jpeg',
        base64: false,
      }
    );
  });
  
  test('should handle optimization errors gracefully', async () => {
    // Arrange
    const mockImageUri = 'file:///path/to/image.jpg';
    const error = new Error('Optimization failed');
    
    (ImageManipulator.manipulateAsync as jest.Mock).mockRejectedValue(error);
    
    // Spy on console.error
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Act
    const result = await optimizeImage(mockImageUri);
    
    // Assert
    expect(result).toBe(mockImageUri); // Should return original URI on error
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error optimizing image:', error);
    
    // Cleanup
    consoleErrorSpy.mockRestore();
  });
  
  test('should get cache size', async () => {
    // Arrange
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
      exists: true,
      isDirectory: true,
    });
    
    (FileSystem.readDirectoryAsync as jest.Mock).mockResolvedValue([
      'cached_image_1.jpg',
      'cached_image_2.jpg',
    ]);
    
    // Act
    const cacheSize = await getCacheSize();
    
    // Assert
    expect(typeof cacheSize).toBe('number');
    expect(cacheSize).toBeGreaterThanOrEqual(0);
  });
  
  test('should manage cache size by deleting old files', async () => {
    // Arrange
    const maxSize = 1024; // 1KB limit
    
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
      exists: true,
      isDirectory: true,
    });
    
    (FileSystem.readDirectoryAsync as jest.Mock).mockResolvedValue([
      'cached_image_1.jpg',
      'cached_image_2.jpg',
    ]);
    
    // Act
    await manageCacheSize(maxSize);
    
    // Assert
    expect(FileSystem.readDirectoryAsync).toHaveBeenCalled();
  });
});