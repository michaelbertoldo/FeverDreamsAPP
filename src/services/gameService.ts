// src/services/gameService.ts
import axios from 'axios';
import { auth, db } from '../config/firebase';
import { doc, setDoc, updateDoc, getDoc, collection, addDoc } from 'firebase/firestore';
import { store } from '../store';
import { setGameId } from '../store/slices/gameSlice';
import { joinGame } from './socketService';

const API_URL = 'https://your-firebase-function-url.com';

// Create a new game
export const createGame = async (displayName: string ): Promise<string> => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('User not authenticated');
    
    // Call API to create game
    const response = await axios.post(`${API_URL}/games`, {
      hostId: userId,
      hostName: displayName
    });
    
    const { gameId, joinCode } = response.data;
    
    // Update Redux store
    store.dispatch(setGameId({ gameId, joinCode }));
    
    // Connect to Socket.IO and join game
    joinGame(gameId, displayName);
    
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
    
    // Call API to join game
    const response = await axios.post(`${API_URL}/games/join`, {
      joinCode,
      userId,
      displayName
    });
    
    const { gameId } = response.data;
    
    // Update Redux store
    store.dispatch(setGameId({ gameId, joinCode }));
    
    // Connect to Socket.IO and join game
    joinGame(gameId, displayName);
    
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
    
    // Emit Socket.IO event
    submitImage(gameId, promptId, imageUrl);
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
