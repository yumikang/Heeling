import TrackPlayer, {
  AppKilledPlaybackBehavior,
  Capability,
  Event,
  RepeatMode,
} from 'react-native-track-player';
import { MIN_BUFFER, MAX_BUFFER } from '../constants';

let isPlayerSetup = false;

// Setup TrackPlayer
export const setupPlayer = async (): Promise<boolean> => {
  if (isPlayerSetup) {
    return true;
  }

  try {
    await TrackPlayer.setupPlayer({
      minBuffer: MIN_BUFFER,
      maxBuffer: MAX_BUFFER,
      playBuffer: 2,
      backBuffer: 5,
    });

    await TrackPlayer.updateOptions({
      android: {
        // StopPlaybackAndRemoveNotification: 앱 종료 시 재생 중지 및 알림 제거
        appKilledPlaybackBehavior: AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification,
      },
      // 알림에 표시할 기능들
      capabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.Stop,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
        Capability.SeekTo,
      ],
      // 축소된 알림에 표시할 기능들 (Android)
      compactCapabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
      ],
      // 알림 설정
      notificationCapabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
      ],
      progressUpdateEventInterval: 1,
    });

    isPlayerSetup = true;
    return true;
  } catch (error: any) {
    // Player already initialized is not a real error
    if (error?.message?.includes('already been initialized')) {
      isPlayerSetup = true;
      return true;
    }
    console.error('Error setting up TrackPlayer:', error);
    return false;
  }
};

// Playback Service - handles background events
export const PlaybackService = async (): Promise<void> => {
  TrackPlayer.addEventListener(Event.RemotePlay, () => {
    TrackPlayer.play();
  });

  TrackPlayer.addEventListener(Event.RemotePause, () => {
    TrackPlayer.pause();
  });

  TrackPlayer.addEventListener(Event.RemoteStop, () => {
    TrackPlayer.stop();
  });

  TrackPlayer.addEventListener(Event.RemoteNext, () => {
    TrackPlayer.skipToNext();
  });

  TrackPlayer.addEventListener(Event.RemotePrevious, () => {
    TrackPlayer.skipToPrevious();
  });

  TrackPlayer.addEventListener(Event.RemoteSeek, (event) => {
    TrackPlayer.seekTo(event.position);
  });

  TrackPlayer.addEventListener(Event.RemoteDuck, async (event) => {
    if (event.paused) {
      // Audio focus lost, pause playback
      await TrackPlayer.pause();
    } else if (event.permanent) {
      // Audio focus lost permanently, stop playback
      await TrackPlayer.stop();
    } else {
      // Temporary duck (e.g., notification), lower volume
      await TrackPlayer.setVolume(0.3);
    }
  });

  TrackPlayer.addEventListener(Event.PlaybackQueueEnded, async (event) => {
    // Get current repeat mode
    const repeatMode = await TrackPlayer.getRepeatMode();

    if (repeatMode === RepeatMode.Queue) {
      // Restart queue from beginning
      await TrackPlayer.skip(0);
      await TrackPlayer.play();
    }
    // If RepeatMode.Track, track-player handles it automatically
    // If RepeatMode.Off, playback stops naturally
  });

  TrackPlayer.addEventListener(Event.PlaybackError, (event) => {
    console.error('Playback error:', event);
  });

  TrackPlayer.addEventListener(Event.PlaybackActiveTrackChanged, (event) => {
    if (event.track) {
      console.log('Now playing:', event.track.title);
    }
  });
};

export default PlaybackService;
