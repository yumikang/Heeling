import { generateId, getAllRows, getFirstRow, runSql } from '../database';
import { Favorite, Track } from '../types';

// Convert DB row to Favorite object
const rowToFavorite = (row: any): Favorite => ({
  id: row.id,
  userId: row.user_id,
  trackId: row.track_id,
  createdAt: row.created_at,
});

export const FavoritesService = {
  // Add favorite
  async addFavorite(userId: string, trackId: string): Promise<Favorite> {
    const id = generateId();
    const now = new Date().toISOString();

    await runSql(
      `INSERT OR IGNORE INTO favorites (id, user_id, track_id, created_at)
       VALUES (?, ?, ?, ?)`,
      [id, userId, trackId, now]
    );

    return {
      id,
      userId,
      trackId,
      createdAt: now,
    };
  },

  // Remove favorite
  async removeFavorite(userId: string, trackId: string): Promise<void> {
    await runSql(
      'DELETE FROM favorites WHERE user_id = ? AND track_id = ?',
      [userId, trackId]
    );
  },

  // Check if track is favorite
  async isFavorite(userId: string, trackId: string): Promise<boolean> {
    const result = await getFirstRow(
      'SELECT id FROM favorites WHERE user_id = ? AND track_id = ?',
      [userId, trackId]
    );
    return !!result;
  },

  // Get favorite tracks with track data
  async getFavorites(userId: string): Promise<Track[]> {
    const rows = await getAllRows(
      `SELECT t.* FROM tracks t
       INNER JOIN favorites f ON t.id = f.track_id
       WHERE f.user_id = ?
       ORDER BY f.created_at DESC`,
      [userId]
    );

    return rows.map((row: any) => ({
      id: row.id,
      title: row.title,
      artist: row.artist,
      category: row.category,
      duration: row.duration,
      audioFile: row.audio_file,
      backgroundImage: row.background_image,
      recommendedBrightness: row.recommended_brightness,
      isFree: row.is_free === 1,
      sortOrder: row.sort_order,
      createdAt: row.created_at,
      tags: row.tags ? JSON.parse(row.tags) : [],
      playCount: row.play_count || 0,
    }));
  },

  // Get favorite IDs for user
  async getFavoriteIds(userId: string): Promise<string[]> {
    const rows = await getAllRows<{ track_id: string }>(
      'SELECT track_id FROM favorites WHERE user_id = ?',
      [userId]
    );
    return rows.map((row) => row.track_id);
  },

  // Get favorites count
  async getFavoritesCount(userId: string): Promise<number> {
    const result = await getFirstRow<{ count: number }>(
      'SELECT COUNT(*) as count FROM favorites WHERE user_id = ?',
      [userId]
    );
    return result?.count || 0;
  },

  // Clear all favorites for user
  async clearFavorites(userId: string): Promise<void> {
    await runSql('DELETE FROM favorites WHERE user_id = ?', [userId]);
  },
};

export default FavoritesService;
