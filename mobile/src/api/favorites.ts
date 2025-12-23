/**
 * Favorites API
 * 즐겨찾기 관리
 */

import { get, post, del } from './client';
import {
  FavoritesQueryParams,
  FavoritesResponse,
  AddFavoriteRequest,
  AddFavoriteResponse,
  Favorite,
} from '@/types/api';

/**
 * 즐겨찾기 목록 조회
 *
 * @param userId - 사용자 ID
 * @returns 즐겨찾기 목록 (트랙 정보 포함)
 *
 * @example
 * ```ts
 * const favorites = await getFavorites('user-123');
 * favorites.data.forEach(fav => {
 *   console.log(fav.track.title);
 * });
 * ```
 */
export const getFavorites = async (userId: string): Promise<FavoritesResponse> => {
  return get<FavoritesResponse>('/sync/favorites', { userId });
};

/**
 * 즐겨찾기 목록을 배열로 반환 (편의 함수)
 *
 * @param userId - 사용자 ID
 * @returns 즐겨찾기 배열
 */
export const getFavoritesList = async (userId: string): Promise<Favorite[]> => {
  const response = await getFavorites(userId);
  return response.data;
};

/**
 * 즐겨찾기 추가
 *
 * @param userId - 사용자 ID
 * @param trackId - 트랙 ID
 * @returns 생성된 즐겨찾기 정보
 *
 * @example
 * ```ts
 * const result = await addFavorite('user-123', 'track-456');
 * console.log('Added favorite:', result.data.id);
 * ```
 */
export const addFavorite = async (
  userId: string,
  trackId: string
): Promise<AddFavoriteResponse> => {
  return post<AddFavoriteResponse>('/sync/favorites', { userId, trackId });
};

/**
 * 즐겨찾기 제거
 *
 * @param favoriteId - 즐겨찾기 ID
 * @returns 성공 여부
 *
 * @example
 * ```ts
 * await removeFavorite('favorite-789');
 * ```
 */
export const removeFavorite = async (
  favoriteId: string
): Promise<{ success: true }> => {
  return del<{ success: true }>(`/sync/favorites/${favoriteId}`);
};

/**
 * 트랙 ID로 즐겨찾기 제거 (편의 함수)
 *
 * @param userId - 사용자 ID
 * @param trackId - 트랙 ID
 * @returns 성공 여부
 */
export const removeFavoriteByTrackId = async (
  userId: string,
  trackId: string
): Promise<{ success: true }> => {
  // 먼저 즐겨찾기 목록에서 해당 트랙의 즐겨찾기 ID 찾기
  const favorites = await getFavoritesList(userId);
  const favorite = favorites.find(fav => fav.trackId === trackId);

  if (!favorite) {
    throw new Error('Favorite not found for this track');
  }

  return removeFavorite(favorite.id);
};

/**
 * 트랙이 즐겨찾기인지 확인 (편의 함수)
 *
 * @param userId - 사용자 ID
 * @param trackId - 트랙 ID
 * @returns 즐겨찾기 여부
 */
export const isFavorite = async (
  userId: string,
  trackId: string
): Promise<boolean> => {
  const favorites = await getFavoritesList(userId);
  return favorites.some(fav => fav.trackId === trackId);
};

/**
 * 즐겨찾기 토글 (편의 함수)
 *
 * @param userId - 사용자 ID
 * @param trackId - 트랙 ID
 * @returns 토글 후 즐겨찾기 여부
 */
export const toggleFavorite = async (
  userId: string,
  trackId: string
): Promise<boolean> => {
  const isCurrentlyFavorite = await isFavorite(userId, trackId);

  if (isCurrentlyFavorite) {
    await removeFavoriteByTrackId(userId, trackId);
    return false;
  } else {
    await addFavorite(userId, trackId);
    return true;
  }
};

export default {
  getFavorites,
  getFavoritesList,
  addFavorite,
  removeFavorite,
  removeFavoriteByTrackId,
  isFavorite,
  toggleFavorite,
};
