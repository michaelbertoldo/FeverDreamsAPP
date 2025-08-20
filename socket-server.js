const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// Enable CORS
app.use(cors());

// Game state management
const games = new Map();
const prompts = [
  "A cat wearing a superhero cape",
  "A robot cooking breakfast",
  "A treehouse in the clouds",
  "A car that can fly",
  "A penguin on a beach",
  "A clock made of food",
  "A dragon reading a book",
  "A robot playing guitar"
];

// Game phases
const GAME_PHASES = {
  LOBBY: 'lobby',
  PROMPT: 'prompt',
  SUBMISSION: 'submission',
  VOTING: 'voting',
  RESULTS: 'results'
};

// Socket connection handling
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log('✅ New client connected:', socket.id);

  // Handle game creation
  socket.on('create-game', ({ playerName, maxPlayers }) => {
    try {
      const gameCode = generateGameCode();
      const game = {
        id: generateId(),
        code: gameCode,
        hostId: socket.id,
        players: [{
          id: socket.id,
          name: playerName,
          isReady: true
        }],
        phase: GAME_PHASES.LOBBY,
        currentRound: 0,
        currentPrompt: null,
        roundStartTime: null,
        submissions: [],
        votes: [],
        createdAt: Date.now()
      };
      
      games.set(gameCode, game);
      socket.join(gameCode);
      socket.gameCode = gameCode;
      
      console.log(`🎮 Game created: ${gameCode} by ${playerName}`);
      
      // Notify the creator
      socket.emit('game-created', {
        gameCode,
        gameId: game.id,
        message: 'Game created successfully!'
      });
      
      // Notify all players in the game
      io.to(gameCode).emit('player-joined', {
        player: game.players[0],
        players: game.players
      });
    } catch (error) {
      console.error('Error creating game:', error);
      socket.emit('error', { message: 'Failed to create game' });
    }
  });

  // Handle joining a game
  socket.on('join-game', ({ playerName, joinCode }) => {
    try {
      const game = games.get(joinCode.toUpperCase());
      
      if (!game) {
        socket.emit('error', { message: 'Game not found' });
        return;
      }

      if (game.players.length >= 8) {
        socket.emit('error', { message: 'Game is full' });
        return;
      }

      // Add player to game
      game.players.push({
        id: socket.id,
        name: playerName,
        isReady: false
      });
      
      socket.join(joinCode);
      socket.gameCode = joinCode;
      
      console.log(`👤 Player ${playerName} joined game ${joinCode}`);
      
      // Notify the player
      socket.emit('game-joined', {
        gameCode: joinCode,
        gameId: game.id,
        message: 'Successfully joined game!'
      });
      
      // Notify all players in the game
      io.to(joinCode).emit('player-joined', {
        player: game.players[game.players.length - 1], // Get the player who just joined
        players: game.players
      });
    } catch (error) {
      console.error('Error joining game:', error);
      socket.emit('error', { message: 'Failed to join game' });
    }
  });

  // Handle player ready status
  socket.on('player-ready', ({ isReady }) => {
    const game = getGameBySocket(socket);
    if (!game) return;

    const player = game.players.find(p => p.id === socket.id);
    if (player) {
      player.isReady = isReady;
      console.log(`👤 Player ${player.name} is ${isReady ? 'ready' : 'not ready'} in game ${game.code}`);
      
      // Notify all players
      io.to(game.code).emit('player-ready-updated', {
        playerId: socket.id,
        isReady,
        players: game.players
      });
    }
  });

  // Handle game start
  socket.on('start-game', () => {
    const game = getGameBySocket(socket);
    if (!game) return;

    if (game.hostId !== socket.id) {
      socket.emit('error', { message: 'Only the host can start the game' });
      return;
    }

    if (game.players.length < 2) {
      socket.emit('error', { message: 'Need at least 2 players to start' });
      return;
    }

    // Start the game
    game.phase = GAME_PHASES.PROMPT;
    game.currentRound = 1;
    game.currentPrompt = prompts[Math.floor(Math.random() * prompts.length)];
    game.roundStartTime = Date.now();
    game.submissions = [];
    game.votes = [];

    console.log(`🚀 Game ${game.code} started! Prompt: ${game.currentPrompt}`);

    // Notify all players
    io.to(game.code).emit('game-started', {
      phase: game.phase,
      round: game.currentRound,
      prompt: game.currentPrompt,
      players: game.players.map(p => ({ id: p.id, name: p.name, ready: p.isReady }))
    });

    // Start prompt phase timer (30 seconds)
    setTimeout(() => {
      if (game.phase === GAME_PHASES.PROMPT) {
        startSubmissionPhase(game);
      }
    }, 30000);
  });

  // Handle prompt submission
  socket.on('submit-prompt', (data) => {
    const game = getGameBySocket(socket);
    if (!game || game.phase !== GAME_PHASES.PROMPT) return;

    const player = game.players.find(p => p.id === socket.id);
    if (!player) return;

    // For now, we'll use the server-generated prompt
    // In the future, you could allow custom prompts
    socket.emit('prompt-received', { 
      prompt: game.currentPrompt,
      timeRemaining: 30000 
    });
  });

  // Handle image submission
  socket.on('submit-image', (data) => {
    const game = getGameBySocket(socket);
    if (!game || game.phase !== GAME_PHASES.SUBMISSION) return;

    const player = game.players.find(p => p.id === socket.id);
    if (!player) return;

    // Add submission
    const submission = {
      id: generateId(),
      playerId: socket.id,
      playerName: player.name,
      imageUrl: data.imageUrl,
      timestamp: Date.now()
    };

    game.submissions.push(submission);
    console.log(`🖼️ Image submitted by ${player.name} in game ${game.code}`);

    // Check if all players have submitted
    if (game.submissions.length === game.players.length) {
      startVotingPhase(game);
    } else {
      // Update remaining time for other players
      io.to(game.code).emit('submission-update', {
        submitted: game.submissions.length,
        total: game.players.length,
        timeRemaining: 60000 - (Date.now() - game.roundStartTime)
      });
    }
  });

  // Handle voting
  socket.on('submit-vote', (data) => {
    const game = getGameBySocket(socket);
    if (!game || game.phase !== GAME_PHASES.VOTING) return;

    const player = game.players.find(p => p.id === socket.id);
    if (!player) return;

    // Check if already voted
    if (game.votes.find(v => v.voterId === socket.id)) {
      socket.emit('error', { message: 'You have already voted' });
      return;
    }

    // Add vote
    const vote = {
      id: generateId(),
      submissionId: data.submissionId,
      voterId: socket.id,
      voterName: player.name,
      timestamp: Date.now()
    };

    game.votes.push(vote);
    console.log(`🗳️ Vote submitted by ${player.name} for submission ${data.submissionId}`);

    // Check if all players have voted
    if (game.votes.length === game.players.length) {
      endRound(game);
    } else {
      // Update remaining time for other players
      io.to(game.code).emit('voting-update', {
        voted: game.votes.length,
        total: game.players.length,
        timeRemaining: 30000 - (Date.now() - game.roundStartTime)
      });
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id);
    
    if (socket.gameCode) {
      const game = games.get(socket.gameCode);
      if (game) {
        // Remove player from game
        game.players = game.players.filter(p => p.id !== socket.id);
        
        // If no players left, remove game
        if (game.players.length === 0) {
          games.delete(socket.gameCode);
          console.log(`🗑️ Game ${socket.gameCode} removed (no players left)`);
        } else {
          // If host left, assign new host
          if (game.hostId === socket.id) {
            game.hostId = game.players[0].id;
            game.players[0].isReady = true;
          }
          
          // Notify remaining players
          io.to(socket.gameCode).emit('player-left', {
            playerId: socket.id,
            players: game.players,
            newHostId: game.hostId
          });
        }
      }
    }
  });
});

