// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');
const socketIO = require('socket.io');
const http = require('http' );

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

// Create Express app
const app = express();
app.use(cors({ origin: true }));

// Create HTTP server
const server = http.createServer(app );

// Initialize Socket.IO
const io = socketIO(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Game rooms storage
const gameRooms = {};

// Socket.IO connection handler
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);
  
  // Join game room
  socket.on('joinGame', async ({ gameId, userId, displayName }) => {
    try {
      // Join the Socket.IO room
      socket.join(gameId);
      
      // Initialize game room if it doesn't exist
      if (!gameRooms[gameId]) {
        // Get game data from Firestore
        const gameDoc = await db.collection('games').doc(gameId).get();
        
        if (!gameDoc.exists) {
          socket.emit('error', { message: 'Game not found' });
          return;
        }
        
        const gameData = gameDoc.data();
        
        gameRooms[gameId] = {
          players: {},
          status: gameData.status || 'waiting',
          currentRound: gameData.currentRound || 0,
          currentPrompt: gameData.currentPrompt || 0,
          hostId: gameData.hostId
        };
      }
      
      // Add player to game room
      gameRooms[gameId].players[userId] = {
        id: userId,
        displayName,
        isReady: false,
        isHost: gameRooms[gameId].hostId === userId,
        score: 0
      };
      
      // Update Firestore
      await db.collection('games').doc(gameId).update({
        [`players.${userId}`]: {
          displayName,
          isReady: false,
          isHost: gameRooms[gameId].hostId === userId,
          score: 0,
          joinedAt: admin.firestore.FieldValue.serverTimestamp()
        }
      });
      
      // Notify room that player joined
      io.to(gameId).emit('playerJoined', {
        playerId: userId,
        displayName,
        isHost: gameRooms[gameId].hostId === userId,
        players: gameRooms[gameId].players
      });
      
      // Send current game state to the new player
      socket.emit('gameState', gameRooms[gameId]);
    } catch (error) {
      console.error('Join game error:', error);
      socket.emit('error', { message: 'Failed to join game' });
    }
  });
  
  // Player ready status
  socket.on('playerReady', async ({ gameId, userId, isReady }) => {
    try {
      // Update player ready status
      if (gameRooms[gameId] && gameRooms[gameId].players[userId]) {
        gameRooms[gameId].players[userId].isReady = isReady;
        
        // Update Firestore
        await db.collection('games').doc(gameId).update({
          [`players.${userId}.isReady`]: isReady
        });
        
        // Notify room of player ready status
        io.to(gameId).emit('playerReadyUpdate', {
          playerId: userId,
          isReady,
          players: gameRooms[gameId].players
        });
        
        // Check if all players are ready to start
        const allPlayersReady = Object.values(gameRooms[gameId].players).every(
          player => player.isReady
        );
        
        if (allPlayersReady && Object.keys(gameRooms[gameId].players).length >= 2) {
          io.to(gameId).emit('allPlayersReady');
        }
      }
    } catch (error) {
      console.error('Player ready error:', error);
      socket.emit('error', { message: 'Failed to update ready status' });
    }
  });
  
  // Start game
  socket.on('startGame', async ({ gameId, userId }) => {
    try {
      // Check if user is host
      if (gameRooms[gameId] && gameRooms[gameId].hostId === userId) {
        // Update game status
        gameRooms[gameId].status = 'playing';
        gameRooms[gameId].currentRound = 1;
        gameRooms[gameId].currentPrompt = 0;
        
        // Generate prompts for the game
        const prompts = await generateGamePrompts(gameId, Object.keys(gameRooms[gameId].players));
        gameRooms[gameId].prompts = prompts;
        
        // Update Firestore
        await db.collection('games').doc(gameId).update({
          status: 'playing',
          currentRound: 1,
          currentPrompt: 0,
          startedAt: admin.firestore.FieldValue.serverTimestamp(),
          prompts
        });
        
        // Notify room that game started
        io.to(gameId).emit('gameStarted', {
          status: 'playing',
          currentRound: 1,
          prompts
        });
        
        // Assign first prompt to players
        assignPromptToPlayers(gameId);
      } else {
        socket.emit('error', { message: 'Only the host can start the game' });
      }
    } catch (error) {
      console.error('Start game error:', error);
      socket.emit('error', { message: 'Failed to start game' });
    }
  });
  
  // Submit image
  socket.on('submitImage', async ({ gameId, userId, promptId, imageUrl }) => {
    try {
      // Find the current prompt
      const prompt = gameRooms[gameId]?.prompts?.find(p => p.id === promptId);
      
      if (!prompt) {
        socket.emit('error', { message: 'Prompt not found' });
        return;
      }
      
      // Check if user is assigned to this prompt
      if (!prompt.assignedPlayers.includes(userId)) {
        socket.emit('error', { message: 'You are not assigned to this prompt' });
        return;
      }
      
      // Save submission to Firestore
      const submissionRef = await db.collection('submissions').add({
        gameId,
        promptId,
        playerId: userId,
        imageUrl,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Update prompt with submission
      if (!prompt.submissions) prompt.submissions = {};
      prompt.submissions[userId] = {
        id: submissionRef.id,
        imageUrl,
        votes: []
      };
      
      // Update Firestore game document
      await db.collection('games').doc(gameId).update({
        [`prompts.${prompt.index}.submissions.${userId}`]: {
          id: submissionRef.id,
          imageUrl,
          votes: []
        }
      });
      
      // Notify room of submission
      io.to(gameId).emit('imageSubmitted', {
        promptId,
        playerId: userId,
        submissionId: submissionRef.id
      });
      
      // Check if all submissions for this prompt are complete
      const assignedPlayers = prompt.assignedPlayers;
      const submittedPlayers = Object.keys(prompt.submissions || {});
      
      if (assignedPlayers.length === submittedPlayers.length) {
        // All players assigned to this prompt have submitted
        io.to(gameId).emit('promptComplete', {
          promptId,
          submissions: prompt.submissions
        });
        
        // Check if all prompts in this round are complete
        checkRoundProgress(gameId);
      }
    } catch (error) {
      console.error('Submit image error:', error);
      socket.emit('error', { message: 'Failed to submit image' });
    }
  });
  
  // Submit vote
  socket.on('submitVote', async ({ gameId, userId, promptId, votedFor }) => {
    try {
      // Find the current prompt
      const prompt = gameRooms[gameId]?.prompts?.find(p => p.id === promptId);
      
      if (!prompt || !prompt.submissions || !prompt.submissions[votedFor]) {
        socket.emit('error', { message: 'Invalid vote' });
        return;
      }
      
      // Check if user is not voting for themselves
      if (votedFor === userId) {
        socket.emit('error', { message: 'You cannot vote for yourself' });
        return;
      }
      
      // Check if user is not assigned to this prompt (only non-participants can vote)
      if (prompt.assignedPlayers.includes(userId)) {
        socket.emit('error', { message: 'You cannot vote on your own prompt' });
        return;
      }
      
      // Add vote to submission
      prompt.submissions[votedFor].votes.push(userId);
      
      // Update Firestore
      await db.collection('games').doc(gameId).update({
        [`prompts.${prompt.index}.submissions.${votedFor}.votes`]: admin.firestore.FieldValue.arrayUnion(userId)
      });
      
      // Notify room of vote
      io.to(gameId).emit('voteSubmitted', {
        promptId,
        voterId: userId,
        votedFor
      });
      
      // Check if all votes for this prompt are complete
      const eligibleVoters = Object.keys(gameRooms[gameId].players).filter(
        playerId => !prompt.assignedPlayers.includes(playerId)
      );
      
      const totalVotes = Object.values(prompt.submissions).reduce(
        (sum, submission) => sum + submission.votes.length, 0
      );
      
      if (totalVotes >= eligibleVoters.length) {
        // All eligible players have voted on this prompt
        io.to(gameId).emit('promptVotingComplete', {
          promptId,
          submissions: prompt.submissions
        });
        
        // Calculate and award points
        awardPointsForPrompt(gameId, promptId);
        
        // Check if all prompts in this round have been voted on
        checkVotingProgress(gameId);
      }
    } catch (error) {
      console.error('Submit vote error:', error);
      socket.emit('error', { message: 'Failed to submit vote' });
    }
  });
  
  // Disconnect handler
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    
    // Find and remove player from game rooms
    Object.keys(gameRooms).forEach(async (gameId) => {
      const playerIds = Object.keys(gameRooms[gameId].players);
      
      for (const playerId of playerIds) {
        const player = gameRooms[gameId].players[playerId];
        
        if (player.socketId === socket.id) {
          // Mark player as disconnected but don't remove
          gameRooms[gameId].players[playerId].connected = false;
          
          // Update Firestore
          await db.collection('games').doc(gameId).update({
            [`players.${playerId}.connected`]: false,
            [`players.${playerId}.lastActive`]: admin.firestore.FieldValue.serverTimestamp()
          });
          
          // Notify room that player disconnected
          io.to(gameId).emit('playerDisconnected', {
            playerId,
            displayName: player.displayName
          });
          
          break;
        }
      }
    });
  });
});

