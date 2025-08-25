// src/store/slices/authSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface User {
  id: string;
  email: string;
  displayName: string;
  selfieUrl?: string;
}

interface AuthState {
  user: User | null;
  selfieUploaded: boolean;
  isLoading: boolean;
}

const initialState: AuthState = {
  user: null,
  selfieUploaded: false,
  isLoading: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },
    setSelfieUploaded: (state, action: PayloadAction<boolean>) => {
      state.selfieUploaded = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.selfieUploaded = false;
    },
  },
});

export const { setUser, setSelfieUploaded, setLoading, logout } = authSlice.actions;
export default authSlice.reducer;