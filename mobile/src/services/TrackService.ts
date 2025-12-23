import { getAllRows, getFirstRow, runSql } from '../database';
import { Track } from '../types';

// Convert DB row to Track object
const rowToTrack = (row: any): Track => ({
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
});

export const TrackService = {
  // Get all tracks
  async getAllTracks(): Promise<Track[]> {
    const rows = await getAllRows(
      'SELECT * FROM tracks ORDER BY sort_order ASC'
    );
    return rows.map(rowToTrack);
  },

  // Get track by ID
  async getTrackById(id: string): Promise<Track | null> {
    const row = await getFirstRow(
      'SELECT * FROM tracks WHERE id = ?',
      [id]
    );
    return row ? rowToTrack(row) : null;
  },

  // Get tracks by category
  async getTracksByCategory(category: string): Promise<Track[]> {
    const rows = await getAllRows(
      'SELECT * FROM tracks WHERE category = ? ORDER BY sort_order ASC',
      [category]
    );
    return rows.map(rowToTrack);
  },

  // Get featured tracks (first 5 tracks)
  async getFeaturedTracks(): Promise<Track[]> {
    const rows = await getAllRows(
      'SELECT * FROM tracks ORDER BY sort_order ASC LIMIT 5'
    );
    return rows.map(rowToTrack);
  },

  // Get popular tracks (by play count)
  async getPopularTracks(limit: number = 10): Promise<Track[]> {
    const rows = await getAllRows(
      'SELECT * FROM tracks ORDER BY play_count DESC LIMIT ?',
      [limit]
    );
    return rows.map(rowToTrack);
  },

  // Get free tracks
  async getFreeTracks(): Promise<Track[]> {
    const rows = await getAllRows(
      'SELECT * FROM tracks WHERE is_free = 1 ORDER BY sort_order ASC'
    );
    return rows.map(rowToTrack);
  },

  // Search tracks
  async searchTracks(query: string): Promise<Track[]> {
    const searchTerm = `%${query}%`;
    const rows = await getAllRows(
      `SELECT * FROM tracks
       WHERE title LIKE ? OR artist LIKE ? OR tags LIKE ?
       ORDER BY sort_order ASC`,
      [searchTerm, searchTerm, searchTerm]
    );
    return rows.map(rowToTrack);
  },

  // Increment play count
  async incrementPlayCount(trackId: string): Promise<void> {
    await runSql(
      'UPDATE tracks SET play_count = play_count + 1 WHERE id = ?',
      [trackId]
    );
  },

  // Get tracks by IDs
  async getTracksByIds(ids: string[]): Promise<Track[]> {
    if (ids.length === 0) return [];

    const placeholders = ids.map(() => '?').join(',');
    const rows = await getAllRows(
      `SELECT * FROM tracks WHERE id IN (${placeholders})`,
      ids
    );

    // 원래 ID 순서 유지
    const trackMap = new Map(rows.map((row: any) => [row.id, rowToTrack(row)]));
    return ids.map(id => trackMap.get(id)).filter((t): t is Track => t !== undefined);
  },
};

export default TrackService;
