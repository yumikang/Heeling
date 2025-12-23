# Backend API Documentation (Phase 2)

> **Note**: 이 문서는 Phase 2 서버 연동 시 사용될 백엔드 API 명세입니다.
> Phase 1에서는 로컬 SQLite만 사용하며, 이 API는 Phase 2에서 활성화됩니다.

## 📋 Overview

| 항목 | 내용 |
|------|------|
| **Framework** | Next.js 15 (App Router) |
| **Database** | PostgreSQL + Prisma ORM |
| **Authentication** | JWT (Access/Refresh Token) |
| **Base URL** | `https://api.heeling.app` (예정) |

---

## 🗄️ Database Schema

### Entity Relationship Diagram

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    User     │────<│ PlayHistory │>────│    Track    │
└─────────────┘     └─────────────┘     └─────────────┘
      │                                        │
      │                                        │
      ↓                                        ↓
┌─────────────┐                         ┌─────────────┐
│  Favorite   │                         │PlaylistTrack│
└─────────────┘                         └─────────────┘
      │                                        │
      │                                        ↓
      │                                 ┌─────────────┐
      └────────────────────────────────>│  Playlist   │
                                        └─────────────┘
```

### Models

#### User

```prisma
model User {
  id                  String             @id @default(cuid())
  email               String?            @unique
  name                String?
  passwordHash        String?
  userType            UserType           @default(PERSONAL)  // PERSONAL | BUSINESS | GUEST
  occupation          String?
  businessType        String?
  preferredThemes     String[]
  subscriptionTier    SubscriptionTier   @default(FREE)      // FREE | PREMIUM | BUSINESS
  subscriptionEndDate DateTime?
  adFreeUntil         DateTime?
  onboardingCompleted Boolean            @default(false)
  createdAt           DateTime           @default(now())
  updatedAt           DateTime           @updatedAt
}
```

#### Track

```prisma
model Track {
  id             String   @id @default(cuid())
  title          String
  composer       String?  @default("Heeling Studio")
  createdWith    String?  @default("Suno AI")
  fileUrl        String
  thumbnailUrl   String?
  duration       Int                    // seconds
  fileSize       Int?                   // bytes
  bpm            Int?
  tags           String[]               // ["sleep", "focus", "nature"]
  mood           String?                // calm, energetic, peaceful
  occupationTags String[]               // ["developer", "designer"]
  businessTags   String[]               // ["cafe", "spa"]
  timeSlotTags   String[]               // ["morning", "night"]
  playCount      Int      @default(0)
  likeCount      Int      @default(0)
  isActive       Boolean  @default(true)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}
```

#### Playlist

```prisma
model Playlist {
  id               String       @id @default(cuid())
  name             String
  description      String?
  coverImage       String?
  type             PlaylistType @default(MANUAL)  // MANUAL | AUTO_GENERATED | BUSINESS_TEMPLATE | THEME
  theme            String?
  timeSlot         TimeSlot?    // MORNING | AFTERNOON | EVENING | NIGHT
  targetUserType   UserType?
  targetOccupation String?
  targetBusiness   String?
  playCount        Int          @default(0)
  isPublic         Boolean      @default(true)
  isFeatured       Boolean      @default(false)
  createdAt        DateTime     @default(now())
  updatedAt        DateTime     @updatedAt
}
```

#### PlayHistory

```prisma
model PlayHistory {
  id             String   @id @default(cuid())
  userId         String
  trackId        String
  playedAt       DateTime @default(now())
  completionRate Float    @default(0)      // 0.0 - 1.0
  listenDuration Int?                      // seconds
  deviceType     String?
  wasAdShown     Boolean  @default(false)
}
```

#### Subscription

```prisma
model Subscription {
  id                   String             @id @default(cuid())
  userId               String
  planType             SubscriptionTier   // FREE | PREMIUM | BUSINESS
  status               SubscriptionStatus // ACTIVE | CANCELED | EXPIRED | PAST_DUE | TRIALING
  startedAt            DateTime
  expiresAt            DateTime
  canceledAt           DateTime?
  stripeSubscriptionId String?
  stripeCustomerId     String?
  amount               Float
  currency             String             @default("USD")
}
```

### Enums

```typescript
enum UserType {
  PERSONAL
  BUSINESS
  GUEST
}

