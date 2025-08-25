import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import Replicate from 'replicate';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Replicate
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

// Game state management
interface Player {
  id: string;
  socketId: string;
  name: string;
  selfieUrl: string;
  score: number;
  isHost: boolean;
}

interface Submission {
  playerId: string;
  playerName: string;
  promptResponse: string;
  imageUrl: string;
  votes: number;
}

interface Game {
  id: string;
  code: string;
  status: 'lobby' | 'playing' | 'voting' | 'roundResults' | 'finalResults';
  currentRound: number;
  totalRounds: number;
  players: Map<string, Player>;
  currentPromptId: string;
  submissions: Map<string, Submission>;
  votingPairs: Array<{ pair: Submission[], promptId: string }>;
  roundScores: Map<string, number>;
  hostId: string;
}

const games = new Map<string, Game>();
const playerToGame = new Map<string, string>();

// Prompts database
const PROMPTS = [
  // Round 1 - Silly
  { id: 'p1', text: 'The worst superhero power would be turning into {blank}', category: 'silly', round: 1 },
  { id: 'p2', text: 'A terrible name for a restaurant would be {blank}', category: 'silly', round: 1 },
  { id: 'p3', text: 'The most useless smartphone app would be {blank}', category: 'silly', round: 1 },
  { id: 'p4', text: 'The worst thing to say on a first date is {blank}', category: 'silly', round: 1 },
  { id: 'p5', text: 'A horrible theme for a birthday party would be {blank}', category: 'silly', round: 1 },
  
  // Round 2 - Creative
  { id: 'p6', text: 'If cats ruled the world, the first law would be {blank}', category: 'creative', round: 2 },
  { id: 'p7', text: 'The secret ingredient in grandma\'s cookies is actually {blank}', category: 'creative', round: 2 },
  { id: 'p8', text: 'Aliens refuse to visit Earth because of {blank}', category: 'creative', round: 2 },
  { id: 'p9', text: 'The real reason dinosaurs went extinct was {blank}', category: 'creative', round: 2 },
  { id: 'p10', text: 'In the future, people will pay millions for {blank}', category: 'creative', round: 2 },
  
  // Round 3 - Absurd
  { id: 'p11', text: 'The Pope\'s secret hobby is {blank}', category: 'absurd', round: 3 },
  { id: 'p12', text: 'The WiFi password in hell is {blank}', category: 'absurd', round: 3 },
  { id: 'p13', text: 'God\'s biggest regret when creating humans was {blank}', category: 'absurd', round: 3 },
  { id: 'p14', text: 'The title of Shakespeare\'s lost play was {blank}', category: 'absurd', round: 3 },
  { id: 'p15', text: 'The last thing you want to hear your surgeon say is {blank}', category: 'absurd', round: 3 },
];

// Helper functions
function generateGameCode(): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += letters[Math.floor(Math.random() * letters.length)];
  }
  return code;
}

function getPromptForRound(round: number): any {
  const roundPrompts = PROMPTS.filter(p => p.round === round);
  return roundPrompts[Math.floor(Math.random() * roundPrompts.length)];
}

function createVotingPairs(submissions: Submission[]): Array<{ pair: Submission[], promptId: string }> {
  const pairs = [];
  for (let i = 0; i < submissions.length; i += 2) {
    if (i + 1 < submissions.length) {
      pairs.push({
        pair: [submissions[i], submissions[i + 1]],
        promptId: 'current',
      });
    }
  }
  return pairs;
}

// API Routes
app.post('/api/generate-image', async (req, res) => {
  try {
    const { prompt, selfieUrl } = req.body;
    
    console.log('Generating AI image with prompt:', prompt);
    
    // Using Flux with face swap for best results
    const output = await replicate.run(
      "lucataco/flux-dev-lora:613a21a57e8545532d2f4016a7c3cfa3c7c63b95d8f712c4e66e101839f35c71",
      {
        input: {
          prompt: `Funny meme photo of person as ${prompt}, highly detailed, comedic, exaggerated expression`,
          image: selfieUrl,
          num_outputs: 1,
          guidance_scale: 7.5,
          num_inference_steps: 28,
        }
      }
    );
    
    res.json({ success: true, imageUrl: Array.isArray(output) ? output[0] : output });
  } catch (error) {
    console.error('Error generating image:', error);
    res.status(500).json({ success: false, error: 'Failed to generate image' });
  }
});

