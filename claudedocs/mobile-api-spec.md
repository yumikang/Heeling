# Heeling Mobile App - API 스펙 문서

**Base URL**: `http://localhost:3000/api` (개발)
**Base URL**: `https://yourdomain.com/api` (프로덕션)

**참고**: 이 문서는 VPS PostgreSQL 데이터베이스 스키마를 기반으로 작성되었습니다.

---

## 🔐 인증 (Authentication)

### POST /api/auth/login
관리자 로그인 (Admin용)

**Request:**
```typescript
{
  email: string;
  password: string;
}
```

**Response (200):**
```typescript
{
  success: true;
  admin: {
    id: string;
    email: string;
    name: string | null;
    role: 'SUPER_ADMIN' | 'ADMIN';
  }
}
```

**Response (401):**
```typescript
{
  error: '이메일 또는 비밀번호가 올바르지 않습니다.'
}
```

**참고**: JWT 토큰은 쿠키로 설정됨

---

## 🏠 홈 화면 (Home)

### GET /api/sync/home
홈 섹션 설정 조회 (ETag 캐싱 지원)

**Headers:**
- `If-None-Match`: `"etag-value"` (선택, 캐싱용)

**Response (200):**
```typescript
{
  success: true;
  data: {
    sections: HomeSectionWithItems[];
    totalCount: number;
  };
  meta: {
    syncedAt: string; // ISO 8601
    etag: string;
  }
}
```

**Response (304):** Not Modified (캐시 유효)

**HomeSection 타입:**
```typescript
interface HomeSection {
  id: string;
  type: 'HERO_BANNER' | 'TRACK_CAROUSEL' | 'ICON_MENU' | 'BANNER' |
        'TRACK_LIST' | 'FEATURED_TRACK' | 'RECENTLY_PLAYED' | 'SPACER';
  title: string | null;
  subtitle: string | null;
  sortOrder: number;
  showMoreButton: boolean;
  moreButtonTarget: string | null;
  config: any;
  items: HomeSectionItem[];
}

interface HomeSectionItem {
  id: string;
  itemType: string; // 'track', 'banner', etc.
  itemId: string | null;
  sortOrder: number;
  config: any;
  trackData?: Track | null; // type이 'track'인 경우
}
```

---

## 🎵 트랙 (Tracks)

### GET /api/tracks
트랙 목록 조회 (페이지네이션)

**Query Parameters:**
- `page`: number (default: 1)
- `limit`: number (default: 100)
- `theme`: string (optional) - 카테고리 필터
- `category`: string (optional) - theme과 동일
- `mood`: string (optional) - 무드 필터
- `q`: string (optional) - 검색어 (제목, 태그)

**Response (200):**
```typescript
{
  success: true;
  data: Track[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
  };
  stats: {
    totalFiles: number;
    totalSize: number;
    totalDownloads: number;
  }
}
```

**Track 타입:**
```typescript
interface Track {
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
```

**참고**:
- `fileUrl`과 `thumbnailUrl`에서 localhost URL은 자동으로 상대 경로로 변환됨
- 정렬: sortOrder → playCount → createdAt (최신순)

### GET /api/tracks/:id
특정 트랙 상세 조회

**Response (200):**
```typescript
{
  success: true;
  data: Track;
}
```

**Response (404):**
```typescript
{
  success: false;
  error: 'Track not found'
}
```

---

## 📂 카테고리 (Categories)

### GET /api/categories
활성화된 카테고리 목록 조회

**Response (200):**
```typescript
{
  success: true;
  data: Category[];
}
```

**Category 타입:**
```typescript
interface Category {
  id: string;
  slug: string;          // URL-friendly 식별자
  name: string;          // 표시 이름
  description: string | null;
  icon: string;          // 아이콘 이름/URL
  color: string;         // 색상 코드
  sortOrder: number;
}
```

---

## 📝 플레이리스트 (Playlists)

### GET /api/playlists
플레이리스트 목록 조회

**Query Parameters:**
- `theme`: string (optional) - 테마 필터
- `type`: 'MANUAL' | 'AUTO_GENERATED' | 'BUSINESS_TEMPLATE' | 'THEME' (optional)
- `featured`: 'true' | 'false' (optional) - 추천 플레이리스트만

**Response (200):**
```typescript
{
  success: true;
  data: PlaylistSummary[];
}
```

