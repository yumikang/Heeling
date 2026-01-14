import { useState, useEffect, useRef, useCallback } from 'react';
import { useSharedValue, withTiming } from 'react-native-reanimated';
import { VolumeManager } from 'react-native-volume-manager';
import { ErrorLogger } from '../services/ErrorLogger';

const logger = ErrorLogger.forScreen('useVolumeIndicator');
const VOLUME_HIDE_DELAY = 2500;

interface UseVolumeIndicatorReturn {
  currentVolume: number;
  showVolumeSlider: boolean;
  volumeOpacity: { value: number };
  showVolumeIndicator: () => void;
}

export const useVolumeIndicator = (isMountedRef: React.RefObject<boolean>): UseVolumeIndicatorReturn => {
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [currentVolume, setCurrentVolume] = useState(0);
  const volumeHideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const volumeOpacity = useSharedValue(0);

  const showVolumeIndicator = useCallback(() => {
    if (!isMountedRef.current) return;

    setShowVolumeSlider(true);
    volumeOpacity.value = withTiming(1, { duration: 150 });

    if (volumeHideTimer.current) {
      clearTimeout(volumeHideTimer.current);
    }

    volumeHideTimer.current = setTimeout(() => {
      if (!isMountedRef.current) return;
      volumeOpacity.value = withTiming(0, { duration: 300 });
      setTimeout(() => {
        if (isMountedRef.current) {
          setShowVolumeSlider(false);
        }
      }, 300);
    }, VOLUME_HIDE_DELAY);
  }, [isMountedRef, volumeOpacity]);

  useEffect(() => {
    let volumeListener: { remove: () => void } | null = null;

    const setupVolumeListener = async () => {
      try {
        const result = await VolumeManager.getVolume();
        if (isMountedRef.current) {
          setCurrentVolume(result.volume);
        }

        volumeListener = VolumeManager.addVolumeListener((res) => {
          if (isMountedRef.current) {
            setCurrentVolume(res.volume);
            showVolumeIndicator();
          }
        });
        logger.debug('setup', 'Volume listener setup complete');
      } catch (error) {
        logger.warn('setup', 'VolumeManager not available', { error });
      }
    };

    setupVolumeListener();

    return () => {
      volumeListener?.remove();
      if (volumeHideTimer.current) {
        clearTimeout(volumeHideTimer.current);
      }
    };
  }, [isMountedRef, showVolumeIndicator]);

  return {
    currentVolume,
    showVolumeSlider,
    volumeOpacity,
    showVolumeIndicator,
  };
};

export default useVolumeIndicator;
