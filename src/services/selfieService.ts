// src/services/selfieService.ts
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { auth, db, storage } from '../config/firebase';
import { doc, updateDoc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { ref, getDownloadURL, uploadBytes, uploadString } from 'firebase/storage';

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

// Upload selfie to Firebase Storage (dedicated function)
export const uploadSelfieToFirebase = async (uri: string): Promise<string> => {
  try {
    console.log('📸 Starting selfie upload process...');
    const processedUri = await processSelfie(uri);
    console.log('✅ Selfie processed successfully');
    
    // Convert URI to blob
    const response = await fetch(processedUri);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }
    const blob = await response.blob();
    console.log('✅ Image converted to blob');
    
    // Get current user
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('User not authenticated');
    console.log('✅ User authenticated:', userId);
    
    // Create storage reference with unique filename
    const selfieRef = ref(storage, `selfies/${userId}/${generateUniqueId()}.jpg`);
    console.log('✅ Storage reference created');
    
    // Upload file
    await uploadBytes(selfieRef, blob);
    console.log('✅ Selfie uploaded to Firebase Storage');
    
    // Get download URL
    const downloadURL = await getDownloadURL(selfieRef);
    console.log('✅ Download URL obtained');
    
    // Update user profile in Firestore with selfie URL
    await updateUserSelfie(userId, downloadURL);
    console.log('✅ User profile updated with selfie URL');
    
    return downloadURL;
  } catch (error) {
    console.error('❌ Error uploading selfie to Firebase:', error);
    throw error;
  }
};

// Upload selfie to Cloudinary (using Firebase Storage as intermediary for now)
export const uploadSelfieToCloudinary = async (uri: string): Promise<string> => {
  try {
    const processedUri = await processSelfie(uri);
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('User not authenticated');

    // Read base64 once for potential Cloudinary upload and Firebase data_url
    const base64 = await FileSystem.readAsStringAsync(processedUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    // Prefer direct Cloudinary upload if configured (more robust on RN)
    const cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    if (cloudName && uploadPreset) {
      try {
        const dataUrl = `data:image/jpeg;base64,${base64}`;
        const form = new FormData();
        form.append('file', dataUrl as any);
        form.append('upload_preset', uploadPreset as string);
        form.append('public_id', `selfies/${userId}/${generateUniqueId()}`);
        const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
        const res = await fetch(cloudinaryUrl, {
          method: 'POST',
          body: form as any,
        });
        const json = await res.json();
        if (!res.ok) {
          throw new Error(`Cloudinary upload failed: ${JSON.stringify(json)}`);
        }
        const secureUrl: string | undefined = json.secure_url;
        if (secureUrl) {
          await updateUserSelfie(userId, secureUrl);
          return secureUrl;
        }
      } catch (cloudErr) {
        console.warn('Cloudinary upload failed, falling back to Firebase Storage:', cloudErr);
      }
    }
    
    // Prepare references and metadata for Firebase fallback
    const selfieRef = ref(storage, `selfies/${userId}/${generateUniqueId()}.jpg`);
    const metadata = {
      contentType: 'image/jpeg',
      cacheControl: 'public, max-age=31536000',
    } as const;

    console.log('Firebase Storage fallback - Storage ref:', selfieRef.toString());
    console.log('Firebase Storage fallback - User ID:', userId);
    console.log('Firebase Storage fallback - Storage instance:', storage ? 'Available' : 'Missing');

    // Attempt upload via data URL first (robust in RN/Expo)
    try {
      const dataUrl = `data:image/jpeg;base64,${base64}`;
      await uploadString(selfieRef, dataUrl, 'data_url', metadata);
    } catch (primaryError: any) {
      console.log('Data URL upload failed, trying Blob upload:', primaryError);
      // Fallback to Blob upload
      try {
        const response = await fetch(processedUri);
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.status}`);
        }
        const blob = await response.blob();
        await uploadBytes(selfieRef, blob, metadata);
      } catch (blobError: any) {
        console.error('Blob upload also failed:', blobError);
        throw new Error(`Both upload methods failed. Data URL: ${primaryError?.message || 'Unknown error'}, Blob: ${blobError?.message || 'Unknown error'}`);
      }
    }
    
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
    if (error && typeof error === 'object') {
      const anyErr = error as any;
      const code = anyErr.code || 'unknown';
      const message = anyErr.message || 'Unknown error';
      const serverResponse = anyErr.customData?.serverResponse || '';
      console.error('Error uploading selfie:', { code, message, serverResponse });
    } else {
      console.error('Error uploading selfie:', error);
    }
    throw error;
  }
};

// Update user profile with selfie URL
export const updateUserSelfie = async (userId: string, selfieUrl: string): Promise<void> => {
  try {
    console.log('🔄 Updating user selfie for:', userId);
    const userRef = doc(db, 'users', userId);
    
    // Check if user document exists, create it if it doesn't
    const userSnapshot = await getDoc(userRef);
    if (!userSnapshot.exists()) {
      console.log('📝 User document does not exist, creating new one...');
      // Create basic user document if it doesn't exist
      await setDoc(userRef, {
        userId,
        displayName: 'Player',
        email: '',
        selfieUrl,
        selfieProcessed: true,
        gamesPlayed: 0,
        totalScore: 0,
        createdAt: Timestamp.now(),
        lastActive: Timestamp.now()
      });
      console.log('✅ New user document created successfully');
    } else {
      console.log('📝 User document exists, updating...');
      // Update existing user document
      await updateDoc(userRef, {
        selfieUrl,
        selfieProcessed: true,
        lastActive: Timestamp.now()
      });
      console.log('✅ Existing user document updated successfully');
    }
  } catch (error) {
    console.error('❌ Error updating user selfie:', error);
    throw error;
  }
};

// Get user's selfie URL
export const getUserSelfie = async (): Promise<string | null> => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) return null;
    
    // In a real app, you'd get this from Firestore user document
    const selfieRef = ref(storage, `selfies/${userId}/profile.jpg`);
    const downloadURL = await getDownloadURL(selfieRef);
    
    return downloadURL;
  } catch (error) {
    console.error('Error getting user selfie:', error);
    return null;
  }
};