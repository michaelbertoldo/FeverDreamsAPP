// src/utils/secureStorage.ts
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';

// Encrypt data before storing
export const encryptData = async (data: string): Promise<string> => {
  try {
    // In a real app, you would implement proper encryption
    // For demo purposes, we'll use a simple hash
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      data
    );
    return hash;
  } catch (error) {
    console.error('Encryption error:', error);
    throw error;
  }
};

// Store sensitive data securely
export const storeSecureData = async (key: string, value: string): Promise<void> => {
  try {
    await SecureStore.setItemAsync(key, value, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED
    });
  } catch (error) {
    console.error('Secure storage error:', error);
    throw error;
  }
};

// Retrieve sensitive data
export const getSecureData = async (key: string): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(key);
  } catch (error) {
    console.error('Secure retrieval error:', error);
    return null;
  }
};

// Delete sensitive data
export const deleteSecureData = async (key: string): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch (error) {
    console.error('Secure deletion error:', error);
    throw error;
  }
};
