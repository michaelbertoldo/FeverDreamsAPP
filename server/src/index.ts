// server/src/index.ts - DISCONNECT FIX
// This version will show exactly where the disconnect is happening

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const Replicate = require('replicate');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.use(cors({ origin: true }));
app.use(express.json({ limit: '10mb' }));

// 🔍 CRITICAL: Initialize Replicate with detailed logging
let replicate = null;
let initError = null;

console.log('🔍 Server Initialization Debug:');
console.log('   TOKEN EXISTS:', !!process.env.REPLICATE_API_TOKEN);
console.log('   TOKEN VALID FORMAT:', process.env.REPLICATE_API_TOKEN?.startsWith('r8_'));

try {
  if (!process.env.REPLICATE_API_TOKEN) {
    initError = 'No REPLICATE_API_TOKEN in environment';
    console.error('❌', initError);
  } else {
    replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });
    console.log('✅ Replicate client created');
  }
  } catch (error) {
    initError = `Replicate initialization failed: ${error.message}`;
    console.error('❌', initError);
  }

// Game state management
const games = new Map();
const playerToGame = new Map();

// Helper functions
function generateGameCode() {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += letters[Math.floor(Math.random() * letters.length)];
  }
  return code;
}

function getPromptForRound(round) {
  const PROMPTS = [
    { id: 'p1', text: 'The worst superhero power would be turning into {blank}', category: 'silly', round: 1 },
    { id: 'p2', text: 'A terrible name for a restaurant would be {blank}', category: 'silly', round: 1 },
    { id: 'p3', text: 'The most useless smartphone app would be {blank}', category: 'silly', round: 1 },
    { id: 'p4', text: 'The worst thing to say on a first date is {blank}', category: 'silly', round: 1 },
    { id: 'p5', text: 'A horrible theme for a birthday party would be {blank}', category: 'silly', round: 1 },
    { id: 'p6', text: 'If cats ruled the world, the first law would be {blank}', category: 'creative', round: 2 },
    { id: 'p7', text: 'The secret ingredient in grandma\'s cookies is actually {blank}', category: 'creative', round: 2 },
    { id: 'p8', text: 'Aliens refuse to visit Earth because of {blank}', category: 'creative', round: 2 },
    { id: 'p9', text: 'The real reason dinosaurs went extinct was {blank}', category: 'creative', round: 2 },
    { id: 'p10', text: 'In the future, people will pay millions for {blank}', category: 'creative', round: 2 },
    { id: 'p11', text: 'The Pope\'s secret hobby is {blank}', category: 'absurd', round: 3 },
    { id: 'p12', text: 'The WiFi password in hell is {blank}', category: 'absurd', round: 3 },
    { id: 'p13', text: 'God\'s biggest regret when creating humans was {blank}', category: 'absurd', round: 3 },
    { id: 'p14', text: 'The title of Shakespeare\'s lost play was {blank}', category: 'absurd', round: 3 },
    { id: 'p15', text: 'The last thing you want to hear your surgeon say is {blank}', category: 'absurd', round: 3 },
  ];
  const roundPrompts = PROMPTS.filter(p => p.round === round);
  return roundPrompts[Math.floor(Math.random() * roundPrompts.length)];
}

function createVotingPairs(submissions) {
  const pairs = [];
  const submissionsArray = Array.from(submissions.values());
  
  for (let i = 0; i < submissionsArray.length - 1; i += 2) {
    pairs.push([submissionsArray[i], submissionsArray[i + 1]]);
  }
  
  // Handle odd number of submissions
  if (submissionsArray.length % 2 === 1) {
    pairs.push([submissionsArray[submissionsArray.length - 1]]);
  }
  
  return pairs;
}

