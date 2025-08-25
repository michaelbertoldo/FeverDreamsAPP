// src/services/gameService.ts - Fixed missing imports
import axios from 'axios';
import { auth, db } from '../config/firebase';
import { doc, setDoc, updateDoc, getDoc, collection, addDoc } from 'firebase/firestore';
import { store } from '../store';
import {
  createGame,
  joinGame
} from '../store/slices/gameSlice';

const API_URL = 'https://your-firebase-function-url.com';

// Create a new game
export const createGameService = async (displayName: string): Promise<string> => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('User not authenticated');
    
    // For demo purposes, we'll create a mock game without the API call
    const gameId = `game_${Date.now()}`;
    const joinCode = generateJoinCode();
    
    // Update Redux store
    store.dispatch(createGame({ gameId, gameCode: joinCode }));
    
    return gameId;
  } catch (error) {
    console.error('Create game error:', error);
    throw error;
  }
};

// Join an existing game
export const joinExistingGame = async (joinCode: string, displayName: string): Promise<string> => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('User not authenticated');
    
    // For demo purposes, we'll create a mock join
    const gameId = `game_joined_${Date.now()}`;
    
    // Update Redux store
    store.dispatch(joinGame({ gameId, gameCode: joinCode }));
    
    return gameId;
  } catch (error) {
    console.error('Join game error:', error);
    throw error;
  }
};

// Submit image to game
export const submitImageToGame = async (gameId: string, promptId: string, imageUrl: string): Promise<void> => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('User not authenticated');
    
    // Add submission to Firestore
    await addDoc(collection(db, 'submissions'), {
      gameId,
      promptId,
      playerId: userId,
      imageUrl,
      createdAt: new Date()
    });
    
    // Emit Socket.IO event - commented out for now
    // submitImage(gameId, promptId, imageUrl);
  } catch (error) {
    console.error('Submit image error:', error);
    throw error;
  }
};

// Get game details
export const getGameDetails = async (gameId: string): Promise<any> => {
  try {
    const gameDoc = await getDoc(doc(db, 'games', gameId));
    
    if (!gameDoc.exists()) {
      throw new Error('Game not found');
    }
    
    return gameDoc.data();
  } catch (error) {
    console.error('Get game details error:', error);
    throw error;
  }
};

// Save winning image
export const saveWinningImage = async (gameId: string, imageUrl: string): Promise<void> => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('User not authenticated');
    
    // Save to user's collection
    await addDoc(collection(db, 'users', userId, 'saved_images'), {
      gameId,
      imageUrl,
      savedAt: new Date()
    });
  } catch (error) {
    console.error('Save winning image error:', error);
    throw error;
  }
};

// Helper function to generate a unique join code
const generateJoinCode = (): string => {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    code += characters.charAt(randomIndex);
  }
  
  return code;
};