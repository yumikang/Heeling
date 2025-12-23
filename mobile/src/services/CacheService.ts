/**
 * CacheService - SQLite 기반 캐시 서비스
 *
 * AsyncStorage 대신 SQLite를 사용하여 캐시 데이터 관리
 * - 더 나은 성능 (대용량 데이터)
 * - 만료 시간 자동 관리
 * - 구조화된 쿼리 지원
 */

import { getFirstRow, runSql, getAllRows } from '../database';

// 캐시 키 상수
export const CACHE_KEYS = {
  HOME_SECTIONS: 'home_sections',
  CATEGORIES: 'categories',
  TRACKS: 'tracks',
  BANNERS: 'banners',
  PLAYLISTS: 'playlists',
  SYNC_VERSION: 'sync_version',
  LAST_SYNC: 'last_sync',
} as const;

export type CacheKey = typeof CACHE_KEYS[keyof typeof CACHE_KEYS];

// 기본 캐시 만료 시간 (분 단위)
const DEFAULT_TTL_MINUTES = {
  [CACHE_KEYS.HOME_SECTIONS]: 30,
  [CACHE_KEYS.CATEGORIES]: 60 * 24, // 24시간
  [CACHE_KEYS.TRACKS]: 60, // 1시간
  [CACHE_KEYS.BANNERS]: 30,
  [CACHE_KEYS.PLAYLISTS]: 60,
  [CACHE_KEYS.SYNC_VERSION]: 60 * 24 * 7, // 1주일
  [CACHE_KEYS.LAST_SYNC]: 60 * 24 * 30, // 30일
} as const;

export const CacheService = {
  /**
   * 캐시 데이터 저장
   */
  async set<T>(key: CacheKey, data: T, ttlMinutes?: number): Promise<void> {
    try {
      const ttl = ttlMinutes ?? DEFAULT_TTL_MINUTES[key] ?? 60;
      const expiresAt = new Date(Date.now() + ttl * 60 * 1000).toISOString();
      const jsonData = JSON.stringify(data);

      await runSql(
        `INSERT INTO home_cache (key, data, cached_at, expires_at)
         VALUES (?, ?, datetime('now'), ?)
         ON CONFLICT(key) DO UPDATE SET
           data = ?,
           cached_at = datetime('now'),
           expires_at = ?`,
        [key, jsonData, expiresAt, jsonData, expiresAt]
      );
    } catch (error) {
      console.error(`[Cache] Failed to set ${key}:`, error);
    }
  },

  /**
   * 캐시 데이터 조회
   * 만료된 경우 null 반환
   */
  async get<T>(key: CacheKey): Promise<T | null> {
    try {
      const row = await getFirstRow<{ data: string; expires_at: string }>(
        `SELECT data, expires_at FROM home_cache
         WHERE key = ? AND expires_at > datetime('now')`,
        [key]
      );

      if (!row) return null;

      return JSON.parse(row.data) as T;
    } catch (error) {
      console.error(`[Cache] Failed to get ${key}:`, error);
      return null;
    }
  },

  /**
   * 캐시 데이터 조회 (만료 무시)
   * 오프라인 모드에서 사용
   */
  async getStale<T>(key: CacheKey): Promise<T | null> {
    try {
      const row = await getFirstRow<{ data: string }>(
        'SELECT data FROM home_cache WHERE key = ?',
        [key]
      );

      if (!row) return null;

      return JSON.parse(row.data) as T;
    } catch (error) {
      console.error(`[Cache] Failed to get stale ${key}:`, error);
      return null;
    }
  },

  /**
   * 캐시 데이터 삭제
   */
  async delete(key: CacheKey): Promise<void> {
    try {
      await runSql('DELETE FROM home_cache WHERE key = ?', [key]);
    } catch (error) {
      console.error(`[Cache] Failed to delete ${key}:`, error);
    }
  },

  /**
   * 만료된 캐시 정리
   */
  async clearExpired(): Promise<number> {
    try {
      const result = await runSql(
        "DELETE FROM home_cache WHERE expires_at <= datetime('now')"
      );
      console.log(`[Cache] Cleared ${result.rowsAffected} expired entries`);
      return result.rowsAffected;
    } catch (error) {
      console.error('[Cache] Failed to clear expired:', error);
      return 0;
    }
  },

  /**
   * 전체 캐시 삭제
   */
  async clearAll(): Promise<void> {
    try {
      await runSql('DELETE FROM home_cache');
      console.log('[Cache] All cache cleared');
    } catch (error) {
      console.error('[Cache] Failed to clear all:', error);
    }
  },

  /**
   * 캐시 존재 여부 확인 (만료 포함)
   */
  async has(key: CacheKey): Promise<boolean> {
    try {
      const row = await getFirstRow<{ cnt: number }>(
        `SELECT COUNT(*) as cnt FROM home_cache
         WHERE key = ? AND expires_at > datetime('now')`,
        [key]
      );
      return (row?.cnt ?? 0) > 0;
    } catch (error) {
      return false;
    }
  },

  /**
   * 캐시 상태 조회
   */
  async getStats(): Promise<{
    total: number;
    expired: number;
    valid: number;
  }> {
    try {
      const total = await getFirstRow<{ cnt: number }>(
        'SELECT COUNT(*) as cnt FROM home_cache'
      );
      const expired = await getFirstRow<{ cnt: number }>(
        "SELECT COUNT(*) as cnt FROM home_cache WHERE expires_at <= datetime('now')"
      );

      const totalCount = total?.cnt ?? 0;
      const expiredCount = expired?.cnt ?? 0;

      return {
        total: totalCount,
        expired: expiredCount,
        valid: totalCount - expiredCount,
      };
    } catch (error) {
      console.error('[Cache] Failed to get stats:', error);
      return { total: 0, expired: 0, valid: 0 };
    }
  },
};

export default CacheService;
