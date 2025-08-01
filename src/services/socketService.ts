// src/services/socketService.ts
import { io, Socket } from 'socket.io-client';
import { auth } from '../config/firebase';
import { store } from '../store';
import { 
  setGameState, 
  addPlayer, 
  updatePlayerReady,
  setGameStatus,
  setCurrentPrompt,
  setSubmission,
  setVote,
  setRoundResults,
  setGameResults
} from '../store/slices/gameSlice';

// Socket.IO client instance
let socket: Socket | null = null;

// Socket.IO server URL
const SOCKET_URL = 'https://your-firebase-function-url.com/socket';

// Initialize Socket.IO client
export const initializeSocket = ( ): Socket => {
  if (socket) return socket;
  
  socket = io(SOCKET_URL, {
    transports: ['websocket'],
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    timeout: 10000
  });
  
  // Set up event listeners
  setupSocketListeners(socket);
  
  return socket;
};

// Connect to Socket.IO server
export const connectSocket = (): void => {
  if (!socket) initializeSocket();
  if (socket && !socket.connected) socket.connect();
};

// Disconnect from Socket.IO server
export const disconnectSocket = (): void => {
  if (socket && socket.connected) socket.disconnect();
};

// Join a game room
export const joinGame = (gameId: string, displayName: string): void => {
  if (!socket || !socket.connected) connectSocket();
  
  const userId = auth.currentUser?.uid;
  if (!userId) return;
  
  socket.emit('joinGame', { gameId, userId, displayName });
};

// Set player ready status
export const setPlayerReady = (gameId: string, isReady: boolean): void => {
  if (!socket || !socket.connected) return;
  
  const userId = auth.currentUser?.uid;
  if (!userId) return;
  
  socket.emit('playerReady', { gameId, userId, isReady });
};

// Start the game (host only)
export const startGame = (gameId: string): void => {
  if (!socket || !socket.connected) return;
  
  const userId = auth.currentUser?.uid;
  if (!userId) return;
  
  socket.emit('startGame', { gameId, userId });
};

// Submit an image for a prompt
export const submitImage = (gameId: string, promptId: string, imageUrl: string): void => {
  if (!socket || !socket.connected) return;
  
  const userId = auth.currentUser?.uid;
  if (!userId) return;
  
  socket.emit('submitImage', { gameId, userId, promptId, imageUrl });
};

// Submit a vote for an image
export const submitVote = (gameId: string, promptId: string, votedFor: string): void => {
  if (!socket || !socket.connected) return;
  
  const userId = auth.currentUser?.uid;
  if (!userId) return;
  
  socket.emit('submitVote', { gameId, userId, promptId, votedFor });
};

// Set up Socket.IO event listeners
const setupSocketListeners = (socket: Socket): void => {
  // Connection events
  socket.on('connect', () => {
    console.log('Socket connected');
  });
  
  socket.on('disconnect', () => {
    console.log('Socket disconnected');
  });
  
  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
  });
  
  // Game events
  socket.on('gameState', (gameState) => {
    store.dispatch(setGameState(gameState));
  });
  
  socket.on('playerJoined', ({ playerId, displayName, isHost, players }) => {
    store.dispatch(addPlayer({ playerId, displayName, isHost }));
  });
  
  socket.on('playerReadyUpdate', ({ playerId, isReady }) => {
    store.dispatch(updatePlayerReady({ playerId, isReady }));
  });
  
  socket.on('allPlayersReady', () => {
    // Notification that all players are ready
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
      store.dispatch(setCurrentPrompt({ promptId, isAssigned: false, assignedPlayers }));
    }
  });
  
  socket.on('imageSubmitted', ({ promptId, playerId, submissionId }) => {
    store.dispatch(setSubmission({ promptId, playerId, submissionId }));
  });
  
  socket.on('promptComplete', ({ promptId, submissions }) => {
    // All submissions for this prompt are complete
  });
  
  socket.on('allSubmissionsComplete', ({ round, prompts }) => {
    store.dispatch(setGameStatus({ status: 'voting', currentRound: round }));
  });
  
  socket.on('startVoting', ({ promptId, promptText, submissions, assignedPlayers }) => {
    store.dispatch(setCurrentPrompt({ 
      promptId, 
      promptText, 
      submissions, 
      assignedPlayers,
      isVoting: true 
    }));
  });
  
  socket.on('voteSubmitted', ({ promptId, voterId, votedFor }) => {
    store.dispatch(setVote({ promptId, voterId, votedFor }));
  });
  
  socket.on('promptVotingComplete', ({ promptId, submissions }) => {
    // Voting for this prompt is complete
  });
  
  socket.on('pointsAwarded', ({ promptId, submissions, players }) => {
    // Points have been awarded for this prompt
  });
  
  socket.on('roundComplete', ({ round, prompts, scores }) => {
    store.dispatch(setRoundResults({ round, prompts, scores }));
  });
  
  socket.on('startNextRound', ({ round }) => {
    store.dispatch(setGameStatus({ status: 'playing', currentRound: round }));
  });
  
  socket.on('gameComplete', ({ scores, winner }) => {
    store.dispatch(setGameResults({ scores, winner }));
    store.dispatch(setGameStatus({ status: 'completed' }));
  });
  
  socket.on('playerDisconnected', ({ playerId, displayName }) => {
    // Handle player disconnection
  });
  
  socket.on('error', ({ message }) => {
    console.error('Socket error:', message);
  });
};
