import NetInfo, { NetInfoState, NetInfoStateType } from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NetworkMode, StreamingQuality, NetworkStatus, NetworkSettings } from '../types';

// Storage keys
const NETWORK_SETTINGS_KEY = '@heeling_network_settings';

// Default network settings
const defaultNetworkSettings: NetworkSettings = {
  networkMode: 'streaming', // Default: allow all streaming
  streamingQuality: 'auto',
  allowCellularDownload: false,
};

/**
 * NetworkService - Manages network state and playback permissions
 *
 * Network Modes:
 * - wifi_only: Only stream/download on WiFi
 * - streaming: Stream on any connection (WiFi + Cellular)
 * - offline: Only play downloaded/cached content
 *
 * Streaming Quality:
 * - auto: Adjust based on connection (high on WiFi, low on cellular)
 * - high: Always high quality (more data usage)
 * - low: Always low quality (save data)
 */
export const NetworkService = {
  // Current network state cache
  _currentNetworkStatus: 'none' as NetworkStatus,
  _settings: { ...defaultNetworkSettings },
  _listeners: new Set<(status: NetworkStatus) => void>(),
  _unsubscribe: null as (() => void) | null,

  /**
   * Initialize network service
   * Load saved settings and start network monitoring
   */
  async initialize(): Promise<void> {
    // Load saved settings
    await this.loadSettings();

    // Get initial network state
    const state = await NetInfo.fetch();
    this._currentNetworkStatus = this._mapNetInfoToStatus(state);

    // Subscribe to network changes
    this._unsubscribe = NetInfo.addEventListener((state) => {
      const newStatus = this._mapNetInfoToStatus(state);
      if (newStatus !== this._currentNetworkStatus) {
        this._currentNetworkStatus = newStatus;
        this._notifyListeners(newStatus);
      }
    });
  },

  /**
   * Cleanup network service (unsubscribe from listeners)
   */
  cleanup(): void {
    if (this._unsubscribe) {
      this._unsubscribe();
      this._unsubscribe = null;
    }
    this._listeners.clear();
  },

  /**
   * Map NetInfo state to our simplified NetworkStatus
   */
  _mapNetInfoToStatus(state: NetInfoState): NetworkStatus {
    if (!state.isConnected) {
      return 'none';
    }
    if (state.type === NetInfoStateType.wifi || state.type === NetInfoStateType.ethernet) {
      return 'wifi';
    }
    if (state.type === NetInfoStateType.cellular) {
      return 'cellular';
    }
    return 'none';
  },

  /**
   * Load settings from AsyncStorage
   */
  async loadSettings(): Promise<NetworkSettings> {
    try {
      const stored = await AsyncStorage.getItem(NETWORK_SETTINGS_KEY);
      if (stored) {
        this._settings = { ...defaultNetworkSettings, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Error loading network settings:', error);
    }
    return this._settings;
  },

  /**
   * Save settings to AsyncStorage
   */
  async saveSettings(settings: Partial<NetworkSettings>): Promise<void> {
    try {
      this._settings = { ...this._settings, ...settings };
      await AsyncStorage.setItem(NETWORK_SETTINGS_KEY, JSON.stringify(this._settings));
    } catch (error) {
      console.error('Error saving network settings:', error);
    }
  },

  /**
   * Get current settings
   */
  getSettings(): NetworkSettings {
    return { ...this._settings };
  },

  /**
   * Get current network status
   */
  getNetworkStatus(): NetworkStatus {
    return this._currentNetworkStatus;
  },

  /**
   * Check if streaming is allowed based on current network and settings
   * Core algorithm for network mode decision
   */
  canStream(): { allowed: boolean; reason: string } {
    const { networkMode } = this._settings;
    const status = this._currentNetworkStatus;

    // Offline mode - never stream
    if (networkMode === 'offline') {
      return {
        allowed: false,
        reason: 'offline_mode',
      };
    }

    // No network connection
    if (status === 'none') {
      return {
        allowed: false,
        reason: 'no_connection',
      };
    }

    // WiFi only mode
    if (networkMode === 'wifi_only') {
      if (status === 'wifi') {
        return { allowed: true, reason: 'wifi_connected' };
      }
      return {
        allowed: false,
        reason: 'cellular_not_allowed',
      };
    }

    // Streaming mode (allow all)
    return { allowed: true, reason: 'streaming_allowed' };
  },

  /**
   * Check if download is allowed based on current network and settings
   */
  canDownload(): { allowed: boolean; reason: string } {
    const { networkMode, allowCellularDownload } = this._settings;
    const status = this._currentNetworkStatus;

    // Offline mode or no connection
    if (networkMode === 'offline' || status === 'none') {
      return {
        allowed: false,
        reason: networkMode === 'offline' ? 'offline_mode' : 'no_connection',
      };
    }

    // WiFi - always allow download
    if (status === 'wifi') {
      return { allowed: true, reason: 'wifi_connected' };
    }

    // Cellular - check settings
    if (status === 'cellular') {
      if (allowCellularDownload) {
        return { allowed: true, reason: 'cellular_download_allowed' };
      }
      return {
        allowed: false,
        reason: 'cellular_download_not_allowed',
      };
    }

    return { allowed: false, reason: 'unknown' };
  },

  /**
   * Get recommended streaming quality based on network and settings
   */
  getRecommendedQuality(): 'high' | 'low' {
    const { streamingQuality } = this._settings;
    const status = this._currentNetworkStatus;

    // If user explicitly set quality, use it
    if (streamingQuality === 'high') return 'high';
    if (streamingQuality === 'low') return 'low';

    // Auto mode: WiFi = high, Cellular = low
    return status === 'wifi' ? 'high' : 'low';
  },

  /**
   * Get audio URL based on quality settings
   * Future: Return different quality URLs from CDN
   */
  getAudioUrl(baseUrl: string, _quality?: 'high' | 'low'): string {
    // For Phase 1, just return the base URL
    // Phase 2: Return quality-specific CDN URLs
    // e.g., baseUrl.replace('.mp3', `_${quality}.mp3`)
    return baseUrl;
  },

  /**
   * Subscribe to network status changes
   */
  addNetworkListener(callback: (status: NetworkStatus) => void): () => void {
    this._listeners.add(callback);
    return () => {
      this._listeners.delete(callback);
    };
  },

  /**
   * Notify all listeners of network change
   */
  _notifyListeners(status: NetworkStatus): void {
    this._listeners.forEach((callback) => {
      try {
        callback(status);
      } catch (error) {
        console.error('Error in network listener:', error);
      }
    });
  },

  /**
   * Get user-friendly message for network state
   */
  getStatusMessage(): string {
    const { networkMode } = this._settings;
    const status = this._currentNetworkStatus;

    if (networkMode === 'offline') {
      return '오프라인 모드';
    }

    switch (status) {
      case 'wifi':
        return 'WiFi 연결됨';
      case 'cellular':
        return networkMode === 'wifi_only'
          ? '셀룰러 연결 (WiFi 전용 모드)'
          : '셀룰러 연결됨';
      case 'none':
        return '네트워크 없음';
      default:
        return '';
    }
  },

  /**
   * Get user-friendly error message for playback restriction
   */
  getRestrictionMessage(reason: string): string {
    switch (reason) {
      case 'offline_mode':
        return '오프라인 모드입니다. 다운로드된 트랙만 재생할 수 있습니다.';
      case 'no_connection':
        return '네트워크 연결이 없습니다.';
      case 'cellular_not_allowed':
        return 'WiFi 전용 모드입니다. WiFi에 연결하거나 설정을 변경해주세요.';
      case 'cellular_download_not_allowed':
        return '셀룰러 데이터로는 다운로드할 수 없습니다. WiFi에 연결해주세요.';
      default:
        return '재생할 수 없습니다.';
    }
  },
};

export default NetworkService;
