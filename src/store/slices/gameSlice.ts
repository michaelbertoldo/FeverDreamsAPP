import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Player {
  id: string;
  name: string;
  score: number;
  isHost: boolean;
  selfieUrl?: string;
}

export interface Prompt {
  id: string;
  text: string;
  category: string;
}

export interface Submission {
  playerId: string;
  playerName: string;
  imageUrl: string;
  promptResponse: string;
  votes: number;
}

export interface GameState {
  currentGameId: string | null;
  gameCode: string | null;
  status: 'idle' | 'lobby' | 'playing' | 'voting' | 'roundResults' | 'finalResults';
  currentRound: number;
  totalRounds: number;
  players: Player[];
  currentPrompt: Prompt | null;
  submissions: Submission[];
  votingPairs: Array<{ pair: Submission[], promptId: string }>;
  currentVotingIndex: number;
  roundScores: Record<string, number>;
  timeRemaining: number;
  isHost: boolean;
  testMode: 'disabled' | 'solo' | 'multiplayer';
}

const initialState: GameState = {
  currentGameId: null,
  gameCode: null,
  status: 'idle',
  currentRound: 1,
  totalRounds: 3,
  players: [],
  currentPrompt: null,
  submissions: [],
  votingPairs: [],
  currentVotingIndex: 0,
  roundScores: {},
  timeRemaining: 0,
  isHost: false,
  testMode: 'disabled',
};

