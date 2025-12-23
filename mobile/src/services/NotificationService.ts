import { getFirstRow, runSql } from '../database';
import { NotificationSettings } from '../types';
import { FCMService } from './FCMService';

// Keys for app_metadata table
const KEYS = {
  PUSH_ENABLED: 'notification_push_enabled',
  MARKETING_ENABLED: 'notification_marketing_enabled',
  REMINDER_ENABLED: 'notification_reminder_enabled',
  NIGHT_MODE_ENABLED: 'notification_night_mode_enabled',
  NIGHT_MODE_START: 'notification_night_mode_start',
  NIGHT_MODE_END: 'notification_night_mode_end',
};

// Default notification settings
const DEFAULT_SETTINGS: NotificationSettings = {
  pushEnabled: true,
  marketingEnabled: false,
  reminderEnabled: true,
  nightModeEnabled: false,
  nightModeStart: '22:00',
  nightModeEnd: '07:00',
};

export const NotificationService = {
  /**
   * Load all notification settings from SQLite
   */
  async loadSettings(): Promise<NotificationSettings> {
    try {
      const [
        pushEnabled,
        marketingEnabled,
        reminderEnabled,
        nightModeEnabled,
        nightModeStart,
        nightModeEnd,
      ] = await Promise.all([
        this.getMetadata(KEYS.PUSH_ENABLED),
        this.getMetadata(KEYS.MARKETING_ENABLED),
        this.getMetadata(KEYS.REMINDER_ENABLED),
        this.getMetadata(KEYS.NIGHT_MODE_ENABLED),
        this.getMetadata(KEYS.NIGHT_MODE_START),
        this.getMetadata(KEYS.NIGHT_MODE_END),
      ]);

      return {
        pushEnabled: pushEnabled !== null ? pushEnabled === 'true' : DEFAULT_SETTINGS.pushEnabled,
        marketingEnabled: marketingEnabled !== null ? marketingEnabled === 'true' : DEFAULT_SETTINGS.marketingEnabled,
        reminderEnabled: reminderEnabled !== null ? reminderEnabled === 'true' : DEFAULT_SETTINGS.reminderEnabled,
        nightModeEnabled: nightModeEnabled !== null ? nightModeEnabled === 'true' : DEFAULT_SETTINGS.nightModeEnabled,
        nightModeStart: nightModeStart ?? DEFAULT_SETTINGS.nightModeStart,
        nightModeEnd: nightModeEnd ?? DEFAULT_SETTINGS.nightModeEnd,
      };
    } catch (error) {
      console.error('Failed to load notification settings:', error);
      return DEFAULT_SETTINGS;
    }
  },

  /**
   * Save notification settings to SQLite
   */
  async saveSettings(settings: Partial<NotificationSettings>): Promise<void> {
    try {
      const updates: Promise<void>[] = [];

      if (settings.pushEnabled !== undefined) {
        updates.push(this.setMetadata(KEYS.PUSH_ENABLED, String(settings.pushEnabled)));
      }
      if (settings.marketingEnabled !== undefined) {
        updates.push(this.setMetadata(KEYS.MARKETING_ENABLED, String(settings.marketingEnabled)));
        // Sync marketing topic with FCM
        FCMService.toggleMarketingTopic(settings.marketingEnabled).catch(err => {
          console.warn('Failed to toggle FCM marketing topic:', err);
        });
      }
      if (settings.reminderEnabled !== undefined) {
        updates.push(this.setMetadata(KEYS.REMINDER_ENABLED, String(settings.reminderEnabled)));
      }
      if (settings.nightModeEnabled !== undefined) {
        updates.push(this.setMetadata(KEYS.NIGHT_MODE_ENABLED, String(settings.nightModeEnabled)));
      }
      if (settings.nightModeStart !== undefined) {
        updates.push(this.setMetadata(KEYS.NIGHT_MODE_START, settings.nightModeStart));
      }
      if (settings.nightModeEnd !== undefined) {
        updates.push(this.setMetadata(KEYS.NIGHT_MODE_END, settings.nightModeEnd));
      }

      await Promise.all(updates);
    } catch (error) {
      console.error('Failed to save notification settings:', error);
      throw error;
    }
  },

  /**
   * Request push notification permission via FCMService
   */
  async requestPermission(): Promise<boolean> {
    try {
      const result = await FCMService.initialize();
      console.log('Push notification permission:', result ? 'granted' : 'denied');
      return result;
    } catch (error) {
      console.error('Failed to request push notification permission:', error);
      return false;
    }
  },

  /**
   * Register device token for push notifications via FCMService
   */
  async registerDevice(): Promise<string | null> {
    try {
      const token = await FCMService.getToken();
      console.log('Device registered with token:', token?.substring(0, 20) + '...');
      return token;
    } catch (error) {
      console.error('Failed to register device:', error);
      return null;
    }
  },

  /**
   * Get current FCM permission status
   */
  async getPermissionStatus(): Promise<'authorized' | 'denied' | 'not_determined'> {
    return FCMService.getPermissionStatus();
  },

  /**
   * Helper: Get metadata value by key
   */
  async getMetadata(key: string): Promise<string | null> {
    const row = await getFirstRow<{ value: string }>(
      'SELECT value FROM app_metadata WHERE key = ?',
      [key]
    );
    return row?.value ?? null;
  },

  /**
   * Helper: Set metadata value (insert or update)
   */
  async setMetadata(key: string, value: string): Promise<void> {
    await runSql(
      `INSERT INTO app_metadata (key, value, updated_at)
       VALUES (?, ?, datetime('now'))
       ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = datetime('now')`,
      [key, value, value]
    );
  },

  /**
   * Check if current time is within night mode hours
   */
  isNightModeActive(settings: NotificationSettings): boolean {
    if (!settings.nightModeEnabled) return false;

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const [startHour, startMin] = settings.nightModeStart.split(':').map(Number);
    const [endHour, endMin] = settings.nightModeEnd.split(':').map(Number);

    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    // Handle overnight range (e.g., 22:00 - 07:00)
    if (startMinutes > endMinutes) {
      return currentMinutes >= startMinutes || currentMinutes < endMinutes;
    }

    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  },

  /**
   * Reset notification settings to defaults
   */
  async resetSettings(): Promise<void> {
    try {
      await Promise.all([
        runSql('DELETE FROM app_metadata WHERE key = ?', [KEYS.PUSH_ENABLED]),
        runSql('DELETE FROM app_metadata WHERE key = ?', [KEYS.MARKETING_ENABLED]),
        runSql('DELETE FROM app_metadata WHERE key = ?', [KEYS.REMINDER_ENABLED]),
        runSql('DELETE FROM app_metadata WHERE key = ?', [KEYS.NIGHT_MODE_ENABLED]),
        runSql('DELETE FROM app_metadata WHERE key = ?', [KEYS.NIGHT_MODE_START]),
        runSql('DELETE FROM app_metadata WHERE key = ?', [KEYS.NIGHT_MODE_END]),
      ]);
    } catch (error) {
      console.error('Failed to reset notification settings:', error);
      throw error;
    }
  },
};

export default NotificationService;