**PlaylistSummary 타입:**
```typescript
interface PlaylistSummary {
  id: string;
  name: string;
  description: string | null;
  coverImage: string | null;
  theme: string | null;
  type: 'MANUAL' | 'AUTO_GENERATED' | 'BUSINESS_TEMPLATE' | 'THEME';
  playCount: number;
  _count: {
    tracks: number;  // 플레이리스트 내 트랙 수
  }
}
```

### GET /api/playlists/:id
특정 플레이리스트 상세 조회 (트랙 목록 포함)

**Response (200):**
```typescript
{
  success: true;
  data: {
    id: string;
    name: string;
    description: string | null;
    coverImage: string | null;
    theme: string | null;
    type: PlaylistType;
    playCount: number;
    tracks: PlaylistTrackWithDetails[];
  }
}
```

**PlaylistTrackWithDetails 타입:**
```typescript
interface PlaylistTrackWithDetails {
  id: string;
  position: number;
  addedAt: string;  // ISO 8601
  track: Track;     // 전체 트랙 정보
}
```

---

## 🎨 배너 (Banners)

### GET /api/banners
활성화된 배너 목록 조회

**Response (200):**
```typescript
{
  success: true;
  data: Banner[];
}
```

**Banner 타입:**
```typescript
interface Banner {
  id: string;
  type: 'HERO' | 'PROMOTION' | 'EVENT' | 'NOTICE';
  title: string;
  subtitle: string | null;
  imageUrl: string;
  linkType: string | null;      // 'internal' | 'external'
  linkTarget: string | null;    // 링크 URL
  backgroundColor: string | null;
  sortOrder: number;
  startDate: string | null;     // ISO 8601
  endDate: string | null;       // ISO 8601
}
```

---

## 📄 페이지/공지사항 (Pages)

### GET /api/pages
공개된 페이지 목록 조회

**Query Parameters:**
- `type`: 'NOTICE' | 'EVENT' | 'POLICY' | 'FAQ' | 'GUIDE' (optional)

**Response (200):**
```typescript
{
  success: true;
  data: Page[];
}
```

**Page 타입:**
```typescript
interface Page {
  id: string;
  slug: string;
  title: string;
  content: string;            // Markdown/HTML
  type: 'NOTICE' | 'EVENT' | 'POLICY' | 'FAQ' | 'GUIDE';
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  publishedAt: string | null; // ISO 8601
  createdAt: string;          // ISO 8601
  updatedAt: string;          // ISO 8601
}
```

---

## 🔔 팝업 (Popups)

### GET /api/popups
활성화된 팝업 목록 조회

**Response (200):**
```typescript
{
  success: true;
  data: Popup[];
}
```

**Popup 타입:**
```typescript
interface Popup {
  id: string;
  type: 'POPUP' | 'FULLSCREEN' | 'BOTTOM_SHEET' | 'NOTICE' | 'EVENT';
  title: string;
  content: string | null;
  imageUrl: string | null;
  linkType: string | null;
  linkTarget: string | null;
  targetUserType: 'PERSONAL' | 'BUSINESS' | 'GUEST' | null;
  priority: number;
  showOnce: boolean;          // true면 한 번만 표시
  startDate: string | null;   // ISO 8601
  endDate: string | null;     // ISO 8601
}
```

---

## 📊 사용자 데이터 (User Data)

### POST /api/sync/history
재생 기록 저장

**Request:**
```typescript
{
  userId: string;
  trackId: string;
  completionRate: number;     // 0-100
  listenDuration: number;     // 초 단위
  deviceType: string;         // 'iOS' | 'Android'
  wasAdShown: boolean;
}
```

**Response (201):**
```typescript
{
  success: true;
  data: {
    id: string;
    playedAt: string;  // ISO 8601
  }
}
```

### GET /api/sync/favorites
즐겨찾기 목록 조회

**Query Parameters:**
- `userId`: string (required)

**Response (200):**
```typescript
{
  success: true;
  data: Favorite[];
}
```

**Favorite 타입:**
```typescript
interface Favorite {
  id: string;
  trackId: string;
  createdAt: string;  // ISO 8601
  track: Track;       // 전체 트랙 정보
}
```

### POST /api/sync/favorites
즐겨찾기 추가

**Request:**
```typescript
{
  userId: string;
  trackId: string;
}
```