// Helper function to generate game prompts
async function generateGamePrompts(gameId, playerIds) {
  try {
    // Get prompt templates from Firestore
    const promptsSnapshot = await db.collection('promptTemplates').limit(12).get();
    const promptTemplates = [];
    
    promptsSnapshot.forEach(doc => {
      promptTemplates.push({
        id: doc.id,
        text: doc.data().text
      });
    });
    
    // Shuffle and select prompts for the game (4 prompts per round, 3 rounds)
    const shuffledPrompts = promptTemplates.sort(() => 0.5 - Math.random()).slice(0, 12);
    
    // Organize prompts by round
    const gamePrompts = [];
    
    for (let round = 1; round <= 3; round++) {
      for (let i = 0; i < 4; i++) {
        const promptIndex = (round - 1) * 4 + i;
        const promptTemplate = shuffledPrompts[promptIndex];
        
        if (!promptTemplate) continue;
        
        // Assign 2 random players to each prompt
        const shuffledPlayers = [...playerIds].sort(() => 0.5 - Math.random());
        const assignedPlayers = shuffledPlayers.slice(0, 2);
        
        gamePrompts.push({
          id: `${gameId}_${round}_${i}`,
          index: gamePrompts.length,
          text: promptTemplate.text,
          round,
          assignedPlayers,
          submissions: {}
        });
      }
    }
    
    return gamePrompts;
  } catch (error) {
    console.error('Generate prompts error:', error);
    throw error;
  }
}

