import { create } from 'zustand';
import { googleAPI } from '@/lib/googleAPI';

export const useAuthStore = create((set, get) => ({
  isAuthenticated: false,
  isInitializing: true,
  user: null,
  error: null,

  // Initialize auth
  initialize: async () => {
    try {
      await googleAPI.init();
      const isSignedIn = googleAPI.isSignedIn();
      
      if (isSignedIn) {
        // Try to refresh token
        try {
          await googleAPI.signIn();
          set({ isAuthenticated: true, isInitializing: false });
        } catch (err) {
          // Token expired, need to sign in again
          set({ isAuthenticated: false, isInitializing: false });
        }
      } else {
        set({ isInitializing: false });
      }
    } catch (error) {
      console.error('Failed to initialize auth:', error);
      set({ error: error.message, isInitializing: false });
    }
  },

  // Sign in
  signIn: async () => {
    try {
      set({ error: null });
      await googleAPI.signIn();
      set({ isAuthenticated: true });
    } catch (error) {
      console.error('Sign in failed:', error);
      set({ error: error.message });
      throw error;
    }
  },

  // Sign out
  signOut: () => {
    googleAPI.signOut();
    set({ isAuthenticated: false, user: null });
  }
}));
