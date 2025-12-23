/**
 * API Configuration
 *
 * 개발/프로덕션 환경 모두 VPS 서버 사용
 * 서브도메인: heeling.one-q.xyz (SSL/HTTPS 지원)
 */

// VPS 프로덕션 서버 URL (개발/프로덕션 통합)
export const API_BASE_URL = 'https://heeling.one-q.xyz';

export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: `${API_BASE_URL}/api/auth/login`,
    REGISTER: `${API_BASE_URL}/api/auth/register`,
    LOGOUT: `${API_BASE_URL}/api/auth/logout`,
  },

  // Home
  HOME: {
    SECTIONS: `${API_BASE_URL}/api/home/sections`,
    CATEGORIES: `${API_BASE_URL}/api/home/categories`,
    BANNERS: `${API_BASE_URL}/api/home/banners`,
    TRACKS: `${API_BASE_URL}/api/home/tracks`,
  },

  // Tracks
  TRACKS: {
    ALL: `${API_BASE_URL}/api/tracks`,
    BY_ID: (id: string) => `${API_BASE_URL}/api/tracks/${id}`,
    INCREMENT_PLAY: (id: string) => `${API_BASE_URL}/api/tracks/${id}/play`,
  },

  // User
  USER: {
    PROFILE: `${API_BASE_URL}/api/user/profile`,
    FAVORITES: `${API_BASE_URL}/api/user/favorites`,
    HISTORY: `${API_BASE_URL}/api/user/history`,
  },

  // Popups
  POPUPS: {
    ACTIVE: `${API_BASE_URL}/api/popups/active`,
    DISMISS: (id: string) => `${API_BASE_URL}/api/popups/${id}/dismiss`,
  },
} as const;

export default {
  API_BASE_URL,
  API_ENDPOINTS,
};
