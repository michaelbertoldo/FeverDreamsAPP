// src/store/slices/gameSlice.ts - Enhanced version
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Player {
  id: string;
  displayName: string;
  isHost: boolean;
  isReady: boolean;
  score: number;
}

interface Prompt {
  promptId: string;
  text: string;
  round: number;
  assignedPlayers: string[];
}

interface Submission {
  submissionId: string;
  promptId: string;
  playerId: string;
  imageUrl: string;
  votes: string[];
}

interface GameState {
  gameId: string | null;
  joinCode: string | null;
  status: 'waiting' | 'playing' | 'voting' | 'results' | 'completed';
  currentRound: number;
  currentPrompt: number;
  players: { [userId: string]: Player };
  prompts: Prompt[];
  submissions: Submission[];
  isHost: boolean;
  currentPromptData: {
    promptId: string | null;
    promptText: string | null;
    isAssigned: boolean;
    isVoting: boolean;
    assignedPlayers: string[];
  } | null;
}

const initialState: GameState = {
  gameId: null,
  joinCode: null,
  status: 'waiting',
  currentRound: 0,
  currentPrompt: 0,
  players: {},
  prompts: [],
  submissions: [],
  isHost: false,
  currentPromptData: null,
};

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    setGameId: (state, action: PayloadAction<string>) => {
      state.gameId = action.payload;
      state.status = 'waiting'; // Set initial status when game is created
      console.log('📝 Game ID set:', action.payload);
    },
    
    setJoinCode: (state, action: PayloadAction<string>) => {
      state.joinCode = action.payload;
      console.log('📝 Join code set:', action.payload);
    },
    
    setGameStatus: (state, action: PayloadAction<{ 
      status: GameState['status']; 
      currentRound?: number; 
      prompts?: Prompt[] 
    }>) => {
      state.status = action.payload.status;
      if (action.payload.currentRound !== undefined) {
        state.currentRound = action.payload.currentRound;
      }
      if (action.payload.prompts) {
        state.prompts = action.payload.prompts;
      }
      console.log('🎮 Game status updated:', action.payload);
    },
    
    addPlayer: (state, action: PayloadAction<{ 
      playerId: string; 
      displayName: string; 
      isHost: boolean 
    }>) => {
      const { playerId, displayName, isHost } = action.payload;
      state.players[playerId] = {
        id: playerId,
        displayName,
        isHost,
        isReady: false,
        score: 0,
      };
      console.log('👤 Player added:', displayName);
    },
    
    updatePlayerReady: (state, action: PayloadAction<{ 
      playerId: string; 
      isReady: boolean 
    }>) => {
      const { playerId, isReady } = action.payload;
      if (state.players[playerId]) {
        state.players[playerId].isReady = isReady;
        console.log('✅ Player ready status updated:', { playerId, isReady });
      }
    },
    
    setCurrentPrompt: (state, action: PayloadAction<{
      promptId: string;
      promptText: string;
      isAssigned: boolean;
      isVoting?: boolean;
      assignedPlayers?: string[];
    }>) => {
      state.currentPromptData = {
        promptId: action.payload.promptId,
        promptText: action.payload.promptText,
        isAssigned: action.payload.isAssigned,
        isVoting: action.payload.isVoting || false,
        assignedPlayers: action.payload.assignedPlayers || [],
      };
      console.log('💭 Current prompt set:', action.payload);
    },
    
    addSubmission: (state, action: PayloadAction<Submission>) => {
      state.submissions.push(action.payload);
      console.log('📸 Submission added:', action.payload.submissionId);
    },
    
    addVote: (state, action: PayloadAction<{
      submissionId: string;
      voterId: string;
    }>) => {
      const submission = state.submissions.find(s => s.submissionId === action.payload.submissionId);
      if (submission) {
        submission.votes.push(action.payload.voterId);
        console.log('🗳️ Vote added:', action.payload);
      }
    },
    
    // Handle successful game creation/joining
    setGameCreated: (state, action: PayloadAction<{
      gameId: string;
      gameCode: string;
      isHost: boolean;
    }>) => {
      state.gameId = action.payload.gameId;
      state.joinCode = action.payload.gameCode;
      state.isHost = action.payload.isHost;
      state.status = 'waiting';
      console.log('🎮 Game created/joined successfully:', action.payload);
    },
    
    // Set host status
    setIsHost: (state, action: PayloadAction<boolean>) => {
      state.isHost = action.payload;
      console.log('👑 Host status set:', action.payload);
    },
    
    // Simulate game start for testing
    startTestGame: (state) => {
      state.status = 'playing';
      state.currentRound = 1;
      
      // Add some test prompts
      state.prompts = [
        {
          promptId: 'prompt_1',
          text: 'You as a superhero saving the day',
          round: 1,
          assignedPlayers: Object.keys(state.players).slice(0, 2)
        },
        {
          promptId: 'prompt_2', 
          text: 'You at a disco party in the 70s',
          round: 1,
          assignedPlayers: Object.keys(state.players).slice(2, 4)
        }
      ];
      
      // Set current prompt for testing
      state.currentPromptData = {
        promptId: 'prompt_1',
        promptText: 'You as a superhero saving the day',
        isAssigned: true,
        isVoting: false,
        assignedPlayers: Object.keys(state.players).slice(0, 2)
      };
      
      console.log('🧪 Test game started with status:', state.status);
    },
    
    // Transition to voting phase after prompt submission
    startVotingPhase: (state) => {
      state.status = 'voting';
      console.log('🗳️ Transitioning to voting phase');
    },
    
    // Transition to results phase after voting
    startResultsPhase: (state) => {
      state.status = 'results';
      console.log('🏆 Transitioning to results phase');
    },
    
    // Reset game state
    resetGame: (state) => {
      return initialState;
    },
  },
});

export const {
  setGameId,
  setJoinCode,
  setGameStatus,
  addPlayer,
  updatePlayerReady,
  setCurrentPrompt,
  addSubmission,
  addVote,
  setGameCreated,
  setIsHost,
  startTestGame,
  startVotingPhase,
  startResultsPhase,
  resetGame,
} = gameSlice.actions;

export default gameSlice.reducer;