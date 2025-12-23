import { getDatabase, generateId, getFirstRow, runSql } from './db';

// Seed is no longer needed - we rely on server sync
// Kept for user settings initialization only

// Check if database is completely empty (first install)
export const needsSeeding = async (): Promise<boolean> => {
  try {
    const trackCount = await getFirstRow<{ count: number }>(
      'SELECT COUNT(*) as count FROM tracks'
    );

    // Only return true if database is completely empty
    // Server sync will populate tracks on first launch
    return false;
  } catch {
    return false;
  }
};

// Seed tracks removed - server sync handles all track data
export const seedTracks = async (): Promise<void> => {
  console.log('[Seed] Track seeding disabled - using server sync');
  // Server sync (SyncService) will populate tracks automatically
};

// Update seed version (deprecated but kept for compatibility)
export const updateSeedVersion = async (): Promise<void> => {
  // No longer needed
};

// Run complete seeding process
export const runSeeding = async (): Promise<void> => {
  console.log('[Seed] Seeding disabled - relying on server sync for track data');
};

// Create default user settings
export const createDefaultUserSettings = async (userId: string): Promise<void> => {
  const existing = await getFirstRow<{ user_id: string }>(
    "SELECT user_id FROM user_settings WHERE user_id = ?",
    [userId]
  );

  if (!existing) {
    await runSql(
      `INSERT INTO user_settings (
        user_id, default_brightness, clock_style, clock_persist,
        haptic_enabled, auto_play, cross_fade, default_volume
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, 0.5, 'digital', 0, 1, 1, 0, 0.8]
    );
  }
};

export default {
  needsSeeding,
  seedTracks,
  updateSeedVersion,
  runSeeding,
  createDefaultUserSettings,
};
