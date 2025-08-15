// 2. FIXED: src/tests/PerformanceTests.ts
import { measureTask, measureRender, shouldApplyPerformanceOptimizations } from '../services/performanceMonitoring';

describe('Performance Monitoring', () => {
  beforeEach(() => {
    // Clear any console spies
    jest.clearAllMocks();
  });
  
  test('should measure task execution time', async () => {
    // Arrange
    const taskName = 'test_task';
    const expectedResult = 'test_result';
    const mockTask = jest.fn().mockImplementation(() => {
      return new Promise((resolve) => {
        setTimeout(() => resolve(expectedResult), 100);
      });
    });
    
    // Spy on console.log to verify logging
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    
    // Act
    const result = await measureTask(taskName, mockTask);
    
    // Assert
    expect(result).toBe(expectedResult);
    expect(mockTask).toHaveBeenCalledTimes(1);
    expect(consoleSpy).toHaveBeenCalledWith(`Starting task: ${taskName}`);
    expect(consoleSpy).toHaveBeenCalledWith(`Completed task: ${taskName}`);
    
    // Cleanup
    consoleSpy.mockRestore();
  });
  
  test('should handle task errors gracefully', async () => {
    // Arrange
    const taskName = 'failing_task';
    const error = new Error('Test error');
    const mockTask = jest.fn().mockRejectedValue(error);
    
    // Spy on console.error
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Act & Assert
    await expect(measureTask(taskName, mockTask)).rejects.toThrow('Test error');
    expect(mockTask).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy).toHaveBeenCalled();
    
    // Cleanup
    consoleErrorSpy.mockRestore();
  });
  
  test('should measure render time correctly', () => {
    // Arrange
    const componentName = 'TestComponent';
    const startTime = performance.now() - 100; // Mock 100ms ago
    
    // Spy on console.log
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    
    // Act
    measureRender(componentName, startTime);
    
    // Assert
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringMatching(new RegExp(`${componentName} render time: \\d+(\\.\\d+)?ms`))
    );
    
    // Cleanup
    consoleSpy.mockRestore();
  });
  
  test('should return performance optimization status', async () => {
    // Act
    const shouldOptimize = await shouldApplyPerformanceOptimizations();
    
    // Assert
    expect(typeof shouldOptimize).toBe('boolean');
    // In our mock implementation, it should return false
    expect(shouldOptimize).toBe(false);
  });
  
  test('measureTask should work with synchronous functions', async () => {
    // Arrange
    const taskName = 'sync_task';
    const expectedResult = 'sync_result';
    const mockTask = jest.fn().mockReturnValue(expectedResult);
    
    // Act
    const result = await measureTask(taskName, mockTask);
    
    // Assert
    expect(result).toBe(expectedResult);
    expect(mockTask).toHaveBeenCalledTimes(1);
  });
});
