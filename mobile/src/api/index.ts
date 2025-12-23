/**
 * API Module Index
 * VPS Backend API 통합 접근 포인트
 *
 * @example
 * ```ts
 * import api from '@/api';
 *
 * // 트랙 조회
 * const tracks = await api.tracks.getTracks({ category: 'sleep' });
 *
 * // 즐겨찾기 추가
 * await api.favorites.addFavorite('user-123', 'track-456');
 *
 * // 홈 섹션 조회
 * const home = await api.home.getHomeSections();
 * ```
 */

// Domain API modules
export { default as auth } from './auth';
export { default as tracks } from './tracks';
export { default as categories } from './categories';
export { default as playlists } from './playlists';
export { default as home } from './home';
export { default as favorites } from './favorites';
export { default as history } from './history';

// Client utilities
export {
  setAuthToken,
  getAuthToken,
  clearAuthToken,
  isApiError,
  isApiSuccess,
} from './client';

// Export all from individual modules for direct import
export * from './auth';
export * from './tracks';
export * from './categories';
export * from './playlists';
export * from './home';
export * from './favorites';
export * from './history';

// Default export: API object
import auth from './auth';
import tracks from './tracks';
import categories from './categories';
import playlists from './playlists';
import home from './home';
import favorites from './favorites';
import history from './history';

export default {
  auth,
  tracks,
  categories,
  playlists,
  home,
  favorites,
  history,
};
