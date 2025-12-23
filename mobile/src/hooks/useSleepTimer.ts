import { useEffect, useRef, useCallback } from 'react';
import TrackPlayer from 'react-native-track-player';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePlayerStore } from '../stores';
import { SleepTimerOption } from '../types';

const SLEEP_TIMER_STORAGE_KEY = '@heeling_sleep_timer_end_time';

export const useSleepTimer = () => {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fadeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const {
    sleepTimer,
    sleepTimerEndTime,
    setSleepTimer,
    clearSleepTimer,
    volume,
  } = usePlayerStore();

  // Calculate remaining time in seconds
  const getRemainingTime = useCallback((): number => {
    if (!sleepTimerEndTime) return 0;
    const remaining = Math.max(0, sleepTimerEndTime - Date.now());
    return Math.floor(remaining / 1000);
  }, [sleepTimerEndTime]);

  // Format remaining time as mm:ss
  const formatRemainingTime = useCallback((): string => {
    const seconds = getRemainingTime();
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, [getRemainingTime]);

  // Fade out volume over 5 seconds
  const fadeOutAndStop = useCallback(async () => {
    const originalVolume = volume;
    const steps = 10;
    const stepTime = 500; // 5 seconds total
    let currentStep = 0;

    fadeIntervalRef.current = setInterval(async () => {
      currentStep++;
      const newVolume = originalVolume * (1 - currentStep / steps);
      await TrackPlayer.setVolume(Math.max(0, newVolume));

      if (currentStep >= steps) {
        if (fadeIntervalRef.current) {
          clearInterval(fadeIntervalRef.current);
          fadeIntervalRef.current = null;
        }
        await TrackPlayer.stop();
        await TrackPlayer.setVolume(originalVolume); // Reset volume
        clearSleepTimer();
        await AsyncStorage.removeItem(SLEEP_TIMER_STORAGE_KEY);
      }
    }, stepTime);
  }, [volume, clearSleepTimer]);

  // Start timer
  const startTimer = useCallback(async (minutes: SleepTimerOption) => {
    // Clear existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
      fadeIntervalRef.current = null;
    }

    if (minutes === null) {
      clearSleepTimer();
      await AsyncStorage.removeItem(SLEEP_TIMER_STORAGE_KEY);
      return;
    }

    setSleepTimer(minutes);

    // Save end time to AsyncStorage for recovery
    const endTime = Date.now() + minutes * 60 * 1000;
    await AsyncStorage.setItem(SLEEP_TIMER_STORAGE_KEY, endTime.toString());

    // Set timeout for (minutes - 5 seconds) to start fade out
    const timeoutMs = (minutes * 60 * 1000) - 5000;

    if (timeoutMs > 0) {
      timerRef.current = setTimeout(() => {
        fadeOutAndStop();
      }, timeoutMs);
    } else {
      // Less than 5 seconds, just stop immediately at end time
      timerRef.current = setTimeout(() => {
        TrackPlayer.stop();
        clearSleepTimer();
      }, minutes * 60 * 1000);
    }
  }, [setSleepTimer, clearSleepTimer, fadeOutAndStop]);

  // Cancel timer
  const cancelTimer = useCallback(async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
      fadeIntervalRef.current = null;
    }
    clearSleepTimer();
    await AsyncStorage.removeItem(SLEEP_TIMER_STORAGE_KEY);
  }, [clearSleepTimer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      if (fadeIntervalRef.current) {
        clearInterval(fadeIntervalRef.current);
      }
    };
  }, []);

  // Load saved timer from AsyncStorage on mount
  useEffect(() => {
    const loadSavedTimer = async () => {
      try {
        const savedEndTime = await AsyncStorage.getItem(SLEEP_TIMER_STORAGE_KEY);
        if (savedEndTime) {
          const endTime = parseInt(savedEndTime, 10);
          const remainingMs = endTime - Date.now();

          if (remainingMs > 0) {
            // Timer still active - restore it
            const remainingMinutes = Math.ceil(remainingMs / 60000);
            // Update Zustand store with approximate remaining time
            usePlayerStore.setState({
              sleepTimer: remainingMinutes as any,
              sleepTimerEndTime: endTime,
            });
          } else {
            // Timer expired while app was closed - clear it
            await AsyncStorage.removeItem(SLEEP_TIMER_STORAGE_KEY);
          }
        }
      } catch (error) {
        console.warn('Failed to load sleep timer from storage:', error);
      }
    };

    loadSavedTimer();
  }, []);

  // Resume timer if sleepTimerEndTime is set (from storage or new timer)
  useEffect(() => {
    if (sleepTimerEndTime && !timerRef.current) {
      const remainingMs = sleepTimerEndTime - Date.now();
      if (remainingMs > 5000) {
        timerRef.current = setTimeout(() => {
          fadeOutAndStop();
        }, remainingMs - 5000);
      } else if (remainingMs > 0) {
        timerRef.current = setTimeout(async () => {
          await TrackPlayer.stop();
          clearSleepTimer();
          await AsyncStorage.removeItem(SLEEP_TIMER_STORAGE_KEY);
        }, remainingMs);
      } else {
        // Timer already expired
        clearSleepTimer();
        AsyncStorage.removeItem(SLEEP_TIMER_STORAGE_KEY);
      }
    }
  }, [sleepTimerEndTime, fadeOutAndStop, clearSleepTimer]);

  return {
    sleepTimer,
    sleepTimerEndTime,
    isTimerActive: sleepTimerEndTime !== null,
    getRemainingTime,
    formatRemainingTime,
    startTimer,
    cancelTimer,
  };
};

export default useSleepTimer;
