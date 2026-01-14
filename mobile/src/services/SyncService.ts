/**
 * SyncService
 * VPS Backend API ↔️ SQLite 동기화 서비스
 *
 * YouTube Music 방식: 메타데이터는 로컬 캐시, 오디오는 스트리밍
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { runSql, getAllRows, getFirstRow, withTransaction, generateId } from '../database';
import { Track } from '../types';
import { NetworkService } from './NetworkService';
import { API_BASE_URL } from '../constants';
import api from '@/api';
import type { Track as ApiTrack } from '@/types/api';

// ============================================================================
// Storage Keys
// ============================================================================

const SYNC_VERSION_KEY = '@heeling_sync_version';
const LAST_SYNC_KEY = '@heeling_last_sync';
const SYNC_IN_PROGRESS_KEY = '@heeling_sync_in_progress';

// ============================================================================
// Interfaces (기존 호환성 유지)
// ============================================================================

interface ServerTrack {
  id: string;
  title: string;
  artist: string | null;
  composer: string | null;
  fileUrl: string;
  thumbnailUrl: string | null;
  duration: number;
  category: string | null;
  tags: string[];
  mood: string | null;
  playCount: number;
  likeCount: number;
  isActive: boolean;
  sortOrder: number | null;
  createdAt: string;
}

interface SyncResponse {
  success: boolean;
  data: ServerTrack[];
  meta: {
    total: number;
    syncVersion: string;
  };
}

interface SyncResult {
  added: number;
  updated: number;
  deleted: number;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * API Track → SQLite Track 변환
 *
 * VPS API 스키마와 SQLite 스키마 매핑:
 * - fileUrl → audio_file (스트리밍 URL)
 * - thumbnailUrl → background_image
 */
const mapApiTrackToDb = (apiTrack: ApiTrack) => {
  // 오디오 URL 변환: 상대 경로 → 절대 경로 (공백/특수문자 인코딩)
  let audioFile = apiTrack.fileUrl || '';
  if (audioFile.startsWith('/')) {
    audioFile = encodeURI(`${API_BASE_URL}${audioFile}`);
  } else if (audioFile) {
    audioFile = encodeURI(audioFile);
  }

  // 이미지 URL 변환: 상대 경로 → 절대 경로 (공백/특수문자 인코딩)
  let backgroundImage = apiTrack.thumbnailUrl || 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=600';
  if (backgroundImage.startsWith('/')) {
    backgroundImage = encodeURI(`${API_BASE_URL}${backgroundImage}`);
  } else if (backgroundImage) {
    backgroundImage = encodeURI(backgroundImage);
  }

  return {
    id: apiTrack.id,
    title: apiTrack.title,
    artist: apiTrack.artist || 'BRIBI',
    category: apiTrack.category || null,
    duration: apiTrack.duration,
    audio_file: audioFile,
    background_image: backgroundImage,
    recommended_brightness: 0.2,
    is_free: 1,
    sort_order: apiTrack.sortOrder || 0,
    tags: JSON.stringify(apiTrack.tags || []),
    play_count: apiTrack.playCount || 0,
    created_at: apiTrack.createdAt,
  };
};

/**
 * 동기화 진행 중 확인
 */
const isSyncInProgress = async (): Promise<boolean> => {
  const value = await AsyncStorage.getItem(SYNC_IN_PROGRESS_KEY);
  return value === 'true';
};

/**
 * 동기화 진행 상태 설정
 */
const setSyncInProgress = async (inProgress: boolean): Promise<void> => {
  await AsyncStorage.setItem(SYNC_IN_PROGRESS_KEY, String(inProgress));
};

// ============================================================================
// Main Sync Service
// ============================================================================