// AI Image Generation prompts organized by category
export const PROMPTS: Prompt[] = [
  // Round 1 - Easy/Silly
  { id: '1', text: 'You as a superhero with the worst superpower: {blank}', category: 'silly' },
  { id: '2', text: 'You as a terrible restaurant owner named {blank}', category: 'silly' },
  { id: '3', text: 'You as the developer of the most useless app: {blank}', category: 'silly' },
  { id: '4', text: 'You on the worst first date saying {blank}', category: 'silly' },
  { id: '5', text: 'You at the most horrible birthday party theme: {blank}', category: 'silly' },
  
  // Round 2 - Medium/Creative
  { id: '6', text: 'You as a cat ruler making the first law: {blank}', category: 'creative' },
  { id: '7', text: 'You as grandma with the secret cookie ingredient: {blank}', category: 'creative' },
  { id: '8', text: 'You as an alien refusing to visit Earth because of {blank}', category: 'creative' },
  { id: '9', text: 'You as the real reason dinosaurs went extinct: {blank}', category: 'creative' },
  { id: '10', text: 'You in the future selling {blank} for millions', category: 'creative' },
  
  // Round 3 - Hard/Absurd
  { id: '11', text: 'You as the Pope doing your secret hobby: {blank}', category: 'absurd' },
  { id: '12', text: 'You in hell setting the WiFi password: {blank}', category: 'absurd' },
  { id: '13', text: 'You as God regretting when you created humans: {blank}', category: 'absurd' },
  { id: '14', text: 'You as Shakespeare writing the lost play: {blank}', category: 'absurd' },
  { id: '15', text: 'You as a surgeon saying the last thing you want to hear: {blank}', category: 'absurd' },
];

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    createGame: (state, action: PayloadAction<{ gameId?: string; gameCode: string; testMode?: 'disabled' | 'solo' | 'multiplayer' }>) => {
      state.currentGameId = action.payload.gameId || `game_${Date.now()}`;
      state.gameCode = action.payload.gameCode;
      state.status = 'lobby';
      state.isHost = true;
      state.currentRound = 1;
      state.players = [];
      state.submissions = [];
      state.testMode = action.payload.testMode || 'disabled';
      console.log('🎮 Game created with test mode:', state.testMode);
    },
    
    joinGame: (state, action: PayloadAction<{ gameId: string; gameCode: string }>) => {
      state.currentGameId = action.payload.gameId;
      state.gameCode = action.payload.gameCode;
      state.status = 'lobby';
      state.isHost = false;
    },
    
    updatePlayers: (state, action: PayloadAction<Player[]>) => {
      state.players = action.payload;
    },
    
    startGame: (state) => {
      state.status = 'playing';
      state.currentRound = 1;
      // Select prompt based on round
      const roundPrompts = PROMPTS.filter(p => {
        if (state.currentRound === 1) return p.category === 'silly';
        if (state.currentRound === 2) return p.category === 'creative';
        return p.category === 'absurd';
      });
      state.currentPrompt = roundPrompts[Math.floor(Math.random() * roundPrompts.length)];
    },
    
    setCurrentPrompt: (state, action: PayloadAction<Prompt>) => {
      state.currentPrompt = action.payload;
    },
    
    submitResponse: (state, action: PayloadAction<Submission>) => {
      state.submissions.push(action.payload);
    },
    
    startVoting: (state, action: PayloadAction<Array<{ pair: Submission[], promptId: string }>>) => {
      state.status = 'voting';
      state.votingPairs = action.payload;
      state.currentVotingIndex = 0;
      // Reset votes for new voting round
      state.submissions = state.submissions.map(sub => ({ ...sub, votes: 0 }));
    },
    
    submitVote: (state, action: PayloadAction<{ submissionId: string; voterId: string }>) => {
      const submission = state.submissions.find(sub => sub.playerId === action.payload.submissionId);
      if (submission) {
        submission.votes = (submission.votes || 0) + 1;
        console.log(`🗳️ Vote added for ${submission.playerName}, total votes: ${submission.votes}`);
      }
    },
    
    nextVotingPair: (state) => {
      if (state.currentVotingIndex < state.votingPairs.length - 1) {
        state.currentVotingIndex += 1;
      } else {
        // Voting complete - calculate scores and move to round results
        console.log('🎯 Voting complete, calculating scores...');
        
        // Calculate round scores based on votes
        const scores: Record<string, number> = {};
        state.submissions.forEach(submission => {
          scores[submission.playerId] = (scores[submission.playerId] || 0) + (submission.votes || 0);
        });
        
        // Update player scores
        state.players = state.players.map(player => ({
          ...player,
          score: (player.score || 0) + (scores[player.id] || 0),
        }));
        
        state.roundScores = scores;
        state.status = 'roundResults';
        console.log('🏆 Round results ready, scores:', scores);
      }
    },
    
    updateScores: (state, action: PayloadAction<Record<string, number>>) => {
      state.roundScores = action.payload;
      // Update player scores
      state.players = state.players.map(player => ({
        ...player,
        score: action.payload[player.id] || player.score,
      }));
    },
    
    nextRound: (state) => {
      if (state.currentRound < state.totalRounds) {
        state.currentRound += 1;
        state.status = 'playing';
        state.submissions = [];
        state.votingPairs = [];
        state.currentVotingIndex = 0;
        
        // Select new prompt for the round
        const roundPrompts = PROMPTS.filter(p => {
          if (state.currentRound === 1) return p.category === 'silly';
          if (state.currentRound === 2) return p.category === 'creative';
          return p.category === 'absurd';
        });
        state.currentPrompt = roundPrompts[Math.floor(Math.random() * roundPrompts.length)];
      } else {
        state.status = 'finalResults';
      }
    },
    
    endGame: (state) => {
      state.currentGameId = null;
      state.gameCode = null;
      state.status = 'idle';
      state.currentRound = 1;
      state.players = [];
      state.submissions = [];
      state.votingPairs = [];
      state.currentPrompt = null;
      state.isHost = false;
    },
    
    setTimeRemaining: (state, action: PayloadAction<number>) => {
      state.timeRemaining = action.payload;
    },
    
    setTestMode: (state, action: PayloadAction<'disabled' | 'solo' | 'multiplayer'>) => {
      state.testMode = action.payload;
      console.log('🧪 Test mode set to:', action.payload);
    },
  },
});

export const {
  createGame,
  joinGame,
  updatePlayers,
  startGame,
  setCurrentPrompt,
  submitResponse,
  startVoting,
  submitVote,
  nextVotingPair,
  updateScores,
  nextRound,
  endGame,
  setTimeRemaining,
  setTestMode,
} = gameSlice.actions;

export default gameSlice.reducer;