import { create } from 'zustand';
import { api } from '@/lib/api';

function readStoredToken() {
  return localStorage.getItem('marketpro_token') || sessionStorage.getItem('marketpro_token');
}

export const useAuthStore = create((set, get) => ({
  user: null,
  token: readStoredToken(),
  isAuthenticated: Boolean(readStoredToken()),
  isHydrating: Boolean(readStoredToken()),

  setSession: (token, user, rememberMe = true) => {
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem('marketpro_token', token);
    set({ token, user, isAuthenticated: true, isHydrating: false });
  },

  logout: () => {
    localStorage.removeItem('marketpro_token');
    sessionStorage.removeItem('marketpro_token');
    set({ token: null, user: null, isAuthenticated: false, isHydrating: false });
  },

  fetchMe: async () => {
    if (!get().token) {
      set({ isHydrating: false });
      return;
    }
    try {
      const { data } = await api.get('/auth/me');
      set({ user: data.user, isAuthenticated: true, isHydrating: false });
    } catch {
      get().logout();
    }
  },
}));