// Helper function to assign prompt to players
function assignPromptToPlayers(gameId) {
  try {
    const gameRoom = gameRooms[gameId];
    if (!gameRoom) return;
    
    const currentRound = gameRoom.currentRound;
    const currentPromptIndex = gameRoom.currentPrompt;
    
    // Find prompts for current round
    const roundPrompts = gameRoom.prompts.filter(p => p.round === currentRound);
    
    if (currentPromptIndex < roundPrompts.length) {
      const prompt = roundPrompts[currentPromptIndex];
      
      // Notify assigned players
      prompt.assignedPlayers.forEach(playerId => {
        io.to(gameId).emit('promptAssigned', {
          playerId,
          promptId: prompt.id,
          promptText: prompt.text
        });
      });
      
      // Notify other players to wait
      Object.keys(gameRoom.players).forEach(playerId => {
        if (!prompt.assignedPlayers.includes(playerId)) {
          io.to(gameId).emit('waitForSubmissions', {
            playerId,
            promptId: prompt.id,
            assignedPlayers: prompt.assignedPlayers.map(id => gameRoom.players[id]?.displayName || id)
          });
        }
      });
    }
  } catch (error) {
    console.error('Assign prompt error:', error);
  }
}

// Helper function to check round progress
function checkRoundProgress(gameId) {
  try {
    const gameRoom = gameRooms[gameId];
    if (!gameRoom) return;
    
    const currentRound = gameRoom.currentRound;
    const roundPrompts = gameRoom.prompts.filter(p => p.round === currentRound);
    
    // Check if all prompts have submissions
    const allPromptsComplete = roundPrompts.every(prompt => {
      const assignedPlayers = prompt.assignedPlayers;
      const submittedPlayers = Object.keys(prompt.submissions || {});
      return assignedPlayers.length === submittedPlayers.length;
    });
    
    if (allPromptsComplete) {
      // Move to voting phase
      gameRoom.status = 'voting';
      
      // Update Firestore
      db.collection('games').doc(gameId).update({
        status: 'voting'
      });
      
      // Notify room that all submissions are complete
      io.to(gameId).emit('allSubmissionsComplete', {
        round: currentRound,
        prompts: roundPrompts
      });
      
      // Start voting on first prompt
      startPromptVoting(gameId, roundPrompts[0].id);
    } else {
      // Move to next prompt
      gameRoom.currentPrompt++;
      
      // Update Firestore
      db.collection('games').doc(gameId).update({
        currentPrompt: gameRoom.currentPrompt
      });
      
      // Assign next prompt to players
      assignPromptToPlayers(gameId);
    }
  } catch (error) {
    console.error('Check round progress error:', error);
  }
}