**Response (201):**
```typescript
{
  success: true;
  data: {
    id: string;
    trackId: string;
    createdAt: string;
  }
}
```

### DELETE /api/sync/favorites/:id
즐겨찾기 제거

**Response (200):**
```typescript
{
  success: true;
}
```

---

## 🔧 설정/Config (App Config)

### GET /api/sync/config
앱 설정 동기화

**Response (200):**
```typescript
{
  success: true;
  data: {
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
}
```

---

## 📱 추천 (Recommendations)

### GET /api/recommend
개인화된 트랙 추천

**Query Parameters:**
- `userId`: string (optional)
- `category`: string (optional)
- `limit`: number (default: 20)

**Response (200):**
```typescript
{
  success: true;
  data: {
    recommended: Track[];
    reason: string;  // 추천 이유
  }
}
```

---

## 🌍 VPS 스케줄 (VPS Schedule)

### GET /api/sync/schedules
사용자의 VPS 자동 스케줄 조회

**Query Parameters:**
- `userId`: string (required)

**Response (200):**
```typescript
{
  success: true;
  data: VpsSchedule[];
}
```

**VpsSchedule 타입:**
```typescript
interface VpsSchedule {
  id: string;
  userId: string;
  categoryId: string;
  scheduledTime: string;      // ISO 8601
  isGenerated: boolean;
  lastGeneratedAt: string | null;
  createdAt: string;
  updatedAt: string;
  category: Category;
}
```

---

## ⚠️ 에러 응답 형식

모든 에러는 다음 형식으로 반환됩니다:

```typescript
{
  success: false;
  error: string;  // 사용자에게 표시할 에러 메시지
}
```

**HTTP 상태 코드:**
- `400`: 잘못된 요청 (Bad Request)
- `401`: 인증 실패 (Unauthorized)
- `403`: 권한 없음 (Forbidden)
- `404`: 리소스 없음 (Not Found)
- `500`: 서버 오류 (Internal Server Error)

---

## 🔄 캐싱 전략

### ETag 지원 API
다음 API들은 ETag 캐싱을 지원합니다:
- `GET /api/sync/home`
- `GET /api/sync/tracks`
- `GET /api/sync/config`

**사용 방법:**
1. 첫 요청에서 응답 헤더의 `ETag` 값을 저장
2. 다음 요청 시 `If-None-Match` 헤더에 저장된 ETag 값 전송
3. `304 Not Modified` 응답 시 로컬 캐시 사용

---

## 📝 데이터 타입 정의 요약

### Enum 타입들

```typescript
// 사용자 타입
type UserType = 'PERSONAL' | 'BUSINESS' | 'GUEST';

// 구독 등급
type SubscriptionTier = 'FREE' | 'PREMIUM' | 'BUSINESS';

// 시간대
type TimeSlot = 'MORNING' | 'AFTERNOON' | 'EVENING' | 'NIGHT';

// 플레이리스트 타입
type PlaylistType = 'MANUAL' | 'AUTO_GENERATED' | 'BUSINESS_TEMPLATE' | 'THEME';

// 홈 섹션 타입
type HomeSectionType =
  | 'HERO_BANNER'
  | 'TRACK_CAROUSEL'
  | 'ICON_MENU'
  | 'BANNER'
  | 'TRACK_LIST'
  | 'FEATURED_TRACK'
  | 'RECENTLY_PLAYED'
  | 'SPACER';

// 배너 타입
type BannerType = 'HERO' | 'PROMOTION' | 'EVENT' | 'NOTICE';

// 팝업 타입
type PopupType = 'POPUP' | 'FULLSCREEN' | 'BOTTOM_SHEET' | 'NOTICE' | 'EVENT';

// 페이지 타입
type PageType = 'NOTICE' | 'EVENT' | 'POLICY' | 'FAQ' | 'GUIDE';
```

---

## 🚀 다음 단계

1. **TypeScript 타입 정의 파일 생성**: `mobile/src/types/api.ts`
2. **API Client 레이어 구축**: `mobile/src/api/client.ts`
3. **도메인별 API 모듈 작성**: `mobile/src/api/auth.ts`, `tracks.ts`, etc.

---

**문서 버전**: 1.0.0
**최종 업데이트**: 2025-12-08
**Based on**: VPS PostgreSQL Database Schema
