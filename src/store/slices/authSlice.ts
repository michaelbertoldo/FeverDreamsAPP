// src/store/slices/authSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { signInWithApple, createUserProfile } from '../../services/authServices';

interface User {
  uid: string;
  email: string | null;
  displayName: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  selfieUploaded: boolean;
}

const initialState: AuthState = {
  user: null,
  loading: false,
  error: null,
  selfieUploaded: false,
};

export const appleSignIn = createAsyncThunk(
  'auth/appleSignIn',
  async (_, { rejectWithValue }) => {
    try {
      const userCredential = await signInWithApple();
      const { user } = userCredential;
      
      // Create or update user profile
      await createUserProfile(
        user.uid,
        user.displayName || 'Player',
        user.email || ''
      );
      
      return {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || 'Player',
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Sign in failed');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setSelfieUploaded: (state, action: PayloadAction<boolean>) => {
      state.selfieUploaded = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.selfieUploaded = false;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(appleSignIn.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(appleSignIn.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(appleSignIn.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  }
});

export const { setSelfieUploaded, logout, clearError } = authSlice.actions;
export default authSlice.reducer;