# Heeling Backend Development Plan

> 작성일: 2025-11-27
> 아키텍처: Offline-First + Sync Pattern (Local SQLite + API + CDN Cache)

---

## 목차
1. [현재 상태 분석](#현재-상태-분석)
2. [개발 우선순위](#개발-우선순위)
3. [Phase 1: 핵심 API 개발](#phase-1-핵심-api-개발)
4. [Phase 2: 어드민 UI 개발](#phase-2-어드민-ui-개발)
5. [Phase 3: 고급 기능](#phase-3-고급-기능)
6. [스키마 정렬 작업](#스키마-정렬-작업)
7. [배포 체크리스트](#배포-체크리스트)

---

## 현재 상태 분석

### Backend (Next.js 16 + Prisma + PostgreSQL)

| 구성요소 | 상태 | 설명 |
|---------|------|------|
| API Routes | 🟡 부분 구현 | tracks, playlists, recommend, push, sync, upload 존재 |
| Database | ✅ 스키마 정의됨 | 10개 모델 (User, Track, Playlist 등) |
| Firebase Admin | ✅ 구현됨 | FCM 푸시 알림 서비스 |
| Admin UI | 🟡 일부만 동작 | 미디어 관리만 실제 동작, 나머지 mock |
| Authentication | ⚪ 미구현 | JWT/세션 기반 인증 필요 |

### Mobile (React Native + SQLite)

| 구성요소 | 상태 | 설명 |
|---------|------|------|
| Local Database | ✅ 동작 중 | SQLite + JSON seed 방식 |
| API Client | ⚪ 미구현 | 모든 서비스가 로컬 DB만 사용 |
| Sync Logic | ⚪ 미구현 | SyncService.ts 기본 구조만 존재 |
| FCM | ✅ 동작 중 | 로컬 FCM + 서버 API fallback |

### 연결 상태

```
┌─────────────┐         ┌─────────────┐
│   Mobile    │ ──❌──  │   Backend   │
│  (SQLite)   │ 연결안됨  │ (PostgreSQL)│
└─────────────┘         └─────────────┘
```

**현재**: Mobile ↔ Backend API 연결 없음, 각각 독립 동작

---

## 개발 우선순위

### 🔴 Priority 1: 핵심 (Must Have)

1. **어드민 인증 시스템**
   - 어드민 로그인/로그아웃
   - 세션 관리 (Next-Auth 또는 커스텀 JWT)

2. **미디어(트랙) 관리 완성**
   - 트랙 CRUD API 완성
   - 파일 업로드 (S3/로컬)
   - 트랙 메타데이터 편집

3. **홈 섹션 관리**
   - 섹션 순서/활성화 관리
   - 섹션별 콘텐츠 할당
   - 실시간 미리보기

4. **Sync API**
   - `GET /api/sync/tracks` - ETag 기반 조건부 응답
   - `GET /api/sync/config` - 앱 설정 동기화
   - Mobile SyncService 연동

### 🟡 Priority 2: 중요 (Should Have)

5. **카테고리/테마 관리**
   - 카테고리 CRUD
   - 아이콘/색상 설정
   - 앱 아이콘 메뉴와 연동

6. **배너 관리 완성**
   - 히어로 배너 관리
   - 프로모션 배너 관리
   - 이미지 업로드 + 딥링크

7. **플레이리스트 관리**
   - 플레이리스트 CRUD
   - 트랙 할당/순서 관리
   - 추천 플레이리스트 설정

8. **푸시 알림 발송 UI**
   - 수동 발송 폼
   - 타겟팅 (전체/개인/비즈니스)
   - 발송 이력 조회

### 🟢 Priority 3: 향후 (Nice to Have)

9. **팝업/공지 관리**
   - 팝업 생성/스케줄링
   - 타겟팅 조건 설정
   - 노출 통계

10. **회원 관리**
    - 회원 목록/검색
    - 회원 상세 정보
    - 구독 상태 확인

11. **통계 대시보드**
    - DAU/MAU 차트
    - 인기 트랙 순위
    - 재생 통계

12. **추천 설정**
    - 추천 알고리즘 파라미터
    - A/B 테스트 설정

---

## Phase 1: 핵심 API 개발

### 1.1 어드민 인증 (1-2일)

```
backend/
├── src/app/api/auth/
│   ├── login/route.ts      # POST - 로그인
│   ├── logout/route.ts     # POST - 로그아웃
│   └── session/route.ts    # GET - 세션 확인
├── src/lib/auth.ts         # 인증 유틸리티
└── src/middleware.ts       # 보호된 라우트 미들웨어
```

**Tasks:**
- [ ] 어드민 계정 모델 추가 (Admin table 또는 User에 role 추가)
- [ ] 비밀번호 해싱 (bcrypt)
- [ ] JWT 토큰 생성/검증
- [ ] 미들웨어로 /admin/* 보호
- [ ] 로그인 페이지 UI

### 1.2 트랙 관리 API 완성 (2-3일)

```
backend/
├── src/app/api/admin/
│   └── tracks/
│       ├── route.ts           # GET (list), POST (create)
│       ├── [id]/route.ts      # GET, PUT, DELETE
│       └── upload/route.ts    # POST (파일 업로드)
```

**Tasks:**
- [ ] 트랙 목록 조회 (페이지네이션, 필터, 검색)
- [ ] 트랙 생성 (메타데이터 + 파일)
- [ ] 트랙 수정
- [ ] 트랙 삭제 (soft delete)
- [ ] 오디오 파일 업로드 (S3 또는 로컬)
- [ ] 썸네일 이미지 업로드

### 1.3 홈 섹션 관리 (2-3일)

```
backend/
├── prisma/schema.prisma    # HomeSection, HomeSectionItem 모델 추가
├── src/app/api/admin/
│   └── home-sections/
│       ├── route.ts        # GET, POST
│       ├── [id]/route.ts   # PUT, DELETE
│       └── reorder/route.ts # PUT (순서 변경)
└── src/app/admin/home/page.tsx  # 관리 UI
```

**Database Schema 추가:**
```prisma
model HomeSection {
  id          String   @id @default(cuid())
  type        String   // hero_banner, track_carousel, icon_menu, etc.
  title       String?
  subtitle    String?
  sortOrder   Int
  isVisible   Boolean  @default(true)
  config      Json     // 섹션별 설정 데이터
  items       HomeSectionItem[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model HomeSectionItem {
  id          String   @id @default(cuid())
  sectionId   String
  section     HomeSection @relation(fields: [sectionId], references: [id])
  itemType    String   // track, banner, menu_item
  itemId      String?  // 참조 ID (trackId, bannerId 등)
  sortOrder   Int
  config      Json?    // 아이템별 추가 설정
  createdAt   DateTime @default(now())
}
```

**Tasks:**
- [ ] HomeSection, HomeSectionItem 모델 추가
- [ ] 섹션 CRUD API
- [ ] 드래그앤드롭 순서 변경
- [ ] 섹션별 콘텐츠 할당 UI
- [ ] 섹션 활성화/비활성화
- [ ] 실시간 미리보기 (모바일 뷰)

### 1.4 Sync API (1-2일)

```
backend/
├── src/app/api/sync/
│   ├── tracks/route.ts     # GET - 트랙 전체 동기화
│   ├── home/route.ts       # GET - 홈 섹션 설정
│   └── config/route.ts     # GET - 앱 설정
```

**Tasks:**
- [ ] tracks.json 생성 API (ETag 헤더 포함)
- [ ] 홈 섹션 설정 API
- [ ] 앱 버전 체크 API
- [ ] CDN 캐시 무효화 트리거

---

## Phase 2: 어드민 UI 개발

### 2.1 어드민 메뉴 구조 업데이트

```typescript
// AdminLayout.tsx 메뉴 업데이트
const MENU_ITEMS = [
  { icon: LayoutDashboard, label: '대시보드', href: '/admin' },
  { icon: Home, label: '홈 관리', href: '/admin/home' },           // 신규
  { icon: Music, label: '미디어 관리', href: '/admin/media' },
  { icon: FolderTree, label: '카테고리', href: '/admin/categories' }, // 신규
  { icon: ListMusic, label: '플레이리스트', href: '/admin/playlists' }, // 신규
  { icon: ImageIcon, label: '배너 관리', href: '/admin/banners' },
  { icon: Bell, label: '푸시 알림', href: '/admin/push' },          // 신규
  { icon: MessageSquare, label: '팝업/공지', href: '/admin/popups' }, // 신규
  { icon: Users, label: '회원 관리', href: '/admin/users' },
  { icon: Settings, label: '설정', href: '/admin/settings' },
];
```

### 2.2 필요한 어드민 페이지

| 페이지 | 경로 | 우선순위 | 설명 |
|--------|------|----------|------|
| 홈 섹션 관리 | /admin/home | 🔴 P1 | 섹션 추가/편집/순서 |
| 카테고리 관리 | /admin/categories | 🟡 P2 | 테마 카테고리 CRUD |
| 플레이리스트 관리 | /admin/playlists | 🟡 P2 | 플레이리스트 + 트랙 할당 |
| 푸시 알림 | /admin/push | 🟡 P2 | 발송 폼 + 이력 |
| 팝업/공지 | /admin/popups | 🟢 P3 | 팝업 생성/스케줄링 |

---

## Phase 3: 고급 기능

### 3.1 통계 대시보드 강화

- 일별/주별/월별 재생 통계
- 인기 트랙 TOP 10
- 사용자 유입 경로
- 구독 현황

### 3.2 추천 시스템

- 추천 알고리즘 설정
- 사용자 세그먼트별 추천
- A/B 테스트 프레임워크

### 3.3 구독/결제 관리

- 구독 플랜 관리
- 결제 이력 조회
- 환불 처리

---

## 스키마 정렬 작업

### Mobile ↔ Backend 스키마 차이점

| 필드 | Mobile (SQLite) | Backend (PostgreSQL) | 조치 |
|------|-----------------|---------------------|------|
| Track.category | ✅ 있음 | ❌ 없음 | Backend에 추가 |
| Track.mood | ✅ 있음 | ❌ 없음 | Backend에 추가 |
| Track.audioUrl | ✅ 있음 | ❌ 없음 | Backend에 추가 |
| Track.imageUrl | ✅ 있음 | ❌ 없음 | Backend에 추가 |

### 필요한 Prisma 마이그레이션

```prisma
// Track 모델 업데이트
model Track {
  id          String   @id @default(cuid())
  title       String
  artist      String?
  duration    Int      // 초 단위
  category    String?  // 추가: healing, focus, sleep 등
  mood        String?  // 추가: calm, energetic, melancholy 등
  audioUrl    String   // 추가: CDN URL
  imageUrl    String?  // 추가: 썸네일 URL
  description String?
  playCount   Int      @default(0)
  isActive    Boolean  @default(true)
  sortOrder   Int?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  playlistTracks PlaylistTrack[]
  playHistory    PlayHistory[]
  favorites      Favorite[]
}
```

---

## 배포 체크리스트

### 개발 환경

- [ ] .env.local 설정 (DATABASE_URL, FIREBASE_*, etc.)
- [ ] Prisma 마이그레이션 실행
- [ ] 시드 데이터 생성
- [ ] 로컬 테스트

### 스테이징 환경

- [ ] VPS 서버 설정
- [ ] PostgreSQL 설치/설정
- [ ] Node.js 환경 구성
- [ ] PM2 또는 Docker 설정
- [ ] Nginx 리버스 프록시
- [ ] SSL 인증서 (Let's Encrypt)

### 프로덕션 환경

- [ ] 환경변수 보안 설정
- [ ] 데이터베이스 백업 자동화
- [ ] 모니터링 설정 (로그, 에러 추적)
- [ ] CDN 설정 (Cloudflare 또는 AWS CloudFront)
- [ ] Firebase Admin 서비스 계정 설정

---

## 예상 일정

| Phase | 작업 | 예상 기간 |
|-------|------|----------|
| Phase 1.1 | 어드민 인증 | 1-2일 |
| Phase 1.2 | 트랙 관리 API | 2-3일 |
| Phase 1.3 | 홈 섹션 관리 | 2-3일 |
| Phase 1.4 | Sync API | 1-2일 |
| Phase 2 | 어드민 UI | 3-5일 |
| Phase 3 | 고급 기능 | 추후 |

**총 예상**: Phase 1-2 완료까지 약 2주

---

## 참고 자료

### 관련 파일 경로

```
Backend:
├── prisma/schema.prisma          # DB 스키마
├── src/app/api/                  # API 라우트
├── src/app/admin/                # 어드민 페이지
├── src/components/AdminLayout.tsx # 어드민 레이아웃
└── src/lib/firebase-admin.ts     # FCM 서비스

Mobile:
├── src/types/home.ts             # 홈 섹션 타입 정의
├── src/config/homeConfig.ts      # 현재 홈 섹션 설정
├── src/services/SyncService.ts   # 동기화 서비스
└── src/database/                 # SQLite 스키마
```

### 앱 홈 섹션 타입 (참고용)

```typescript
type HomeSectionType =
  | 'hero_banner'      // 탑 히어로 배너
  | 'track_carousel'   // 썸네일 음악 캐러셀
  | 'icon_menu'        // 아이콘 메뉴 (테마 카테고리)
  | 'banner'           // 중간 배너
  | 'track_list'       // 트랙 리스트
  | 'featured_track'   // 피처드 트랙
  | 'recently_played'  // 최근 재생
  | 'spacer';          // 여백
```