enum SubscriptionTier {
  FREE
  PREMIUM
  BUSINESS
}

enum PlaylistType {
  MANUAL
  AUTO_GENERATED
  BUSINESS_TEMPLATE
  THEME
}

enum TimeSlot {
  MORNING     // 06:00 - 12:00
  AFTERNOON   // 12:00 - 18:00
  EVENING     // 18:00 - 22:00
  NIGHT       // 22:00 - 06:00
}

enum AdType {
  AUDIO
  BANNER
  REWARDED
}

enum AdProvider {
  ADMOB
  META
}

enum SubscriptionStatus {
  ACTIVE
  CANCELED
  EXPIRED
  PAST_DUE
  TRIALING
}
```

---

## 🔌 API Endpoints

### Tracks API

#### GET /api/tracks

트랙 목록을 조회합니다.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | 페이지 번호 |
| `limit` | number | 20 | 페이지당 항목 수 |
| `theme` | string | - | 테마 필터 (tags 배열에서 검색) |
| `mood` | string | - | 분위기 필터 |
| `q` | string | - | 검색어 (title, tags) |

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "clxx...",
      "title": "Rainy Forest",
      "composer": "Nature Sounds",
      "thumbnailUrl": "https://...",
      "duration": 3600,
      "bpm": 60,
      "tags": ["sleep", "nature"],
      "mood": "calm",
      "playCount": 1234,
      "likeCount": 567,
      "fileSize": 10485760,
      "createdAt": "2025-01-01T00:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNext": true
  },
  "stats": {
    "totalFiles": 150,
    "totalSize": 1572864000,
    "totalDownloads": 0
  }
}
```

#### GET /api/tracks/:id

단일 트랙을 조회합니다.

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "clxx...",
    "title": "Rainy Forest",
    "composer": "Nature Sounds",
    "createdWith": "Suno AI",
    "fileUrl": "https://storage.../track.mp3",
    "thumbnailUrl": "https://...",
    "duration": 3600,
    "fileSize": 10485760,
    "bpm": 60,
    "tags": ["sleep", "nature"],
    "mood": "calm",
    "occupationTags": ["developer"],
    "businessTags": [],
    "timeSlotTags": ["night"],
    "playCount": 1234,
    "likeCount": 567,
    "isActive": true,
    "createdAt": "2025-01-01T00:00:00Z",
    "_count": {
      "favorites": 567,
      "playHistories": 1234
    }
  }
}
```

#### POST /api/tracks (Admin)

새 트랙을 생성합니다.

**Request Body:**

```json
{
  "title": "Ocean Waves",
  "composer": "Nature Sounds",
  "fileUrl": "https://storage.../track.mp3",
  "thumbnailUrl": "https://...",
  "duration": 2400,
  "fileSize": 8388608,
  "bpm": 50,
  "tags": ["meditation", "ocean"],
  "mood": "peaceful",
  "occupationTags": [],
  "businessTags": ["spa"],
  "timeSlotTags": ["morning", "evening"]
}
```

#### PATCH /api/tracks/:id (Admin)

트랙 정보를 수정합니다.

**Request Body:** (수정할 필드만)

```json
{
  "title": "Updated Title",
  "tags": ["sleep", "nature", "rain"]
}
```

#### DELETE /api/tracks/:id (Admin)

트랙을 소프트 삭제합니다. (`isActive = false`)

---

### Playlists API

#### GET /api/playlists

플레이리스트 목록을 조회합니다.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `theme` | string | 테마 필터 |
| `type` | string | 타입 필터 (MANUAL, AUTO_GENERATED, etc.) |
| `featured` | boolean | 피처드만 조회 |

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "clxx...",
      "name": "Deep Sleep",
      "description": "수면을 위한 편안한 음악",
      "coverImage": "https://...",
      "theme": "sleep",
      "type": "THEME",
      "playCount": 5678,
      "_count": {
        "tracks": 15
      }
    }
  ]
}
```

