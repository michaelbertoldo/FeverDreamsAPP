// src/services/authServices.ts
import { auth, db } from '../config/firebase';
import { 
  signInWithCredential, 
  OAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  UserCredential,
  signOut
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
    const provider = new OAuthProvider('apple.com');
    const authCredential = provider.credential({
      idToken: credential.identityToken!,
      rawNonce: credential.authorizationCode!,
    });
    
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
): Promise<void> => {
  try {
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
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
};

export const signInWithEmail = async (email: string, password: string): Promise<UserCredential> => {
  try {
    return await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    console.error('Email Sign-In Error:', error);
    throw error;
  }
};

export const signUpWithEmail = async (email: string, password: string, displayName: string): Promise<UserCredential> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await createUserProfile(userCredential.user.uid, displayName, email);
    return userCredential;
  } catch (error) {
    console.error('Email Sign-Up Error:', error);
    throw error;
  }
};

export const signOutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Sign-Out Error:', error);
    throw error;
  }
};