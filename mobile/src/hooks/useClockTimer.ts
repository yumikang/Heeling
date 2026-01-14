import { useState, useEffect, useRef } from 'react';
import Orientation from 'react-native-orientation-locker';
import { ErrorLogger } from '../services/ErrorLogger';

const logger = ErrorLogger.forScreen('useClockTimer');

interface UseClockTimerReturn {
  currentTime: Date;
}

export const useClockTimer = (
  isClockMode: boolean,
  isMountedRef: React.RefObject<boolean>
): UseClockTimerReturn => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const clockTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isClockMode) {
      logger.debug('clockMode', 'Clock mode enabled');
      setCurrentTime(new Date());
      clockTimer.current = setInterval(() => {
        if (isMountedRef.current) {
          setCurrentTime(new Date());
        }
      }, 1000);
    }

    return () => {
      if (clockTimer.current) {
        clearInterval(clockTimer.current);
        clockTimer.current = null;
      }
    };
  }, [isClockMode, isMountedRef]);

  useEffect(() => {
    if (isClockMode) {
      Orientation.lockToLandscapeRight();
    } else {
      Orientation.lockToPortrait();
    }

    return () => {
      Orientation.lockToPortrait();
    };
  }, [isClockMode]);

  return { currentTime };
};

export default useClockTimer;
