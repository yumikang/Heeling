/**
 * API Type Definitions
 * Based on VPS PostgreSQL Database Schema and Backend API Spec
 *
 * @see /claudedocs/mobile-api-spec.md
 */

// ============================================================================
// Enum Types
// ============================================================================

/** 사용자 타입 */
export type UserType = 'PERSONAL' | 'BUSINESS' | 'GUEST';

/** 구독 등급 */
export type SubscriptionTier = 'FREE' | 'PREMIUM' | 'BUSINESS';

/** 시간대 */
export type TimeSlot = 'MORNING' | 'AFTERNOON' | 'EVENING' | 'NIGHT';

/** 플레이리스트 타입 */
export type PlaylistType = 'MANUAL' | 'AUTO_GENERATED' | 'BUSINESS_TEMPLATE' | 'THEME';

/** 홈 섹션 타입 */
export type HomeSectionType =
  | 'HERO_BANNER'
  | 'TRACK_CAROUSEL'
  | 'ICON_MENU'
  | 'BANNER'
  | 'TRACK_LIST'
  | 'FEATURED_TRACK'
  | 'RECENTLY_PLAYED'
  | 'SPACER';

/** 배너 타입 */
export type BannerType = 'HERO' | 'PROMOTION' | 'EVENT' | 'NOTICE';

/** 팝업 타입 */
export type PopupType = 'POPUP' | 'FULLSCREEN' | 'BOTTOM_SHEET' | 'NOTICE' | 'EVENT';

/** 페이지 타입 */
export type PageType = 'NOTICE' | 'EVENT' | 'POLICY' | 'FAQ' | 'GUIDE';

/** 페이지 상태 */
export type PageStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

// ============================================================================
// Core Model Types
// ============================================================================

/** 트랙 (오디오 콘텐츠) */
export interface Track {
  id: string;
  title: string;
  artist: string | null;         // default: "Heeling"
  composer: string | null;        // default: "Heeling Studio"
  createdWith: string | null;     // default: "Suno AI"
  fileUrl: string;                // 오디오 파일 URL
  thumbnailUrl: string | null;    // 썸네일 이미지 URL
  duration: number;               // 초 단위
  fileSize: number | null;        // 바이트
  bpm: number | null;             // BPM
  category: string | null;        // 카테고리
  tags: string[];                 // 태그 배열
  mood: string | null;            // 무드
  playCount: number;
  likeCount: number;
  sortOrder: number | null;
  createdAt: string;              // ISO 8601
  updatedAt: string;              // ISO 8601
}

/** 카테고리 */
export interface Category {
  id: string;
  slug: string;                   // URL-friendly 식별자
  name: string;                   // 표시 이름
  description: string | null;
  icon: string;                   // 아이콘 이름/URL
  color: string;                  // 색상 코드
  sortOrder: number;
}

/** 사용자 */
export interface User {
  id: string;
  email: string | null;
  userType: UserType;
  subscriptionTier: SubscriptionTier;
  appleId: string | null;
  googleId: string | null;
  displayName: string | null;
  createdAt: string;              // ISO 8601
  updatedAt: string;              // ISO 8601
}

/** 관리자 (로그인용) */
export interface Admin {
  id: string;
  email: string;
  name: string | null;
  role: 'SUPER_ADMIN' | 'ADMIN';
}

/** 플레이리스트 요약 (목록용) */
export interface PlaylistSummary {
  id: string;
  name: string;
  description: string | null;
  coverImage: string | null;
  theme: string | null;
  type: PlaylistType;
  playCount: number;
  _count: {
    tracks: number;              // 플레이리스트 내 트랙 수
  };
}

/** 플레이리스트 상세 (트랙 목록 포함) */
export interface PlaylistDetail {
  id: string;
  name: string;
  description: string | null;
  coverImage: string | null;
  theme: string | null;
  type: PlaylistType;
  playCount: number;
  tracks: PlaylistTrackWithDetails[];
}