#### GET /api/playlists/:id

플레이리스트 상세 (트랙 포함)를 조회합니다.

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "clxx...",
    "name": "Deep Sleep",
    "description": "수면을 위한 편안한 음악",
    "coverImage": "https://...",
    "theme": "sleep",
    "type": "THEME",
    "tracks": [
      {
        "id": "track_001",
        "title": "Rainy Forest",
        "composer": "Nature Sounds",
        "thumbnailUrl": "https://...",
        "duration": 3600,
        "bpm": 60,
        "tags": ["sleep"],
        "mood": "calm",
        "fileUrl": "https://...",
        "position": 0
      }
    ]
  }
}
```

#### POST /api/playlists (Admin)

새 플레이리스트를 생성합니다.

**Request Body:**

```json
{
  "name": "Morning Energy",
  "description": "활기찬 아침을 위한 음악",
  "coverImage": "https://...",
  "type": "THEME",
  "theme": "energy",
  "timeSlot": "MORNING",
  "isFeatured": true
}
```

#### POST /api/playlists/:id/tracks (Admin)

플레이리스트에 트랙을 추가합니다.

**Request Body:**

```json
{
  "trackId": "clxx..."
}
```

---

### Recommendation API

#### GET /api/recommend

맞춤 추천 트랙을 조회합니다.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `user_type` | string | personal | personal / business |
| `occupation` | string | - | 직업 (personal만) |
| `business_type` | string | - | 업종 (business만) |
| `time_slot` | string | auto | morning/afternoon/evening/night (auto: 현재 시간 기준) |
| `mood` | string | - | 분위기 필터 |
| `limit` | number | 10 | 반환 개수 |

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "clxx...",
      "title": "Rainy Forest",
      "composer": "Nature Sounds",
      "thumbnailUrl": "https://...",
      "duration": 3600,
      "bpm": 60,
      "tags": ["sleep"],
      "mood": "calm",
      "playCount": 1234,
      "fileUrl": "https://..."
    }
  ],
  "meta": {
    "timeSlot": "night",
    "userType": "personal",
    "occupation": "developer",
    "businessType": null,
    "count": 10
  }
}
```

**추천 알고리즘:**

1. **시간대 필터**: `timeSlotTags` 매칭
2. **사용자 타입별 필터**:
   - Personal: `occupationTags` 매칭
   - Business: `businessTags` 매칭
3. **분위기 필터**: `mood` 매칭 (선택)
4. **정렬**: 인기순 (`playCount`) + 최신순
5. **랜덤화**: 결과를 랜덤하게 섞어 반환

---

### Sync API

#### GET /api/sync

앱 동기화용 전체 트랙 데이터를 조회합니다.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `format` | string | json | json / xml |

**Response (JSON):**

```json
{
  "status": "update_available",
  "version": 1706140800000,
  "tracks": [
    {
      "id": "track_001",
      "title": "Rainy Forest",
      "artist": "Nature Sounds",
      "url": "https://storage.../track.mp3",
      "artwork": "https://...",
      "version": 1706140800000
    }
  ]
}
```

**Response (XML):**

```xml
<response>
  <status>update_available</status>
  <version>1706140800000</version>
  <tracks>
    <track id="track_001" version="1706140800000">
      <title>Rainy Forest</title>
      <artist>Nature Sounds</artist>
      <url>https://storage.../track.mp3</url>
      <artwork>https://...</artwork>
    </track>
  </tracks>
</response>
```

---

### Upload API

#### POST /api/upload

파일을 업로드합니다. (Admin용)

**Request:**

```
Content-Type: multipart/form-data

file: [binary]
```