// 🧪 CRITICAL TEST: Direct API call to verify token works
app.post('/test-direct-api', async (req, res) => {
  console.log('🧪 Testing direct API call to Replicate...');
  
  try {
    if (!process.env.REPLICATE_API_TOKEN) {
      return res.status(500).json({
        success: false,
        error: 'No API token configured'
      });
    }

    // Test direct fetch to Replicate API (bypassing our Replicate client)
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: "30c1d0b916a6f8efce669b602f8f70c18193b2a3ef2deb35e2a13e17e6ab37e",
        input: {
          prompt: "test superhero",
          num_inference_steps: 4,
          guidance_scale: 0,
          width: 512,
          height: 512,
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Direct API call failed:', response.status, errorText);
      return res.status(500).json({
        success: false,
        error: `Direct API failed: ${response.status}`,
        details: errorText
      });
    }

    const data = await response.json();
    console.log('✅ Direct API call successful:', data.id);
    
    res.json({
      success: true,
      message: 'Direct API call works',
      predictionId: data.id,
      status: data.status
    });

  } catch (error) {
    console.error('❌ Direct API test error:', error);
    res.status(500).json({
      success: false,
      error: 'Direct API test failed',
      details: error.message
    });
  }
});

// 🎨 FIXED IMAGE GENERATION - Finding the disconnect
app.post('/generate-image', async (req, res) => {
  console.log('🎨 ===========================================');
  console.log('🎨 IMAGE GENERATION REQUEST START');
  console.log('🎨 ===========================================');
  
  try {
    const { prompt, selfieUrl, gameId, userId } = req.body;
    
    console.log('📥 Request data:', {
      prompt: prompt?.substring(0, 50) + '...',
      hasSelfie: !!selfieUrl,
      userId: userId || 'anonymous'
    });

    // Validate inputs
    if (!prompt) {
      console.error('❌ Missing prompt');
      return res.status(400).json({ 
        success: false,
        error: 'Missing prompt parameter' 
      });
    }

    // Check server setup
    if (initError) {
      console.error('❌ Server init error:', initError);
      return res.status(500).json({ 
        success: false,
        error: 'Server configuration error',
        details: initError
      });
    }

    if (!replicate) {
      console.error('❌ Replicate client not available');
      return res.status(500).json({ 
        success: false,
        error: 'Replicate client not initialized' 
      });
    }

    console.log('🚀 Starting REAL AI generation...');
    console.log('   Model: black-forest-labs/flux-schnell');
    console.log('   Prompt:', prompt);
    console.log('   Face blending:', !!selfieUrl);

    // 🔥 THE CRITICAL PART - Actual AI generation
    try {
      const input = {
        prompt: `${prompt}, cartoon style, funny, exaggerated expression, vibrant colors, meme-style`,
        num_inference_steps: 4,
        guidance_scale: 0,
        width: 768,
        height: 768,
        seed: Math.floor(Math.random() * 1000000),
      };

      if (selfieUrl) {
        input.image = selfieUrl;
        console.log('   ✅ Added selfie for face blending');
      }

      console.log('🏃‍♂️ Calling replicate.run() with input:', Object.keys(input));
      console.log('   This is where the REAL generation should happen...');
      
      const startTime = Date.now();
      
      // 🚨 THIS IS THE CRITICAL LINE - Where real AI generation happens
      const output = await replicate.run("black-forest-labs/flux-schnell", { input });
      
      const duration = Date.now() - startTime;
      console.log(`⚡ replicate.run() completed in ${duration}ms`);
      console.log('   Output type:', typeof output);
      console.log('   Output is array:', Array.isArray(output));
      console.log('   Output length:', Array.isArray(output) ? output.length : 'n/a');
      
      if (Array.isArray(output)) {
        console.log('   Output[0] type:', typeof output[0]);
        console.log('   Output[0] preview:', output[0]?.substring(0, 50) + '...');
      } else {
        console.log('   Output preview:', output?.substring(0, 50) + '...');
      }

      const imageUrl = Array.isArray(output) ? output[0] : output;

      // 🔍 CRITICAL VALIDATION
      if (!imageUrl) {
        console.error('❌ No image URL returned from replicate.run()');
        console.error('   Full output:', output);
        throw new Error('No image URL returned from FLUX Schnell');
      }

      if (typeof imageUrl !== 'string') {
        console.error('❌ Image URL is not a string:', typeof imageUrl);
        console.error('   Value:', imageUrl);
        throw new Error(`Invalid image URL type: ${typeof imageUrl}`);
      }

      if (!imageUrl.startsWith('http')) {
        console.error('❌ Image URL does not start with http:', imageUrl);
        throw new Error(`Invalid image URL format: ${imageUrl}`);
      }

      // 🎉 SUCCESS - Real AI image generated
      console.log('🎉 ===========================================');
      console.log('🎉 REAL AI IMAGE GENERATED SUCCESSFULLY!');
      console.log('🎉 ===========================================');
      console.log('   Duration:', duration + 'ms');
      console.log('   Image URL:', imageUrl);
      console.log('   URL domain:', new URL(imageUrl).hostname);
      
      return res.json({
        success: true,
        imageUrl,
        prompt,
        metadata: {
          model: "flux-schnell",
          generationTime: `${duration}ms`,
          realAI: true, // Flag to confirm this is real AI
          urlDomain: new URL(imageUrl).hostname
        }
      });

    } catch (aiError) {
      console.error('❌ ===========================================');
      console.error('❌ AI GENERATION FAILED');
      console.error('❌ ===========================================');
      console.error('   Error type:', aiError.constructor.name);
      console.error('   Error message:', aiError.message);
      console.error('   Full error:', aiError);
      
      // Check if it's a network/API issue
      if (aiError.message.includes('fetch')) {
        console.error('   >> This looks like a network/API issue');
      } else if (aiError.message.includes('401')) {
        console.error('   >> This looks like an authentication issue');
      } else if (aiError.message.includes('429')) {
        console.error('   >> This looks like a rate limiting issue');
      }
      
      return res.status(500).json({ 
        success: false,
        error: 'AI generation failed',
        details: aiError.message,
        errorType: aiError.constructor.name
      });
    }

  } catch (error) {
    console.error('❌ ===========================================');
    console.error('❌ CRITICAL SERVER ERROR');
    console.error('❌ ===========================================');
    console.error('   Error:', error);
    
    res.status(500).json({ 
      success: false,
      error: 'Critical server error',
      details: error.message 
    });
  }
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

// Game state management (already declared above)

// Helper functions already defined above

// API Routes - Using enhanced generate-image endpoint below

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

// Enhanced test endpoint
app.get('/test', (req, res) => {
  const hasApiToken = !!process.env.REPLICATE_API_TOKEN;
  
  res.json({ 
    message: '🎉 FeverDreams AI Party Game API Working!',
    timestamp: new Date().toISOString(),
    apiTokenConfigured: hasApiToken,
    endpoints: [
      'GET /test - Test endpoint',
      'POST /api/generate-image - Generate AI images with face blending'
    ]
  });
});

// Health endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// 🎨 IMPROVED AI Image Generation
app.post('/api/generate-image', async (req, res) => {
  try {
    const { prompt, selfieUrl, gameId, userId, promptId, width = 768, height = 768, strength = 0.8 } = req.body;
    
    // Validate required parameters
    if (!prompt) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing prompt parameter' 
      });
    }

    if (!process.env.REPLICATE_API_TOKEN) {
      return res.status(500).json({ 
        success: false,
        error: 'Replicate API token not configured' 
      });
    }

    console.log(`🎨 Starting AI generation:`);
    console.log(`   Prompt: "${prompt}"`);
    console.log(`   User: ${userId}`);
    console.log(`   Has Selfie: ${!!selfieUrl}`);

    try {
      // 🎮 PRIMARY: FLUX Schnell - Optimized for SPEED and FUN (Party Game Perfect!)
      console.log('🏃‍♂️ Using FLUX Schnell for fastest generation...');
      
      const input = {
        prompt: `${prompt}, cartoon style, funny, exaggerated expression, vibrant colors, meme-style, comedic, high quality`,
        num_inference_steps: 4, // Schnell optimized for 4 steps
        guidance_scale: 0, // Schnell works best with guidance_scale 0
        width: parseInt(width),
        height: parseInt(height),
        seed: Math.floor(Math.random() * 1000000),
        go_fast: true // Replicate optimization
      };

      // Add face blending if selfie provided
      if (selfieUrl) {
        input.image = selfieUrl;
        console.log('🖼️ Adding face blending with selfie');
      }

      console.log('🎯 FLUX Schnell input:', input);
      
      // Use FLUX Schnell model (fastest and cheapest!)
      const output = await replicate.run("black-forest-labs/flux-schnell", { input });
      const imageUrl = Array.isArray(output) ? output[0] : output;

      if (!imageUrl) {
        throw new Error('No image URL returned from FLUX Schnell');
      }

      console.log('⚡ FLUX Schnell image generated in ~3-5 seconds!');
      return res.json({
        success: true,
        imageUrl,
        prompt,
        model: "flux-schnell",
        speed: "ultra-fast",
        cost: "$0.003",
        quality: "perfect-for-party-games",
        estimatedTime: "3-5 seconds"
      });

    } catch (primaryError) {
      console.error('❌ FLUX Schnell failed:', primaryError);
      
      try {
        // 🔄 FALLBACK: FLUX Dev (higher quality, slightly slower)
        console.log('🔄 Fallback to FLUX Dev...');
        
        const fallbackInput = {
          prompt: `${prompt}, cartoon style, funny, colorful, high quality, comedic, exaggerated facial expression`,
          num_inference_steps: 28,
          guidance_scale: 3.5,
          width: parseInt(width),
          height: parseInt(height),
          seed: Math.floor(Math.random() * 1000000)
        };

        if (selfieUrl) {
          fallbackInput.image = selfieUrl;
        }

        const fallbackOutput = await replicate.run("black-forest-labs/flux-dev", { 
          input: fallbackInput 
        });
        
        const fallbackImageUrl = Array.isArray(fallbackOutput) ? fallbackOutput[0] : fallbackOutput;
        
        console.log('✅ FLUX Dev fallback successful!');
        return res.json({
          success: true,
          imageUrl: fallbackImageUrl,
          prompt,
          model: "flux-dev-fallback",
          speed: "medium",
          cost: "$0.030",
          fallback: true
        });

      } catch (fallbackError) {
        console.error('❌ All generation methods failed:', fallbackError);
        
        return res.status(500).json({ 
          success: false,
          error: 'All image generation methods failed',
          details: {
            primary: primaryError.message,
            fallback: fallbackError.message
          }
        });
      }
    }

  } catch (error) {
    console.error('❌ Critical error in generate-image:', error);
    res.status(500).json({ 
      success: false,
      error: 'Critical server error',
      details: error.message 
    });
  }
});