// Helper function to start voting on a prompt
function startPromptVoting(gameId, promptId) {
  try {
    const gameRoom = gameRooms[gameId];
    if (!gameRoom) return;
    
    const prompt = gameRoom.prompts.find(p => p.id === promptId);
    if (!prompt) return;
    
    // Update current prompt for voting
    gameRoom.currentPrompt = prompt.index;
    
    // Update Firestore
    db.collection('games').doc(gameId).update({
      currentPrompt: prompt.index,
      votingPromptId: promptId
    });
    
    // Notify room to start voting
    io.to(gameId).emit('startVoting', {
      promptId,
      promptText: prompt.text,
      submissions: prompt.submissions,
      assignedPlayers: prompt.assignedPlayers
    });
  } catch (error) {
    console.error('Start voting error:', error);
  }
}

// Helper function to check voting progress
function checkVotingProgress(gameId) {
  try {
    const gameRoom = gameRooms[gameId];
    if (!gameRoom) return;
    
    const currentRound = gameRoom.currentRound;
    const roundPrompts = gameRoom.prompts.filter(p => p.round === currentRound);
    
    // Find current prompt index
    const currentPromptIndex = gameRoom.currentPrompt;
    
    // Check if there are more prompts to vote on
    if (currentPromptIndex < roundPrompts.length - 1) {
      // Move to next prompt
      const nextPrompt = roundPrompts[currentPromptIndex + 1];
      startPromptVoting(gameId, nextPrompt.id);
    } else {
      // All prompts in this round have been voted on
      // Show round results
      io.to(gameId).emit('roundComplete', {
        round: currentRound,
        prompts: roundPrompts,
        scores: calculateRoundScores(gameId, currentRound)
      });
      
      // Check if game is complete
      if (currentRound >= 3) {
        // Game is complete
        gameRoom.status = 'completed';
        
        // Update Firestore
        db.collection('games').doc(gameId).update({
          status: 'completed',
          completedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        // Notify room that game is complete
        io.to(gameId).emit('gameComplete', {
          scores: calculateFinalScores(gameId),
          winner: determineWinner(gameId)
        });
      } else {
        // Move to next round
        gameRoom.currentRound++;
        gameRoom.currentPrompt = 0;
        gameRoom.status = 'playing';
        
        // Update Firestore
        db.collection('games').doc(gameId).update({
          currentRound: gameRoom.currentRound,
          currentPrompt: 0,
          status: 'playing'
        });
        
        // Start next round after a delay
        setTimeout(() => {
          io.to(gameId).emit('startNextRound', {
            round: gameRoom.currentRound
          });
          
          // Assign first prompt of next round
          assignPromptToPlayers(gameId);
        }, 10000); // 10 second delay to show results
      }
    }
  } catch (error) {
    console.error('Check voting progress error:', error);
  }
}

// Helper function to award points for a prompt
function awardPointsForPrompt(gameId, promptId) {
  try {
    const gameRoom = gameRooms[gameId];
    if (!gameRoom) return;
    
    const prompt = gameRoom.prompts.find(p => p.id === promptId);
    if (!prompt || !prompt.submissions) return;
    
    // Calculate points for each submission
    Object.entries(prompt.submissions).forEach(([playerId, submission]) => {
      const votes = submission.votes || [];
      const pointsPerVote = 100;
      
      // Calculate points (100 per vote, 1000 if unanimous)
      const eligibleVoters = Object.keys(gameRoom.players).filter(
        id => !prompt.assignedPlayers.includes(id)
      );
      
      let points = votes.length * pointsPerVote;
      
      // Check for unanimous vote
      if (votes.length === eligibleVoters.length && votes.length > 0) {
        points = 1000; // Unanimous vote bonus
      }
      
      // Add points to player's score
      if (gameRoom.players[playerId]) {
        gameRoom.players[playerId].score = (gameRoom.players[playerId].score || 0) + points;
        
        // Update Firestore
        db.collection('games').doc(gameId).update({
          [`players.${playerId}.score`]: gameRoom.players[playerId].score
        });
      }
      
      // Save points to submission
      prompt.submissions[playerId].points = points;
      
      // Update Firestore
      db.collection('games').doc(gameId).update({
        [`prompts.${prompt.index}.submissions.${playerId}.points`]: points
      });
    });
    
    // Notify room of points awarded
    io.to(gameId).emit('pointsAwarded', {
      promptId,
      submissions: prompt.submissions,
      players: gameRoom.players
    });
  } catch (error) {
    console.error('Award points error:', error);
  }
}

// Helper function to calculate round scores
function calculateRoundScores(gameId, round) {
  try {
    const gameRoom = gameRooms[gameId];
    if (!gameRoom) return {};
    
    const roundPrompts = gameRoom.prompts.filter(p => p.round === round);
    const roundScores = {};
    
    // Initialize scores for all players
    Object.keys(gameRoom.players).forEach(playerId => {
      roundScores[playerId] = {
        playerId,
        displayName: gameRoom.players[playerId].displayName,
        roundScore: 0,
        totalScore: gameRoom.players[playerId].score || 0
      };
    });
    
    // Calculate round scores
    roundPrompts.forEach(prompt => {
      if (!prompt.submissions) return;
      
      Object.entries(prompt.submissions).forEach(([playerId, submission]) => {
        if (roundScores[playerId] && submission.points) {
          roundScores[playerId].roundScore += submission.points;
        }
      });
    });
    
    return roundScores;
  } catch (error) {
    console.error('Calculate round scores error:', error);
    return {};
  }
}

// Helper function to calculate final scores
function calculateFinalScores(gameId) {
  try {
    const gameRoom = gameRooms[gameId];
    if (!gameRoom) return {};
    
    const finalScores = {};
    
    // Get final scores for all players
    Object.entries(gameRoom.players).forEach(([playerId, player]) => {
      finalScores[playerId] = {
        playerId,
        displayName: player.displayName,
        score: player.score || 0
      };
    });
    
    return finalScores;
  } catch (error) {
    console.error('Calculate final scores error:', error);
    return {};
  }
}

// Helper function to determine winner
function determineWinner(gameId) {
  try {
    const gameRoom = gameRooms[gameId];
    if (!gameRoom) return null;
    
    let highestScore = -1;
    let winnerId = null;
    
    // Find player with highest score
    Object.entries(gameRoom.players).forEach(([playerId, player]) => {
      const score = player.score || 0;
      if (score > highestScore) {
        highestScore = score;
        winnerId = playerId;
      }
    });
    
    if (winnerId) {
      return {
        playerId: winnerId,
        displayName: gameRoom.players[winnerId].displayName,
        score: highestScore
      };
    }
    
    return null;
  } catch (error) {
    console.error('Determine winner error:', error);
    return null;
  }
}

// Express route for creating a new game
app.post('/games', async (req, res) => {
  try {
    const { hostId, hostName } = req.body;
    
    if (!hostId || !hostName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Generate a unique join code
    const joinCode = generateJoinCode();
    
    // Create game document in Firestore
    const gameRef = await db.collection('games').add({
      hostId,
      joinCode,
      status: 'waiting',
      players: {
        [hostId]: {
          displayName: hostName,
          isHost: true,
          isReady: false,
          score: 0,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        }
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return res.status(201).json({
      gameId: gameRef.id,
      joinCode,
      hostId
    });
  } catch (error) {
    console.error('Create game error:', error);
    return res.status(500).json({ error: 'Failed to create game' });
  }
});

// Express route for joining a game
app.post('/games/join', async (req, res) => {
  try {
    const { joinCode, userId, displayName } = req.body;
    
    if (!joinCode || !userId || !displayName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Find game with join code
    const gamesSnapshot = await db.collection('games')
      .where('joinCode', '==', joinCode)
      .where('status', '==', 'waiting')
      .limit(1)
      .get();
    
    if (gamesSnapshot.empty) {
      return res.status(404).json({ error: 'Game not found or already started' });
    }
    
    const gameDoc = gamesSnapshot.docs[0];
    const gameId = gameDoc.id;
    const gameData = gameDoc.data();
    
    // Check if game is full (max 8 players)
    const playerCount = Object.keys(gameData.players || {}).length;
    if (playerCount >= 8) {
      return res.status(400).json({ error: 'Game is full' });
    }
    
    return res.status(200).json({
      gameId,
      joinCode,
      hostId: gameData.hostId
    });
  } catch (error) {
    console.error('Join game error:', error);
    return res.status(500).json({ error: 'Failed to join game' });
  }
});

// Helper function to generate a unique join code
function generateJoinCode() {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed similar looking characters
  let code = '';
  
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    code += characters.charAt(randomIndex);
  }
  
  return code;
}

// Export the Express API as a Firebase Function
exports.api = functions.https.onRequest(app );

// Export the Socket.IO server as a Firebase Function
exports.socket = functions.https.onRequest(server );