// Helper functions
function startSubmissionPhase(game) {
  game.phase = GAME_PHASES.SUBMISSION;
  game.roundStartTime = Date.now();
  
  console.log(`🖼️ Starting submission phase for game ${game.code}`);
  
  io.to(game.code).emit('phase-changed', {
    phase: game.phase,
    message: 'Submit your AI-generated image!',
    timeRemaining: 60000
  });

  // Start submission phase timer (60 seconds)
  setTimeout(() => {
    if (game.phase === GAME_PHASES.SUBMISSION) {
      startVotingPhase(game);
    }
  }, 60000);
}

function startVotingPhase(game) {
  game.phase = GAME_PHASES.VOTING;
  game.roundStartTime = Date.now();
  
  console.log(`🗳️ Starting voting phase for game ${game.code}`);
  
  io.to(game.code).emit('phase-changed', {
    phase: game.phase,
    submissions: game.submissions,
    message: 'Vote for your favorite image!',
    timeRemaining: 30000
  });

  // Start voting phase timer (30 seconds)
  setTimeout(() => {
    if (game.phase === GAME_PHASES.VOTING) {
      endRound(game);
    }
  }, 30000);
}

function endRound(game) {
  game.phase = GAME_PHASES.RESULTS;
  
  // Calculate results
  const voteCounts = {};
  game.submissions.forEach(sub => {
    voteCounts[sub.id] = 0;
  });
  
  game.votes.forEach(vote => {
    voteCounts[vote.submissionId]++;
  });
  
  const winner = Object.entries(voteCounts).reduce((a, b) => 
    voteCounts[a[0]] > voteCounts[b[0]] ? a : b
  );
  
  console.log(`🏆 Round ended in game ${game.code}. Winner: ${winner[0]} with ${winner[1]} votes`);
  
  // Send results to all players
  io.to(game.code).emit('round-results', {
    phase: game.phase,
    submissions: game.submissions,
    votes: game.votes,
    winner: winner[0],
    winnerVotes: winner[1]
  });

  // Reset for next round or end game
  setTimeout(() => {
    if (game.currentRound < 3) { // Play 3 rounds
      game.currentRound++;
      game.phase = GAME_PHASES.PROMPT;
      game.currentPrompt = prompts[Math.floor(Math.random() * prompts.length)];
      game.submissions = [];
      game.votes = [];
      
      io.to(game.code).emit('next-round', {
        phase: game.phase,
        round: game.currentRound,
        prompt: game.currentPrompt
      });
    } else {
      // Game over
      io.to(game.code).emit('game-over', {
        message: 'Game completed! Thanks for playing!',
        finalResults: {
          rounds: game.currentRound,
          totalPlayers: game.players.length
        }
      });
      
      // Remove game
      games.delete(game.code);
    }
  }, 5000); // Show results for 5 seconds
}

// Generate a random 6-character game code
function generateGameCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Helper function to get game by socket
function getGameBySocket(socket) {
  const gameCode = socket.gameCode;
  if (!gameCode) return null;
  return games.get(gameCode);
}

// Helper function to generate a unique ID
function generateId() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    activeGames: games.size,
    timestamp: new Date().toISOString()
  });
});

// Get active games info
app.get('/games', (req, res) => {
  const gamesInfo = Array.from(games.values()).map(game => ({
    code: game.code,
    playerCount: game.players.length,
    phase: game.phase,
    round: game.currentRound,
    createdAt: game.createdAt
  }));
  
  res.json(gamesInfo);
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 Socket server running on port ${PORT}`);
  console.log(`📱 Health check: http://localhost:${PORT}/health`);
  console.log(`🎮 Games info: http://localhost:${PORT}/games`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🔄 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});
