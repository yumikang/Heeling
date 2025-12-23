/**
 * HomeService - 홈 화면 데이터를 백엔드에서 가져오는 서비스
 *
 * SQLite 캐시 사용으로 업그레이드:
 * - 더 나은 성능 (대용량 데이터 처리)
 * - 자동 만료 관리
 * - 오프라인 지원 강화
 */
import { Track } from '../types';
import { API_BASE_URL } from '../constants';
import { CacheService, CACHE_KEYS } from './CacheService';
import { CategoryService } from './CategoryService';

/** 빠른 타임아웃으로 fetch (서버 없으면 빨리 폴백) */
const fetchWithTimeout = async (url: string, timeout = 5000): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    // AbortError는 타임아웃으로 인한 정상 동작이므로 조용히 처리
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('TIMEOUT'); // 조용한 에러로 변환
    }
    throw error;
  }
};

// 백엔드 타입 정의
export interface ServerCategory {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  sortOrder: number;
}

export interface ServerTrack {
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
  sortOrder: number | null;
}

export interface ServerHomeSectionItem {
  id: string;
  itemType: string;
  itemId: string | null;
  sortOrder: number;
  config: any;
  trackData?: ServerTrack | null;
}

export interface ServerHomeSection {
  id: string;
  type: string;
  title: string | null;
  subtitle: string | null;
  sortOrder: number;
  showMoreButton: boolean;
  moreButtonTarget: string | null;
  config: any;
  items: ServerHomeSectionItem[];
}

// URL 변환 유틸리티
const toFullUrl = (path: string | null | undefined): string | undefined => {
  if (!path) return undefined;

  // localhost URL을 맥북 IP로 변환 (iOS 시뮬레이터용)
  if (path.startsWith('http://localhost:3000') || path.startsWith('http://127.0.0.1:3000')) {
    return path.replace(/http:\/\/(localhost|127\.0\.0\.1):3000/, API_BASE_URL);
  }

  // 이미 전체 URL인 경우
  if (path.startsWith('http')) return path;

  // 상대 경로를 절대 경로로 변환
  if (path.startsWith('/')) {
    return `${API_BASE_URL}${path}`;
  }

  return path;
};

// 변환 유틸리티
const serverTrackToLocal = (track: ServerTrack): Track => ({
  id: track.id,
  title: track.title,
  artist: track.artist || track.composer || 'BRIBI',
  category: track.category || 'healing',
  duration: track.duration,
  audioFile: toFullUrl(track.fileUrl) || track.fileUrl,
  backgroundImage: toFullUrl(track.thumbnailUrl) || 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=600',
  recommendedBrightness: 0.3,
  isFree: true,
  sortOrder: track.sortOrder || 0,
  createdAt: new Date().toISOString(),
  tags: track.tags,
  playCount: track.playCount,
});

// 플레이리스트 타입
export interface ServerPlaylist {
  id: string;
  name: string;
  description: string | null;
  coverImage: string | null;
  type: string;
  theme: string | null;
  isPublic: boolean;
  isFeatured: boolean;
  tracks: Array<{
    id: string;
    title: string;
    composer: string | null;
    thumbnailUrl: string | null;
    duration: number;
    fileUrl: string;
    tags: string[];
    mood: string | null;
    position: number;
  }>;
}

// 배너 타입
export interface ServerBanner {
  id: string;
  type: string;
  title: string | null;
  subtitle: string | null;
  imageUrl: string | null;
  linkType: string | null;
  linkTarget: string | null;
  backgroundColor: string | null;
}

