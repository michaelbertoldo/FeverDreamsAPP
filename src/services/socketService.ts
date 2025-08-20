// src/services/socketService.ts
import { io, Socket } from 'socket.io-client';
import { auth } from '../config/firebase';
import { store } from '../store';

import { 
  setGameStatus,
  addPlayer, 
  updatePlayerReady,
  setCurrentPrompt,
  addSubmission,
  addVote,
  setGameCreated
} from '../store/slices/gameSlice';

// Socket.IO client instance
let socket: Socket | null = null;

// Socket.IO server URL - for development, we'll use a mock/demo setup
const SOCKET_URL = 'http://172.20.10.2:3001'; // Use local network IP for React Native

// Initialize Socket.IO client
export const initializeSocket = (): Socket => {
  if (socket) return socket;
  
  socket = io(SOCKET_URL, {
    transports: ['websocket', 'polling'],
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    timeout: 10000,
    forceNew: true
  });
  
  // Set up event listeners
  setupSocketListeners(socket);
  
  return socket;
};

// Connect to Socket.IO server
export const connectSocket = (): void => {
  try {
    if (!socket) initializeSocket();
    if (socket && !socket.connected) {
      socket.connect();
    }
  } catch (error) {
    console.error('Error connecting to socket:', error);
  }
};

// Disconnect from Socket.IO server
export const disconnectSocket = (): void => {
  try {
    if (socket && socket.connected) {
      socket.disconnect();
    }
  } catch (error) {
    console.error('Error disconnecting socket:', error);
  }
};

// Join a game room
export const joinGame = (gameId: string, displayName: string): void => {
  try {
    if (!socket || !socket.connected) {
      console.log('Socket not connected, attempting to connect...');
      connectSocket();
      
      // Wait a bit for connection and then try to join
      setTimeout(() => {
        if (socket && socket.connected) {
          const userId = auth.currentUser?.uid || `guest_${Date.now()}`;
          socket.emit('joinGame', { gameId, userId, displayName });
        } else {
          console.warn('Socket still not connected after timeout');
          // For demo purposes, simulate joining without actual socket
          simulateJoinGame(gameId, displayName);
        }
      }, 1000);
      return;
    }
    
    const userId = auth.currentUser?.uid || `guest_${Date.now()}`;
    socket.emit('joinGame', { gameId, userId, displayName });
  } catch (error) {
    console.error('Error joining game:', error);
    // Fallback to simulation for demo
    simulateJoinGame(gameId, displayName);
  }
};

// Simulate joining game for demo purposes
const simulateJoinGame = (gameId: string, displayName: string): void => {
  console.log('Simulating game join for demo purposes');
  const userId = auth.currentUser?.uid || `guest_${Date.now()}`;
  
  // Simulate adding the player to the game
  store.dispatch(addPlayer({
    playerId: userId,
    displayName,
    isHost: true // Make them host for demo
  }));
};

// Set player ready status
export const setPlayerReady = (gameId: string, isReady: boolean): void => {
  try {
    if (!socket || !socket.connected) {
      console.warn('Socket not connected for setPlayerReady');
      return;
    }
    
    const userId = auth.currentUser?.uid;
    if (!userId) return;
    
    socket.emit('playerReady', { gameId, userId, isReady });
  } catch (error) {
    console.error('Error setting player ready:', error);
  }
};

// Start the game (host only)
export const startGame = (gameId: string): void => {
  try {
    if (!socket || !socket.connected) {
      console.warn('Socket not connected for startGame');
      return;
    }
    
    const userId = auth.currentUser?.uid;
    if (!userId) return;
    
    socket.emit('startGame', { gameId, userId });
  } catch (error) {
    console.error('Error starting game:', error);
  }
};

// Submit an image for a prompt
export const submitImage = (gameId: string, promptId: string, imageUrl: string): void => {
  try {
    if (!socket || !socket.connected) {
      console.warn('Socket not connected for submitImage');
      return;
    }
    
    const userId = auth.currentUser?.uid;
    if (!userId) return;
    
    socket.emit('submitImage', { gameId, userId, promptId, imageUrl });
  } catch (error) {
    console.error('Error submitting image:', error);
  }
};