/** 플레이리스트 내 트랙 정보 */
export interface PlaylistTrackWithDetails {
  id: string;
  position: number;
  addedAt: string;                // ISO 8601
  track: Track;                   // 전체 트랙 정보
}

/** 배너 */
export interface Banner {
  id: string;
  type: BannerType;
  title: string;
  subtitle: string | null;
  imageUrl: string;
  linkType: string | null;        // 'internal' | 'external'
  linkTarget: string | null;      // 링크 URL
  backgroundColor: string | null;
  sortOrder: number;
  startDate: string | null;       // ISO 8601
  endDate: string | null;         // ISO 8601
}

/** 팝업 */
export interface Popup {
  id: string;
  type: PopupType;
  title: string;
  content: string | null;
  imageUrl: string | null;
  linkType: string | null;
  linkTarget: string | null;
  targetUserType: UserType | null;
  priority: number;
  showOnce: boolean;              // true면 한 번만 표시
  startDate: string | null;       // ISO 8601
  endDate: string | null;         // ISO 8601
}

/** 페이지/공지사항 */
export interface Page {
  id: string;
  slug: string;
  title: string;
  content: string;                // Markdown/HTML
  type: PageType;
  status: PageStatus;
  publishedAt: string | null;     // ISO 8601
  createdAt: string;              // ISO 8601
  updatedAt: string;              // ISO 8601
}

/** 즐겨찾기 */
export interface Favorite {
  id: string;
  trackId: string;
  createdAt: string;              // ISO 8601
  track: Track;                   // 전체 트랙 정보
}

/** VPS 스케줄 */
export interface VpsSchedule {
  id: string;
  userId: string;
  categoryId: string;
  scheduledTime: string;          // ISO 8601
  isGenerated: boolean;
  lastGeneratedAt: string | null;
  createdAt: string;
  updatedAt: string;
  category: Category;
}

// ============================================================================
// Home Section Types
// ============================================================================

/** 홈 섹션 아이템 */
export interface HomeSectionItem {
  id: string;
  itemType: string;               // 'track', 'banner', etc.
  itemId: string | null;
  sortOrder: number;
  config: any;                    // JSON configuration
  trackData?: Track | null;       // type이 'track'인 경우
}

/** 홈 섹션 */
export interface HomeSection {
  id: string;
  type: HomeSectionType;
  title: string | null;
  subtitle: string | null;
  sortOrder: number;
  showMoreButton: boolean;
  moreButtonTarget: string | null;
  config: any;                    // JSON configuration
  items: HomeSectionItem[];
}

// ============================================================================
// API Request/Response Types
// ============================================================================

/** 공통 성공 응답 */
export interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
}

/** 공통 에러 응답 */
export interface ApiErrorResponse {
  success: false;
  error: string;
}

/** API 응답 타입 */
export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

/** 페이지네이션 메타 정보 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
}

/** 페이지네이션 응답 */
export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  meta: PaginationMeta;
  stats?: {
    totalFiles: number;
    totalSize: number;
    totalDownloads: number;
  };
}

/** 동기화 메타 정보 */
export interface SyncMeta {
  syncedAt: string;               // ISO 8601
  etag: string;
}

/** 동기화 응답 */
export interface SyncResponse<T> {
  success: true;
  data: T;
  meta: SyncMeta;
}

// ============================================================================
// Authentication
// ============================================================================

/** 로그인 요청 */
export interface LoginRequest {
  email: string;
  password: string;
}

/** 로그인 응답 */
export interface LoginResponse {
  success: true;
  admin: Admin;
}

// ============================================================================
// Tracks
// ============================================================================

/** 트랙 목록 쿼리 파라미터 */
export interface TracksQueryParams {
  page?: number;                  // default: 1
  limit?: number;                 // default: 100
  theme?: string;                 // 카테고리 필터
  category?: string;              // theme과 동일
  mood?: string;                  // 무드 필터
  q?: string;                     // 검색어 (제목, 태그)
}

/** 트랙 목록 응답 */
export type TracksResponse = PaginatedResponse<Track>;

