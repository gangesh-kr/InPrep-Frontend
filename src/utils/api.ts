import { store } from '../store';
import { logout } from '../store/authSlice';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const token = store.getState().auth.token;
  
  const headers = new Headers(options.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    if (response.status === 401) {
      store.dispatch(logout());
    }
    throw new Error(errorData.error || 'Something went wrong');
  }

  return response.json();
};
