import { create } from 'zustand';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  setToken: (token: string | null) => void;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>((set) => {
  const storedToken = localStorage.getItem('iip_token');
  const storedUser = localStorage.getItem('iip_user');
  
  return {
    user: storedUser ? JSON.parse(storedUser) : null,
    token: storedToken,
    isAuthenticated: !!storedToken,
    login: (user, token) => {
      localStorage.setItem('iip_token', token);
      localStorage.setItem('iip_user', JSON.stringify(user));
      set({ user, token, isAuthenticated: true });
    },
    logout: () => {
      localStorage.removeItem('iip_token');
      localStorage.removeItem('iip_user');
      set({ user: null, token: null, isAuthenticated: false });
    },
    setToken: (token) => {
      if (token) {
        localStorage.setItem('iip_token', token);
      } else {
        localStorage.removeItem('iip_token');
      }
      set({ token, isAuthenticated: !!token });
    },
    setUser: (user) => {
      if (user) {
        localStorage.setItem('iip_user', JSON.stringify(user));
      } else {
        localStorage.removeItem('iip_user');
      }
      set({ user });
    },
  };
});
