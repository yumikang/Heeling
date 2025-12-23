/**
 * Tracks API
 * 트랙(오디오 콘텐츠) 조회 및 관리
 */

import { get } from './client';
import {
  TracksQueryParams,
  TracksResponse,
  TrackDetailResponse,
  Track,
} from '@/types/api';

/**
 * 트랙 목록 조회 (페이지네이션, 필터링, 검색)
 *
 * @param params - 쿼리 파라미터
 * @param params.page - 페이지 번호 (default: 1)
 * @param params.limit - 페이지 크기 (default: 100)
 * @param params.category - 카테고리 필터 (theme과 동일)
 * @param params.mood - 무드 필터
 * @param params.q - 검색어 (제목, 태그)
 * @returns 트랙 목록 및 페이지네이션 정보
 *
 * @example
 * ```ts
 * // 전체 트랙 조회
 * const allTracks = await getTracks();
 *
 * // 카테고리별 트랙 조회
 * const sleepTracks = await getTracks({ category: 'sleep' });
 *
 * // 검색
 * const searchResults = await getTracks({ q: 'meditation' });
 *
 * // 페이지네이션
 * const page2 = await getTracks({ page: 2, limit: 20 });
 * ```
 */
export const getTracks = async (
  params?: TracksQueryParams
): Promise<TracksResponse> => {
  return get<TracksResponse>('/tracks', params);
};

/**
 * 특정 트랙 상세 조회
 *
 * @param trackId - 트랙 ID
 * @returns 트랙 상세 정보
 *
 * @example
 * ```ts
 * const track = await getTrackById('track-123');
 * console.log(track.data.title);
 * ```
 */
export const getTrackById = async (trackId: string): Promise<TrackDetailResponse> => {
  return get<TrackDetailResponse>(`/tracks/${trackId}`);
};

/**
 * 카테고리별 트랙 조회 (편의 함수)
 *
 * @param category - 카테고리 slug
 * @param limit - 결과 개수 제한
 * @returns 해당 카테고리의 트랙 목록
 */
export const getTracksByCategory = async (
  category: string,
  limit: number = 20
): Promise<Track[]> => {
  const response = await getTracks({ category, limit, page: 1 });
  return response.data;
};

/**
 * 무드별 트랙 조회 (편의 함수)
 *
 * @param mood - 무드
 * @param limit - 결과 개수 제한
 * @returns 해당 무드의 트랙 목록
 */
export const getTracksByMood = async (
  mood: string,
  limit: number = 20
): Promise<Track[]> => {
  const response = await getTracks({ mood, limit, page: 1 });
  return response.data;
};

/**
 * 트랙 검색 (편의 함수)
 *
 * @param query - 검색어
 * @param limit - 결과 개수 제한
 * @returns 검색 결과 트랙 목록
 */
export const searchTracks = async (
  query: string,
  limit: number = 20
): Promise<Track[]> => {
  const response = await getTracks({ q: query, limit, page: 1 });
  return response.data;
};

export default {
  getTracks,
  getTrackById,
  getTracksByCategory,
  getTracksByMood,
  searchTracks,
};
