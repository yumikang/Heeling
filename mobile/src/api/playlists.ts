/**
 * Playlists API
 * 플레이리스트 조회
 */

import { get } from './client';
import {
  PlaylistsQueryParams,
  PlaylistsResponse,
  PlaylistDetailResponse,
  PlaylistSummary,
  PlaylistDetail,
} from '@/types/api';

/**
 * 플레이리스트 목록 조회
 *
 * @param params - 쿼리 파라미터
 * @param params.theme - 테마 필터
 * @param params.type - 플레이리스트 타입 필터
 * @param params.featured - 추천 플레이리스트만 조회
 * @returns 플레이리스트 목록
 *
 * @example
 * ```ts
 * // 전체 플레이리스트
 * const all = await getPlaylists();
 *
 * // 테마별 필터링
 * const sleepPlaylists = await getPlaylists({ theme: 'sleep' });
 *
 * // 추천 플레이리스트만
 * const featured = await getPlaylists({ featured: 'true' });
 * ```
 */
export const getPlaylists = async (
  params?: PlaylistsQueryParams
): Promise<PlaylistsResponse> => {
  return get<PlaylistsResponse>('/playlists', params);
};

/**
 * 플레이리스트 상세 조회 (트랙 목록 포함)
 *
 * @param playlistId - 플레이리스트 ID
 * @returns 플레이리스트 상세 정보 및 트랙 목록
 *
 * @example
 * ```ts
 * const playlist = await getPlaylistById('playlist-123');
 * console.log(playlist.data.name);
 * console.log(playlist.data.tracks.length); // 트랙 개수
 * ```
 */
export const getPlaylistById = async (
  playlistId: string
): Promise<PlaylistDetailResponse> => {
  return get<PlaylistDetailResponse>(`/playlists/${playlistId}`);
};

/**
 * 플레이리스트 목록을 배열로 반환 (편의 함수)
 *
 * @param params - 쿼리 파라미터
 * @returns 플레이리스트 배열
 */
export const getPlaylistsList = async (
  params?: PlaylistsQueryParams
): Promise<PlaylistSummary[]> => {
  const response = await getPlaylists(params);
  return response.data;
};

/**
 * 추천 플레이리스트 조회 (편의 함수)
 *
 * @returns 추천 플레이리스트 배열
 */
export const getFeaturedPlaylists = async (): Promise<PlaylistSummary[]> => {
  return getPlaylistsList({ featured: 'true' });
};

/**
 * 테마별 플레이리스트 조회 (편의 함수)
 *
 * @param theme - 테마
 * @returns 해당 테마의 플레이리스트 배열
 */
export const getPlaylistsByTheme = async (theme: string): Promise<PlaylistSummary[]> => {
  return getPlaylistsList({ theme });
};

export default {
  getPlaylists,
  getPlaylistById,
  getPlaylistsList,
  getFeaturedPlaylists,
  getPlaylistsByTheme,
};
