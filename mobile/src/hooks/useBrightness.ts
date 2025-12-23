import { useEffect, useCallback } from 'react';
import { usePlayerStore } from '../stores';
import { SettingsService } from '../services';
import { getRecommendedBrightness } from '../constants';

export const useBrightness = () => {
  const { currentTrack, brightness, setBrightness } = usePlayerStore();

  // Apply auto brightness based on category when track changes
  const applyAutoBrightness = useCallback(async () => {
    try {
      const settings = await SettingsService.loadBrightnessSettings();

      if (settings.autoBrightnessEnabled && currentTrack?.category) {
        // Auto brightness is enabled and track has a category
        const recommendedBrightness = getRecommendedBrightness(currentTrack.category);
        setBrightness(recommendedBrightness);
      } else if (!settings.autoBrightnessEnabled) {
        // Auto brightness is disabled - use default brightness
        setBrightness(settings.defaultBrightness);
      }
      // If auto brightness is enabled but no category, keep current brightness
    } catch (error) {
      console.warn('Failed to apply auto brightness:', error);
    }
  }, [currentTrack, setBrightness]);

  // Apply brightness when track changes
  useEffect(() => {
    if (currentTrack) {
      applyAutoBrightness();
    }
  }, [currentTrack?.id, applyAutoBrightness]);

  // Load initial brightness on mount
  useEffect(() => {
    const loadInitialBrightness = async () => {
      try {
        const settings = await SettingsService.loadBrightnessSettings();
        // If no track is playing, apply default brightness
        if (!currentTrack) {
          setBrightness(settings.defaultBrightness);
        }
      } catch (error) {
        console.warn('Failed to load initial brightness:', error);
      }
    };
    loadInitialBrightness();
  }, []);

  return {
    brightness,
    setBrightness,
    applyAutoBrightness,
    getRecommendedBrightness: (category?: string) => getRecommendedBrightness(category),
  };
};

export default useBrightness;
