import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';
import { UserService } from '../services/UserService';

interface AuthState {
  isLoggedIn: boolean;
  isGuest: boolean;
  user: User | null;
  isLoading: boolean;

  // Actions
  login: (user: User) => void;
  logout: () => void;
  setGuest: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  ensureUserInDb: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isLoggedIn: false,
      isGuest: false,
      user: null,
      isLoading: true,

      login: (user: User) => set({
        isLoggedIn: true,
        isGuest: user.provider === 'guest',
        user,
        isLoading: false,
      }),

      logout: () => set({
        isLoggedIn: false,
        isGuest: false,
        user: null,
        isLoading: false,
      }),

      setGuest: async () => {
        try {
          // Create guest user in database
          const guestUser = await UserService.createUser('guest', undefined, 'Guest');
          set({
            isLoggedIn: true,
            isGuest: true,
            user: guestUser,
            isLoading: false,
          });
        } catch (error) {
          console.error('Failed to create guest user:', error);
          // Fallback to local-only user if DB fails
          const guestUser: User = {
            id: `guest_${Date.now()}`,
            provider: 'guest',
            displayName: 'Guest',
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
          };
          set({
            isLoggedIn: true,
            isGuest: true,
            user: guestUser,
            isLoading: false,
          });
        }
      },

      // Ensure current user exists in database (for restored sessions)
      ensureUserInDb: async () => {
        const { user } = get();
        if (!user) return;

        try {
          const existingUser = await UserService.getUser(user.id);
          if (!existingUser) {
            // User doesn't exist in DB, create it
            await UserService.createUser(user.provider, user.email, user.displayName);
          }
        } catch (error) {
          console.error('Failed to ensure user in DB:', error);
        }
      },

      setLoading: (loading: boolean) => set({ isLoading: loading }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        isLoggedIn: state.isLoggedIn,
        isGuest: state.isGuest,
        user: state.user,
      }),
    }
  )
);
