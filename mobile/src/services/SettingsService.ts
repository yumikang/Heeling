import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirstRow, runSql } from '../database';
import { UserSettings } from '../types';

// AsyncStorage keys for brightness settings
const BRIGHTNESS_SETTINGS_KEY = '@heeling_brightness_settings';

// Brightness settings interface
export interface BrightnessSettings {
  defaultBrightness: number;
  autoBrightnessEnabled: boolean;
}

// Default brightness settings
const defaultBrightnessSettings: BrightnessSettings = {
  defaultBrightness: 0.5,
  autoBrightnessEnabled: true,
};

// Convert DB row to UserSettings object
const rowToSettings = (row: any): UserSettings => ({
  userId: row.user_id,
  defaultBrightness: row.default_brightness,
  clockStyle: row.clock_style,
  clockPersist: row.clock_persist === 1,
  hapticEnabled: row.haptic_enabled === 1,
  autoPlay: row.auto_play === 1,
  crossFade: row.cross_fade === 1,
  defaultVolume: row.default_volume,
  defaultSleepTimer: row.default_sleep_timer,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

// Default settings
const defaultSettings: Omit<UserSettings, 'userId' | 'createdAt' | 'updatedAt'> = {
  defaultBrightness: 0.5,
  clockStyle: 'digital',
  clockPersist: false,
  hapticEnabled: true,
  autoPlay: true,
  crossFade: false,
  defaultVolume: 0.8,
  defaultSleepTimer: null,
};

export const SettingsService = {
  // Get settings for user
  async getSettings(userId: string): Promise<UserSettings> {
    const row = await getFirstRow(
      'SELECT * FROM user_settings WHERE user_id = ?',
      [userId]
    );

    if (row) {
      return rowToSettings(row);
    }

    // Create default settings if not exist
    const now = new Date().toISOString();
    await runSql(
      `INSERT INTO user_settings (
        user_id, default_brightness, clock_style, clock_persist,
        haptic_enabled, auto_play, cross_fade, default_volume,
        default_sleep_timer, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        defaultSettings.defaultBrightness,
        defaultSettings.clockStyle,
        defaultSettings.clockPersist ? 1 : 0,
        defaultSettings.hapticEnabled ? 1 : 0,
        defaultSettings.autoPlay ? 1 : 0,
        defaultSettings.crossFade ? 1 : 0,
        defaultSettings.defaultVolume,
        defaultSettings.defaultSleepTimer,
        now,
        now,
      ]
    );

    return {
      userId,
      ...defaultSettings,
      createdAt: now,
      updatedAt: now,
    };
  },

  // Update settings
  async updateSettings(
    userId: string,
    updates: Partial<Omit<UserSettings, 'userId' | 'createdAt' | 'updatedAt'>>
  ): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.defaultBrightness !== undefined) {
      fields.push('default_brightness = ?');
      values.push(updates.defaultBrightness);
    }
    if (updates.clockStyle !== undefined) {
      fields.push('clock_style = ?');
      values.push(updates.clockStyle);
    }
    if (updates.clockPersist !== undefined) {
      fields.push('clock_persist = ?');
      values.push(updates.clockPersist ? 1 : 0);
    }
    if (updates.hapticEnabled !== undefined) {
      fields.push('haptic_enabled = ?');
      values.push(updates.hapticEnabled ? 1 : 0);
    }
    if (updates.autoPlay !== undefined) {
      fields.push('auto_play = ?');
      values.push(updates.autoPlay ? 1 : 0);
    }
    if (updates.crossFade !== undefined) {
      fields.push('cross_fade = ?');
      values.push(updates.crossFade ? 1 : 0);
    }
    if (updates.defaultVolume !== undefined) {
      fields.push('default_volume = ?');
      values.push(updates.defaultVolume);
    }
    if (updates.defaultSleepTimer !== undefined) {
      fields.push('default_sleep_timer = ?');
      values.push(updates.defaultSleepTimer);
    }

    if (fields.length === 0) return;

    fields.push("updated_at = datetime('now')");
    values.push(userId);

    await runSql(
      `UPDATE user_settings SET ${fields.join(', ')} WHERE user_id = ?`,
      values
    );
  },

  // Reset settings to default
  async resetSettings(userId: string): Promise<void> {
    await runSql(
      `UPDATE user_settings SET
        default_brightness = ?,
        clock_style = ?,
        clock_persist = ?,
        haptic_enabled = ?,
        auto_play = ?,
        cross_fade = ?,
        default_volume = ?,
        default_sleep_timer = ?,
        updated_at = datetime('now')
       WHERE user_id = ?`,
      [
        defaultSettings.defaultBrightness,
        defaultSettings.clockStyle,
        defaultSettings.clockPersist ? 1 : 0,
        defaultSettings.hapticEnabled ? 1 : 0,
        defaultSettings.autoPlay ? 1 : 0,
        defaultSettings.crossFade ? 1 : 0,
        defaultSettings.defaultVolume,
        defaultSettings.defaultSleepTimer,
        userId,
      ]
    );
  },

  // Load brightness settings from AsyncStorage
  async loadBrightnessSettings(): Promise<BrightnessSettings> {
    try {
      const stored = await AsyncStorage.getItem(BRIGHTNESS_SETTINGS_KEY);
      if (stored) {
        return { ...defaultBrightnessSettings, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.warn('Failed to load brightness settings:', error);
    }
    return defaultBrightnessSettings;
  },

  // Save brightness settings to AsyncStorage
  async saveBrightnessSettings(updates: Partial<BrightnessSettings>): Promise<void> {
    try {
      const current = await this.loadBrightnessSettings();
      const updated = { ...current, ...updates };
      await AsyncStorage.setItem(BRIGHTNESS_SETTINGS_KEY, JSON.stringify(updated));
    } catch (error) {
      console.warn('Failed to save brightness settings:', error);
    }
  },
};

export default SettingsService;