// Submit a vote for an image
export const submitVote = (gameId: string, promptId: string, votedFor: string): void => {
  try {
    if (!socket || !socket.connected) {
      console.warn('Socket not connected for submitVote');
      return;
    }
    
    const userId = auth.currentUser?.uid;
    if (!userId) return;
    
    socket.emit('submitVote', { gameId, userId, promptId, votedFor });
  } catch (error) {
    console.error('Error submitting vote:', error);
  }
};

// Set up Socket.IO event listeners
const setupSocketListeners = (socket: Socket): void => {
  // Connection events
  socket.on('connect', () => {
    console.log('✅ Socket connected successfully to:', SOCKET_URL);
  });
  
  socket.on('disconnect', (reason) => {
    console.log('❌ Socket disconnected:', reason);
  });
  
  socket.on('connect_error', (error) => {
    console.error('🔥 Socket connection error:', error);
    console.error('🔥 Full error object:', error);
  });
  
  // Game events
  socket.on('gameState', (gameState) => {
    store.dispatch(setGameStatus(gameState));
  });
  
  socket.on('playerJoined', ({ playerId, displayName, isHost }) => {
    store.dispatch(addPlayer({ playerId, displayName, isHost }));
  });
  
  socket.on('playerReadyUpdate', ({ playerId, isReady }) => {
    store.dispatch(updatePlayerReady({ playerId, isReady }));
  });
  
  socket.on('allPlayersReady', () => {
    console.log('All players are ready!');
  });
  
  socket.on('gameStarted', ({ status, currentRound, prompts }) => {
    store.dispatch(setGameStatus({ status, currentRound, prompts }));
  });
  
  socket.on('promptAssigned', ({ playerId, promptId, promptText }) => {
    const userId = auth.currentUser?.uid;
    if (userId === playerId) {
      store.dispatch(setCurrentPrompt({ promptId, promptText, isAssigned: true }));
    }
  });
  
  socket.on('waitForSubmissions', ({ playerId, promptId, assignedPlayers }) => {
    const userId = auth.currentUser?.uid;
    if (userId === playerId) {
      store.dispatch(setCurrentPrompt({ 
        promptId, 
        promptText: 'Waiting for submissions...', // Add required promptText
        isAssigned: false, 
        assignedPlayers 
      }));
    }
  });

  socket.on('imageSubmitted', ({ promptId, playerId, submissionId }) => {
    store.dispatch(addSubmission({ 
      submissionId, // Use submissionId instead of promptId
      promptId, 
      playerId, 
      imageUrl: '', // Add required imageUrl
      votes: [] // Add required votes array
    }));
  });

  socket.on('promptComplete', ({ promptId, submissions }) => {
    console.log('Prompt complete:', promptId);
  });
  
  socket.on('allSubmissionsComplete', ({ round, prompts }) => {
    store.dispatch(setGameStatus({ status: 'voting', currentRound: round }));
  });
  
  socket.on('startVoting', ({ promptId, promptText, submissions, assignedPlayers }) => {
    store.dispatch(setCurrentPrompt({ 
      promptId, 
      promptText, 
      isAssigned: false, // Change from true to false since we're waiting for submissions
      assignedPlayers
    }));
  });

  socket.on('voteSubmitted', ({ promptId, voterId, votedFor }) => {
    store.dispatch(addVote({ 
      submissionId: votedFor, // Use votedFor as submissionId
      voterId 
    }));
  });
  
  socket.on('promptVotingComplete', ({ promptId, submissions }) => {
    console.log('Voting complete for prompt:', promptId);
  });
  
  socket.on('pointsAwarded', ({ promptId, submissions, players }) => {
    console.log('Points awarded for prompt:', promptId);
  });
  
  socket.on('roundComplete', ({ round, prompts, scores }) => {
    store.dispatch(setGameStatus({ status: 'playing', currentRound: round }));
  });
  
  socket.on('startNextRound', ({ round }) => {
    store.dispatch(setGameStatus({ status: 'playing', currentRound: round }));
  });
  
  socket.on('gameComplete', ({ scores, winner }) => {
    store.dispatch(setGameStatus({ status: 'completed' }));
  });
  
  socket.on('gameCreated', (data) => {
    store.dispatch(setGameCreated(data));
  });

  socket.on('gameJoined', (data) => {
    store.dispatch(setGameCreated(data));
  });
  
  socket.on('playerDisconnected', ({ playerId, displayName }) => {
    console.log('Player disconnected:', displayName);
  });
  
  socket.on('error', ({ message }) => {
    console.error('Socket error:', message);
  });
};

