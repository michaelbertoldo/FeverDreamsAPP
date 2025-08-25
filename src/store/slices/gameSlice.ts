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
};

// Quiplash-style prompts organized by category
export const PROMPTS: Prompt[] = [
  // Round 1 - Easy/Silly
  { id: '1', text: 'The worst superhero power would be turning into a {blank}', category: 'silly' },
  { id: '2', text: 'A terrible name for a restaurant would be {blank}', category: 'silly' },
  { id: '3', text: 'The most useless smartphone app would be {blank}', category: 'silly' },
  { id: '4', text: 'The worst thing to say on a first date is {blank}', category: 'silly' },
  { id: '5', text: 'A horrible theme for a birthday party would be {blank}', category: 'silly' },
  
  // Round 2 - Medium/Creative
  { id: '6', text: 'If cats ruled the world, the first law would be {blank}', category: 'creative' },
  { id: '7', text: 'The secret ingredient in grandma\'s cookies is actually {blank}', category: 'creative' },
  { id: '8', text: 'Aliens refuse to visit Earth because of {blank}', category: 'creative' },
  { id: '9', text: 'The real reason dinosaurs went extinct was {blank}', category: 'creative' },
  { id: '10', text: 'In the future, people will pay millions for {blank}', category: 'creative' },
  
  // Round 3 - Hard/Absurd
  { id: '11', text: 'The Pope\'s secret hobby is {blank}', category: 'absurd' },
  { id: '12', text: 'The WiFi password in hell is {blank}', category: 'absurd' },
  { id: '13', text: 'God\'s biggest regret when creating humans was {blank}', category: 'absurd' },
  { id: '14', text: 'The title of Shakespeare\'s lost play was {blank}', category: 'absurd' },
  { id: '15', text: 'The last thing you want to hear your surgeon say is {blank}', category: 'absurd' },
];

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    createGame: (state, action: PayloadAction<{ gameId: string; gameCode: string }>) => {
      state.currentGameId = action.payload.gameId;
      state.gameCode = action.payload.gameCode;
      state.status = 'lobby';
      state.isHost = true;
      state.currentRound = 1;
      state.players = [];
      state.submissions = [];
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
    },
    
    nextVotingPair: (state) => {
      if (state.currentVotingIndex < state.votingPairs.length - 1) {
        state.currentVotingIndex += 1;
      } else {
        state.status = 'roundResults';
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
  nextVotingPair,
  updateScores,
  nextRound,
  endGame,
  setTimeRemaining,
} = gameSlice.actions;

export default gameSlice.reducer;