import { create } from 'zustand';
import { Track, PlaybackState, SleepTimerOption } from '../types';

interface PlayerState {
  // Current Track
  currentTrack: Track | null;
  queue: Track[];
  queueIndex: number;

  // Playback State
  playbackState: PlaybackState;
  isPlaying: boolean;

  // Progress
  position: number;
  duration: number;
  buffered: number;

  // Volume & Brightness
  volume: number;
  brightness: number;

  // Modes
  isImmersiveMode: boolean;
  isRepeat: boolean;
  isShuffle: boolean;

  // Sleep Timer
  sleepTimer: SleepTimerOption;
  sleepTimerEndTime: number | null;

  // Actions
  setTrack: (track: Track) => void;
  setQueue: (tracks: Track[], startIndex?: number) => void;
  addToQueue: (track: Track) => void;
  clearQueue: () => void;

  setPlaybackState: (state: PlaybackState) => void;
  setIsPlaying: (playing: boolean) => void;

  setPosition: (position: number) => void;
  setDuration: (duration: number) => void;
  setBuffered: (buffered: number) => void;
  setProgress: (position: number, duration: number, buffered: number) => void;

  setVolume: (volume: number) => void;
  setBrightness: (brightness: number) => void;

  toggleImmersiveMode: () => void;
  setRepeat: (repeat: boolean) => void;
  setShuffle: (shuffle: boolean) => void;

  setSleepTimer: (minutes: SleepTimerOption) => void;
  clearSleepTimer: () => void;

  reset: () => void;
}

const initialState = {
  currentTrack: null,
  queue: [],
  queueIndex: 0,
  playbackState: 'stopped' as PlaybackState,
  isPlaying: false,
  position: 0,
  duration: 0,
  buffered: 0,
  volume: 0.8,
  brightness: 1.0,
  isImmersiveMode: false,
  isRepeat: false,
  isShuffle: false,
  sleepTimer: null,
  sleepTimerEndTime: null,
};

export const usePlayerStore = create<PlayerState>((set, get) => ({
  ...initialState,

  setTrack: (track: Track) => set({
    currentTrack: track,
    position: 0,
    duration: track.duration,
  }),

  setQueue: (tracks: Track[], startIndex = 0) => set({
    queue: tracks,
    queueIndex: startIndex,
    currentTrack: tracks[startIndex] || null,
  }),

  addToQueue: (track: Track) => set((state) => ({
    queue: [...state.queue, track],
  })),

  clearQueue: () => set({
    queue: [],
    queueIndex: 0,
  }),

  setPlaybackState: (state: PlaybackState) => set({
    playbackState: state,
    isPlaying: state === 'playing',
  }),

  setIsPlaying: (playing: boolean) => set({
    isPlaying: playing,
    playbackState: playing ? 'playing' : 'paused',
  }),

  setPosition: (position: number) => set({ position }),
  setDuration: (duration: number) => set({ duration }),
  setBuffered: (buffered: number) => set({ buffered }),

  setProgress: (position: number, duration: number, buffered: number) => set({
    position,
    duration,
    buffered,
  }),

  setVolume: (volume: number) => set({
    volume: Math.max(0, Math.min(1, volume))
  }),

  setBrightness: (brightness: number) => set({
    brightness: Math.max(0, Math.min(1, brightness))
  }),

  toggleImmersiveMode: () => set((state) => ({
    isImmersiveMode: !state.isImmersiveMode,
  })),

  setRepeat: (repeat: boolean) => set({ isRepeat: repeat }),
  setShuffle: (shuffle: boolean) => set({ isShuffle: shuffle }),

  setSleepTimer: (minutes: SleepTimerOption) => {
    if (minutes === null) {
      set({ sleepTimer: null, sleepTimerEndTime: null });
    } else {
      const endTime = Date.now() + minutes * 60 * 1000;
      set({ sleepTimer: minutes, sleepTimerEndTime: endTime });
    }
  },

  clearSleepTimer: () => set({
    sleepTimer: null,
    sleepTimerEndTime: null,
  }),

  reset: () => set(initialState),
}));
