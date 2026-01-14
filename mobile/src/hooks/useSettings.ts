import { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NetworkService, NotificationService, SettingsService, ErrorLogger } from '../services';
import { usePlayerStore } from '../stores';
import { NetworkMode, StreamingQuality } from '../types';

const logger = ErrorLogger.forScreen('useSettings');

export type LanguageCode = 'ko' | 'en' | 'ja';

export interface LanguageOption {
  code: LanguageCode;
  flag: string;
  label: string;
  nativeName: string;
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: 'ko', flag: '🇰🇷', label: '언어', nativeName: '한국어' },
  { code: 'en', flag: '🇺🇸', label: 'Language', nativeName: 'English' },
  { code: 'ja', flag: '🇯🇵', label: '言語', nativeName: '日本語' },
];

const LANGUAGE_STORAGE_KEY = '@heeling_language';

export interface SettingsState {
  // Brightness
  defaultBrightness: number;
  autoBrightnessEnabled: boolean;
  // Network
  networkMode: NetworkMode;
  streamingQuality: StreamingQuality;
  allowCellularDownload: boolean;
  // Notifications
  pushEnabled: boolean;
  marketingEnabled: boolean;
  reminderEnabled: boolean;
  nightModeEnabled: boolean;
  // Language
  currentLanguage: LanguageCode;
}

export function useSettings() {
  const { setBrightness } = usePlayerStore();
  const isMountedRef = useRef(true);

  // Brightness settings
  const [defaultBrightness, setDefaultBrightness] = useState(0.5);
  const [autoBrightnessEnabled, setAutoBrightnessEnabled] = useState(true);

  // Network settings
  const [networkMode, setNetworkMode] = useState<NetworkMode>('streaming');
  const [streamingQuality, setStreamingQuality] = useState<StreamingQuality>('auto');
  const [allowCellularDownload, setAllowCellularDownload] = useState(false);

  // Notification settings
  const [pushEnabled, setPushEnabled] = useState(true);
  const [marketingEnabled, setMarketingEnabled] = useState(false);
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [nightModeEnabled, setNightModeEnabled] = useState(false);

  // Language settings
  const [currentLanguage, setCurrentLanguage] = useState<LanguageCode>('ko');

  // Loading state
  const [isLoading, setIsLoading] = useState(true);

  // Mount/unmount tracking
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Load all settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      logger.debug('loadSettings', 'Loading all settings');
      try {
        // Load brightness settings
        const brightnessSettings = await SettingsService.loadBrightnessSettings();
        if (isMountedRef.current) {
          setDefaultBrightness(brightnessSettings.defaultBrightness);
          setAutoBrightnessEnabled(brightnessSettings.autoBrightnessEnabled);
        }

        // Load network settings
        const networkSettings = await NetworkService.loadSettings();
        if (isMountedRef.current) {
          setNetworkMode(networkSettings.networkMode);
          setStreamingQuality(networkSettings.streamingQuality);
          setAllowCellularDownload(networkSettings.allowCellularDownload);
        }

        // Load notification settings
        const notificationSettings = await NotificationService.loadSettings();
        if (isMountedRef.current) {
          setPushEnabled(notificationSettings.pushEnabled);
          setMarketingEnabled(notificationSettings.marketingEnabled);
          setReminderEnabled(notificationSettings.reminderEnabled);
          setNightModeEnabled(notificationSettings.nightModeEnabled);
        }

        // Load language setting
        const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (isMountedRef.current && savedLanguage && ['ko', 'en', 'ja'].includes(savedLanguage)) {
          setCurrentLanguage(savedLanguage as LanguageCode);
        }

        logger.info('loadSettings', 'All settings loaded successfully');
      } catch (error) {
        logger.error('loadSettings', 'Error loading settings', error as Error);
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    };
    loadSettings();
  }, []);

  // Brightness handlers
  const handleDefaultBrightnessChange = useCallback(async (value: number) => {
    setDefaultBrightness(value);
    setBrightness(value);
    await SettingsService.saveBrightnessSettings({ defaultBrightness: value });
  }, [setBrightness]);

  const handleAutoBrightnessChange = useCallback(async (value: boolean) => {
    setAutoBrightnessEnabled(value);
    await SettingsService.saveBrightnessSettings({ autoBrightnessEnabled: value });
  }, []);

  // Network handlers
  const handleNetworkModeChange = useCallback(async (mode: NetworkMode) => {
    setNetworkMode(mode);
    await NetworkService.saveSettings({ networkMode: mode });
  }, []);

  const handleQualityChange = useCallback(async (quality: StreamingQuality) => {
    setStreamingQuality(quality);
    await NetworkService.saveSettings({ streamingQuality: quality });
  }, []);

  const handleCellularDownloadChange = useCallback(async (value: boolean) => {
    setAllowCellularDownload(value);
    await NetworkService.saveSettings({ allowCellularDownload: value });
  }, []);

  // Notification handlers
  const handlePushEnabledChange = useCallback(async (value: boolean) => {
    setPushEnabled(value);
    await NotificationService.saveSettings({ pushEnabled: value });
    if (value) {
      await NotificationService.requestPermission();
    }
  }, []);

  const handleMarketingEnabledChange = useCallback(async (value: boolean) => {
    setMarketingEnabled(value);
    await NotificationService.saveSettings({ marketingEnabled: value });
  }, []);

  const handleReminderEnabledChange = useCallback(async (value: boolean) => {
    setReminderEnabled(value);
    await NotificationService.saveSettings({ reminderEnabled: value });
  }, []);

  const handleNightModeEnabledChange = useCallback(async (value: boolean) => {
    setNightModeEnabled(value);
    await NotificationService.saveSettings({ nightModeEnabled: value });
  }, []);

  // Language handler
  const handleLanguageChange = useCallback(async (langCode: LanguageCode) => {
    setCurrentLanguage(langCode);
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, langCode);
  }, []);

  // Get current language option
  const getCurrentLanguageOption = useCallback(() => {
    return LANGUAGE_OPTIONS.find(lang => lang.code === currentLanguage) || LANGUAGE_OPTIONS[0];
  }, [currentLanguage]);

  return {
    // State
    isLoading,
    // Brightness
    defaultBrightness,
    autoBrightnessEnabled,
    onDefaultBrightnessChange: handleDefaultBrightnessChange,
    onAutoBrightnessChange: handleAutoBrightnessChange,
    // Network
    networkMode,
    streamingQuality,
    allowCellularDownload,
    onNetworkModeChange: handleNetworkModeChange,
    onQualityChange: handleQualityChange,
    onCellularDownloadChange: handleCellularDownloadChange,
    // Notifications
    pushEnabled,
    marketingEnabled,
    reminderEnabled,
    nightModeEnabled,
    onPushEnabledChange: handlePushEnabledChange,
    onMarketingEnabledChange: handleMarketingEnabledChange,
    onReminderEnabledChange: handleReminderEnabledChange,
    onNightModeEnabledChange: handleNightModeEnabledChange,
    // Language
    currentLanguage,
    onLanguageChange: handleLanguageChange,
    getCurrentLanguageOption,
  };
}
