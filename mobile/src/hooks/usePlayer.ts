import { useCallback, useEffect, useRef } from 'react';
import TrackPlayer, {
  Track as RNTrack,
  State,
  usePlaybackState,
  useProgress,
  useActiveTrack,
  RepeatMode,
} from 'react-native-track-player';
import { usePlayerStore } from '../stores';
import { Track } from '../types';
import { TrackService } from '../services/TrackService';
import { HomeService } from '../services/HomeService';
import { HistoryService } from '../services/HistoryService';
import { DownloadService } from '../services/DownloadService';
import { useAuthStore } from '../stores';
import { resolveAudioFile } from '../utils/audioAssets';

// Convert app Track to react-native-track-player Track (sync version)
// Note: url accepts both string (remote URL) and number (require() bundled asset)
const toRNTrack = (track: Track): RNTrack => {
  const resolvedUrl = resolveAudioFile(track.audioFile);
  return {
    id: track.id,
    url: resolvedUrl as any, // RNTrack expects string, but number works for bundled assets
    title: track.title,
    artist: track.artist,
    artwork: track.backgroundImage,
    duration: track.duration,
  };
};

// Convert app Track to RNTrack with local file check (async version)
// Prioritizes downloaded local file over remote URL for offline playback
const toRNTrackWithLocalCheck = async (track: Track): Promise<RNTrack> => {
  const playableUrl = await DownloadService.getPlayableUrl(track);
  return {
    id: track.id,
    url: playableUrl as any,
    title: track.title,
    artist: track.artist,
    artwork: track.backgroundImage,
    duration: track.duration,
  };
};