**Response:**

```json
{
  "success": true,
  "url": "/uploads/1706140800000-filename.mp3",
  "filename": "1706140800000-filename.mp3",
  "size": 10485760,
  "type": "audio/mpeg"
}
```

---

## 🔐 Authentication (Phase 2 예정)

### POST /api/auth/apple

Apple Sign In 토큰 교환

**Request:**

```json
{
  "identityToken": "eyJ...",
  "authorizationCode": "abc123"
}
```

**Response:**

```json
{
  "success": true,
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "user": {
    "id": "clxx...",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

### POST /api/auth/google

Google Sign In 토큰 교환

**Request:**

```json
{
  "idToken": "eyJ..."
}
```

### POST /api/auth/refresh

Access Token 갱신

**Request:**

```json
{
  "refreshToken": "eyJ..."
}
```

### POST /api/auth/logout

로그아웃 (Refresh Token 무효화)

---

## 💰 Subscription API (Phase 2 예정)

### GET /api/subscription/status

현재 구독 상태 조회

**Response:**

```json
{
  "success": true,
  "data": {
    "tier": "PREMIUM",
    "status": "ACTIVE",
    "expiresAt": "2025-12-31T23:59:59Z",
    "features": ["ad_free", "offline_download", "high_quality"]
  }
}
```

### POST /api/subscription

구독 시작 (Stripe 연동)

### DELETE /api/subscription

구독 취소

---

## 📊 Play History API (Phase 2 예정)

### POST /api/history

재생 기록 저장

**Request:**

```json
{
  "trackId": "clxx...",
  "completionRate": 0.85,
  "listenDuration": 3060,
  "deviceType": "iOS"
}
```

### GET /api/history

재생 히스토리 조회

---

## 🚨 Error Handling

모든 에러 응답은 다음 형식을 따릅니다:

```json
{
  "success": false,
  "error": "Error message here"
}
```

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 500 | Internal Server Error |

---

## 🔧 Development Setup

### Environment Variables

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/heeling"

# JWT
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="15m"
REFRESH_TOKEN_EXPIRES_IN="7d"

# Stripe (Phase 2)
STRIPE_SECRET_KEY="sk_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Storage (Phase 2)
S3_BUCKET="heeling-storage"
S3_REGION="ap-northeast-2"
S3_ACCESS_KEY="..."
S3_SECRET_KEY="..."
```

### Running Locally

```bash
cd backend

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Start development server
npm run dev
```

---

## 📁 Project Structure

```
backend/
├── src/
│   └── app/
│       └── api/
│           ├── tracks/
│           │   ├── route.ts          # GET, POST, PUT, DELETE
│           │   └── [id]/
│           │       └── route.ts      # GET, PATCH, DELETE (by ID)
│           ├── playlists/
│           │   ├── route.ts          # GET, POST
│           │   └── [id]/
│           │       └── route.ts      # GET, POST (add track)
│           ├── recommend/
│           │   └── route.ts          # GET
│           ├── sync/
│           │   └── route.ts          # GET
│           └── upload/
│               └── route.ts          # POST
├── prisma/
│   └── schema.prisma
├── lib/
│   └── prisma.ts
└── package.json
```

---

## 📌 Phase 2 Migration Checklist

Phase 1 (로컬) → Phase 2 (서버) 전환 시:

- [ ] 백엔드 서버 배포 (VPS or Cloud)
- [ ] PostgreSQL 데이터베이스 설정
- [ ] Prisma 마이그레이션 실행
- [ ] 환경 변수 설정
- [ ] SSL 인증서 설정
- [ ] API Base URL 앱에 설정
- [ ] 로컬 SQLite → 서버 동기화 로직 구현
- [ ] 인증 API 구현 (Apple/Google)
- [ ] Stripe 결제 연동
- [ ] 파일 스토리지 (S3/R2) 연동

---

**Document Version**: 1.0
**Last Updated**: 2025-11-25
