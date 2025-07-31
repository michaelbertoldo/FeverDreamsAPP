// src/store/slices/authSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { signInWithApple, createUserProfile } from '../../services/authService';

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
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    loading: false,
    error: null,
    selfieUploaded: false,
  },
  reducers: {
    setSelfieUploaded: (state, action) => {
      state.selfieUploaded = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.selfieUploaded = false;
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
        state.error = action.payload;
      });
  }
});

export const { setSelfieUploaded, logout } = authSlice.actions;
export default authSlice.reducer;