export const SyncService = {
  /**
   * Check if sync is needed
   */
  async needsSync(): Promise<boolean> {
    try {
      const lastSync = await AsyncStorage.getItem(LAST_SYNC_KEY);
      if (!lastSync) return true;

      // Sync if last sync was more than 1 hour ago
      const lastSyncTime = new Date(lastSync).getTime();
      const oneHourAgo = Date.now() - 60 * 60 * 1000;

      return lastSyncTime < oneHourAgo;
    } catch {
      return true;
    }
  },

  /**
   * Fetch tracks from server (새 API 레이어 사용)
   */
  async fetchServerTracks(): Promise<ApiTrack[]> {
    const { allowed } = NetworkService.canStream();
    if (!allowed) {
      console.log('[Sync] Network not available for sync');
      return [];
    }

    try {
      console.log('[Sync] Fetching tracks from VPS API...');

      // 새로운 API 레이어 사용
      let allTracks: ApiTrack[] = [];
      let page = 1;
      let hasMore = true;
      const limit = 100;

      while (hasMore) {
        const response = await api.tracks.getTracks({ page, limit });
        allTracks = [...allTracks, ...response.data];

        console.log(`[Sync] Fetched page ${page}: ${response.data.length} tracks`);

        hasMore = response.meta.hasNext;
        page++;

        // 안전장치: 최대 10페이지 (1000곡)
        if (page > 10) break;
      }

      console.log(`[Sync] Total tracks fetched: ${allTracks.length}`);
      return allTracks;
    } catch (error) {
      console.error('[Sync] Failed to fetch server tracks:', error);
      return [];
    }
  },

  /**
   * Convert server track to local format (기존 호환성 유지)
   */
  serverToLocalTrack(serverTrack: ServerTrack): Partial<Track> {
    // 오디오 URL 변환: 상대 경로 → 절대 경로 (공백/특수문자 인코딩)
    let audioFile = serverTrack.fileUrl || '';
    if (audioFile.startsWith('/')) {
      audioFile = encodeURI(`${API_BASE_URL}${audioFile}`);
    } else if (audioFile) {
      audioFile = encodeURI(audioFile);
    }

    // 이미지 URL 변환: 상대 경로 → 절대 경로 (공백/특수문자 인코딩)
    let backgroundImage = serverTrack.thumbnailUrl || 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=600';
    if (backgroundImage.startsWith('/')) {
      backgroundImage = encodeURI(`${API_BASE_URL}${backgroundImage}`);
    } else if (backgroundImage) {
      backgroundImage = encodeURI(backgroundImage);
    }

    return {
      id: serverTrack.id,
      title: serverTrack.title,
      artist: serverTrack.artist || 'BRIBI',
      category: serverTrack.category || 'healing',
      duration: serverTrack.duration,
      audioFile,
      backgroundImage,
      tags: serverTrack.tags,
      playCount: serverTrack.playCount,
    };
  },

  /**
   * Sync tracks from server to local database (업그레이드 버전)
   */
  async syncTracks(): Promise<SyncResult> {
    const result: SyncResult = { added: 0, updated: 0, deleted: 0 };

    // 중복 동기화 방지
    if (await isSyncInProgress()) {
      console.log('[Sync] Sync already in progress');
      return result;
    }

    try {
      await setSyncInProgress(true);
      console.log('[Sync] Starting sync from VPS...');

      // 새 API 레이어로 트랙 가져오기
      const serverTracks = await this.fetchServerTracks();

      if (serverTracks.length === 0) {
        console.log('[Sync] No tracks to sync or network unavailable');
        await setSyncInProgress(false);
        return result;
      }

      // Get current local tracks
      const localTracks = await getAllRows('SELECT id FROM tracks');
      const localIds = new Set(localTracks.map((t: any) => t.id));
      const serverIds = new Set(serverTracks.map(t => t.id));

      // Find tracks to delete (exist locally but not on server)
      const toDelete = [...localIds].filter(id => !serverIds.has(id));

      console.log(`[Sync] Tracks to delete: ${toDelete.length}`);

      // 트랜잭션으로 일괄 처리
      await withTransaction(async () => {
        // Delete removed tracks
        for (const id of toDelete) {
          await runSql('DELETE FROM tracks WHERE id = ?', [id]);
          result.deleted++;
        }

        // Upsert server tracks
        for (const apiTrack of serverTracks) {
          const dbTrack = mapApiTrackToDb(apiTrack);
          const existing = await getFirstRow('SELECT id FROM tracks WHERE id = ?', [apiTrack.id]);

          if (existing) {
            // Update existing track
            await runSql(
              `UPDATE tracks SET
                title = ?, artist = ?, category = ?, duration = ?,
                audio_file = ?, background_image = ?, tags = ?,
                play_count = ?, sort_order = ?
              WHERE id = ?`,
              [
                dbTrack.title,
                dbTrack.artist,
                dbTrack.category,
                dbTrack.duration,
                dbTrack.audio_file,
                dbTrack.background_image,
                dbTrack.tags,
                dbTrack.play_count,
                dbTrack.sort_order,
                apiTrack.id,
              ]
            );
            result.updated++;
          } else {
            // Insert new track
            await runSql(
              `INSERT INTO tracks (
                id, title, artist, category, duration, audio_file,
                background_image, recommended_brightness, is_free,
                sort_order, tags, play_count, created_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                dbTrack.id,
                dbTrack.title,
                dbTrack.artist,
                dbTrack.category,
                dbTrack.duration,
                dbTrack.audio_file,
                dbTrack.background_image,
                dbTrack.recommended_brightness,
                dbTrack.is_free,
                dbTrack.sort_order,
                dbTrack.tags,
                dbTrack.play_count,
                dbTrack.created_at,
              ]
            );
            result.added++;
          }
        }
      });

      // Update last sync time
      await AsyncStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
      await setSyncInProgress(false);

      console.log(`[Sync] ✅ Completed: ${result.added} added, ${result.updated} updated, ${result.deleted} deleted`);
      return result;
    } catch (error) {
      console.error('[Sync] ❌ Failed:', error);
      await setSyncInProgress(false);
      return result;
    }
  },

  /**
   * 사용자 데이터 동기화 (즐겨찾기, 재생 기록)
   */
  async syncUserData(userId: string): Promise<{ success: boolean }> {
    if (!userId) {
      console.log('[Sync] User ID required for user data sync');
      return { success: false };
    }

    console.log('[Sync] Syncing user data to server...');

    try {
      // 1. 즐겨찾기 동기화
      await this.syncFavoritesToServer(userId);

      // 2. 재생 기록 동기화
      await this.syncHistoryToServer(userId);

      console.log('[Sync] ✅ User data sync completed');
      return { success: true };
    } catch (error) {
      console.error('[Sync] ❌ User data sync failed:', error);
      return { success: false };
    }
  },

  /**
   * 즐겨찾기 동기화 (로컬 → 서버)
   */
  async syncFavoritesToServer(userId: string): Promise<void> {
    try {
      // 로컬의 모든 즐겨찾기 조회
      const localFavorites = await getAllRows<{ id: string; track_id: string }>(
        'SELECT id, track_id FROM favorites WHERE user_id = ?',
        [userId]
      );

      console.log(`[Sync] Found ${localFavorites.length} local favorites`);

      // 서버의 즐겨찾기 조회
      const serverFavorites = await api.favorites.getFavorites(userId);
      const serverTrackIds = new Set(serverFavorites.data.map(f => f.trackId));

      // 서버에 없는 항목만 전송
      for (const localFav of localFavorites) {
        if (!serverTrackIds.has(localFav.track_id)) {
          try {
            await api.favorites.addFavorite(userId, localFav.track_id);
            console.log(`[Sync] Favorite synced: ${localFav.track_id}`);
          } catch (error) {
            console.error(`[Sync] Failed to sync favorite ${localFav.track_id}:`, error);
          }
        }
      }
    } catch (error) {
      console.error('[Sync] Favorites sync failed:', error);
    }
  },

  /**
   * 재생 기록 동기화 (로컬 → 서버)
   */
  async syncHistoryToServer(userId: string): Promise<void> {
    try {
      // 최근 재생 기록 조회 (최근 100개)
      const recentHistory = await getAllRows<{
        track_id: string;
        played_at: string;
        duration_played: number;
      }>(
        `SELECT track_id, played_at, duration_played
         FROM play_history
         WHERE user_id = ?
         ORDER BY played_at DESC
         LIMIT 100`,
        [userId]
      );

      console.log(`[Sync] Found ${recentHistory.length} play history items`);

      // 서버로 배치 전송
      for (const history of recentHistory) {
        try {
          const completionRate = 100; // TODO: 실제 완료율 계산
          await api.history.savePlayHistory({
            userId,
            trackId: history.track_id,
            completionRate,
            listenDuration: history.duration_played,
            deviceType: 'iOS', // TODO: Platform.OS로 동적 설정
            wasAdShown: false,
          });
        } catch (error) {
          // 실패해도 계속 진행 (중복 기록 등)
          console.log(`[Sync] History already synced or failed: ${history.track_id}`);
        }
      }
    } catch (error) {
      console.error('[Sync] History sync failed:', error);
    }
  },

  /**
   * Force full sync (clear and re-sync)
   */
  async forceSync(): Promise<SyncResult> {
    console.log('[Sync] Force sync requested');
    await AsyncStorage.removeItem(LAST_SYNC_KEY);
    await AsyncStorage.removeItem(SYNC_VERSION_KEY);
    await setSyncInProgress(false); // Reset progress flag
    return this.syncTracks();
  },

  /**
   * Get last sync time
   */
  async getLastSyncTime(): Promise<Date | null> {
    const lastSync = await AsyncStorage.getItem(LAST_SYNC_KEY);
    return lastSync ? new Date(lastSync) : null;
  },

  /**
   * 동기화 상태 초기화
   */
  async resetSyncState(): Promise<void> {
    await AsyncStorage.removeItem(LAST_SYNC_KEY);
    await AsyncStorage.removeItem(SYNC_VERSION_KEY);
    await AsyncStorage.removeItem(SYNC_IN_PROGRESS_KEY);
  },
};

export default SyncService;
