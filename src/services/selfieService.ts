// src/services/selfieService.ts
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { auth, db, storage } from '../config/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Process selfie locally before upload
export const processSelfie = async (uri: string): Promise<string> => {
  try {
    // Resize and optimize the image
    const processedImage = await ImageManipulator.manipulateAsync(
      uri,
      [
        { resize: { width: 512, height: 512 } },
      ],
      { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
    );
    
    return processedImage.uri;
  } catch (error) {
    console.error('Error processing selfie:', error);
    throw error;
  }
};

// Generate a unique ID for file naming
const generateUniqueId = (): string => {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
};

// Generate a signed upload URL from Cloudinary
export const getCloudinarySignature = async () => {
  // In a real app, this would be a secure API call to your backend
  // which would generate and return the signature
  // For demo purposes, we'll simulate this
  
  const timestamp = Math.round(new Date().getTime() / 1000);
  const publicId = `selfies/${auth.currentUser?.uid}/${generateUniqueId()}`;
  
  // This would normally be done server-side for security
  // You would implement a Firebase Function for this
  return {
    timestamp,
    publicId,
    signature: "generated_signature_from_server",
    apiKey: "your_cloudinary_api_key"
  };
};

// Upload selfie to Cloudinary (using Firebase Storage as intermediary for now)
export const uploadSelfieToCloudinary = async (uri: string): Promise<string> => {
  try {
    const processedUri = await processSelfie(uri);
    
    // In a real implementation, you would:
    // 1. Get a signed upload URL from your backend
    // 2. Upload directly to Cloudinary from the client
    // For demo purposes, we'll use Firebase Storage as an intermediary
    
    // Convert URI to blob
    const response = await fetch(processedUri);
    const blob = await response.blob();
    
    // Upload to Firebase Storage first (temporary)
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('User not authenticated');
    
    const selfieRef = ref(storage, `selfies/${userId}/${generateUniqueId()}.jpg`);
    await uploadBytes(selfieRef, blob);
    
    // Get download URL
    const downloadURL = await getDownloadURL(selfieRef);
    
    // In a production app, you would now:
    // 1. Upload from your server to Cloudinary using the Firebase URL
    // 2. Delete the temporary Firebase storage file
    // 3. Return the Cloudinary URL
    
    // For now, we'll use the Firebase URL directly
    // Update user profile with selfie URL
    await updateUserSelfie(userId, downloadURL);
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading selfie:', error);
    throw error;
  }
};

// Update user profile with selfie URL
export const updateUserSelfie = async (userId: string, selfieUrl: string): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      selfieUrl,
      selfieProcessed: true,
      lastActive: new Date()
    });
  } catch (error) {
    console.error('Error updating user selfie:', error);
    throw error;
  }
};

// Get user selfie URL
export const getUserSelfie = async (userId: string): Promise<string | null> => {
  try {
    // In a real app, you would:
    // 1. Get the selfie URL from Firestore
    // 2. Generate a signed URL with short expiration for security
    
    // For demo purposes, we'll return a simulated URL
    return `https://res.cloudinary.com/your-cloud/image/upload/v1/${userId}/selfie.jpg`;
  } catch (error) {
    console.error('Error getting user selfie:', error);
    return null;
  }
};