// 🧪 Quick test endpoint for FLUX Schnell
app.post('/test-schnell', async (req, res) => {
  try {
    console.log('🧪 Testing FLUX Schnell...');
    
    const output = await replicate.run("black-forest-labs/flux-schnell", { 
      input: {
        prompt: "superhero cat flying through rainbow sky, cartoon style, funny, vibrant colors",
        num_inference_steps: 4,
        guidance_scale: 0,
        width: 768,
        height: 768,
        go_fast: true
      }
    });
    
    const imageUrl = Array.isArray(output) ? output[0] : output;
    
    console.log('⚡ FLUX Schnell test successful!');
    res.json({
      success: true,
      message: 'FLUX Schnell test successful - perfect for party games!',
      imageUrl,
      model: 'flux-schnell',
      speed: '3-5 seconds',
      cost: '$0.003'
    });

  } catch (error) {
    console.error('❌ FLUX Schnell test failed:', error);
    res.status(500).json({
      success: false,
      error: 'FLUX Schnell test failed',
      details: error.message
    });
  }
});

// 🚀 Start server
// Simple test endpoint
app.get('/test', (req, res) => {
  res.json({ 
    message: '🎉 Server Running',
    replicate: {
      initialized: !!replicate,
      tokenExists: !!process.env.REPLICATE_API_TOKEN,
      error: initError
    }
  });
});

// Start server
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`   Ready for AI generation: ${replicate ? '✅ YES' : '❌ NO'}`);
  console.log(`   Socket.IO enabled for multiplayer`);
  if (initError) {
    console.error(`   Init Error: ${initError}`);
  }
});
