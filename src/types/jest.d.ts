// src/types/global.d.ts
// Global type definitions for the project

// Jest global functions (when types package isn't working)
declare global {
    var describe: (name: string, fn: () => void) => void;
    var it: (name: string, fn: () => void | Promise<void>) => void;
    var test: (name: string, fn: () => void | Promise<void>) => void;
    var expect: any;
    var beforeEach: (fn: () => void | Promise<void>) => void;
    var afterEach: (fn: () => void | Promise<void>) => void;
    var beforeAll: (fn: () => void | Promise<void>) => void;
    var afterAll: (fn: () => void | Promise<void>) => void;
    var jest: {
      fn: () => any;
      mock: (moduleName: string, factory?: () => any) => void;
      clearAllMocks: () => void;
      spyOn: (object: any, method: string) => any;
      requireActual: (moduleName: string) => any;
      Mock: any;
      MockedFunction: <T extends (...args: any[]) => any>(fn: T) => MockedFunction<T>;
    };
  }
  
  // Jest matchers
  declare namespace jest {
    interface Matchers<R> {
      toBe(expected: any): R;
      toEqual(expected: any): R;
      toBeTruthy(): R;
      toBeFalsy(): R;
      toBeUndefined(): R;
      toBeDefined(): R;
      toBeNull(): R;
      toBeGreaterThan(expected: number): R;
      toBeGreaterThanOrEqual(expected: number): R;
      toBeLessThan(expected: number): R;
      toBeLessThanOrEqual(expected: number): R;
      toContain(expected: any): R;
      toHaveBeenCalled(): R;
      toHaveBeenCalledTimes(expected: number): R;
      toHaveBeenCalledWith(...expected: any[]): R;
      toThrow(expected?: string | Error): R;
      toMatchObject(expected: any): R;
      toHaveLength(expected: number): R;
      toBeInstanceOf(expected: any): R;
      toMatch(expected: string | RegExp): R;
      toHaveProperty(keyPath: string, value?: any): R;
      resolves: Matchers<R>;
      rejects: Matchers<R>;
    }
    
    // FIX: Define MockedFunction as a type, not a value
    type MockedFunction<T extends (...args: any[]) => any> = T & {
      mockResolvedValue(value: Awaited<ReturnType<T>>): MockedFunction<T>;
      mockRejectedValue(value: any): MockedFunction<T>;
      mockReturnValue(value: ReturnType<T>): MockedFunction<T>;
      mockImplementation(fn: T): MockedFunction<T>;
      mockResolvedValueOnce(value: Awaited<ReturnType<T>>): MockedFunction<T>;
      mockRejectedValueOnce(value: any): MockedFunction<T>;
      mockReturnValueOnce(value: ReturnType<T>): MockedFunction<T>;
      mockImplementationOnce(fn: T): MockedFunction<T>;
      mockReset(): MockedFunction<T>;
      mockRestore(): void;
      mockClear(): MockedFunction<T>;
      mock: {
        calls: Parameters<T>[];
        results: { type: 'return' | 'throw'; value: any }[];
        instances: any[];
      };
    };
  }
  
  // Performance API
  declare global {
    interface Performance {
      now(): number;
    }
    
    var performance: Performance;
  }
  
  // Expo and React Native module declarations
  declare module 'expo-notifications' {
    export function scheduleNotificationAsync(request: any): Promise<string>;
    export function requestPermissionsAsync(): Promise<any>;
  }
  
  declare module 'expo-image-picker' {
    export function requestCameraPermissionsAsync(): Promise<any>;
    export function requestMediaLibraryPermissionsAsync(): Promise<any>;
    export function launchCameraAsync(options?: any): Promise<any>;
    export function launchImageLibraryAsync(options?: any): Promise<any>;
    export const MediaTypeOptions: {
      Images: string;
    };
  }
  
  declare module 'expo-file-system' {
    export const cacheDirectory: string | null;
    export function getInfoAsync(uri: string): Promise<any>;
    export function downloadAsync(uri: string, fileUri: string): Promise<any>;
    export function readDirectoryAsync(uri: string): Promise<string[]>;
    export function deleteAsync(uri: string, options?: any): Promise<void>;
  }
  
  declare module 'expo-image-manipulator' {
    export function manipulateAsync(uri: string, actions: any[], options?: any): Promise<any>;
    export const SaveFormat: {
      JPEG: string;
      PNG: string;
    };
  }
  
  declare module '@react-native-async-storage/async-storage' {
    export default {
      getItem: (key: string) => Promise<string | null>,
      setItem: (key: string, value: string) => Promise<void>,
      removeItem: (key: string) => Promise<void>,
      multiRemove: (keys: string[]) => Promise<void>,
      getAllKeys: () => Promise<string[]>,
    };
  }
  
  export {};