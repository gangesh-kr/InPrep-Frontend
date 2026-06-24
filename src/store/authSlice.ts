import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { User } from '../types';

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

const storedToken = localStorage.getItem('iip_token');
const storedUser = localStorage.getItem('iip_user');

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
      localStorage.setItem('iip_token', token);
      localStorage.setItem('iip_user', JSON.stringify(user));
      state.user = user;
      state.token = token;
      state.isAuthenticated = true;
    },
    logout: (state) => {
      localStorage.removeItem('iip_token');
      localStorage.removeItem('iip_user');
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
    },
    setToken: (state, action: PayloadAction<string | null>) => {
      const token = action.payload;
      if (token) {
        localStorage.setItem('iip_token', token);
      } else {
        localStorage.removeItem('iip_token');
      }
      state.token = token;
      state.isAuthenticated = !!token;
    },
    setUser: (state, action: PayloadAction<User | null>) => {
      const user = action.payload;
      if (user) {
        localStorage.setItem('iip_user', JSON.stringify(user));
      } else {
        localStorage.removeItem('iip_user');
      }
      state.user = user;
    },
  },
});

export const { login, logout, setToken, setUser } = authSlice.actions;
export default authSlice.reducer;
