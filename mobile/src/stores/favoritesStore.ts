import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface FavoritesState {
  // Favorites (track IDs)
  favorites: string[];

  // Actions
  addFavorite: (trackId: string) => void;
  removeFavorite: (trackId: string) => void;
  toggleFavorite: (trackId: string) => void;
  isFavorite: (trackId: string) => boolean;
  clearFavorites: () => void;
  setFavorites: (favorites: string[]) => void;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: [],

      addFavorite: (trackId: string) => set((state) => {
        if (state.favorites.includes(trackId)) return state;
        return { favorites: [...state.favorites, trackId] };
      }),

      removeFavorite: (trackId: string) => set((state) => ({
        favorites: state.favorites.filter((id) => id !== trackId),
      })),

      toggleFavorite: (trackId: string) => {
        const { favorites, addFavorite, removeFavorite } = get();
        if (favorites.includes(trackId)) {
          removeFavorite(trackId);
        } else {
          addFavorite(trackId);
        }
      },

      isFavorite: (trackId: string) => {
        return get().favorites.includes(trackId);
      },

      clearFavorites: () => set({ favorites: [] }),

      setFavorites: (favorites: string[]) => set({ favorites }),
    }),
    {
      name: 'favorites-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
