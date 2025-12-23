# AI 음악 생성 시스템 개발 문서

## 개요

Heeling 앱의 AI 기반 힐링 음악 자동 생성 시스템입니다. Suno AI로 음악을 생성하고, Google Gemini Imagen으로 앨범 커버를 생성합니다.

## 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                    Admin Generate Page                       │
│                 /admin/generate/page.tsx                     │
├─────────────────────────────────────────────────────────────┤
│  Hooks (상태 관리)                                            │
│  ├── useGeneration.ts  - 음악 생성 로직                       │
│  ├── useTracks.ts      - 트랙 목록 관리                       │
│  ├── useSync.ts        - Suno 동기화                         │
│  └── useSettings.ts    - API 설정 관리                       │
├─────────────────────────────────────────────────────────────┤
│  Components (UI 컴포넌트)                                     │
│  ├── GenerateTab.tsx     - 음악 생성 폼                       │
│  ├── TracksTab.tsx       - 생성된 트랙 목록                   │
│  ├── ScheduleTab.tsx     - 스케줄 관리                        │
│  ├── SettingsTab.tsx     - API 설정                          │
│  └── GenerationModal.tsx - 생성 진행 모달                     │
├─────────────────────────────────────────────────────────────┤
│  API Routes                                                  │
│  ├── /api/admin/generate/music   - Suno 음악 생성            │
│  ├── /api/admin/generate/image   - Gemini 이미지 생성         │
│  ├── /api/admin/generate/text    - Gemini 텍스트 생성         │
│  ├── /api/admin/generate/tracks  - 트랙 CRUD                 │
│  ├── /api/admin/generate/titles  - 제목 캐시 관리             │
│  └── /api/admin/generate/cache   - 생성 캐시                  │
├─────────────────────────────────────────────────────────────┤
│  Clients (외부 API)                                          │
│  ├── suno-client.ts    - Suno API 클라이언트                  │
│  └── imagen-client.ts  - Google Imagen 클라이언트             │
└─────────────────────────────────────────────────────────────┘
```

## 주요 파일 구조

```
src/
├── app/admin/generate/
│   ├── page.tsx              # 메인 페이지 (356줄로 리팩토링)
│   ├── types.ts              # TypeScript 타입 정의
│   ├── constants.ts          # 스타일, 분위기 상수
│   ├── hooks/
│   │   ├── index.ts
│   │   ├── useGeneration.ts  # 음악 생성 핵심 로직
│   │   ├── useTracks.ts      # 트랙 관리
│   │   ├── useSync.ts        # Suno 동기화
│   │   └── useSettings.ts    # 설정 관리
│   └── components/
│       ├── index.ts
│       ├── GenerateTab.tsx
│       ├── TracksTab.tsx
│       ├── ScheduleTab.tsx
│       ├── SettingsTab.tsx
│       └── GenerationModal.tsx
├── app/api/admin/generate/
│   ├── music/route.ts        # Suno 음악 생성 API
│   ├── image/route.ts        # Gemini 이미지 생성 API
│   ├── text/route.ts         # Gemini 텍스트 생성 API
│   ├── tracks/route.ts       # 트랙 CRUD API
│   ├── titles/route.ts       # 제목 캐시 API
│   ├── cache/route.ts        # 생성 캐시 API
│   └── download/route.ts     # 파일 다운로드 API
└── lib/
    ├── suno-client.ts        # Suno API 클라이언트
    └── imagen-client.ts      # Google Imagen 클라이언트
```

## API 클라이언트

### Suno Client (`suno-client.ts`)

Suno AI를 통한 음악 생성:

```typescript
const client = new SunoClient(apiKey, baseUrl);

// 음악 생성
const result = await client.generate({
  title: '평화로운 아침',
  style: 'piano',
  mood: 'calm',
  instrumental: true,
});

// 상태 확인
const status = await client.getStatus(taskId);
```

### Imagen Client (`imagen-client.ts`)

Google Gemini Imagen을 통한 앨범 커버 생성:

```typescript
const client = new ImagenClient(apiKey);

// 이미지 생성
const images = await client.generateImage({
  prompt: 'serene healing music album cover...',
  numberOfImages: 1,
  aspectRatio: '1:1',
});