/** 트랙 상세 응답 */
export interface TrackDetailResponse {
  success: true;
  data: Track;
}

// ============================================================================
// Categories
// ============================================================================

/** 카테고리 목록 응답 */
export interface CategoriesResponse {
  success: true;
  data: Category[];
}

// ============================================================================
// Playlists
// ============================================================================

/** 플레이리스트 목록 쿼리 파라미터 */
export interface PlaylistsQueryParams {
  theme?: string;                 // 테마 필터
  type?: PlaylistType;            // 플레이리스트 타입
  featured?: 'true' | 'false';    // 추천 플레이리스트만
}

/** 플레이리스트 목록 응답 */
export interface PlaylistsResponse {
  success: true;
  data: PlaylistSummary[];
}

/** 플레이리스트 상세 응답 */
export interface PlaylistDetailResponse {
  success: true;
  data: PlaylistDetail;
}

// ============================================================================
// Banners
// ============================================================================

/** 배너 목록 응답 */
export interface BannersResponse {
  success: true;
  data: Banner[];
}

// ============================================================================
// Pages
// ============================================================================

/** 페이지 목록 쿼리 파라미터 */
export interface PagesQueryParams {
  type?: PageType;
}

/** 페이지 목록 응답 */
export interface PagesResponse {
  success: true;
  data: Page[];
}

// ============================================================================
// Popups
// ============================================================================

/** 팝업 목록 응답 */
export interface PopupsResponse {
  success: true;
  data: Popup[];
}

// ============================================================================
// User Data
// ============================================================================

/** 재생 기록 저장 요청 */
export interface SaveHistoryRequest {
  userId: string;
  trackId: string;
  completionRate: number;         // 0-100
  listenDuration: number;         // 초 단위
  deviceType: string;             // 'iOS' | 'Android'
  wasAdShown: boolean;
}

/** 재생 기록 저장 응답 */
export interface SaveHistoryResponse {
  success: true;
  data: {
    id: string;
    playedAt: string;             // ISO 8601
  };
}

/** 즐겨찾기 목록 쿼리 파라미터 */
export interface FavoritesQueryParams {
  userId: string;
}

/** 즐겨찾기 목록 응답 */
export interface FavoritesResponse {
  success: true;
  data: Favorite[];
}

/** 즐겨찾기 추가 요청 */
export interface AddFavoriteRequest {
  userId: string;
  trackId: string;
}

/** 즐겨찾기 추가 응답 */
export interface AddFavoriteResponse {
  success: true;
  data: {
    id: string;
    trackId: string;
    createdAt: string;
  };
}

// ============================================================================
// App Config
// ============================================================================

/** 앱 설정 */
export interface AppConfig {
  premium: {
    enabled: boolean;
    monthlyPrice: number;
    yearlyPrice: number;
    features: string[];
  };
  ads: {
    enabled: boolean;
    providers: ('ADMOB' | 'META')[];
  };
  // ... 기타 설정
}

/** 앱 설정 응답 */
export interface AppConfigResponse {
  success: true;
  data: AppConfig;
}

// ============================================================================
// Recommendations
// ============================================================================

/** 추천 쿼리 파라미터 */
export interface RecommendQueryParams {
  userId?: string;
  category?: string;
  limit?: number;                 // default: 20
}

/** 추천 응답 */
export interface RecommendResponse {
  success: true;
  data: {
    recommended: Track[];
    reason: string;               // 추천 이유
  };
}

// ============================================================================
// Home (Sync)
// ============================================================================

/** 홈 섹션 응답 */
export interface HomeSectionsResponse {
  success: true;
  data: {
    sections: HomeSection[];
    totalCount: number;
  };
  meta: SyncMeta;
}

// ============================================================================
// VPS Schedules
// ============================================================================

/** VPS 스케줄 쿼리 파라미터 */
export interface VpsSchedulesQueryParams {
  userId: string;
}

/** VPS 스케줄 응답 */
export interface VpsSchedulesResponse {
  success: true;
  data: VpsSchedule[];
}