// Zustand-based socket store for components that need it
import { create } from 'zustand';

interface SocketStore {
  socket: Socket | null;
  connected: boolean;
  connecting: boolean;
  error: string | null;
  gameCode: string | null;
  gameId: string | null;
  playerName: string | null;
  connect: () => void;
  disconnect: () => void;
  createGame: (playerName: string, maxPlayers?: number) => void;
  joinGame: (playerName: string, joinCode: string) => void;
  setReady: (isReady: boolean) => void;
  startGame: () => void;
  submitPrompt: (promptText: string) => void;
  submitVote: (submissionId: string) => void;
  leaveGame: () => void;
  setGameCode: (code: string) => void;
  setPlayerName: (name: string) => void;
}

export const useSocketStore = create<SocketStore>((set, get) => ({
  socket: null,
  connected: false,
  connecting: false,
  error: null,
  gameCode: null,
  gameId: null,
  playerName: null,

  connect: () => {
    set({ connecting: true, error: null });
    try {
      const socket = initializeSocket();
      if (socket) {
        // Set up socket event listeners for the store
        socket.on('game-created', (data) => {
          console.log('🎮 Game created:', data);
          set({ gameCode: data.gameCode, gameId: data.gameId });
          
          // Also dispatch to Redux for other components
          store.dispatch(setGameCreated({
            gameId: data.gameId,
            gameCode: data.gameCode,
            isHost: true
          }));
        });

        socket.on('game-joined', (data) => {
          console.log('🎮 Game joined:', data);
          set({ gameCode: data.gameCode, gameId: data.gameId });
          
          // Also dispatch to Redux for other components
          store.dispatch(setGameCreated({
            gameId: data.gameId,
            gameCode: data.gameCode,
            isHost: false
          }));
        });

        socket.on('error', (error) => {
          console.error('❌ Socket error:', error);
          set({ error: error.message || 'Socket error occurred' });
        });

        socket.connect();
        set({ socket, connected: true, connecting: false });
      }
    } catch (error) {
      set({ error: 'Failed to connect', connecting: false });
    }
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
    }
    set({ connected: false, socket: null });
  },

  createGame: (playerName: string, maxPlayers = 8) => {
    const { socket } = get();
    if (socket && socket.connected) {
      socket.emit('create-game', { playerName, maxPlayers });
    }
  },

  joinGame: (playerName: string, joinCode: string) => {
    const { socket } = get();
    if (socket && socket.connected) {
      socket.emit('join-game', { playerName, joinCode });
    }
  },

  setReady: (isReady: boolean) => {
    const { socket } = get();
    if (socket && socket.connected) {
      socket.emit('player-ready', { isReady });
    }
  },

  startGame: () => {
    const { socket } = get();
    if (socket && socket.connected) {
      socket.emit('start-game');
    }
  },

  submitPrompt: (promptText: string) => {
    const { socket } = get();
    if (socket && socket.connected) {
      socket.emit('submit-prompt', { promptText });
    }
  },

  submitVote: (submissionId: string) => {
    const { socket } = get();
    if (socket && socket.connected) {
      socket.emit('submit-vote', { submissionId });
    }
  },

  leaveGame: () => {
    const { socket } = get();
    if (socket && socket.connected) {
      socket.emit('leave-game');
    }
  },

  setGameCode: (code: string) => set({ gameCode: code }),
  setPlayerName: (name: string) => set({ playerName: name }),
}));