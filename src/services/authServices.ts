// src/services/authService.ts
import { auth, db } from '../config/firebase';
import { 
  signInWithCredential, 
  AppleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  UserCredential 
} from 'firebase/auth';
import { doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';
import * as AppleAuthentication from 'expo-apple-authentication';

export const signInWithApple = async (): Promise<UserCredential> => {
  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
    
    // Convert to Firebase credential
    const provider = new AppleAuthProvider();
    const authCredential = provider.credential(credential.identityToken);
    
    // Sign in with Firebase
    return await signInWithCredential(auth, authCredential);
  } catch (error) {
    console.error('Apple Sign-In Error:', error);
    throw error;
  }
};

export const createUserProfile = async (
  userId: string, 
  displayName: string, 
  email: string
) => {
  const userRef = doc(db, 'users', userId);
  const userSnapshot = await getDoc(userRef);
  
  if (!userSnapshot.exists()) {
    await setDoc(userRef, {
      userId,
      displayName,
      email,
      selfieUrl: '',
      selfieProcessed: false,
      gamesPlayed: 0,
      totalScore: 0,
      createdAt: Timestamp.now(),
      lastActive: Timestamp.now()
    });
  }
  
  return userRef;
};

// Additional auth methods (email/password, signout, etc.)