// 프롬프트 자동 생성
const prompt = generateArtworkPrompt({
  title: '평화로운 아침',
  category: 'healing',
  mood: 'calm',
  style: 'watercolor',
});
```

**지원 모델**: `imagen-4.0-generate-preview-06-06`

**아트 스타일**:
- 회화: watercolor, oilPainting, impressionist, japanese, chinese, korean
- 디지털: digital3d, gradient, glassmorphism, geometric, lowPoly
- 사진: cinematic, ethereal, macro, aerial
- 일러스트: anime, lofi, vintage, botanical
- 추상: abstract, surreal, minimal

## 음악 생성 플로우

```
1. 사용자 입력
   ├── 제목 키워드 (선택)
   ├── 스타일 (piano, nature, meditation, ...)
   ├── 분위기 (calm, dreamy, melancholy, ...)
   ├── 아트 스타일 (watercolor, anime, ...)
   └── 생성 곡 수

2. 제목 생성 (Gemini)
   ├── 캐시 확인 → 있으면 캐시 사용
   └── 없으면 AI로 한/영 제목 생성

3. 음악 생성 (Suno)
   ├── 프롬프트 구성
   ├── Suno API 호출
   └── 폴링으로 완료 대기

4. 오디오 다운로드
   └── 로컬 저장 (/public/media/audio/)

5. 커버 이미지 생성 (Gemini Imagen)
   ├── 프롬프트 구성 (제목, 카테고리, 분위기, 아트 스타일)
   ├── Imagen API 호출
   └── 로컬 저장 (/public/media/covers/)

6. 트랙 저장
   └── DB에 트랙 정보 저장 (SystemSetting 테이블)
```

## 데이터 저장

### 트랙 데이터 구조

```typescript
interface GeneratedTrack {
  id: string;
  title: string;
  titleEn?: string;
  audioUrl: string;        // 로컬: /media/audio/...
  imageUrl?: string;       // 로컬: /media/covers/...
  duration: number;
  style: string;
  mood: string;
  generatedAt: string;
  batchId?: string;
}
```

### 저장 위치

- **트랙 메타데이터**: `SystemSetting` 테이블 (key: `generated_tracks`)
- **오디오 파일**: `/public/media/audio/`
- **커버 이미지**: `/public/media/covers/`
- **캐시**: `/data/cache/` (Suno, Gemini 응답 캐시)

## API 설정

### 환경 변수

```env
# Suno API (선택 - DB 설정 우선)
SUNO_API_KEY=your_suno_api_key
SUNO_API_BASE_URL=https://api.suno.ai

# Gemini API (선택 - DB 설정 우선)
GEMINI_API_KEY=your_gemini_api_key
```

### DB 설정 (우선순위 높음)

API 키는 Base64로 인코딩되어 `SystemSetting` 테이블에 저장:

```json
// key: 'ai_music'
{
  "enabled": true,
  "apiKey": "base64_encoded_suno_key",
  "baseUrl": "https://api.suno.ai"
}

// key: 'ai_image'
{
  "enabled": true,
  "apiKey": "base64_encoded_gemini_key"
}
```

## 트러블슈팅

### 이미지 생성 안됨

1. **모델명 확인**: `imagen-4.0-generate-preview-06-06` 사용
2. **API 키 확인**: DB 설정에서 `ai_image` 키 확인
3. **로그 확인**: 서버 콘솔에서 `[Image API]` 로그 확인

### 음악 생성 타임아웃

- 기본 타임아웃: 5분 (60회 x 5초 폴링)
- Suno 크레딧 확인 필요

### 커버가 안 보임

1. `imageUrl`이 로컬 경로(`/media/covers/...`)인지 확인
2. 파일이 실제로 존재하는지 확인
3. 외부 URL(Suno 기본 커버)은 만료될 수 있음

## 변경 이력

### 2024-11-28

- **리팩토링**: `page.tsx` 2,741줄 → 356줄 (hooks, components 분리)
- **버그 수정**: Imagen 모델명 수정 (`imagen-4.0-generate-001` → `imagen-4.0-generate-preview-06-06`)
- **개선**: 에러 핸들링 강화, 상세 로그 추가
- **기능**: 기존 트랙 커버 재생성 스크립트 추가