// Socket.IO event handlers
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Create game
  socket.on('create-game', (playerData: { name: string; selfieUrl: string }) => {
    const gameCode = generateGameCode();
    const gameId = uuidv4();
    
    const player: Player = {
      id: socket.id,
      socketId: socket.id,
      name: playerData.name,
      selfieUrl: playerData.selfieUrl,
      score: 0,
      isHost: true,
    };
    
    const game: Game = {
      id: gameId,
      code: gameCode,
      status: 'lobby',
      currentRound: 1,
      totalRounds: 3,
      players: new Map([[socket.id, player]]),
      currentPromptId: '',
      submissions: new Map(),
      votingPairs: [],
      roundScores: new Map(),
      hostId: socket.id,
    };
    
    games.set(gameId, game);
    playerToGame.set(socket.id, gameId);
    
    socket.join(gameId);
    socket.emit('game-created', {
      gameId,
      gameCode,
      player,
    });
    
    console.log(`Game created with code: ${gameCode}`);
  });

  // Join game
  socket.on('join-game', (data: { gameCode: string; name: string; selfieUrl: string }) => {
    const game = Array.from(games.values()).find(g => g.code === data.gameCode.toUpperCase());
    
    if (!game) {
      socket.emit('error', 'Invalid game code');
      return;
    }
    
    if (game.players.size >= 8) {
      socket.emit('error', 'Game is full');
      return;
    }
    
    const player: Player = {
      id: socket.id,
      socketId: socket.id,
      name: data.name,
      selfieUrl: data.selfieUrl,
      score: 0,
      isHost: false,
    };
    
    game.players.set(socket.id, player);
    playerToGame.set(socket.id, game.id);
    
    socket.join(game.id);
    socket.emit('game-joined', {
      gameId: game.id,
      gameCode: game.code,
      players: Array.from(game.players.values()),
    });
    
    // Notify other players
    io.to(game.id).emit('player-joined', {
      players: Array.from(game.players.values()),
    });
    
    console.log(`Player ${data.name} joined game ${game.code}`);
  });

  // Start game
  socket.on('start-game', () => {
    const gameId = playerToGame.get(socket.id);
    if (!gameId) return;
    
    const game = games.get(gameId);
    if (!game || game.hostId !== socket.id) return;
    
    if (game.players.size < 3) {
      socket.emit('error', 'Need at least 3 players to start');
      return;
    }
    
    game.status = 'playing';
    const prompt = getPromptForRound(game.currentRound);
    game.currentPromptId = prompt.id;
    
    io.to(gameId).emit('game-started', {
      prompt,
      round: game.currentRound,
      totalRounds: game.totalRounds,
    });
    
    // Start timer for submission phase
    setTimeout(() => {
      if (game.status === 'playing') {
        startVotingPhase(gameId);
      }
    }, 60000); // 60 seconds for submissions
  });

  // Submit response
  socket.on('submit-response', async (data: { promptResponse: string }) => {
    const gameId = playerToGame.get(socket.id);
    if (!gameId) return;
    
    const game = games.get(gameId);
    const player = game?.players.get(socket.id);
    
    if (!game || !player || game.status !== 'playing') return;
    
    // Generate AI image
    try {
      const response = await fetch('http://localhost:3000/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: data.promptResponse,
          selfieUrl: player.selfieUrl,
        }),
      });
      
      const result = await response.json();
      
      const submission: Submission = {
        playerId: player.id,
        playerName: player.name,
        promptResponse: data.promptResponse,
        imageUrl: result.imageUrl || 'https://via.placeholder.com/400',
        votes: 0,
      };
      
      game.submissions.set(player.id, submission);
      
      socket.emit('submission-received', { success: true });
      
      // Check if all players have submitted
      if (game.submissions.size === game.players.size) {
        startVotingPhase(gameId);
      }
    } catch (error) {
      console.error('Error processing submission:', error);
      socket.emit('error', 'Failed to generate image');
    }
  });

  // Submit vote
  socket.on('submit-vote', (data: { votedForId: string }) => {
    const gameId = playerToGame.get(socket.id);
    if (!gameId) return;
    
    const game = games.get(gameId);
    if (!game || game.status !== 'voting') return;
    
    const submission = game.submissions.get(data.votedForId);
    if (submission) {
      submission.votes += 1;
    }
    
    socket.emit('vote-received', { success: true });
  });

  // Disconnect
  socket.on('disconnect', () => {
    const gameId = playerToGame.get(socket.id);
    if (gameId) {
      const game = games.get(gameId);
      if (game) {
        game.players.delete(socket.id);
        playerToGame.delete(socket.id);
        
        if (game.players.size === 0) {
          games.delete(gameId);
        } else {
          io.to(gameId).emit('player-left', {
            players: Array.from(game.players.values()),
          });
          
          // If host left, assign new host
          if (game.hostId === socket.id && game.players.size > 0) {
            const newHost = game.players.values().next().value;
            if (newHost) {
              newHost.isHost = true;
              game.hostId = newHost.id;
              
              io.to(gameId).emit('host-changed', { newHostId: newHost.id });
            }
          }
        }
      }
    }
    
    console.log('Client disconnected:', socket.id);
  });
});

// Helper function to start voting phase
function startVotingPhase(gameId: string) {
  const game = games.get(gameId);
  if (!game) return;
  
  game.status = 'voting';
  const submissions = Array.from(game.submissions.values());
  const votingPairs = createVotingPairs(submissions);
  game.votingPairs = votingPairs;
  
  io.to(gameId).emit('voting-started', {
    votingPairs,
    currentPrompt: PROMPTS.find(p => p.id === game.currentPromptId),
  });
  
  // Auto-advance to results after voting time
  setTimeout(() => {
    showRoundResults(gameId);
  }, votingPairs.length * 15000); // 15 seconds per voting pair
}

// Helper function to show round results
function showRoundResults(gameId: string) {
  const game = games.get(gameId);
  if (!game) return;
  
  game.status = 'roundResults';
  
  // Calculate scores
  const submissions = Array.from(game.submissions.values());
  submissions.forEach(sub => {
    const player = game.players.get(sub.playerId);
    if (player) {
      player.score += sub.votes;
      game.roundScores.set(sub.playerId, sub.votes);
    }
  });
  
  io.to(gameId).emit('round-results', {
    submissions: submissions.sort((a, b) => b.votes - a.votes),
    scores: Array.from(game.players.values()).map(p => ({
      playerId: p.id,
      name: p.name,
      score: p.score,
    })),
    currentRound: game.currentRound,
    totalRounds: game.totalRounds,
  });
}

// Start server
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
