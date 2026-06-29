import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { User } from '../types';

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

const isClient = typeof window !== 'undefined';
const storedToken = isClient ? localStorage.getItem('inprep_token') : null;
const storedUser = isClient ? localStorage.getItem('inprep_user') : null;

const initialState: AuthState = {
  user: storedUser ? JSON.parse(storedUser) : null,
  token: storedToken,
  isAuthenticated: !!storedToken,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    login: (state, action: PayloadAction<{ user: User; token: string }>) => {
      const { user, token } = action.payload;
      localStorage.setItem('inprep_token', token);
      localStorage.setItem('inprep_user', JSON.stringify(user));
      state.user = user;
      state.token = token;
      state.isAuthenticated = true;
    },
    logout: (state) => {
      localStorage.removeItem('inprep_token');
      localStorage.removeItem('inprep_user');
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
    },
    setToken: (state, action: PayloadAction<string | null>) => {
      const token = action.payload;
      if (token) {
        localStorage.setItem('inprep_token', token);
      } else {
        localStorage.removeItem('inprep_token');
      }
      state.token = token;
      state.isAuthenticated = !!token;
    },
    setUser: (state, action: PayloadAction<User | null>) => {
      const user = action.payload;
      if (user) {
        localStorage.setItem('inprep_user', JSON.stringify(user));
      } else {
        localStorage.removeItem('inprep_user');
      }
      state.user = user;
    },
  },
});

export const { login, logout, setToken, setUser } = authSlice.actions;
export default authSlice.reducer;
