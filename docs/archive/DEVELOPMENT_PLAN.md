# Heeling 앱 개발 마스터 플랜

**버전**: 1.0
**작성일**: 2025-11-25
**목표**: MVP 6-8주 내 완성
**타겟**: DAU 500명, MRR $500

---

## 📊 Executive Summary

### 실현 가능성: ✅ 확정
- 8주 타임라인 달성 가능 (적절한 팀 구성 시)
- Critical Path: 30일 (백엔드 코어 → 스트리밍 → 광고 → 테스트 → 출시)

### 핵심 아키텍처 결정
| 결정 사항 | 선택 | 근거 |
|-----------|------|------|
| 앱 프레임워크 | React Native | iOS/Android 동시 지원, 개발 속도 |
| 로컬 DB | SQLite (expo-sqlite) | 오프라인 우선, 즉시 렌더링 |
| 오디오 플레이어 | react-native-track-player | 백그라운드 재생, 잠금화면 컨트롤 |
| 파일 스토리지 | Cloudflare R2 | 무료 Egress, S3 호환 |
| 결제 | Stripe | 글로벌 지원, 구독 관리 |
| 광고 | AdMob + Meta | 듀얼 네트워크로 eCPM 최적화 |

### 리스크 매트릭스
| 리스크 | 확률 | 영향 | 완화 전략 |
|--------|------|------|-----------|
| iOS 백그라운드 오디오 제한 | 70% | 높음 | Week 1 스파이크 테스트 필수 |
| 광고 수익 목표 미달 | 60% | 중간 | 듀얼 네트워크 + 프리미엄 전환 강화 |
| 대용량 파일 스트리밍 실패 | 40% | 높음 | CDN 활용, 청크 다운로드 |
| 앱스토어 거부 | 40% | 높음 | 가이드라인 사전 검토, 콘텐츠 정책 명확화 |

---

## 🏗️ Phase 0: 개발 환경 및 인프라 구축 (Week 0)

### 0.1 개발 환경 설정
```
Priority: P0 (Critical)
Duration: 2일
Dependencies: 없음
```

#### Tasks
- [ ] **0.1.1** Node.js 20 LTS 설치 확인
- [ ] **0.1.2** pnpm 또는 yarn berry 설정 (모노레포 준비)
- [ ] **0.1.3** ESLint + Prettier 통합 설정
- [ ] **0.1.4** Husky + lint-staged 설정 (pre-commit hooks)
- [ ] **0.1.5** GitHub 리포지토리 설정
  - Branch protection rules
  - PR template
  - Issue templates

#### 기술 스펙
```bash
# 권장 버전
node: 20.x LTS
pnpm: 8.x
typescript: 5.x
```

---

### 0.2 인프라 구축
```
Priority: P0 (Critical)
Duration: 2일
Dependencies: 0.1 완료
```

#### Tasks
- [ ] **0.2.1** VPS 서버 초기 설정 (141.164.60.51)
  ```bash
  # SSH 키 설정
  # 방화벽 설정 (ufw)
  # fail2ban 설치
  ```
- [ ] **0.2.2** PostgreSQL 설치 및 설정
  ```sql
  -- 데이터베이스 생성
  CREATE DATABASE heeling_prod;
  CREATE DATABASE heeling_dev;

  -- 사용자 생성
  CREATE USER heeling_admin WITH ENCRYPTED PASSWORD '***';
  GRANT ALL PRIVILEGES ON DATABASE heeling_prod TO heeling_admin;
  ```
- [ ] **0.2.3** Redis 설치 및 설정
  ```bash
  # 캐싱 + 세션 + 광고 빈도 제어용
  maxmemory 1gb
  maxmemory-policy allkeys-lru
  ```
- [ ] **0.2.4** Cloudflare R2 버킷 생성
  - `heeling-music` (음원 파일)
  - `heeling-thumbnails` (썸네일)
  - `heeling-data` (JSON/XML 동기화 파일)