export const usePlayer = () => {
  const playbackState = usePlaybackState();
  const progress = useProgress();
  const activeTrack = useActiveTrack();
  const historyIdRef = useRef<string | null>(null);

  const {
    currentTrack,
    queue,
    isPlaying,
    volume,
    isRepeat,
    isShuffle,
    setTrack,
    setQueue,
    setIsPlaying,
    setProgress,
    setPlaybackState,
  } = usePlayerStore();

  const { user } = useAuthStore();

  // Update store when playback state changes
  useEffect(() => {
    const state = playbackState.state;
    if (state === State.Playing) {
      setIsPlaying(true);
      setPlaybackState('playing');
    } else if (state === State.Paused) {
      setIsPlaying(false);
      setPlaybackState('paused');
    } else if (state === State.Stopped) {
      setIsPlaying(false);
      setPlaybackState('stopped');
    } else if (state === State.Buffering || state === State.Loading) {
      setPlaybackState('buffering');
    }
  }, [playbackState.state]);

  // Update progress in store
  useEffect(() => {
    setProgress(progress.position, progress.duration, progress.buffered);
  }, [progress.position, progress.duration, progress.buffered]);

  // Handle track changes (when skipping to next/previous)
  useEffect(() => {
    if (activeTrack && currentTrack?.id !== activeTrack.id) {
      // Find the track in the queue
      const newTrack = queue.find(t => t.id === activeTrack.id);
      if (newTrack) {
        setTrack(newTrack);

        // Increment play count
        TrackService.incrementPlayCount(newTrack.id).catch(console.error);

        // Add to play history
        if (user?.id) {
          // Update previous history duration if exists
          if (historyIdRef.current && progress.position > 0) {
            HistoryService.updateDurationPlayed(
              historyIdRef.current,
              Math.floor(progress.position)
            ).catch(console.warn);
          }

          // Create new history entry
          HistoryService.addPlayHistory(user.id, newTrack.id)
            .then(history => {
              historyIdRef.current = history.id;
            })
            .catch(console.warn);
        }
      }
    }
  }, [activeTrack?.id]);

  // Play a single track with auto-queue (adds related tracks from same category)
  const playTrack = useCallback(async (track: Track, skipAutoQueue: boolean = false) => {
    try {
      await TrackPlayer.reset();

      // Auto-queue: fetch related tracks from same category
      let queueTracks: Track[] = [track];

      if (!skipAutoQueue && track.category) {
        try {
          // Try HomeService first (backend), fallback to TrackService (local DB)
          let relatedTracks = await HomeService.getTracksByCategory(track.category);

          if (relatedTracks.length === 0) {
            relatedTracks = await TrackService.getTracksByCategory(track.category);
          }

          // Filter out current track and limit to 20 related tracks
          const otherTracks = relatedTracks
            .filter(t => t.id !== track.id)
            .slice(0, 20);

          // Current track first, then related tracks
          queueTracks = [track, ...otherTracks];
          console.log(`Auto-queue: Added ${otherTracks.length} related tracks from category "${track.category}"`);
        } catch (autoQueueError) {
          console.warn('Auto-queue failed, playing single track:', autoQueueError);
          // Continue with just the single track
        }
      }

      // Add all tracks to player queue (with local file check for offline playback)
      const rnTracks = await Promise.all(queueTracks.map(toRNTrackWithLocalCheck));
      await TrackPlayer.add(rnTracks);
      await TrackPlayer.play();

      // Update store with queue
      setQueue(queueTracks, 0);

      // Increment play count
      await TrackService.incrementPlayCount(track.id);

      // Add to play history (non-blocking, don't fail playback)
      if (user?.id) {
        try {
          const history = await HistoryService.addPlayHistory(user.id, track.id);
          historyIdRef.current = history.id;
        } catch (historyError) {
          console.warn('Failed to record play history:', historyError);
          // Continue playing - history is not critical
        }
      }
    } catch (error) {
      console.error('Error playing track:', error);
    }
  }, [user?.id]);

  // Play multiple tracks (queue)
  const playQueue = useCallback(async (tracks: Track[], startIndex: number = 0) => {
    try {
      console.log('playQueue called with', tracks.length, 'tracks, startIndex:', startIndex);

      await TrackPlayer.reset();

      // 트랙 변환 및 검증 (with local file check for offline playback)
      const rnTracks = await Promise.all(tracks.map(async (track, index) => {
        try {
          const rnTrack = await toRNTrackWithLocalCheck(track);
          console.log(`Track ${index}:`, track.title, 'URL:', rnTrack.url);
          return rnTrack;
        } catch (err) {
          console.error(`Failed to convert track ${index}:`, track.title, err);
          throw err;
        }
      }));

      console.log('Adding tracks to player...');
      await TrackPlayer.add(rnTracks);

      console.log('Skipping to index:', startIndex);
      await TrackPlayer.skip(startIndex);

      console.log('Starting playback...');
      await TrackPlayer.play();

      setQueue(tracks, startIndex);

      // Increment play count for first track
      if (tracks[startIndex]) {
        await TrackService.incrementPlayCount(tracks[startIndex].id);

        // Add to play history (non-blocking, don't fail playback)
        if (user?.id) {
          try {
            const history = await HistoryService.addPlayHistory(user.id, tracks[startIndex].id);
            historyIdRef.current = history.id;
          } catch (historyError) {
            console.warn('Failed to record play history:', historyError);
            // Continue playing - history is not critical
          }
        }
      }

      console.log('playQueue completed successfully');
    } catch (error) {
      console.error('Error playing queue:', error);
      throw error; // 에러를 다시 던져서 호출자가 알 수 있게 함
    }
  }, [user?.id]);

  // Basic controls
  const play = useCallback(async () => {
    await TrackPlayer.play();
  }, []);

  const pause = useCallback(async () => {
    await TrackPlayer.pause();
  }, []);

  const stop = useCallback(async () => {
    // Update history duration before stopping
    if (historyIdRef.current && progress.position > 0) {
      await HistoryService.updateDurationPlayed(
        historyIdRef.current,
        Math.floor(progress.position)
      );
    }
    await TrackPlayer.stop();
    await TrackPlayer.reset();
    historyIdRef.current = null;
  }, [progress.position]);

  const togglePlayPause = useCallback(async () => {
    if (isPlaying) {
      await pause();
    } else {
      await play();
    }
  }, [isPlaying, play, pause]);

  // Skip controls
  const skipToNext = useCallback(async () => {
    try {
      if (isShuffle && queue.length > 1) {
        // Shuffle mode: pick random track (different from current)
        const currentIndex = await TrackPlayer.getActiveTrackIndex();
        let randomIndex: number;
        do {
          randomIndex = Math.floor(Math.random() * queue.length);
        } while (randomIndex === currentIndex && queue.length > 1);
        await TrackPlayer.skip(randomIndex);
      } else {
        await TrackPlayer.skipToNext();
      }
    } catch {
      // No next track
    }
  }, [isShuffle, queue.length]);

  const skipToPrevious = useCallback(async () => {
    try {
      // If we're more than 3 seconds in, restart current track
      if (progress.position > 3) {
        await TrackPlayer.seekTo(0);
      } else {
        await TrackPlayer.skipToPrevious();
      }
    } catch {
      // No previous track, just restart current
      await TrackPlayer.seekTo(0);
    }
  }, [progress.position]);

  // Seek
  const seekTo = useCallback(async (seconds: number) => {
    await TrackPlayer.seekTo(seconds);
  }, []);

  // Volume
  const setPlayerVolume = useCallback(async (vol: number) => {
    const clampedVolume = Math.max(0, Math.min(1, vol));
    await TrackPlayer.setVolume(clampedVolume);
    usePlayerStore.getState().setVolume(clampedVolume);
  }, []);

  // Repeat mode
  const setRepeatMode = useCallback(async (repeat: boolean) => {
    await TrackPlayer.setRepeatMode(
      repeat ? RepeatMode.Track : RepeatMode.Off
    );
    usePlayerStore.getState().setRepeat(repeat);
  }, []);

  // Shuffle (handled at queue level)
  const toggleShuffle = useCallback(() => {
    usePlayerStore.getState().setShuffle(!isShuffle);
  }, [isShuffle]);

  // Play mode toggle: OFF -> Repeat -> Shuffle -> OFF
  const togglePlayMode = useCallback(async () => {
    if (!isRepeat && !isShuffle) {
      // OFF -> Repeat
      await TrackPlayer.setRepeatMode(RepeatMode.Track);
      usePlayerStore.getState().setRepeat(true);
      usePlayerStore.getState().setShuffle(false);
    } else if (isRepeat && !isShuffle) {
      // Repeat -> Shuffle
      await TrackPlayer.setRepeatMode(RepeatMode.Off);
      usePlayerStore.getState().setRepeat(false);
      usePlayerStore.getState().setShuffle(true);
    } else {
      // Shuffle -> OFF
      await TrackPlayer.setRepeatMode(RepeatMode.Off);
      usePlayerStore.getState().setRepeat(false);
      usePlayerStore.getState().setShuffle(false);
    }
  }, [isRepeat, isShuffle]);

  return {
    // State
    currentTrack,
    activeTrack,
    queue,
    isPlaying,
    playbackState: playbackState.state,
    progress: {
      position: progress.position,
      duration: progress.duration,
      buffered: progress.buffered,
    },
    volume,
    isRepeat,
    isShuffle,

    // Actions
    playTrack,
    playQueue,
    play,
    pause,
    stop,
    togglePlayPause,
    skipToNext,
    skipToPrevious,
    seekTo,
    setVolume: setPlayerVolume,
    setRepeatMode,
    toggleShuffle,
    togglePlayMode,
  };
};

export default usePlayer;
