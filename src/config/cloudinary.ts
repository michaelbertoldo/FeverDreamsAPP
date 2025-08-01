// src/config/cloudinary.ts
// Note: The v2 cloudinary SDK is not compatible with React Native
// This file provides the configuration structure for potential future use

export const cloudinaryConfig = {
    cloud_name: process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME || 'YOUR_CLOUD_NAME',
    api_key: process.env.EXPO_PUBLIC_CLOUDINARY_API_KEY || 'YOUR_API_KEY',
    api_secret: process.env.EXPO_PUBLIC_CLOUDINARY_API_SECRET || 'YOUR_API_SECRET', // This should never be exposed in client-side code
    secure: true
  };
  
  // For React Native, we'll use direct HTTP requests to Cloudinary's REST API
  export const getCloudinaryUploadUrl = (cloudName: string) => {
    return `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
  };
  
  // Helper function to generate upload signature (should be done server-side)
  export const generateUploadParams = (publicId: string, timestamp: number) => {
    return {
      public_id: publicId,
      timestamp: timestamp,
      // signature would be generated server-side for security
    };
  };
  
  export default cloudinaryConfig;