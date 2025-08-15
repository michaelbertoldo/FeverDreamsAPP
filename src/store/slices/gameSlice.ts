// src/store/slices/gameSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Player {
  id: string;
  displayName: string;
  isHost: boolean;
  isReady: boolean;
  score: number;
  connected?: boolean;
}

interface Submission {
  id: string;
  imageUrl: string;
  votes: string[];
  points?: number;
}

interface Prompt {
  id: string;
  text: string;
  round: number;
  assignedPlayers: string[];
  submissions: {
    [playerId: string]: Submission;
  };
}

interface GameState {
  gameId: string | null;
  joinCode: string | null;
  status: 'waiting' | 'playing' | 'voting' | 'results' | 'completed';
  players: {
    [playerId: string]: Player;
  };
  currentRound: number;
  currentPrompt: number;
  prompts: Prompt[];
  isHost: boolean;
  currentPromptData: {
    promptId: string | null;
    promptText: string | null;
    isAssigned: boolean;
    isVoting: boolean;
    assignedPlayers: string[];
    submissions: {
      [playerId: string]: Submission;
    };
  };
  roundResults: {
    round: number;
    scores: {
      [playerId: string]: {
        roundScore: number;
        totalScore: number;
      };
    };
  } | null;
  gameResults: {
    scores: {
      [playerId: string]: {
        score: number;
      };
    };
    winner: {
      playerId: string;
      displayName: string;
      score: number;
    } | null;
  } | null;
  error: string | null;
}

const initialState: GameState = {
  gameId: null,
  joinCode: null,
  status: 'waiting',
  players: {},
  currentRound: 0,
  currentPrompt: 0,
  prompts: [],
  isHost: false,
  currentPromptData: {
    promptId: null,
    promptText: null,
    isAssigned: false,
    isVoting: false,
    assignedPlayers: [],
    submissions: {}
  },
  roundResults: null,
  gameResults: null,
  error: null
};

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    setGameId: (state, action: PayloadAction<{ gameId: string; joinCode: string }>) => {
      state.gameId = action.payload.gameId;
      state.joinCode = action.payload.joinCode;
    },
    setGameState: (state, action: PayloadAction<any>) => {
      const gameState = action.payload;
      
      if (gameState.players) state.players = gameState.players;
      if (gameState.status) state.status = gameState.status;
      if (gameState.currentRound) state.currentRound = gameState.currentRound;
      if (gameState.currentPrompt) state.currentPrompt = gameState.currentPrompt;
      if (gameState.prompts) state.prompts = gameState.prompts;
      
      // Check if current user is host - we'll handle this in the component
      if (gameState.hostId) {
        state.isHost = true; // Simplified for now
      }
    },
    addPlayer: (state, action: PayloadAction<{ playerId: string; displayName: string; isHost: boolean }>) => {
      const { playerId, displayName, isHost } = action.payload;
      
      state.players[playerId] = {
        id: playerId,
        displayName,
        isHost,
        isReady: false,
        score: 0,
        connected: true
      };
    },
    updatePlayerReady: (state, action: PayloadAction<{ playerId: string; isReady: boolean }>) => {
      const { playerId, isReady } = action.payload;
      
      if (state.players[playerId]) {
        state.players[playerId].isReady = isReady;
      }
    },
    setGameStatus: (state, action: PayloadAction<{ status: string; currentRound?: number; prompts?: Prompt[] }>) => {
      const { status, currentRound, prompts } = action.payload;
      
      state.status = status as any;
      if (currentRound) state.currentRound = currentRound;
      if (prompts) state.prompts = prompts;
    },
    setCurrentPrompt: (state, action: PayloadAction<any>) => {
      const { 
        promptId, 
        promptText, 
        isAssigned, 
        isVoting, 
        assignedPlayers, 
        submissions 
      } = action.payload;
      
      state.currentPromptData = {
        promptId: promptId || state.currentPromptData.promptId,
        promptText: promptText || state.currentPromptData.promptText,
        isAssigned: isAssigned !== undefined ? isAssigned : state.currentPromptData.isAssigned,
        isVoting: isVoting !== undefined ? isVoting : state.currentPromptData.isVoting,
        assignedPlayers: assignedPlayers || state.currentPromptData.assignedPlayers,
        submissions: submissions || state.currentPromptData.submissions
      };
    },
    setSubmission: (state, action: PayloadAction<{ promptId: string; playerId: string; submissionId: string }>) => {
      const { promptId, playerId, submissionId } = action.payload;
      
      // Find the prompt
      const promptIndex = state.prompts.findIndex(p => p.id === promptId);
      if (promptIndex >= 0) {
        if (!state.prompts[promptIndex].submissions) {
          state.prompts[promptIndex].submissions = {};
        }
        
        state.prompts[promptIndex].submissions[playerId] = {
          id: submissionId,
          imageUrl: '', // Will be updated when voting starts
          votes: []
        };
      }
    },
    setVote: (state, action: PayloadAction<{ promptId: string; voterId: string; votedFor: string }>) => {
      const { promptId, voterId, votedFor } = action.payload;
      
      // Find the prompt
      const promptIndex = state.prompts.findIndex(p => p.id === promptId);
      if (promptIndex >= 0 && state.prompts[promptIndex].submissions[votedFor]) {
        state.prompts[promptIndex].submissions[votedFor].votes.push(voterId);
      }
      
      // Also update current prompt data if it's the active voting prompt
      if (state.currentPromptData.promptId === promptId && 
          state.currentPromptData.submissions[votedFor]) {
        state.currentPromptData.submissions[votedFor].votes.push(voterId);
      }
    },
    setRoundResults: (state, action: PayloadAction<{ round: number; prompts: Prompt[]; scores: any }>) => {
      const { round, prompts, scores } = action.payload;
      
      state.roundResults = {
        round,
        scores
      };
      
      // Update prompts with results
      prompts.forEach(prompt => {
        const promptIndex = state.prompts.findIndex(p => p.id === prompt.id);
        if (promptIndex >= 0) {
          state.prompts[promptIndex] = prompt;
        }
      });
      
      // Update player scores
      Object.entries(scores).forEach(([playerId, scoreData]: [string, any]) => {
        if (state.players[playerId]) {
          state.players[playerId].score = scoreData.totalScore;
        }
      });
      
      state.status = 'results';
    },
    setGameResults: (state, action: PayloadAction<{ scores: any; winner: any }>) => {
      const { scores, winner } = action.payload;
      
      state.gameResults = {
        scores,
        winner
      };
      
      // Update final player scores
      Object.entries(scores).forEach(([playerId, scoreData]: [string, any]) => {
        if (state.players[playerId]) {
          state.players[playerId].score = scoreData.score;
        }
      });
    },
    resetGame: (state) => {
      return initialState;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    }
  }
});

export const {
  setGameId,
  setGameState,
  addPlayer,
  updatePlayerReady,
  setGameStatus,
  setCurrentPrompt,
  setSubmission,
  setVote,
  setRoundResults,
  setGameResults,
  resetGame,
  setError
} = gameSlice.actions;

export default gameSlice.reducer;