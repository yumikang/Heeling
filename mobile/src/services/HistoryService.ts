import { generateId, getAllRows, runSql } from '../database';
import { PlayHistory, Track } from '../types';

// Convert DB row to PlayHistory object
const rowToHistory = (row: any): PlayHistory => ({
  id: row.id,
  userId: row.user_id,
  trackId: row.track_id,
  playedAt: row.played_at,
  durationPlayed: row.duration_played,
});

export const HistoryService = {
  // Add play history
  async addPlayHistory(
    userId: string,
    trackId: string,
    durationPlayed: number = 0
  ): Promise<PlayHistory> {
    const id = generateId();
    const now = new Date().toISOString();

    await runSql(
      `INSERT INTO play_history (id, user_id, track_id, played_at, duration_played)
       VALUES (?, ?, ?, ?, ?)`,
      [id, userId, trackId, now, durationPlayed]
    );

    return {
      id,
      userId,
      trackId,
      playedAt: now,
      durationPlayed,
    };
  },

  // Get recently played tracks with track data
  async getRecentlyPlayed(userId: string, limit: number = 10): Promise<Track[]> {
    const rows = await getAllRows(
      `SELECT DISTINCT t.* FROM tracks t
       INNER JOIN play_history ph ON t.id = ph.track_id
       WHERE ph.user_id = ?
       ORDER BY ph.played_at DESC
       LIMIT ?`,
      [userId, limit]
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

  // Get play history for user
  async getPlayHistory(userId: string, limit: number = 50): Promise<PlayHistory[]> {
    const rows = await getAllRows(
      `SELECT * FROM play_history
       WHERE user_id = ?
       ORDER BY played_at DESC
       LIMIT ?`,
      [userId, limit]
    );
    return rows.map(rowToHistory);
  },

  // Update duration played
  async updateDurationPlayed(historyId: string, duration: number): Promise<void> {
    await runSql(
      'UPDATE play_history SET duration_played = ? WHERE id = ?',
      [duration, historyId]
    );
  },

  // Clear play history for user
  async clearHistory(userId: string): Promise<void> {
    await runSql('DELETE FROM play_history WHERE user_id = ?', [userId]);
  },
};

export default HistoryService;