- [ ] **0.2.5** Nginx 리버스 프록시 설정
- [ ] **0.2.6** SSL 인증서 설정 (Let's Encrypt)
- [ ] **0.2.7** PM2 프로세스 관리자 설정

#### 인프라 아키텍처
```
[Client Apps]
     ↓
[Cloudflare CDN]
     ↓
[Nginx - one-q.xyz]
     ↓
[Next.js API - PM2]
     ↓
┌────┴────┐
↓         ↓
[PostgreSQL] [Redis]
     ↓
[Cloudflare R2]
```

---

### 0.3 외부 서비스 계정 설정
```
Priority: P0 (Critical)
Duration: 1일
Dependencies: 없음 (병렬 진행 가능)
```

#### Tasks
- [ ] **0.3.1** Google AdMob 계정 생성 (승인 2-3일 소요)
  - App ID 발급
  - 광고 단위 생성 (배너, 전면, 보상형)
- [ ] **0.3.2** Meta Audience Network 계정 생성
- [ ] **0.3.3** Stripe 계정 활성화
  - 개인 프리미엄 상품 생성 ($4.99/월)
  - 비즈니스 플랜 상품 생성 ($19.99/월)
  - Webhook 엔드포인트 설정
- [ ] **0.3.4** Firebase 프로젝트 생성
  - iOS/Android 앱 등록
  - Authentication 활성화 (Google)
- [ ] **0.3.5** 카카오 개발자 앱 등록
- [ ] **0.3.6** 네이버 개발자 앱 등록
- [ ] **0.3.7** Apple Developer 계정 확인 (iOS 배포용)
- [ ] **0.3.8** Google Play Console 앱 등록

---

### 0.4 스파이크 테스트 (리스크 검증)
```
Priority: P0 (Critical)
Duration: 2일
Dependencies: 0.2 완료
```

#### Tasks
- [ ] **0.4.1** 대용량 파일 업로드 테스트
  ```typescript
  // 150MB 파일 Multipart 업로드 테스트
  // Presigned URL 생성 및 검증
  // 청크 사이즈: 5MB
  // 재시도 로직 검증
  ```
- [ ] **0.4.2** react-native-track-player 백그라운드 테스트
  ```typescript
  // iOS 시뮬레이터에서 테스트
  // 실제 디바이스에서 테스트
  // 잠금화면 컨트롤 확인
  // 15분+ 백그라운드 유지 확인
  ```
- [ ] **0.4.3** SQLite 대용량 데이터 성능 테스트
  ```typescript
  // 10,000 트랙 데이터 삽입
  // 쿼리 성능 측정 (<50ms 목표)
  // WAL 모드 활성화 확인
  ```

---

## 🔧 Phase 1: 백엔드 Core API 완성 (Week 1-2)

### 1.1 동기화 API 구현
```
Priority: P0 (Critical)
Duration: 3일
Dependencies: Phase 0 완료
```

#### Tasks
- [ ] **1.1.1** version.json 엔드포인트 구현
  ```typescript
  // GET /api/sync/version
  interface VersionResponse {
    version: string;           // "2024.11.25.001"
    tracks_version: string;
    playlists_version: string;
    banners_version: string;
    settings_version: string;
    last_updated: string;      // ISO 8601
  }
  ```
- [ ] **1.1.2** 전체 데이터 동기화 엔드포인트
  ```typescript
  // GET /api/sync/full
  interface SyncResponse {
    tracks: Track[];
    playlists: Playlist[];
    banners: Banner[];
    pages: Page[];
    settings: AppSettings;
    tombstones: {
      tracks: string[];      // deleted IDs
      playlists: string[];
    };
  }
  ```
- [ ] **1.1.3** 델타 동기화 엔드포인트
  ```typescript
  // GET /api/sync/delta?since=2024-11-20T00:00:00Z
  interface DeltaSyncResponse {
    updated: {
      tracks: Track[];
      playlists: Playlist[];
    };
    deleted: {
      tracks: string[];
      playlists: string[];
    };
  }
  ```
- [ ] **1.1.4** Tombstone 관리 시스템 구현
  ```prisma
  model Tombstone {
    id          String   @id @default(cuid())
    entityType  String   // "track" | "playlist"
    entityId    String
    deletedAt   DateTime @default(now())

    @@index([entityType, deletedAt])
  }
  ```

#### API 스펙
```yaml
# version.json 구조
version: "2024.11.25.001"
tracks:
  count: 150
  hash: "abc123"
  updated_at: "2024-11-25T10:00:00Z"
playlists:
  count: 20
  hash: "def456"
  updated_at: "2024-11-25T09:00:00Z"
```

---

### 1.2 파일 업로드 시스템 고도화
```
Priority: P0 (Critical)
Duration: 2일
Dependencies: 1.1 완료
```

#### Tasks
- [ ] **1.2.1** Presigned URL 생성 API
  ```typescript
  // POST /api/upload/presign
  interface PresignRequest {
    filename: string;
    contentType: string;
    fileSize: number;
  }

  interface PresignResponse {
    uploadId?: string;        // Multipart용
    presignedUrl: string;     // 단일 업로드용
    partUrls?: string[];      // Multipart용
    key: string;
    expiresAt: string;
  }
  ```
- [ ] **1.2.2** Multipart 업로드 초기화
  ```typescript
  // POST /api/upload/multipart/init
  // 150MB 이상 파일용
  // 청크 사이즈: 5MB
  ```
- [ ] **1.2.3** Multipart 완료 확인
  ```typescript
  // POST /api/upload/multipart/complete
  interface CompleteRequest {
    uploadId: string;
    key: string;
    parts: { PartNumber: number; ETag: string }[];
  }
  ```
- [ ] **1.2.4** 업로드 실패 복구 API
  ```typescript
  // POST /api/upload/multipart/abort
  // 실패한 업로드 정리
  ```
- [ ] **1.2.5** 썸네일 자동 생성 (Sharp)
  ```typescript
  // 원본 업로드 시 자동으로 생성
  // sizes: [64, 128, 256, 512]
  // format: WebP (품질 80)
  ```

---

### 1.3 인증 시스템 구현
```
Priority: P0 (Critical)
Duration: 3일
Dependencies: 1.1 완료
```

#### Tasks
- [ ] **1.3.1** JWT 토큰 관리 시스템
  ```typescript
  // Access Token: 15분
  // Refresh Token: 7일
  // httpOnly 쿠키 사용

  interface TokenPayload {
    userId: string;
    userType: 'PERSONAL' | 'BUSINESS' | 'GUEST';
    subscriptionTier: 'FREE' | 'PREMIUM' | 'BUSINESS';
    iat: number;
    exp: number;
  }
  ```
- [ ] **1.3.2** OAuth 토큰 교환 API
  ```typescript
  // POST /api/auth/oauth/google
  // POST /api/auth/oauth/kakao
  // POST /api/auth/oauth/naver

  interface OAuthRequest {
    provider: 'google' | 'kakao' | 'naver';
    accessToken: string;
    idToken?: string;
  }
  ```
- [ ] **1.3.3** 게스트 모드 구현
  ```typescript
  // POST /api/auth/guest
  // 익명 사용자 생성
  // 광고 최대 빈도 적용
  // 재생 이력 저장 안 함
  ```
- [ ] **1.3.4** 토큰 갱신 API
  ```typescript
  // POST /api/auth/refresh
  // Refresh Token으로 새 Access Token 발급
  ```
- [ ] **1.3.5** 로그아웃 API
  ```typescript
  // POST /api/auth/logout
  // Refresh Token 무효화
  ```

---

### 1.4 추천 시스템 API
```
Priority: P1 (Important)
Duration: 2일
Dependencies: 1.1 완료
```

#### Tasks
- [ ] **1.4.1** 개인 사용자 추천
  ```typescript
  // GET /api/recommend?user_type=personal

  // 알고리즘 가중치
  // - 직업별 기본 추천: 30%
  // - 시간대별 추천: 30%
  // - 이력 기반: 30%
  // - 랜덤 발견: 10%
  ```
- [ ] **1.4.2** 비즈니스 사용자 추천
  ```typescript
  // GET /api/recommend?user_type=business&business_type=cafe

  // 알고리즘 가중치
  // - 업종별 추천: 40%
  // - 시간대별 자동 전환: 40%
  // - 연속 재생 최적화: 20%
  ```
- [ ] **1.4.3** 시간대 감지 로직
  ```typescript
  const getTimeSlot = (hour: number): TimeSlot => {
    if (hour >= 6 && hour < 9) return 'MORNING';
    if (hour >= 9 && hour < 18) return 'AFTERNOON';
    if (hour >= 18 && hour < 22) return 'EVENING';
    return 'NIGHT';
  };
  ```
- [ ] **1.4.4** BPM 기반 추천 필터
  ```typescript
  // 시간대별 BPM 범위
  const BPM_RANGES = {
    MORNING: { min: 80, max: 100 },
    AFTERNOON: { min: 60, max: 80 },
    EVENING: { min: 50, max: 70 },
    NIGHT: { min: 40, max: 60 },
  };
  ```

---

### 1.5 광고 및 구독 API
```
Priority: P0 (Critical)
Duration: 2일
Dependencies: 1.3 완료
```

#### Tasks
- [ ] **1.5.1** 광고 노출 기록 API
  ```typescript
  // POST /api/ads/impression
  interface AdImpressionRequest {
    adUnitId: string;
    adType: 'AUDIO' | 'BANNER' | 'REWARDED';
    adProvider: 'ADMOB' | 'META';
    clicked?: boolean;
    completed?: boolean;
    skipped?: boolean;
  }
  ```
- [ ] **1.5.2** 광고 빈도 제어 API
  ```typescript
  // GET /api/ads/status
  interface AdStatusResponse {
    nextAdIn: number;           // 다음 광고까지 남은 트랙 수
    adFreeUntil: string | null; // 무광고 종료 시각
    todayRewardedCount: number; // 오늘 보상형 광고 시청 횟수
    maxRewardedPerDay: number;  // 일일 최대 (5회)
  }
  ```
- [ ] **1.5.3** 보상형 광고 완료 API
  ```typescript
  // POST /api/ads/reward
  // 1시간 무광고 부여
  // 일일 5회 제한 확인
  ```
- [ ] **1.5.4** Stripe Webhook 핸들러
  ```typescript
  // POST /api/webhooks/stripe
  // Events:
  // - customer.subscription.created
  // - customer.subscription.updated
  // - customer.subscription.deleted
  // - invoice.payment_failed
  ```
- [ ] **1.5.5** 구독 상태 조회 API
  ```typescript
  // GET /api/subscription/status
  interface SubscriptionStatus {
    tier: 'FREE' | 'PREMIUM' | 'BUSINESS';
    status: 'ACTIVE' | 'CANCELED' | 'EXPIRED' | 'TRIALING';
    expiresAt: string | null;
    features: string[];
  }
  ```

---

## 📱 Phase 2: React Native 앱 기반 구축 (Week 2-3)

### 2.1 프로젝트 초기화
```
Priority: P0 (Critical)
Duration: 1일
Dependencies: Phase 0 완료
```

#### Tasks
- [ ] **2.1.1** Expo 프로젝트 생성
  ```bash
  npx create-expo-app heeling-app --template expo-template-blank-typescript
  ```
- [ ] **2.1.2** 네비게이션 설정 (Expo Router)
  ```
  app/
  ├── (tabs)/
  │   ├── index.tsx          # 홈
  │   ├── explore.tsx        # 탐색
  │   └── library.tsx        # 내 음악
  ├── player/
  │   └── [id].tsx           # 플레이어
  ├── auth/
  │   ├── login.tsx
  │   └── onboarding/
  ├── settings/
  │   └── index.tsx
  └── _layout.tsx
  ```
- [ ] **2.1.3** 상태 관리 설정 (Zustand)
  ```typescript
  // stores/
  // - useAuthStore.ts
  // - usePlayerStore.ts
  // - useSyncStore.ts
  // - useAdStore.ts
  ```
- [ ] **2.1.4** 테마 시스템 설정
  ```typescript
  const theme = {
    colors: {
      primary: '#00E19C',
      background: '#0A0E0D',
      card: '#1A2421',
      text: '#FFFFFF',
      textSecondary: '#A0B0AA',
      accent: '#00FFB3',
    },
    spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
    borderRadius: { sm: 8, md: 16, lg: 24 },
  };
  ```

---

### 2.2 SQLite 로컬 DB 구현
```
Priority: P0 (Critical)
Duration: 2일
Dependencies: 2.1 완료
```

#### Tasks
- [ ] **2.2.1** expo-sqlite 설치 및 설정
  ```bash
  npx expo install expo-sqlite
  ```
- [ ] **2.2.2** 스키마 정의
  ```sql
  -- tracks 테이블
  CREATE TABLE IF NOT EXISTS tracks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    composer TEXT,
    file_url TEXT NOT NULL,
    thumbnail_url TEXT,
    duration INTEGER,
    bpm INTEGER,
    tags TEXT,           -- JSON array
    mood TEXT,
    play_count INTEGER DEFAULT 0,
    is_downloaded INTEGER DEFAULT 0,
    local_path TEXT,
    created_at TEXT,
    updated_at TEXT
  );

  -- 인덱스
  CREATE INDEX idx_tracks_mood ON tracks(mood);
  CREATE INDEX idx_tracks_play_count ON tracks(play_count DESC);
  ```
- [ ] **2.2.3** 마이그레이션 시스템
  ```typescript
  // PRAGMA user_version 사용
  const CURRENT_VERSION = 1;

  const migrations = {
    1: `
      CREATE TABLE tracks (...);
      CREATE TABLE playlists (...);
      CREATE TABLE sync_meta (...);
    `,
  };
  ```
- [ ] **2.2.4** CRUD 헬퍼 함수
  ```typescript
  // db/tracks.ts
  export const getTracks = async (filters?: TrackFilters): Promise<Track[]>;
  export const getTrackById = async (id: string): Promise<Track | null>;
  export const upsertTracks = async (tracks: Track[]): Promise<void>;
  export const deleteTracksByIds = async (ids: string[]): Promise<void>;
  ```
- [ ] **2.2.5** WAL 모드 활성화
  ```typescript
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await db.execAsync('PRAGMA synchronous = NORMAL;');
  ```

---

### 2.3 동기화 클라이언트 구현
```
Priority: P0 (Critical)
Duration: 2일
Dependencies: 2.2 완료
```

#### Tasks
- [ ] **2.3.1** 버전 체크 로직
  ```typescript
  // services/sync.ts
  export const checkForUpdates = async (): Promise<boolean> => {
    const localVersion = await getLocalVersion();
    const remoteVersion = await fetchRemoteVersion();
    return localVersion !== remoteVersion.version;
  };
  ```
- [ ] **2.3.2** 전체 동기화 구현
  ```typescript
  export const performFullSync = async (): Promise<SyncResult> => {
    const data = await api.get('/api/sync/full');

    await db.transaction(async () => {
      await upsertTracks(data.tracks);
      await upsertPlaylists(data.playlists);
      await deleteTombstones(data.tombstones);
      await saveLocalVersion(data.version);
    });

    return { success: true, tracksUpdated: data.tracks.length };
  };
  ```
- [ ] **2.3.3** 델타 동기화 구현
  ```typescript
  export const performDeltaSync = async (since: string): Promise<SyncResult> => {
    const delta = await api.get(`/api/sync/delta?since=${since}`);

    await db.transaction(async () => {
      await upsertTracks(delta.updated.tracks);
      await deleteTracksByIds(delta.deleted.tracks);
    });

    return { success: true };
  };
  ```
- [ ] **2.3.4** Tombstone 처리
  ```typescript
  const deleteTombstones = async (tombstones: Tombstones) => {
    await deleteTracksByIds(tombstones.tracks);
    await deletePlaylistsByIds(tombstones.playlists);
  };
  ```
- [ ] **2.3.5** 백그라운드 동기화 설정
  ```typescript
  // expo-background-fetch 사용
  // 최소 15분 간격
  BackgroundFetch.registerTaskAsync(SYNC_TASK_NAME, {
    minimumInterval: 15 * 60,
    stopOnTerminate: false,
    startOnBoot: true,
  });
  ```

---

### 2.4 인증 UI 구현
```
Priority: P0 (Critical)
Duration: 2일
Dependencies: 2.1 완료
```

#### Tasks
- [ ] **2.4.1** 온보딩 화면 구현
  ```
  [화면 1] 사용 목적 선택
  - 👤 개인 사용
  - 🏢 비즈니스 사용

  [화면 2-1] 개인 - 직업 선택
  [화면 2-2] 비즈니스 - 업종 선택

  [화면 3] 선호 테마 선택 (최대 2개)

  [화면 4] 로그인 / 게스트 계속
  ```
- [ ] **2.4.2** Google OAuth 구현
  ```typescript
  // @react-native-google-signin/google-signin
  import { GoogleSignin } from '@react-native-google-signin/google-signin';

  GoogleSignin.configure({
    webClientId: process.env.GOOGLE_WEB_CLIENT_ID,
    offlineAccess: true,
  });
  ```
- [ ] **2.4.3** 카카오 로그인 구현
  ```typescript
  // @react-native-seoul/kakao-login
  import { login } from '@react-native-seoul/kakao-login';

  const kakaoLogin = async () => {
    const token = await login();
    // 백엔드로 토큰 전송하여 교환
  };
  ```
- [ ] **2.4.4** 네이버 로그인 구현
  ```typescript
  // @react-native-seoul/naver-login
  import { NaverLogin } from '@react-native-seoul/naver-login';
  ```
- [ ] **2.4.5** 토큰 저장 및 관리
  ```typescript
  // expo-secure-store 사용
  import * as SecureStore from 'expo-secure-store';

  export const saveTokens = async (access: string, refresh: string) => {
    await SecureStore.setItemAsync('accessToken', access);
    await SecureStore.setItemAsync('refreshToken', refresh);
  };
  ```

---

## 🎵 Phase 3: 동기화 시스템 구현 (Week 3-4)

### 3.1 앱 시작 시 동기화 플로우
```
Priority: P0 (Critical)
Duration: 2일
Dependencies: Phase 2 완료
```

#### 앱 시작 플로우
```
앱 시작
   ↓
로컬 DB 확인
   ↓
[있음]              [없음]
   ↓                   ↓
version.json 체크    전체 동기화
   ↓                   ↓
[변경 있음]  [변경 없음]  로컬 DB 생성
   ↓           ↓          ↓
델타 동기화  바로 진입   홈 화면 진입
   ↓
로컬 DB 업데이트
   ↓
홈 화면 진입
```

#### Tasks
- [ ] **3.1.1** 앱 초기화 훅
  ```typescript
  // hooks/useAppInit.ts
  export const useAppInit = () => {
    const [isReady, setIsReady] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
      const init = async () => {
        await initDatabase();
        await checkAndSync();
        setIsReady(true);
      };
      init().catch(setError);
    }, []);

    return { isReady, error };
  };
  ```
- [ ] **3.1.2** 스플래시 화면 + 로딩 상태
  ```typescript
  // 동기화 진행률 표시
  // "데이터 업데이트 중... 45%"
  ```
- [ ] **3.1.3** 오프라인 모드 감지
  ```typescript
  import NetInfo from '@react-native-community/netinfo';

  const { isConnected } = await NetInfo.fetch();
  if (!isConnected) {
    // 로컬 데이터만 사용
    // 동기화 스킵
  }
  ```
- [ ] **3.1.4** 동기화 실패 처리
  ```typescript
  // 3회 재시도 후 실패 시
  // 로컬 데이터로 진행
  // 백그라운드에서 재시도 예약
  ```

---

### 3.2 파일 다운로드 관리
```
Priority: P1 (Important)
Duration: 2일
Dependencies: 3.1 완료
```

#### Tasks
- [ ] **3.2.1** 다운로드 매니저 구현
  ```typescript
  // services/downloadManager.ts
  export const downloadTrack = async (track: Track): Promise<string> => {
    const localPath = `${FileSystem.documentDirectory}tracks/${track.id}.mp3`;

    const downloadResumable = FileSystem.createDownloadResumable(
      track.fileUrl,
      localPath,
      {},
      (progress) => {
        const percent = progress.totalBytesWritten / progress.totalBytesExpectedToWrite;
        updateDownloadProgress(track.id, percent);
      }
    );

    const result = await downloadResumable.downloadAsync();
    return result.uri;
  };
  ```
- [ ] **3.2.2** 다운로드 큐 관리
  ```typescript
  // 동시 다운로드 제한: 3개
  // 우선순위 큐 (현재 재생 중인 플레이리스트 우선)
  ```
- [ ] **3.2.3** 스토리지 관리
  ```typescript
  // 저장 공간 확인
  const freeSpace = await FileSystem.getFreeDiskStorageAsync();

  // LRU 캐시 정책
  // 30일 미재생 파일 자동 삭제
  ```
- [ ] **3.2.4** 다운로드 재개 지원
  ```typescript
  // expo-file-system의 createDownloadResumable 사용
  // 앱 종료 후 재시작 시 이어받기
  ```

---

## 🎧 Phase 4: 미디어 플레이어 통합 (Week 4-5)

### 4.1 오디오 플레이어 구현
```
Priority: P0 (Critical)
Duration: 3일
Dependencies: Phase 3 완료
```

#### Tasks
- [ ] **4.1.1** react-native-track-player 설치
  ```bash
  npm install react-native-track-player
  cd ios && pod install
  ```
- [ ] **4.1.2** Playback Service 등록
  ```typescript
  // index.js (앱 진입점)
  import TrackPlayer from 'react-native-track-player';

  TrackPlayer.registerPlaybackService(() => require('./service'));
  ```
- [ ] **4.1.3** Service 구현
  ```typescript
  // service.ts
  import TrackPlayer, { Event } from 'react-native-track-player';

  module.exports = async function() {
    TrackPlayer.addEventListener(Event.RemotePlay, () => TrackPlayer.play());
    TrackPlayer.addEventListener(Event.RemotePause, () => TrackPlayer.pause());
    TrackPlayer.addEventListener(Event.RemoteNext, () => TrackPlayer.skipToNext());
    TrackPlayer.addEventListener(Event.RemotePrevious, () => TrackPlayer.skipToPrevious());
    TrackPlayer.addEventListener(Event.RemoteStop, () => TrackPlayer.stop());
  };
  ```
- [ ] **4.1.4** 플레이어 초기화
  ```typescript
  await TrackPlayer.setupPlayer({
    minBuffer: 15,
    maxBuffer: 50,
    playBuffer: 2.5,
    backBuffer: 0,
  });

  await TrackPlayer.updateOptions({
    capabilities: [
      Capability.Play,
      Capability.Pause,
      Capability.SkipToNext,
      Capability.SkipToPrevious,
      Capability.Stop,
    ],
    compactCapabilities: [
      Capability.Play,
      Capability.Pause,
      Capability.SkipToNext,
    ],
  });
  ```
- [ ] **4.1.5** 큐 관리
  ```typescript
  // stores/usePlayerStore.ts
  interface PlayerState {
    queue: Track[];
    currentIndex: number;
    isPlaying: boolean;
    position: number;
    duration: number;

    // Actions
    setQueue: (tracks: Track[]) => void;
    playTrack: (index: number) => void;
    togglePlayPause: () => void;
    skipToNext: () => void;
    skipToPrevious: () => void;
    seekTo: (position: number) => void;
  }
  ```
- [ ] **4.1.6** 재생 이력 기록
  ```typescript
  // 재생 완료율 계산
  // 30초 이상 재생 시 기록
  // 백엔드로 비동기 전송
  ```

---

### 4.2 플레이어 UI 구현
```
Priority: P0 (Critical)
Duration: 3일
Dependencies: 4.1 완료
```

#### Tasks
- [ ] **4.2.1** 미니 플레이어 바
  ```tsx
  // components/MiniPlayer.tsx
  // - 현재 트랙 정보 (썸네일, 제목)
  // - 재생/일시정지 버튼
  // - 진행률 바
  // - 탭 시 전체 화면 플레이어로 이동
  ```
- [ ] **4.2.2** 전체 화면 플레이어
  ```tsx
  // screens/Player.tsx
  // - 대형 앨범 커버
  // - 트랙 정보 (제목, 카테고리)
  // - 시크바 + 시간 표시
  // - 컨트롤 (이전/재생/다음)
  // - 좋아요, 반복, 메뉴 버튼
  // - 광고 예고 (무료 사용자)
  ```
- [ ] **4.2.3** 잠금화면 컨트롤
  ```typescript
  // iOS: MPNowPlayingInfoCenter
  // Android: MediaSession
  // react-native-track-player가 자동 처리
  ```
- [ ] **4.2.4** 수면 타이머
  ```typescript
  // 15분, 30분, 45분, 1시간, 2시간
  // 커스텀 시간 설정
  // 페이드 아웃 효과 (30초)
  ```
- [ ] **4.2.5** 자동 재생 설정
  ```typescript
  // 플레이리스트 끝 도달 시
  // - 추천 음악 자동 생성
  // - 또는 플레이리스트 반복
  ```

---

### 4.3 홈 화면 구현
```
Priority: P0 (Critical)
Duration: 2일
Dependencies: 4.2 완료
```

#### Tasks
- [ ] **4.3.1** 홈 화면 레이아웃
  ```tsx
  // screens/Home.tsx
  // - 헤더 (로고, 프로필)
  // - "지금의 분위기" 추천 카드 (3개)
  // - "테마별 음악" 그리드 (6개)
  // - "최근 재생" 가로 스크롤
  // - "인기 음악" 가로 스크롤
  // - 배너 광고 (무료 사용자)
  // - 미니 플레이어 바
  ```
- [ ] **4.3.2** 추천 카드 컴포넌트
  ```tsx
  // components/RecommendCard.tsx
  // - 그라데이션 배경
  // - 제목 + 설명
  // - 재생 버튼
  ```
- [ ] **4.3.3** 트랙 리스트 컴포넌트
  ```tsx
  // components/TrackList.tsx
  // - FlatList (성능 최적화)
  // - 가로 스크롤 모드
  // - 로딩 스켈레톤
  ```
- [ ] **4.3.4** Pull-to-refresh 동기화
  ```tsx
  // 당겨서 새로고침
  // 동기화 진행 중 인디케이터
  ```

---

## 💰 Phase 5: 광고 및 결제 시스템 (Week 5-6)

### 5.1 광고 시스템 구현
```
Priority: P0 (Critical)
Duration: 3일
Dependencies: Phase 4 완료
```

#### Tasks
- [ ] **5.1.1** AdMob SDK 설치
  ```bash
  npm install react-native-google-mobile-ads
  ```
- [ ] **5.1.2** 배너 광고 구현
  ```tsx
  // components/BannerAd.tsx
  import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';

  <BannerAd
    unitId={adUnitId}
    size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
    onAdLoaded={() => logImpression('BANNER')}
    onAdFailedToLoad={(error) => handleAdError(error)}
  />
  ```
- [ ] **5.1.3** 오디오 광고 (전면 광고) 구현
  ```tsx
  // services/audioAd.ts
  import { InterstitialAd, AdEventType } from 'react-native-google-mobile-ads';

  const interstitial = InterstitialAd.createForAdRequest(AD_UNIT_ID);

  // 트랙 종료 후에만 표시
  // 3초 예고 후 재생
  // 5초 후 Skip 가능
  ```
- [ ] **5.1.4** 보상형 광고 구현
  ```tsx
  // services/rewardedAd.ts
  import { RewardedAd, RewardedAdEventType } from 'react-native-google-mobile-ads';

  // 시청 완료 시 1시간 무광고
  // 일일 5회 제한
  ```
- [ ] **5.1.5** 광고 빈도 제어
  ```typescript
  // stores/useAdStore.ts
  interface AdState {
    tracksUntilAd: number;      // 다음 광고까지 남은 트랙
    adFreeUntil: Date | null;   // 무광고 종료 시각
    todayRewardedCount: number;

    // 사용자 타입별 빈도
    // 게스트: 3곡당 1회
    // 무료 회원: 4곡당 1회
    // 로열티 높음: 5곡당 1회
  }
  ```
- [ ] **5.1.6** 광고 예외 처리
  ```typescript
  // 수면 모드: 광고 비활성화
  // 타이머 30분 이하: 광고 없음
  // 첫 세션: 30분 광고 없음
  // 네트워크 오류: 광고 Skip
  ```

---

### 5.2 결제 시스템 구현
```
Priority: P0 (Critical)
Duration: 3일
Dependencies: 5.1 완료
```

#### Tasks
- [ ] **5.2.1** Stripe SDK 설치
  ```bash
  npm install @stripe/stripe-react-native
  ```
- [ ] **5.2.2** 구독 화면 UI
  ```tsx
  // screens/Subscription.tsx
  // - 현재 플랜 표시
  // - 개인 프리미엄 ($4.99/월)
  // - 비즈니스 플랜 ($19.99/월)
  // - 기능 비교 테이블
  // - 결제 버튼
  ```
- [ ] **5.2.3** 결제 플로우 구현
  ```typescript
  // 1. PaymentIntent 생성 (백엔드)
  // 2. PaymentSheet 표시
  // 3. 결제 완료 확인
  // 4. 구독 활성화
  ```
- [ ] **5.2.4** 구독 상태 관리
  ```typescript
  // stores/useSubscriptionStore.ts
  interface SubscriptionState {
    tier: 'FREE' | 'PREMIUM' | 'BUSINESS';
    status: 'ACTIVE' | 'CANCELED' | 'EXPIRED';
    expiresAt: Date | null;

    isPremium: () => boolean;
    isBusiness: () => boolean;
    canAccessFeature: (feature: string) => boolean;
  }
  ```
- [ ] **5.2.5** 구독 복원 기능
  ```typescript
  // App Store / Play Store 구매 복원
  // 기기 변경 시 사용
  ```
- [ ] **5.2.6** 프리미엄 전환 유도 UI
  ```tsx
  // 광고 재생 직전
  // 5번째 광고 시청 후
  // 수면 모드 진입 시
  // 8시간+ 연속 재생 시 (비즈니스)
  ```

---

## 🖥️ Phase 6: 관리자 대시보드 완성 (Week 6-7)

### 6.1 기존 대시보드 고도화
```
Priority: P1 (Important)
Duration: 2일
Dependencies: Phase 5 완료
```

#### Tasks
- [ ] **6.1.1** 실제 데이터 연동
  ```typescript
  // 현재 mock 데이터 → 실제 API 연동
  // - 총 사용자 수
  // - 총 재생 수
  // - 스토리지 사용량
  // - 주간 활동 추이
  ```
- [ ] **6.1.2** 광고 수익 대시보드
  ```tsx
  // - 일일/주간/월간 수익
  // - eCPM 트렌드
  // - 광고 타입별 성과
  // - 완료율/Skip률
  ```
- [ ] **6.1.3** 구독 통계 대시보드
  ```tsx
  // - 총 구독자 수
  // - 플랜별 분포
  // - 전환율
  // - MRR (월 반복 수익)
  ```

---

### 6.2 미디어 관리 고도화
```
Priority: P1 (Important)
Duration: 2일
Dependencies: 6.1 완료
```

#### Tasks
- [ ] **6.2.1** 벌크 업로드 기능
  ```tsx
  // CSV + ZIP 파일 업로드
  // 메타데이터 일괄 등록
  // 실패 목록 다운로드
  ```
- [ ] **6.2.2** 태그 관리 시스템
  ```tsx
  // 태그 일괄 수정
  // 태그 자동 추천
  // 중복 태그 병합
  ```
- [ ] **6.2.3** 플레이리스트 관리
  ```tsx
  // 드래그 앤 드롭 순서 변경
  // 자동 생성 플레이리스트 설정
  // 비즈니스 템플릿 관리
  ```

---

### 6.3 동기화 관리
```
Priority: P1 (Important)
Duration: 1일
Dependencies: 6.2 완료
```

#### Tasks
- [ ] **6.3.1** version.json 관리 UI
  ```tsx
  // 현재 버전 표시
  // 수동 버전 증가
  // 변경 이력 조회
  ```
- [ ] **6.3.2** XML/JSON 내보내기
  ```tsx
  // 전체 데이터 내보내기
  // 형식 선택 (JSON/XML)
  // CDN 캐시 무효화
  ```
- [ ] **6.3.3** Tombstone 관리
  ```tsx
  // 삭제된 항목 목록
  // 30일 지난 항목 영구 삭제
  ```

---

## 🧪 Phase 7: 테스트 및 출시 준비 (Week 7-8)

### 7.1 테스트
```
Priority: P0 (Critical)
Duration: 3일
Dependencies: Phase 6 완료
```

#### Tasks
- [ ] **7.1.1** 단위 테스트
  ```bash
  # Jest + React Native Testing Library
  npm test -- --coverage

  # 목표: 70% 이상 커버리지
  ```
- [ ] **7.1.2** E2E 테스트
  ```typescript
  // Detox 또는 Maestro
  // 주요 사용자 플로우:
  // - 온보딩 → 홈 → 재생
  // - 로그인 → 구독
  // - 동기화 플로우
  ```
- [ ] **7.1.3** 성능 테스트
  ```typescript
  // - 앱 시작 시간 < 3초
  // - 트랙 재생 시작 < 2초
  // - 메모리 사용량 < 150MB
  // - 배터리 소모 최적화
  ```
- [ ] **7.1.4** 백그라운드 재생 테스트
  ```
  // iOS: 15분+ 백그라운드 유지
  // Android: Foreground Service 안정성
  // 잠금화면 컨트롤 동작
  ```
- [ ] **7.1.5** 오프라인 모드 테스트
  ```
  // 네트워크 끊김 상태에서:
  // - 로컬 데이터 표시
  // - 다운로드된 트랙 재생
  // - 동기화 대기열 관리
  ```

---

### 7.2 법률 문서 준비
```
Priority: P0 (Critical)
Duration: 1일
Dependencies: 없음 (병렬 진행)
```

#### Tasks
- [ ] **7.2.1** 이용약관 (Terms of Service)
- [ ] **7.2.2** 개인정보 처리방침 (Privacy Policy)
  - GDPR 대응 포함
- [ ] **7.2.3** 광고 정책 (Ad Policy)
- [ ] **7.2.4** 상업용 라이선스 약관
- [ ] **7.2.5** 환불 정책
- [ ] **7.2.6** 저작권 정책
- [ ] **7.2.7** 법률 검토 의뢰

---

### 7.3 앱스토어 출시 준비
```
Priority: P0 (Critical)
Duration: 2일
Dependencies: 7.1, 7.2 완료
```

#### Tasks
- [ ] **7.3.1** 앱 아이콘 최종화
  ```
  // iOS: 1024x1024
  // Android: 512x512
  // Adaptive Icon (Android)
  ```
- [ ] **7.3.2** 스토어 스크린샷 제작
  ```
  // iOS: 6.5", 5.5"
  // Android: Phone, Tablet
  // 최소 4장, 권장 8장
  ```
- [ ] **7.3.3** 앱 설명 작성
  ```
  // 한국어 / 영어
  // 키워드 최적화 (ASO)
  // 기능 하이라이트
  ```
- [ ] **7.3.4** iOS 빌드 및 제출
  ```bash
  # Xcode Archive
  # App Store Connect 업로드
  # 심사 제출
  ```
- [ ] **7.3.5** Android 빌드 및 제출
  ```bash
  # AAB 빌드
  # Play Console 업로드
  # 내부 테스트 → 프로덕션
  ```
- [ ] **7.3.6** 심사 대응 준비
  ```
  // 테스트 계정 준비
  // 기능 설명 문서
  // 심사 거부 시 대응 계획
  ```

---

## 📈 성공 지표 (3개월 목표)

### 사용자 지표
| 지표 | 목표 | 측정 방법 |
|------|------|-----------|
| DAU | 500명 | GA4 |
| MAU | 2,000명 | GA4 |
| 평균 세션 시간 | 15분 (개인), 8시간 (비즈니스) | 자체 로그 |
| 재생 완료율 | 70% | PlayHistory |
| D7 유지율 | 40% | Cohort 분석 |

### 수익 지표
| 지표 | 목표 | 측정 방법 |
|------|------|-----------|
| 월 광고 수익 | $300 | AdMob |
| eCPM | $3-5 | AdMob |
| 프리미엄 전환율 | 5% | Subscriptions |
| 비즈니스 전환율 | 80% (비즈니스 사용자 중) | Subscriptions |
| 총 MRR | $500 | 광고 + 구독 |

---

## 🚨 Critical Path (30일)

```
Week 1: 백엔드 코어 (5일)
   └─ 동기화 API + 인증 + 파일 업로드
        ↓
Week 2-3: 음악 스트리밍 (7일)
   └─ SQLite + 동기화 + 플레이어
        ↓
Week 4-5: 광고 통합 (7일)
   └─ AdMob SDK + 빈도 제어 + 결제
        ↓
Week 6-7: 테스트 (6일)
   └─ E2E + 성능 + 백그라운드
        ↓
Week 8: 앱스토어 (5일)
   └─ 빌드 + 제출 + 심사 대응
```

---

## 📚 참고 라이브러리 버전

```json
{
  "react-native-track-player": "^4.1.2",
  "react-native-video": "^7.0.0",
  "expo-sqlite": "~14.0.0",
  "expo-file-system": "~17.0.0",
  "expo-secure-store": "~13.0.0",
  "@stripe/stripe-react-native": "^0.38.0",
  "react-native-google-mobile-ads": "^14.0.0",
  "@react-native-google-signin/google-signin": "^12.0.0",
  "@react-native-seoul/kakao-login": "^5.4.0",
  "@react-native-seoul/naver-login": "^3.1.0",
  "zustand": "^4.5.0"
}
```

---

**문서 종료**

*작성일: 2025-11-25*