export const HomeService = {
  /**
   * 카테고리 목록 조회 (SQLite 캐시 사용)
   */
  async getCategories(): Promise<ServerCategory[]> {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/api/categories`);
      const data = await response.json();

      if (data.success && data.data) {
        // SQLite에 카테고리 동기화
        await CategoryService.syncCategories(data.data);
        // SQLite 캐시에도 저장 (빠른 조회용)
        await CacheService.set(CACHE_KEYS.CATEGORIES, data.data);
        return data.data;
      }
      return [];
    } catch (error) {
      // 서버 타임아웃은 정상 동작 (로컬 캐시로 폴백)
      if (!(error instanceof Error && error.message === 'TIMEOUT')) {
        console.error('Failed to fetch categories:', error);
      }
      // SQLite 캐시에서 로드
      const cached = await CacheService.get<ServerCategory[]>(CACHE_KEYS.CATEGORIES);
      if (cached) return cached;
      // 캐시 만료 시 stale 데이터 사용 (오프라인 지원)
      const stale = await CacheService.getStale<ServerCategory[]>(CACHE_KEYS.CATEGORIES);
      return stale ?? [];
    }
  },

  /**
   * 홈 섹션 조회 (SQLite 캐시 사용)
   */
  async getHomeSections(): Promise<ServerHomeSection[]> {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/api/sync/home`);
      const data = await response.json();

      if (data.success && data.data?.sections) {
        // SQLite 캐시에 저장
        await CacheService.set(CACHE_KEYS.HOME_SECTIONS, data.data.sections);
        return data.data.sections;
      }
      return [];
    } catch (error) {
      // 서버 타임아웃은 정상 동작 (로컬 캐시로 폴백)
      if (!(error instanceof Error && error.message === 'TIMEOUT')) {
        console.error('Failed to fetch home sections:', error);
      }
      // SQLite 캐시에서 로드
      const cached = await CacheService.get<ServerHomeSection[]>(CACHE_KEYS.HOME_SECTIONS);
      if (cached) return cached;
      // 캐시 만료 시 stale 데이터 사용 (오프라인 지원)
      const stale = await CacheService.getStale<ServerHomeSection[]>(CACHE_KEYS.HOME_SECTIONS);
      return stale ?? [];
    }
  },

  /**
   * 트랙 목록 조회 (SQLite 캐시 사용)
   */
  async getTracks(options?: { category?: string; limit?: number }): Promise<Track[]> {
    try {
      const params = new URLSearchParams();
      if (options?.category) params.append('theme', options.category);
      if (options?.limit) params.append('limit', options.limit.toString());

      const response = await fetchWithTimeout(`${API_BASE_URL}/api/tracks?${params}`);
      const data = await response.json();

      if (data.success && data.data) {
        const tracks = data.data.map(serverTrackToLocal);
        // SQLite 캐시에 저장
        await CacheService.set(CACHE_KEYS.TRACKS, tracks);
        return tracks;
      }
      return [];
    } catch (error) {
      // 서버 타임아웃은 정상 동작 (로컬 캐시로 폴백)
      if (!(error instanceof Error && error.message === 'TIMEOUT')) {
        console.error('Failed to fetch tracks:', error);
      }
      // SQLite 캐시에서 로드
      const cached = await CacheService.get<Track[]>(CACHE_KEYS.TRACKS);
      if (cached) return cached;
      // 캐시 만료 시 stale 데이터 사용 (오프라인 지원)
      const stale = await CacheService.getStale<Track[]>(CACHE_KEYS.TRACKS);
      return stale ?? [];
    }
  },

  /**
   * 인기 트랙 조회
   */
  async getPopularTracks(limit: number = 10): Promise<Track[]> {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/api/tracks?limit=${limit}`);
      const data = await response.json();

      if (data.success && data.data) {
        // playCount 기준 정렬
        const sorted = [...data.data].sort((a: any, b: any) => (b.playCount || 0) - (a.playCount || 0));
        return sorted.slice(0, limit).map(serverTrackToLocal);
      }
      return [];
    } catch (error) {
      // 서버 타임아웃은 정상 동작
      if (!(error instanceof Error && error.message === 'TIMEOUT')) {
        console.error('Failed to fetch popular tracks:', error);
      }
      return [];
    }
  },

  /**
   * 카테고리별 트랙 조회
   */
  async getTracksByCategory(category: string): Promise<Track[]> {
    return this.getTracks({ category });
  },

  /**
   * 캐시 클리어 (SQLite 기반)
   */
  async clearCache(): Promise<void> {
    await Promise.all([
      CacheService.delete(CACHE_KEYS.HOME_SECTIONS),
      CacheService.delete(CACHE_KEYS.CATEGORIES),
      CacheService.delete(CACHE_KEYS.TRACKS),
      CacheService.delete(CACHE_KEYS.BANNERS),
    ]);
  },

  /**
   * 히어로 배너 조회 (모든 타입의 배너 포함)
   */
  async getHeroBanners(): Promise<ServerBanner[]> {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/api/banners`);
      const data = await response.json();

      if (data.success && data.data) {
        return data.data;
      }
      return [];
    } catch (error) {
      // 서버 타임아웃은 정상 동작
      if (!(error instanceof Error && error.message === 'TIMEOUT')) {
        console.error('Failed to fetch hero banners:', error);
      }
      return [];
    }
  },

  /**
   * 플레이리스트 상세 조회
   */
  async getPlaylist(playlistId: string): Promise<ServerPlaylist | null> {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/api/playlists/${playlistId}`);
      const data = await response.json();

      if (data.success && data.data) {
        return data.data;
      }
      return null;
    } catch (error) {
      // 서버 타임아웃은 정상 동작
      if (!(error instanceof Error && error.message === 'TIMEOUT')) {
        console.error('Failed to fetch playlist:', error);
      }
      return null;
    }
  },

  /**
   * 플레이리스트 트랙을 로컬 Track 형식으로 변환
   */
  playlistTrackToLocal(track: ServerPlaylist['tracks'][0]): Track {
    return {
      id: track.id,
      title: track.title,
      artist: track.composer || 'BRIBI',
      category: 'healing',
      duration: track.duration,
      audioFile: toFullUrl(track.fileUrl) || track.fileUrl,
      backgroundImage: toFullUrl(track.thumbnailUrl) || 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=600',
      recommendedBrightness: 0.3,
      isFree: true,
      sortOrder: track.position,
      createdAt: new Date().toISOString(),
      tags: track.tags,
    };
  },
};

export default HomeService;
