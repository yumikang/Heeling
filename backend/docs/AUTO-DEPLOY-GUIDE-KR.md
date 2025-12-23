# Heeling 자동 배포 시스템 완벽 가이드

## 📋 목차
1. [시스템 개요](#시스템-개요)
2. [전체 플로우](#전체-플로우)
3. [핵심 컴포넌트](#핵심-컴포넌트)
4. [데이터 구조](#데이터-구조)
5. [API 엔드포인트](#api-엔드포인트)
6. [배포 프로세스](#배포-프로세스)
7. [에러 처리](#에러-처리)
8. [로컬 테스트](#로컬-테스트)
9. [VPS 배포](#vps-배포)
10. [트러블슈팅](#트러블슈팅)

---

## 시스템 개요

### 목적
Suno AI를 이용한 힐링 음악 생성 및 자동 배포 시스템

### 주요 특징
- **제목 캐시 시스템**: AI가 미리 생성한 창의적인 제목 사용
- **2트랙 동시 처리**: Suno 1회 호출로 2개 트랙 생성 및 배포
- **자동 이미지 생성**: Gemini Imagen으로 각 트랙별 커버 이미지 생성
- **Retry 메커니즘**: 실패 시 자동 재시도 (최대 3회)
- **Zombie 감지**: 1시간 이상 진행 없는 작업 자동 실패 처리

---

## 전체 플로우

```
┌─────────────────────────────────────────────────────────────┐
│ 1단계: 스케줄 설정 (관리자 페이지)                              │
└─────────────────────────────────────────────────────────────┘
   │
   ├─ 스케줄 이름: "매일 아침 힐링 음악"
   ├─ 빈도: daily/weekly/monthly/once
   ├─ 생성 개수: 1-10 (각 개수당 2트랙 생성)
   ├─ 스타일/분위기: piano/calm 등
   └─ 자동 배포: ON/OFF
   │
   ↓
┌─────────────────────────────────────────────────────────────┐
│ 2단계: 스케줄 실행 (수동 또는 예약)                             │
│ POST /api/admin/generate/schedules/run                      │
└─────────────────────────────────────────────────────────────┘
   │
   ├─ 제목 캐시에서 2개 제목 조회
   │  GET /api/admin/generate/titles?category=healing&count=2
   │  → 예: ["Whispers of Dawn", "Piano in the Mist"]
   │
   ├─ Suno API 호출 (첫 번째 제목으로)
   │  POST https://api.sunoaiapi.com/api/v1/gateway/generate/music
   │  → taskId: "abc123" 받음
   │
   ├─ GenerationTask 2개 생성 (autoDeploy=true)
   │  ├─ Task 1: taskId=abc123, trackIndex=0, title="Whispers of Dawn"
   │  └─ Task 2: taskId=abc123, trackIndex=1, title="Piano in the Mist"
   │
   └─ 사용한 제목 캐시에서 마킹
      POST /api/admin/generate/titles (action: markUsed)
   │
   ↓
┌─────────────────────────────────────────────────────────────┐
│ 3단계: 자동 배포 스크립트 실행 (5분마다 - cron)                  │
│ node scripts/check-and-deploy.js                            │
└─────────────────────────────────────────────────────────────┘
   │
   ├─ DB에서 PENDING/GENERATING 상태 Task 조회
   │  SELECT * FROM GenerationTask
   │  WHERE autoDeploy=true AND status IN (...)
   │
   ├─ taskId별 그룹화 (중복 처리 방지)
   │  taskId=abc123 → [Task1(idx=0), Task2(idx=1)]
   │
   ├─ Suno 상태 체크
   │  GET https://api.sunoaiapi.com/api/v1/gateway/query?ids=abc123
   │  → status: PENDING → GENERATING → SUCCESS
   │
   └─ SUCCESS일 때 배포 시작
   │
   ↓
┌─────────────────────────────────────────────────────────────┐
│ 4단계: 2개 트랙 다운로드 및 배포                                │
│ downloadAndDeploy([Task1, Task2], sunoData)                 │
└─────────────────────────────────────────────────────────────┘
   │
   FOR EACH Track (0, 1):
   │
   ├─ Gemini 이미지 생성 (각 트랙별 제목 기반)
   │  POST https://generativelanguage.googleapis.com/.../imagen-4.0
   │  prompt: "Whispers of Dawn" 테마 반영
   │  → cover_abc123_0_1701234567.png 저장
   │
   ├─ Suno 오디오 다운로드
   │  GET sunoData.tracks[trackIndex].streamAudioUrl
   │  → abc123_1701234567.mp3 저장
   │
   ├─ 오디오 메타데이터 추출
   │  music-metadata 라이브러리로 duration 추출
   │  → 예: 180초
   │
   ├─ Track 테이블에 삽입
   │  INSERT INTO Track (
   │    title: "Whispers of Dawn",
   │    fileUrl: "/media/tracks/abc123_0.mp3",
   │    thumbnailUrl: "/media/covers/cover_0.png",
   │    duration: 180,
   │    ...
   │  )
   │
   └─ GenerationTask 상태 업데이트
      UPDATE GenerationTask
      SET status='DEPLOYED'
      WHERE id=Task.id
   │
   ↓
┌─────────────────────────────────────────────────────────────┐
│ 5단계: 완료 (앱에서 즉시 재생 가능)                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 핵심 컴포넌트

### 1. 제목 캐시 시스템

**파일 위치**: `data/title-cache/healing_titles.json`

**구조**:
```json
{
  "category": "healing",
  "generatedAt": "2024-12-03T12:00:00Z",
  "titles": [
    {
      "ko": "새벽을 여는 멜로디",
      "en": "Whispers of Dawn",
      "keywords": "새벽, 멜로디, 평화",
      "used": false,
      "usedAt": null
    },
    {
      "ko": "안개 속 피아노",
      "en": "Piano in the Mist",
      "keywords": "안개, 피아노, 신비",
      "used": true,
      "usedAt": "2024-12-03T14:30:00Z"
    }
  ]
}
```

**사용 흐름**:
1. **생성**: 관리자 페이지 → "50개 생성" 버튼
2. **조회**: `GET /api/admin/generate/titles?category=healing&count=2`
3. **마킹**: `POST /api/admin/generate/titles` (action: markUsed)
4. **공유**: 수동 생성 + 자동 생성 모두 동일 캐시 사용

**장점**:
- AI가 생성한 창의적이고 시적인 제목
- "힐링 음악 1", "Healing Music 2" 같은 단순 제목 방지
- 사전 생성으로 음악 생성 시 지연 없음

---

### 2. GenerationTask 모델

**데이터베이스 테이블**: `GenerationTask`

**주요 필드**:
```prisma
model GenerationTask {
  id            String   // cuid: "clq1x2y3z4..."
  scheduleId    String?  // 어느 스케줄에서 생성되었는지

  // Suno 식별자 (2개 Task가 동일한 taskId 공유)
  taskId        String   // "abc123"
  trackIndex    Int      // 0 or 1

  // 트랙 정보
  title         String   // "Whispers of Dawn"
  style         String   // "piano"
  mood          String   // "calm"

  // 상태 추적
  status        GenerationStatus  // PENDING → GENERATING → GENERATED → DOWNLOADING → DEPLOYING → DEPLOYED
  retryCount    Int      // 0-3
  maxRetries    Int      // 3

  // Suno URL (원본 보존)
  sunoAudioUrl  String?
  sunoImageUrl  String?

  // 로컬 저장 URL
  audioUrl      String?  // "/media/tracks/abc123_0.mp3"
  imageUrl      String?  // "/media/covers/cover_0.png"

  // 메타데이터
  duration      Int?     // 180 (초)

  // 타임스탬프
  lastCheckedAt DateTime?
  failedAt      DateTime?
  error         String?
  createdAt     DateTime
  updatedAt     DateTime

  // 플래그
  autoDeploy    Boolean  // true

  @@unique([taskId, trackIndex])  // 복합 unique: 같은 taskId로 2개 트랙
}
```

**상태 전이**:
```
PENDING (Suno 호출 완료)
   ↓
GENERATING (Suno 생성 중)
   ↓
GENERATED (Suno 완료, URL 확인)
   ↓
DOWNLOADING (로컬 저장 중)
   ↓
DEPLOYING (Track 테이블 삽입 중)
   ↓
DEPLOYED (완료)

또는
   ↓
FAILED (maxRetries 초과 또는 zombie timeout)
```

---

### 3. 자동 배포 스크립트

**파일**: `scripts/check-and-deploy.js`

**주요 함수**:

#### `main()`
- DB에서 처리 대상 Task 조회
- taskId별 그룹화 (중복 제거)
- 순차 처리 (1초 간격)

#### `processTask(task)`
- taskId로 연관 Task 전체 조회
- Suno 상태 체크
- Zombie timeout 체크 (1시간)
- 상태별 처리:
  - PENDING/RUNNING: 상태 업데이트만
  - SUCCESS: downloadAndDeploy 호출
  - FAILED: Retry 또는 최종 실패

#### `downloadAndDeploy(tasks, sunoData)`
- 2개 트랙 순회 처리
- 각 트랙별:
  1. Gemini 이미지 생성
  2. Suno 오디오 다운로드
  3. Duration 추출
  4. 로컬 저장 (public/media/)
  5. Track 테이블 삽입
  6. GenerationTask 상태 업데이트

#### `generateGeminiImage(title)`
- 제목 분석하여 테마 감지
- 테마별 프롬프트 생성
- Gemini Imagen 4.0 호출
- Base64 이미지 반환

#### `downloadWithRetry(url, maxRetries)`
- Exponential backoff retry
- 네트워크 오류 대응

#### `extractDuration(audioBuffer)`
- music-metadata 라이브러리 사용
- MP3 파일에서 duration 추출

---

## 데이터 구조

### Suno API 응답

**생성 요청**:
```json
POST https://api.sunoaiapi.com/api/v1/gateway/generate/music
{
  "title": "Whispers of Dawn",
  "prompt": "Instrumental healing music...",
  "style": "Ambient, relaxing piano...",
  "instrumental": true,
  "custom_mode": false,
  "mv": "chirp-v5"
}

Response:
{
  "code": 200,
  "data": {
    "taskId": "abc123"
  }
}
```

**상태 조회**:
```json
GET https://api.sunoaiapi.com/api/v1/gateway/query?ids=abc123

Response:
{
  "code": 200,
  "data": {
    "taskId": "abc123",
    "status": "SUCCESS",
    "response": {
      "sunoData": [
        {
          "id": "track001",
          "title": "Whispers of Dawn",
          "streamAudioUrl": "https://cdn.suno.ai/abc123_0.mp3",
          "image_url": "https://cdn.suno.ai/abc123_0.png",
          "duration": 180.5,
          "tags": "piano, calm, healing"
        },
        {
          "id": "track002",
          "title": "Whispers of Dawn",
          "streamAudioUrl": "https://cdn.suno.ai/abc123_1.mp3",
          "image_url": "https://cdn.suno.ai/abc123_1.png",
          "duration": 185.2,
          "tags": "piano, calm, healing"
        }
      ]
    }
  }
}
```

### Track 테이블 구조

```prisma
model Track {
  id            String   // "clq1x2y3z4..."
  title         String   // "Whispers of Dawn"
  artist        String   // "Heeling"
  composer      String   // "Heeling Studio"
  createdWith   String   // "Suno AI"

  fileUrl       String   // "/media/tracks/abc123_0_1701234567.mp3"
  thumbnailUrl  String   // "/media/covers/cover_0_1701234567.png"

  duration      Int      // 180 (초)
  fileSize      Int?     // bytes (선택)

  category      String   // "piano"
  tags          String[] // ["piano", "calm", "ai-generated"]
  mood          String   // "calm"

  playCount     Int      // 0
  likeCount     Int      // 0
  isActive      Boolean  // true

  createdAt     DateTime
  updatedAt     DateTime
}
```

---

## API 엔드포인트

### 1. 제목 API

#### `GET /api/admin/generate/titles`
**용도**: 사용 가능한 제목 조회

**파라미터**:
- `category`: "healing" (고정)
- `count`: 가져올 개수 (기본: 1)

**응답**:
```json
{
  "success": true,
  "data": {
    "available": 165,
    "total": 200,
    "titles": [
      {
        "ko": "새벽을 여는 멜로디",
        "en": "Whispers of Dawn",
        "keywords": "새벽, 멜로디, 평화"
      },
      {
        "ko": "안개 속 피아노",
        "en": "Piano in the Mist",
        "keywords": "안개, 피아노, 신비"
      }
    ],
    "needsGeneration": false,
    "generatedAt": "2024-12-03T12:00:00Z"
  }
}
```

#### `POST /api/admin/generate/titles`
**용도 1**: 제목 대량 생성

**요청**:
```json
{
  "category": "healing",
  "mood": "calm",
  "style": "piano",
  "count": 50
}
```

**용도 2**: 사용된 제목 마킹

**요청**:
```json
{
  "action": "markUsed",
  "category": "healing",
  "titleIds": ["Whispers of Dawn", "Piano in the Mist"]
}
```

---

### 2. 스케줄 API

#### `POST /api/admin/generate/schedules/run`
**용도**: 스케줄 즉시 실행

**요청**:
```json
{
  "scheduleId": "schedule_123",
  "generateConfig": {
    "style": "piano",
    "mood": "calm",
    "instrumental": true
  }
}
```

**응답**:
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "taskId": "abc123",
        "status": "PENDING",
        "iteration": 1,
        "titles": ["Whispers of Dawn", "Piano in the Mist"]
      }
    ],
    "totalGenerations": 1,
    "expectedTracks": 2,
    "message": "Started 1 generation(s). Expected 2 tracks."
  }
}
```

---

### 3. 음악 생성 API

#### `POST /api/admin/generate/music`
**용도**: 수동 음악 생성 (관리자 페이지)

#### `GET /api/admin/generate/music?taskId=abc123`
**용도**: 생성 상태 조회

---

## 배포 프로세스

### 단계별 상세 설명

#### **PENDING → GENERATING**
```javascript
// check-and-deploy.js
const sunoResponse = await checkSunoStatus(task.taskId);
const sunoStatus = sunoResponse.data?.status;

if (sunoStatus === 'PENDING' || sunoStatus === 'RUNNING') {
  await prisma.generationTask.updateMany({
    where: { taskId: task.taskId },
    data: {
      status: 'GENERATING',
      lastCheckedAt: new Date()
    }
  });
}
```

**소요 시간**: Suno 생성 시간 (평균 1-3분)

---

#### **GENERATING → GENERATED**
```javascript
if (sunoStatus === 'SUCCESS' || sunoStatus === 'TEXT_SUCCESS') {
  const allTasks = await prisma.generationTask.findMany({
    where: { taskId: task.taskId, autoDeploy: true },
    orderBy: { trackIndex: 'asc' }
  });

  await downloadAndDeploy(allTasks, sunoResponse.data);
}
```

**작업**: 2개 트랙 다운로드 및 배포 시작

---

#### **GENERATED → DOWNLOADING**
```javascript
// 각 트랙별 처리
for (const task of tasks) {
  const trackIndex = task.trackIndex;
  const sunoTrack = tracks[trackIndex];

  // 1. Gemini 이미지 생성
  const imageBuffer = await generateGeminiImage(task.title);
  const imageUrl = await saveToLocal(imageBuffer, ...);

  await prisma.generationTask.update({
    where: { id: task.id },
    data: {
      status: 'DOWNLOADING',
      imageUrl,
      lastCheckedAt: new Date()
    }
  });

  // 2. 오디오 다운로드
  const audioBuffer = await downloadWithRetry(sunoAudioUrl, 3);
  const duration = await extractDuration(audioBuffer);
  const audioUrl = await saveToLocal(audioBuffer, ...);
}
```

**소요 시간**: Gemini (3-5초) + 오디오 다운로드 (2-10초)

---

#### **DOWNLOADING → DEPLOYING**
```javascript
await prisma.generationTask.update({
  where: { id: task.id },
  data: {
    status: 'DEPLOYING',
    audioUrl,
    duration,
    lastCheckedAt: new Date()
  }
});
```

**작업**: Track 테이블 삽입 준비

---

#### **DEPLOYING → DEPLOYED**
```javascript
// Track 테이블 삽입
const trackData = {
  title: task.title,
  artist: 'Heeling',
  composer: 'Heeling Studio',
  createdWith: 'Suno AI',
  fileUrl: audioUrl,
  thumbnailUrl: imageUrl,
  duration,
  category: task.style || 'healing',
  tags: [task.style, task.mood, 'ai-generated'].filter(Boolean),
  mood: task.mood || 'calm',
  isActive: true
};

const createdTrack = await prisma.track.create({ data: trackData });

// GenerationTask 완료 처리
await prisma.generationTask.update({
  where: { id: task.id },
  data: {
    status: 'DEPLOYED',
    lastCheckedAt: new Date()
  }
});
```

**완료**: 앱에서 즉시 재생 가능

---

### 전체 타임라인

```
T+0분:    스케줄 실행 → GenerationTask 2개 생성 (PENDING)
T+5분:    Cron 실행 → Suno 상태 체크 (GENERATING)
T+8분:    Cron 실행 → Suno 완료 확인 (SUCCESS)
          → 2개 트랙 다운로드 시작
T+8분30초: Gemini 이미지 2개 생성 완료
T+9분:    오디오 2개 다운로드 완료
T+9분10초: Track 테이블 2개 레코드 삽입
          → 배포 완료 (DEPLOYED)
```

**총 소요 시간**: 약 9-10분 (Suno 생성 시간에 따라 변동)

---

## 에러 처리

### 1. Retry 메커니즘

```javascript
// Suno 생성 실패 시
if (sunoStatus === 'FAILED') {
  if (task.retryCount < task.maxRetries) {
    // Retry
    await prisma.generationTask.updateMany({
      where: { taskId: task.taskId },
      data: {
        retryCount: task.retryCount + 1,
        status: 'PENDING',
        error: 'Suno generation failed, retrying...',
        lastCheckedAt: new Date()
      }
    });
  } else {
    // 최종 실패
    await prisma.generationTask.updateMany({
      where: { taskId: task.taskId },
      data: {
        status: 'FAILED',
        failedAt: new Date(),
        error: 'Suno generation failed after maximum retries'
      }
    });
  }
}
```

**Retry 전략**:
- 최대 3회 재시도
- Suno FAILED 상태 또는 네트워크 오류 시
- Exponential backoff (다운로드 시)

---

### 2. Zombie Timeout

```javascript
if (task.status === 'GENERATING' || task.status === 'PENDING') {
  const hoursSinceCreation =
    (Date.now() - new Date(task.createdAt).getTime()) / (1000 * 60 * 60);

  if (hoursSinceCreation > CONFIG.ZOMBIE_TIMEOUT_HOURS) {
    await prisma.generationTask.update({
      where: { id: task.id },
      data: {
        status: 'FAILED',
        failedAt: new Date(),
        error: `Timeout: No progress after ${CONFIG.ZOMBIE_TIMEOUT_HOURS} hour(s)`
      }
    });
  }
}
```

**Zombie 조건**:
- PENDING 또는 GENERATING 상태
- 1시간 이상 경과
- lastCheckedAt 업데이트 없음

**처리**:
- 자동 FAILED 처리
- Slack 알림 (설정 시)

---

### 3. Gemini 이미지 생성 실패

```javascript
try {
  const imageBuffer = await generateGeminiImage(task.title);
  imageUrl = await saveToLocal(imageBuffer, ...);
} catch (imageError) {
  console.warn(`Gemini image generation failed (non-critical):`, imageError.message);
  // 이미지 없이 계속 진행
  imageUrl = null;
}
```

**전략**:
- Non-critical 오류로 처리
- 이미지 없이 배포 진행
- Track.thumbnailUrl = null

---

### 4. 제목 캐시 부족

```javascript
if (titlesData.success && titlesData.data.titles?.length >= 2) {
  trackTitles = titlesData.data.titles.slice(0, 2);
} else {
  // Fallback
  trackTitles = [
    { ko: `${title} #1`, en: `${title} #1`, keywords: title },
    { ko: `${title} #2`, en: `${title} #2`, keywords: title }
  ];
}
```

**Fallback 전략**:
- 스케줄 이름 기반 제목 생성
- `#1`, `#2` 접미사 추가
- 정상 배포 진행

---

## 로컬 테스트

### 환경 설정

**1. 환경변수 (.env)**:
```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/heeling_db"

# Suno API
SUNO_API_KEY="your_suno_api_key_here"

# Gemini API
GEMINI_API_KEY="your_gemini_api_key_here"

# Slack (선택)
SLACK_WEBHOOK_URL="https://hooks.slack.com/services/..."
```

**2. 데이터베이스 마이그레이션**:
```bash
npm run db:migrate
npx prisma generate
```

---

### 테스트 시나리오

#### **시나리오 1: 전체 플로우 테스트**

```bash
# Terminal 1: 서버 실행
npm run dev

# Terminal 2: 스케줄 실행 (관리자 페이지)
# http://localhost:3002/admin/generate
# → AI 음악 → 스케줄 → 실행 버튼

# Terminal 3: Auto-deploy 1회 실행
npm run deploy:check
```

**확인 사항**:
```sql
-- GenerationTask 확인
SELECT id, taskId, trackIndex, title, status
FROM "GenerationTask"
WHERE autoDeploy = true
ORDER BY createdAt DESC
LIMIT 10;

-- Track 확인
SELECT id, title, fileUrl, thumbnailUrl, duration
FROM "Track"
ORDER BY createdAt DESC
LIMIT 10;
```

---

#### **시나리오 2: Watch 모드 (30초 간격)**

```bash
npm run deploy:watch
```

**로그 확인**:
```
[TaskID abc123] Processing 2 tasks...
  - Task clq1x2y3z4... (trackIndex 0): Whispers of Dawn
  - Task clq5a6b7c8... (trackIndex 1): Piano in the Mist
[TaskID abc123] ⏳ Still generating...

... 30초 후 ...

[TaskID abc123] ✅ Generation complete, deploying both tracks...
[Deploy] Starting for taskId abc123 (2 tracks)
[Deploy] Processing track 0: Whispers of Dawn
[Deploy] Generating cover image with Gemini for: Whispers of Dawn
[Deploy] Cover image generated and saved: /media/covers/...
[Deploy] Downloading audio: https://cdn.suno.ai/...
[Deploy] Duration: 180s
[Deploy] ✅ Track created: clq9x0y1z2... (Whispers of Dawn)
[Deploy] Processing track 1: Piano in the Mist
[Deploy] Generating cover image with Gemini for: Piano in the Mist
[Deploy] Cover image generated and saved: /media/covers/...
[Deploy] Downloading audio: https://cdn.suno.ai/...
[Deploy] Duration: 185s
[Deploy] ✅ Track created: clq3a4b5c6... (Piano in the Mist)
[Deploy] ✅ All tracks deployed for taskId abc123
```

---

#### **시나리오 3: 제목 캐시 테스트**

```bash
# 1. 제목 캐시 상태 확인
curl http://localhost:3002/api/admin/generate/titles?category=healing

# 2. 제목 캐시 생성 (부족할 경우)
# 관리자 페이지 → AI 음악 → "50개 생성" 버튼

# 3. 스케줄 실행 후 로그 확인
[Schedule Run] Using titles from cache: Whispers of Dawn, Piano in the Mist
```

---

#### **시나리오 4: 에러 시나리오**

**Retry 테스트**:
```bash
# Suno API 키를 잘못된 값으로 변경
# → 3회 재시도 후 FAILED 확인

# 로그:
[TaskID abc123] ❌ Suno generation failed
[TaskID abc123] 🔄 Retry 1/3
... 5분 후 ...
[TaskID abc123] 🔄 Retry 2/3
... 5분 후 ...
[TaskID abc123] 🔄 Retry 3/3
... 5분 후 ...
[TaskID abc123] ⛔ Max retries reached
```

**Zombie Timeout 테스트**:
```bash
# GenerationTask를 PENDING 상태로 1시간 이상 방치
# → Zombie 감지 확인

# 로그:
[Task clq1x2y3z4...] 🧟 Zombie detected: 1.23h old
[Task clq1x2y3z4...] ❌ Failed: Timeout after 1 hour(s)
```

---

## VPS 배포

### 1. VPS 환경 설정

```bash
# 프로젝트 클론
cd /home/user
git clone https://github.com/your-repo/heeling.git
cd heeling/backend

# Node.js 18+ 설치 확인
node --version  # v18.x.x 이상

# 의존성 설치
npm install

# 환경변수 설정
cp .env.example .env
nano .env
# → DATABASE_URL, SUNO_API_KEY, GEMINI_API_KEY 설정

# DB 마이그레이션
npm run db:migrate

# Prisma Client 생성
npx prisma generate
```

---

### 2. Crontab 설정

```bash
# Crontab 편집
crontab -e

# 5분마다 실행
*/5 * * * * /home/user/heeling/backend/scripts/heeling-auto-deploy.sh >> /var/log/heeling-auto-deploy.log 2>&1
```

**Wrapper Script** (`scripts/heeling-auto-deploy.sh`):
```bash
#!/bin/bash
PROJECT_ROOT="/home/user/heeling/backend"
SCRIPT_PATH="$PROJECT_ROOT/scripts/check-and-deploy.js"
LOCK_FILE="/tmp/heeling-auto-deploy.lock"

# Lock 획득 (flock 사용)
exec 9>"$LOCK_FILE"
if ! flock -n 9; then
  echo "Another instance is running"
  exit 1
fi

# 환경변수 로드
cd "$PROJECT_ROOT"
source .env

# 스크립트 실행
node "$SCRIPT_PATH"

# Lock 해제
rm -f "$LOCK_FILE"
```

---

### 3. Log Rotation 설정

```bash
# Logrotate 설정
sudo nano /etc/logrotate.d/heeling-auto-deploy
```

**내용**:
```
/var/log/heeling-auto-deploy.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0644 user user
}
```

**테스트**:
```bash
# Dry run
sudo logrotate -d /etc/logrotate.d/heeling-auto-deploy

# Force rotation
sudo logrotate -f /etc/logrotate.d/heeling-auto-deploy
```

---

### 4. 모니터링

```bash
# 실시간 로그 확인
tail -f /var/log/heeling-auto-deploy.log

# 최근 배포 확인
grep "✅ Track created" /var/log/heeling-auto-deploy.log | tail -20

# 에러 확인
grep "❌" /var/log/heeling-auto-deploy.log | tail -20

# Cron 실행 확인
grep CRON /var/log/syslog | grep heeling
```

---

### 5. Slack 알림 (선택)

```bash
# .env에 추가
SLACK_WEBHOOK_URL="https://hooks.slack.com/services/T00/B00/XXX"
```

**알림 발송 시점**:
- ✅ 배포 성공 (Track 생성 완료)
- ❌ 최종 실패 (max retries 도달)
- 🧟 Zombie timeout
- 🚨 Fatal error (스크립트 크래시)

---

## 트러블슈팅

### 문제 1: GenerationTask가 PENDING에서 진행 안 됨

**원인**:
- Suno API 키 오류
- Suno 서비스 장애
- 네트워크 문제

**해결**:
```bash
# 1. Suno API 키 확인
echo $SUNO_API_KEY

# 2. 수동으로 Suno 상태 체크
curl "https://api.sunoaiapi.com/api/v1/gateway/query?ids=taskId여기" \
  -H "api-key: $SUNO_API_KEY"

# 3. DB에서 Task 확인
psql $DATABASE_URL -c "SELECT id, taskId, status, error FROM \"GenerationTask\" WHERE status='PENDING';"

# 4. 수동으로 FAILED 처리 (필요 시)
psql $DATABASE_URL -c "UPDATE \"GenerationTask\" SET status='FAILED', error='Manual intervention' WHERE id='task_id_here';"
```

---

### 문제 2: 제목 캐시 부족

**증상**:
```
[Schedule Run] Not enough titles in cache (1/2), using fallback
```

**해결**:
```bash
# 1. 관리자 페이지에서 "50개 생성" 버튼 클릭

# 2. 또는 API 직접 호출
curl -X POST http://localhost:3002/api/admin/generate/titles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "category": "healing",
    "mood": "calm",
    "style": "piano",
    "count": 50
  }'
```

---

### 문제 3: Gemini 이미지 생성 실패

**증상**:
```
[Deploy] Gemini image generation failed (non-critical): API key invalid
```

**해결**:
```bash
# 1. GEMINI_API_KEY 확인
echo $GEMINI_API_KEY

# 2. Gemini API 키 권한 확인
# https://aistudio.google.com/app/apikey

# 3. 이미지 없이 배포는 정상 진행됨 (thumbnailUrl = null)
```

---

### 문제 4: Lock 파일 문제

**증상**:
```
Another instance is running (lock file exists)
```

**해결**:
```bash
# 1. Lock 파일 확인
ls -la /tmp/heeling-auto-deploy.lock

# 2. Lock 파일 나이 확인
stat /tmp/heeling-auto-deploy.lock

# 3. Stale lock 제거 (30분 이상)
rm -f /tmp/heeling-auto-deploy.lock

# 4. Wrapper script에 자동 stale lock 제거 로직 있음
```

---

### 문제 5: Duration 추출 실패

**증상**:
```
[Deploy] Duration extraction failed: Invalid audio format
```

**해결**:
```bash
# 1. music-metadata 설치 확인
npm list music-metadata

# 2. 오디오 파일 직접 확인
file public/media/tracks/abc123_0.mp3

# 3. FFmpeg로 duration 추출 (대안)
ffprobe -v error -show_entries format=duration \
  -of default=noprint_wrappers=1:nokey=1 \
  public/media/tracks/abc123_0.mp3
```

---

## 성능 최적화

### 1. 병렬 처리

**현재**:
- taskId별 순차 처리
- 동일 taskId 내 2개 트랙 순차 처리

**최적화 가능**:
```javascript
// 다른 taskId는 병렬 처리
const taskGroups = groupByTaskId(tasks);
await Promise.all(
  taskGroups.map(group => processTaskGroup(group))
);

// 같은 taskId 내 2개 트랙도 병렬 처리 가능
await Promise.all(
  tasks.map(task => downloadAndDeployOne(task, sunoData))
);
```

---

### 2. 캐싱

**Gemini 이미지 캐싱**:
```javascript
// 동일 제목으로 재생성 시 캐시 활용
const cacheKey = `gemini_image_${title}`;
const cached = await redis.get(cacheKey);
if (cached) return cached;

const image = await generateGeminiImage(title);
await redis.set(cacheKey, image, 'EX', 86400); // 24시간
```

---

### 3. 리소스 제한

```javascript
// check-and-deploy.js CONFIG
const CONFIG = {
  MAX_CONCURRENT_TASKS: 3,      // 동시 처리 Task 수
  ZOMBIE_TIMEOUT_HOURS: 1,      // Zombie timeout
  RETRY_DELAY_MS: 1000,         // Retry 간격
  DOWNLOAD_TIMEOUT_MS: 30000,   // 다운로드 timeout
};
```

---

## 보안 고려사항

### 1. API 키 보안

```bash
# .env 파일 권한
chmod 600 .env

# Git ignore
echo ".env" >> .gitignore
```

---

### 2. 파일 업로드 검증

```javascript
// check-and-deploy.js
async function saveToLocal(buffer, filename, directory) {
  // 파일명 sanitize
  const safeFilename = filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .substring(0, 100);

  // 파일 크기 제한 (50MB)
  if (buffer.length > 50 * 1024 * 1024) {
    throw new Error('File too large');
  }

  // ...
}
```

---

### 3. SQL Injection 방지

```javascript
// Prisma ORM 사용 (자동 parameterization)
await prisma.generationTask.findMany({
  where: { taskId: userInput }  // ✅ Safe
});

// Raw query 사용 금지
await prisma.$executeRaw`SELECT * FROM Track WHERE id = ${userInput}`;  // ❌ Unsafe
```

---

## 마무리

### 핵심 포인트

1. **제목 캐시**: 수동/자동 생성 모두 공유
2. **2트랙 처리**: Suno 1회 호출 = 2개 트랙 배포
3. **상태 추적**: PENDING → DEPLOYED (6단계)
4. **에러 처리**: Retry 3회, Zombie 1시간
5. **자동화**: Cron 5분마다 실행

### 체크리스트

**로컬 테스트**:
- [ ] 제목 캐시 167개 확인
- [ ] 스케줄 실행 → 2개 GenerationTask 생성
- [ ] npm run deploy:check 실행
- [ ] 2개 Track 생성 확인

**VPS 배포**:
- [ ] 환경변수 설정 (.env)
- [ ] Crontab 설정 (*/5 * * * *)
- [ ] Log rotation 설정
- [ ] 모니터링 설정

**알림 (선택)**:
- [ ] Slack webhook 설정
- [ ] 테스트 알림 발송

---

**작성일**: 2024-12-03
**버전**: 1.0
**문서 관리**: 시스템 변경 시 업데이트 필요
