// src/utils/deviceInfo.ts
import * as Battery from 'expo-battery';
import * as Device from 'expo-device';
import { Platform, Dimensions } from 'react-native';
import { getNetworkState } from './networkResilience';

// Get battery level
export const getBatteryLevel = async (): Promise<number> => {
  try {
    return await Battery.getBatteryLevelAsync();
  } catch (error) {
    console.error('Error getting battery level:', error);
    return 1.0; // Default to full battery if error
  }
};

// Get battery state
export const getBatteryState = async (): Promise<Battery.BatteryState> => {
  try {
    return await Battery.getBatteryStateAsync();
  } catch (error) {
    console.error('Error getting battery state:', error);
    return Battery.BatteryState.UNKNOWN;
  }
};

// Check if device is low power mode
export const isLowPowerMode = async (): Promise<boolean> => {
  try {
    return await Battery.isLowPowerModeEnabledAsync();
  } catch (error) {
    console.error('Error checking low power mode:', error);
    return false;
  }
};

// Get device memory info
export const getMemoryInfo = async (): Promise<{
  totalMemory: number;
  freeMemory: number;
}> => {
  try {
    // This is a mock implementation since Expo doesn't provide direct memory access
    // In a real app, you might use native modules or approximations
    return {
      totalMemory: 4096, // Mock value in MB
      freeMemory: 2048, // Mock value in MB
    };
  } catch (error) {
    console.error('Error getting memory info:', error);
    return {
      totalMemory: 0,
      freeMemory: 0,
    };
  }
};

// Get device performance tier - Fixed deviceYearClass issue
export const getDevicePerformanceTier = async (): Promise<'low' | 'medium' | 'high'> => {
  try {
    // Get device info
    const deviceType = Device.deviceType;
    
    // Check if device is a tablet
    const isTablet = deviceType === Device.DeviceType.TABLET;
    
    // Get device year class if available, otherwise estimate based on other factors
    let deviceYear: number | null = null;
    
    try {
      // Try to get deviceYearClass if it exists
      deviceYear = (Device as any).deviceYearClass;
    } catch (e) {
      // deviceYearClass not available, estimate based on platform
      console.log('deviceYearClass not available, using fallback estimation');
    }
    
    // If we can't get device year, estimate based on device type and platform
    if (!deviceYear) {
      if (Platform.OS === 'ios') {
        // For iOS, assume newer devices (most iOS devices in use are relatively recent)
        deviceYear = 2018;
      } else {
        // For Android or unknown, be more conservative
        deviceYear = 2016;
      }
    }
    
    // Determine performance tier based on device year and type
    if (deviceYear >= 2019 || isTablet) {
      return 'high';
    } else if (deviceYear >= 2016) {
      return 'medium';
    } else {
      return 'low';
    }
  } catch (error) {
    console.error('Error getting device performance tier:', error);
    return 'medium'; // Default to medium if error
  }
};

// Get optimal settings based on device and network
export const getOptimalSettings = async (): Promise<{
  performanceTier: 'low' | 'medium' | 'high';
  shouldReduceAnimations: boolean;
  shouldReduceImageQuality: boolean;
  shouldPreload: boolean;
  maxConcurrentOperations: number;
}> => {
  try {
    // Get device info
    const performanceTier = await getDevicePerformanceTier();
    const batteryLevel = await getBatteryLevel();
    const isLowPower = await isLowPowerMode();
    const networkState = await getNetworkState();
    
    // Default settings
    const settings = {
      performanceTier,
      shouldReduceAnimations: false,
      shouldReduceImageQuality: false,
      shouldPreload: true,
      maxConcurrentOperations: 3,
    };
    
    // Adjust based on battery
    if (batteryLevel < 0.2 || isLowPower) {
      settings.shouldReduceAnimations = true;
      settings.shouldReduceImageQuality = true;
      settings.shouldPreload = false;
      settings.maxConcurrentOperations = 1;
    }
    
    // Adjust based on network
    if (!networkState.isConnected || networkState.type !== 'wifi') {
      settings.shouldReduceImageQuality = true;
      settings.shouldPreload = false;
    }
    
    // Adjust based on performance tier
    if (performanceTier === 'low') {
      settings.shouldReduceAnimations = true;
      settings.maxConcurrentOperations = 1;
    } else if (performanceTier === 'high') {
      settings.maxConcurrentOperations = 5;
    }
    
    return settings;
  } catch (error) {
    console.error('Error getting optimal settings:', error);
    
    // Default conservative settings
    return {
      performanceTier: 'medium',
      shouldReduceAnimations: false,
      shouldReduceImageQuality: false,
      shouldPreload: true,
      maxConcurrentOperations: 2,
    };
  }
};