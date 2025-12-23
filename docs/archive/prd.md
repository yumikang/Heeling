# 힐링 음악 스트리밍 앱 PRD (Product Requirements Document)

## 📋 문서 정보
- **프로젝트명**: 힐링 음악 스트리밍 플랫폼
- **버전**: 2.0
- **작성일**: 2025-11-21
- **작성자**: Leo (CodeB)
- **문서 목적**: MVP 개발을 위한 전체 요구사항 정의
- **주요 변경사항**: 광고 기반 수익 모델 추가, 상업 공간 타겟 추가

---

## 🎯 1. 제품 개요

### 1.1 제품 비전
"명상 기능이 포함된 앱"이 아닌, **힐링 음악에 특화된 스트리밍 플랫폼**. YouTube Music의 UX를 차용하되, 콘텐츠는 100% 힐링·명상·집중 음악으로 구성.

### 1.2 핵심 가치 제안
- 복잡한 명상 코스/챌린지 없음
- 음악 중심의 미니멀 인터페이스
- 직업별·시간대별·공간별 자동 추천
- 전체 기능 무료 제공 (광고 기반)
- 상업 공간용 연속 재생 모드 및 스케줄러

### 1.3 타겟 사용자

#### 1차 타겟: 집중 작업 직군 (40%)
- 디자이너, 개발자, 작가, 연구원
- **핵심 니즈**: 몰입, 생산성 향상, 방해받지 않는 환경
- **사용 시나리오**: 업무 중 배경음악, 재택근무, 카페 작업

#### 2차 타겟: 웰니스 추구 일반 사용자 (30%)
- 수면 장애, 불안감, 스트레스 관리 필요자
- **핵심 니즈**: 수면 개선, 심리적 안정, 일상 회복
- **사용 시나리오**: 취침 전, 출퇴근 시간, 휴식 시간

#### 3차 타겟: 요가·명상 실천자 (15%)
- 요가 강사, 명상 수련자, 마음챙김 실천자
- **핵심 니즈**: 수련 보조, 호흡 가이드, 정적 환경
- **사용 시나리오**: 요가 세션, 명상 시간, 스트레칭

#### 4차 타겟: 상업 공간 운영자 (15%) ⭐ 신규
- 카페, 마사지샵, 요가 스튜디오, 미용실, 서점 등
- **핵심 니즈**: 분위기 조성, 장시간 연속 재생, 저작권 안전성
- **사용 시나리오**: 매장 오픈~마감, 시간대별 분위기 전환
- **특이사항**: 
  - 광고 민감도 높음 (손님 경험 저하)
  - 비즈니스 플랜 전환율 예상 80%
  - 평균 재생 시간 8-12시간/일

### 1.4 비즈니스 모델

#### 📊 수익 구조

**주 수익원: 광고 (60%)**
- **오디오 광고**: 3-5곡마다 15초 광고 삽입 (트랙 종료 후에만)
- **배너 광고**: 홈 화면 하단 네이티브 광고
- **보상형 광고**: 광고 시청 시 1시간 무광고 제공
- **광고 제공**: Google AdMob, Meta Audience Network

**부 수익원: 프리미엄 구독 (40%)**
- **개인 프리미엄**: $4.99/월
  - 광고 제거
  - 오프라인 다운로드 무제한
  - 고음질 스트리밍 (320kbps)
  - 수면 타이머 고급 기능
  
- **비즈니스 플랜**: $19.99/월 ⭐
  - 광고 완전 제거
  - 상업용 라이선스 포함
  - 시간대별 자동 플레이리스트 전환
  - 다중 기기 동기화 (매장별 설정)
  - 볼륨 스케줄러
  - 우선 고객 지원

**수익 예측 (Phase별)**

| Phase | DAU | 광고 수익/월 | 구독 수익/월 | 총 수익/월 |
|-------|-----|-------------|-------------|-----------|
| MVP (3개월) | 500 | $300 | $200 | $500 |
| Phase 2 (6개월) | 5,000 | $3,500 | $2,500 | $6,000 |
| Phase 3 (1년) | 20,000 | $15,000 | $12,000 | $27,000 |

**계산 근거**:
- 광고: 사용자당 일평균 5회 노출 × eCPM $3 × 30일
- 구독: 전환율 8% (개인 5%, 비즈니스 3%)

#### 🎯 확장 가능성
- 기업 B2B 라이선스 (오피스 단체 계정)
- 프리미엄 음원 아티스트 파트너십
- 공간별 맞춤 큐레이션 컨설팅 서비스 ($500/회)
- 하드웨어 번들 (블루투스 스피커 + 앱 구독 1년)

---

## 🏗️ 2. 기술 스택 및 아키텍처

### 2.1 프론트엔드
```
- React Native (iOS/Android 동시 지원)
- TypeScript
- React Navigation
- Zustand (상태관리)
- React Native Track Player (음악 재생)
- React Native Linear Gradient (UI)
- React Native Google Mobile Ads (AdMob) ⭐
- Meta Audience Network SDK ⭐
```

**광고 SDK 선택 이유**:
- Google AdMob: 가장 높은 fillRate, 안정적 수익
- Meta Audience Network: 경쟁 입찰로 eCPM 향상

### 2.2 백엔드
```
- Next.js API Routes (서버리스 우선)
- PostgreSQL (음악 메타데이터, 광고 로그)
- Redis (캐싱, 세션, 광고 빈도 제어)
- Prisma ORM
- Bull Queue (광고 로그 배치 처리)
```

### 2.3 인프라
```
- VPS: 141.164.60.51 (one-q.xyz)
- 음원 스토리지: AWS S3 or Cloudflare R2
- CDN: Cloudflare
- 컨테이너: Podman
- 프로세스 관리: PM2
- 광고 분석: Google Analytics 4, AdMob Dashboard
```

### 2.4 Architecture 다이어그램

```
[React Native App]
  ├─ AdMob SDK
  └─ Meta SDK
       ↓
[API Gateway - Next.js]
  ├─ /api/ads/log (광고 노출 기록)
  └─ /api/subscription (구독 관리)
       ↓
   ┌───┴───┐
   ↓       ↓
[PostgreSQL] [Redis Cache]
   ↓           ↓
   ├─ AdImpressions (광고 로그)
   └─ Ad Frequency Control (빈도 제한)
       ↓
[S3/R2 음원 스토리지]
       ↓
[Cloudflare CDN]
```

---

## 🎨 3. UI/UX 설계

### 3.1 디자인 시스템

**컬러 팔레트**:
```
Primary: #00E19C (Bright Green)
Background: #0A0E0D (Deep Black-Green)
Card: #1A2421 (Dark Green)
Text Primary: #FFFFFF
Text Secondary: #A0B0AA
Accent: #00FFB3 (Glow Effect)
Ad Banner: #1F2B27 (구분되는 어두운 톤)
Premium Badge: #FFD700 (Gold)
```

**타이포그래피**:
- Title: Pretendard Bold 24px
- Subtitle: Pretendard Medium 16px
- Body: Pretendard Regular 14px
- Ad Label: Pretendard Regular 10px (50% opacity)

**디자인 원칙**:
- 카드 radius: 16px
- 요소 간 여백: 최소 16px
- 터치 타겟: 최소 48x48px
- 다크모드 기본 적용
- 광고는 콘텐츠와 시각적으로 구분 (라벨 필수)

### 3.2 화면 구조

#### 홈 화면 (광고 배너 포함)
```
┌─────────────────────────┐
│ [Logo]         [Profile]│
├─────────────────────────┤
│                         │
│  🎧 지금의 분위기       │
│  └─ 3개 추천 카드       │
│                         │
│  🌿 테마별 음악         │
│  └─ 6개 그리드          │
│                         │
│  📻 최근 재생           │
│  └─ 가로 스크롤 리스트  │
│                         │
│  🔥 인기 음악           │
│  └─ 가로 스크롤 리스트  │
│                         │
├─────────────────────────┤
│ [광고 배너 - 320x50]    │ ⭐
│ "Ad · 프리미엄으로 제거"│
├─────────────────────────┤
│ [미니 플레이어 바]      │
├─────────────────────────┤
│ 홈 · 탐색 · 내 음악    │
└─────────────────────────┘
```

#### 플레이어 화면 (전체 화면)
```
┌─────────────────────────┐
│       [< 닫기]          │
│                         │
│   [대형 앨범 커버]      │
│                         │
│   Track Title           │
│   Category              │
│                         │
│  [━━━━━●━━━━━━]        │
│  00:42      04:23       │
│                         │
│  [◁◁]  [▶]  [▷▷]      │
│                         │
│  [♡]  [순환]  [···]    │
│                         │
│  (다음: 광고 재생 예정) │ ⭐ 무료 사용자
│  [광고 보고 Skip하기]   │
└─────────────────────────┘
```

#### 광고 재생 화면 (오디오 광고)
```
┌─────────────────────────┐
│                         │
│      🔊 광고 재생       │
│                         │
│  "15초 후 음악이        │
│   계속 재생됩니다"      │
│                         │
│   ━━━━●━━━━━━          │
│   5초        15초       │
│                         │
│   [Skip 광고] (5초 후)  │
│                         │
│   ─────────────────     │
│   광고 없이 듣고 싶다면?│
│   [프리미엄 알아보기]   │
└─────────────────────────┘
```

#### 온보딩 화면 (수정)
```
[화면 1: 사용 목적] ⭐ 신규
┌─────────────────────────┐
│  어떻게 사용하실 건가요? │
│                         │
│  ┌─────────────────┐   │
│  │  👤 개인 사용    │   │
│  │  집중, 수면, 명상│   │
│  └─────────────────┘   │
│                         │
│  ┌─────────────────┐   │
│  │  🏢 비즈니스 사용│   │
│  │  카페, 샵 배경음악│  │
│  └─────────────────┘   │
└─────────────────────────┘

[화면 2-1: 개인 - 직업 선택]
[화면 2-2: 비즈니스 - 업종 선택] ⭐ 신규
┌─────────────────────────┐
│  어떤 공간인가요?        │
│                         │
│  ☕ 카페/베이커리        │
│  💆 마사지/스파          │
│  🧘 요가/필라테스        │
│  💇 미용실/네일샵        │
│  📚 서점/북카페          │
│  🎨 갤러리/작업실        │
│  🏨 호텔/펜션            │
│  ➕ 기타                │
└─────────────────────────┘

[화면 3: 테마 선택]
[화면 4: 가입 / 게스트]
```

#### 비즈니스 설정 화면 ⭐ 신규
```
┌─────────────────────────┐
│  🏢 비즈니스 모드       │
├─────────────────────────┤
│                         │
│  현재 플랜: 무료        │
│  └─ 3곡당 1회 광고 재생 │
│                         │
│  [비즈니스 플랜으로     │
│   업그레이드 $19.99/월] │
│                         │
│  ──────────────────     │
│                         │
│  ⏰ 시간대별 플레이리스트│
│  ┌──────────────────┐  │
│  │ 오픈 (09:00)     │  │
│  │ → 활기찬 아침    │  │
│  ├──────────────────┤  │
│  │ 점심 (12:00)     │  │
│  │ → 편안한 재즈    │  │
│  ├──────────────────┤  │
│  │ 저녁 (18:00)     │  │
│  │ → 차분한 힐링    │  │
│  └──────────────────┘  │
│                         │
│  🔊 볼륨 스케줄러       │
│  ┌──────────────────┐  │
│  │ 오전: 60%        │  │
│  │ 오후: 50%        │  │
│  │ 저녁: 70%        │  │
│  └──────────────────┘  │
│                         │
│  🔁 연속 재생 모드      │
│  [ON] 플레이리스트 반복 │
│                         │
└─────────────────────────┘
```

---

## 💾 4. 데이터베이스 설계

### 4.1 ERD (Entity Relationship Diagram)

```
Users
├─ id (PK)
├─ email (unique)
├─ name
├─ user_type (personal | business) ⭐
├─ occupation (직업, personal만)
├─ business_type (업종, business만) ⭐
├─ preferred_themes (JSON)
├─ subscription_tier (free | premium | business) ⭐
├─ subscription_end_date ⭐
├─ ad_free_until (보상형 광고 시청 시) ⭐
├─ created_at
└─ updated_at

Tracks
├─ id (PK)
├─ title
├─ file_url (S3 경로)
├─ thumbnail_url
├─ duration (초)
├─ bpm
├─ tags (JSON: ["집중", "아침"])
├─ occupation_tags (JSON)
├─ business_tags (JSON: ["cafe", "massage"]) ⭐
├─ play_count
├─ license_info (로열티 프리 증명)
├─ created_at
└─ updated_at

Playlists
├─ id (PK)
├─ name
├─ description
├─ type (auto_generated | manual | business_template) ⭐
├─ theme
├─ time_slot (morning | afternoon | evening | night) ⭐
├─ cover_image
└─ created_at

PlaylistTracks (중간 테이블)
├─ playlist_id (FK)
├─ track_id (FK)
└─ position

PlayHistory
├─ id (PK)
├─ user_id (FK)
├─ track_id (FK)
├─ played_at
├─ completion_rate (재생 완료율 %)
├─ device_type
├─ was_ad_shown (광고 표시 여부) ⭐
└─ session_duration (세션 총 재생 시간) ⭐

Favorites
├─ user_id (FK)
├─ track_id (FK)
└─ created_at

AdImpressions ⭐ 신규
├─ id (PK)
├─ user_id (FK, nullable)
├─ ad_unit_id (AdMob 광고 단위 ID)
├─ ad_type (audio | banner | rewarded)
├─ ad_provider (admob | meta)
├─ impression_time (노출 시각)
├─ clicked (boolean)
├─ completed (오디오/비디오만)
├─ skipped (boolean)
├─ estimated_revenue (예상 수익)
├─ device_type
└─ created_at

BusinessSchedules ⭐ 신규
├─ id (PK)
├─ user_id (FK)
├─ time_slot (morning | lunch | afternoon | evening | night)
├─ start_time (HH:MM)
├─ playlist_id (FK)
├─ volume_level (0-100)
└─ is_active (boolean)

Subscriptions ⭐ 신규
├─ id (PK)
├─ user_id (FK)
├─ plan_type (premium | business)
├─ status (active | canceled | expired)
├─ started_at
├─ expires_at
├─ payment_method
├─ amount
└─ created_at
```

### 4.2 인덱스 전략
```sql
-- 기존 인덱스
CREATE INDEX idx_tracks_tags ON tracks USING GIN(tags);
CREATE INDEX idx_tracks_occupation ON tracks USING GIN(occupation_tags);
CREATE INDEX idx_play_history_user_date ON play_history(user_id, played_at DESC);
CREATE INDEX idx_tracks_play_count ON tracks(play_count DESC);

-- 신규 인덱스 (광고/비즈니스)
CREATE INDEX idx_tracks_business_tags ON tracks USING GIN(business_tags);
CREATE INDEX idx_ad_impressions_user_time ON ad_impressions(user_id, impression_time DESC);
CREATE INDEX idx_users_subscription ON users(subscription_tier, subscription_end_date);
CREATE INDEX idx_business_schedules_user ON business_schedules(user_id, is_active);
```

---

## 🔐 5. 보안 및 정책

### 5.1 인증/인가
```
- JWT 기반 인증 (Access Token 15분, Refresh Token 7일)
- httpOnly 쿠키 사용
- 소셜 로그인: Google, Apple (선택)
- 게스트 모드 지원 (익명 재생 가능, 이력 저장 안 됨, 광고 최대 빈도)
```

### 5.2 데이터 보안
| 항목 | 조치 |
|------|------|
| 개인정보 암호화 | AES-256 (email, name) |
| 통신 암호화 | TLS 1.3 |
| 비밀번호 해싱 | bcrypt (cost 12) |
| API Rate Limiting | 100 req/min per IP |
| SQL Injection 방지 | Prisma ORM (Prepared Statements) |
| 결제 정보 | PCI-DSS 준수, Stripe 사용 (카드 정보 미저장) |

### 5.3 저작권 및 라이선스

#### 음원 라이선스
- **음원 출처 명시 필수**: 각 트랙에 `license_info` 필드 추가
- **로열티 프리 음원만 사용**: Epidemic Sound, Artlist, AudioJungle
- **음원 다운로드 방지**: 스트리밍 전용, DRM 적용 고려
- **관리자 업로드 시 라이선스 증명 첨부 필수**

#### 상업용 라이선스
비즈니스 플랜 가입 시 제공:
- 공연권(Performance Rights) 포함
- ASCAP/BMI/SESAC 라이선스 불필요 (로열티 프리 음원 기반)
- 라이선스 증명서 PDF 발급
- 업종별 사용 가능 범위 명시:
  - ✅ 카페, 레스토랑, 마사지샵, 요가 스튜디오, 미용실 등
  - ❌ 클럽, 페스티벌, 라디오 방송 (별도 계약 필요)

#### 저작권 분쟁 대응
```
1. 신고 접수: report@healingmusic.app
2. 24시간 내 해당 음원 일시 중단
3. 라이선스 검증 (7일 이내)
4. 문제 확인 시 영구 삭제 + 사용자 환불
```

### 5.4 개인정보 처리방침
- 최소 수집 원칙: 이메일, 직업/업종만 필수
- 재생 이력 90일 후 자동 삭제 옵션 제공
- 광고 데이터: 익명화 30일 후 집계 데이터만 보관
- 회원 탈퇴 시 즉시 삭제 (백업 제외)
- GDPR 대응: 데이터 다운로드 기능 제공

### 5.5 콘텐츠 정책
```
금지 콘텐츠:
- 저작권 침해 음원
- 정치적·종교적 메시지 포함 음원
- 불쾌한 소음 (screamer 등)
- 성적 암시가 있는 ASMR

품질 기준:
- 최소 128kbps (권장 256kbps)
- 파일 형식: MP3, AAC
- 최대 파일 크기: 50MB
```

### 5.6 광고 정책 ⭐ 신규

#### 허용 광고 카테고리
- 웰니스 제품 (영양제, 운동기구)
- 교육 서비스 (온라인 강의, 언어 학습)
- 라이프스타일 앱
- 친환경 제품
- 금융 서비스 (투자, 보험)

#### 금지 광고 카테고리
- 알코올, 담배, 도박
- 정치·종교 광고
- 성인 콘텐츠
- 공포·폭력적 이미지
- 시끄럽거나 불쾌한 사운드

#### 광고 검수 프로세스
```
1. Google AdMob 자동 필터링
2. 사용자 신고 시 수동 검토 (24시간 내)
3. 문제 광고 블랙리스트 등록
4. 광고주에게 재발 방지 요청
```

---

## 📊 6. 광고 전략 및 사용자 경험

### 6.1 광고 삽입 원칙

#### 핵심 원칙: 음악 경험 최우선
- **트랙 중간 삽입 절대 금지**
- **트랙 종료 후에만 광고 재생**
- **수면 모드에서는 광고 비활성화**
- **광고 전 3초 예고 (선택적 Skip 가능)**

#### 광고 빈도 제어

| 사용자 타입 | 광고 빈도 | 설명 |
|------------|---------|------|
| 게스트 | 3곡당 1회 | 최대 빈도 |
| 무료 회원 | 4곡당 1회 | 기본 |
| 무료 회원 (로열티 높음) | 5곡당 1회 | 7일 연속 접속 시 |
| 비즈니스 무료 | 3곡당 1회 | 손님 경험 고려 빈도 |
| 보상형 광고 시청 | 1시간 무광고 | 15초 비디오 광고 |
| 프리미엄 | 광고 없음 | - |
| 비즈니스 플랜 | 광고 없음 | - |

#### 광고 타입별 전략

**1. 오디오 광고 (Audio Ads)**
- 길이: 15초 (최대 30초)
- 삽입 위치: 트랙 종료 후
- Skip 가능: 5초 후
- 예고: "잠시 후 15초 광고가 재생됩니다"
- 볼륨: 트랙 평균 볼륨의 80% (갑작스러운 큰 소리 방지)

**2. 배너 광고 (Banner Ads)**
- 위치: 홈 화면 하단 (미니 플레이어 위)
- 크기: 320x50 (모바일 표준)
- 새로고침: 30초마다
- 닫기 버튼: 제공 (광고 수익 감소 감수)
- 디자인: 앱 테마와 조화 (어두운 배경)

**3. 보상형 광고 (Rewarded Ads)**
- 형식: 15-30초 비디오
- 보상: 1시간 무광고 재생
- 제공 위치: 
  - 플레이어 화면 하단 버튼
  - 광고 재생 직전 "광고 Skip" 옵션
- 일일 제한: 5회 (최대 5시간 무광고)

#### 광고 예외 상황

| 상황 | 광고 처리 |
|------|----------|
| 수면 모드 활성화 | 광고 완전 비활성화 |
| 타이머 설정 (30분 이하) | 광고 없음 |
| 첫 세션 (신규 사용자) | 처음 30분 광고 없음 |
| 네트워크 오류 | 광고 Skip, 음악 계속 재생 |
| 광고 로드 실패 | 즉시 다음 트랙 재생 |

### 6.2 광고 수익 최적화 전략

#### A/B 테스트 항목
```
1. 광고 빈도
   - A: 3곡당 1회 vs B: 5곡당 1회
   - 측정: 이탈률, ARPU

2. 광고 길이
   - A: 15초 vs B: 30초
   - 측정: Skip률, eCPM

3. 보상형 광고 위치
   - A: 플레이어 내 vs B: 광고 재생 직전
   - 측정: 시청 완료율

4. 배너 위치
   - A: 상단 vs B: 하단
   - 측정: CTR, 사용자 불만
```

#### 프리미엄 전환 유도

**무료 → 프리미엄 전환 포인트**
```
1. 광고 재생 직전
   "광고 없이 듣고 싶다면? 프리미엄 7일 무료 체험"

2. 5번째 광고 시청 후
   "오늘 이미 5번의 광고를 시청하셨어요. 프리미엄은 $4.99/월"

3. 수면 모드 진입 시
   "수면 중에는 광고가 재생되지 않아요. 
    언제나 광고 없이 듣고 싶다면 프리미엄을 추천해요"

4. 비즈니스 사용자 감지 시 (8시간+ 연속 재생)
   "비즈니스로 사용 중이신가요? 
    비즈니스 플랜으로 고객 경험을 향상시키세요"
```

**전환율 목표**
- 무료 → 프리미엄: 5%
- 무료 → 비즈니스: 3% (비즈니스 사용자 중 80%)
- 총 전환율: 8%

### 6.3 광고 데이터 분석

#### 추적 지표
```sql
-- 일일 광고 리포트
SELECT 
  DATE(impression_time) as date,
  ad_type,
  COUNT(*) as impressions,
  SUM(CASE WHEN clicked THEN 1 ELSE 0 END) as clicks,
  SUM(CASE WHEN completed THEN 1 ELSE 0 END) as completions,
  SUM(CASE WHEN skipped THEN 1 ELSE 0 END) as skips,
  SUM(estimated_revenue) as revenue,
  AVG(estimated_revenue) as avg_revenue_per_impression
FROM ad_impressions
WHERE impression_time >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(impression_time), ad_type
ORDER BY date DESC, impressions DESC;
```

#### 대시보드 지표
- **일일 광고 수익**: 실시간 집계
- **eCPM 트렌드**: 7일/30일 추이
- **광고 완료율**: 오디오/비디오별
- **Skip률**: 타겟 <30%
- **프리미엄 전환율**: 광고 노출 후 24시간 내

---

## ⚙️ 7. 기능 정의 및 예외 처리

### 7.1 음악 재생 기능

| 기능 | 정의 | 예외 처리 |
|------|------|-----------|
| 스트리밍 재생 | 네트워크를 통한 실시간 재생 | 네트워크 끊김 → 버퍼링 3초 대기 → 재연결 시도 → 실패 시 오프라인 알림 |
| 백그라운드 재생 | 앱이 백그라운드에 있어도 재생 지속 | iOS: Audio Session 설정, Android: Foreground Service |
| 광고 재생 | 트랙 종료 후 광고 삽입 | 광고 로드 실패 → Skip하고 다음 트랙, 네트워크 오류 → 광고 없이 계속 |
| 오프라인 모드 | 미리 캐시된 음악 재생 (Phase 2) | 저장 공간 부족 → 경고 메시지, 프리미엄 전용 기능 |
| 자동 재생 | 트랙 종료 시 다음 트랙 자동 시작 | 플레이리스트 끝 → 추천 음악 자동 생성 |
| 크로스페이드 | 트랙 간 부드러운 전환 (선택 기능) | 하드웨어 제약 → 기능 비활성화 |

### 7.2 추천 알고리즘

#### 입력 변수
- 사용자 타입 (개인 / 비즈니스)
- 직업 또는 업종
- 현재 시간대
- 최근 재생 이력 (5개)
- 즐겨찾기 태그
- 구독 상태 (광고 빈도 조절)

#### 추천 로직

**개인 사용자**
```
1. 직업별 기본 추천 (30%)
   - 개발자 → 집중, Flow 음악 (BPM 60-80)
   - 디자이너 → 창의성, 영감 (BPM 80-100)
   - 작가 → 정적, 클래식 (BPM 50-70)
   
2. 시간대별 추천 (30%)
   - 06:00-09:00 → 아침 활력 (밝은 톤)
   - 09:00-18:00 → 집중, 업무
   - 18:00-22:00 → 회복, 편안함
   - 22:00-06:00 → 수면 (BPM 40-60)
   
3. 이력 기반 추천 (30%)
   - 협업 필터링 (유사 사용자 패턴)
   - 완료율 높은 트랙 우선
   
4. 랜덤 발견 (10%)
   - 새로운 음악 노출
```

**비즈니스 사용자** ⭐
```
1. 업종별 추천 (40%)
   - 카페 → 어쿠스틱, 재즈 (BPM 80-100)
   - 마사지 → 힐링, 명상 (BPM 50-70)
   - 요가 → 정적, 자연 사운드 (BPM 40-60)
   - 미용실 → 팝, 인디 (BPM 90-110)
   
2. 시간대별 자동 전환 (40%)
   - 사용자 설정 스케줄 우선
   - 미설정 시 기본 템플릿 적용
   
3. 연속 재생 최적화 (20%)
   - 같은 트랙 반복 최소화
   - 플레이리스트 50곡 이상 자동 생성
```

#### 예외 처리
- 신규 사용자 (이력 없음) → 직업/업종 + 시간대만 활용
- 비정상 패턴 (24시간 연속 재생) → 로그 기록, 추천 가중치 조정 안 함
- 비즈니스 사용자 게스트 모드 → "비즈니스로 사용 중이신가요?" 팝업

### 7.3 검색 기능

**검색 대상**:
- 트랙 제목
- 테마 태그
- 직업/업종 태그
- 아티스트명 (Phase 2)

**검색 방식**:
- PostgreSQL Full-Text Search
- 초성 검색 지원 (한글)
  - 예: "ㅈㅈㅇㅇ" → "집중음악"
- 영문 자동완성

**예외 처리**:
| 상황 | 처리 방법 |
|------|----------|
| 검색 결과 없음 | "비슷한 음악" 제안 (유사도 70% 이상) |
| 검색어 2자 미만 | 검색 비활성화 (성능 이슈 방지) |
| 동시 검색 요청 다수 | Debounce 500ms 적용 |

### 7.4 비즈니스 전용 기능 ⭐

#### 시간대별 플레이리스트 자동 전환
```javascript
// 스케줄 예시
const schedules = [
  { 
    time: "09:00", 
    playlist: "카페 오픈 - 활기찬 아침",
    volume: 60
  },
  { 
    time: "12:00", 
    playlist: "점심 시간 - 편안한 재즈",
    volume: 50
  },
  { 
    time: "15:00", 
    playlist: "오후 - 차분한 어쿠스틱",
    volume: 55
  },
  { 
    time: "18:00", 
    playlist: "저녁 - 감성 인디",
    volume: 65
  }
];
```

**작동 방식**:
- 백그라운드에서 시간 체크 (1분마다)
- 설정 시간 도달 시 현재 트랙 종료 후 전환
- 페이드 아웃/인 효과 (5초)
- 오프라인 시 다음 접속 시 적용

**예외 처리**:
- 플레이리스트 없음 → 기본 템플릿 자동 적용
- 시간 중복 → 가장 최근 설정 우선
- 네트워크 오류 → 현재 플레이리스트 유지

#### 연속 재생 모드
- 플레이리스트 끝 도달 → 처음부터 반복
- 최소 50곡 이상 플레이리스트 자동 생성
- 같은 트랙 연속 재생 방지 (최소 10곡 간격)

#### 볼륨 스케줄러
- 시간대별 볼륨 자동 조절 (0-100%)
- 페이드 효과로 부드럽게 전환 (30초)
- 수동 조절 시 스케줄 일시 정지

### 7.5 관리자 기능

| 기능 | 상세 | 예외 처리 |
|------|------|-----------|
| 음원 업로드 | MP3/AAC, 최대 50MB | 파일 형식 오류 → 변환 도구 안내 |
| 메타데이터 입력 | 제목, 태그, 직업, 업종, BPM | 필수 필드 누락 → 업로드 차단 |
| 음원 순서 조정 | 드래그 앤 드롭 | 순서 충돌 → 자동 재정렬 |
| 벌크 업로드 | CSV + ZIP 파일 | 10개 중 3개 실패 → 실패 목록 다운로드 |
| 통계 조회 | 재생수, 완료율, 인기 시간대, 광고 수익 | 데이터 없음 → "분석 중" 표시 |
| 광고 수익 대시보드 | 일일/주간/월간 수익, eCPM 트렌드 | AdMob API 오류 → 캐시 데이터 표시 |
| 음원 삭제 | Soft Delete (복구 가능 30일) | 플레이리스트에 포함 시 경고 |
| 사용자 관리 | 구독 상태, 비즈니스 플랜 승인 | 결제 오류 → 고객 지원 안내 |

---

## 🌐 8. 외부 API 연동 및 확장성

### 8.1 현재 연동 (MVP)

**필수 연동**:
- **S3/R2 API**: 음원 스토리지
- **Cloudflare API**: CDN 캐시 제어
- **Google AdMob API**: 광고 노출, 수익 조회 ⭐
- **Meta Audience Network API**: 광고 노출 (보조) ⭐
- **Stripe API**: 구독 결제 처리 ⭐

### 8.2 확장 가능 API (Phase 2)

| API | 목적 | 우선순위 |
|-----|------|----------|
| Google Analytics 4 | 사용자 행동 분석, 광고 효율 측정 | 상 |
| Adjust/AppsFlyer | 앱 마케팅 어트리뷰션 | 상 |
| Spotify API | 힐링 플레이리스트 분석, 유사 음악 추천 | 중 |
| Last.fm API | 음악 태깅, 메타데이터 보강 | 하 |
| Apple Music API | 크로스 플랫폼 동기화 | 중 |
| Notion API | 개인 명상 일지 연동 | 하 |
| Google Calendar API | 루틴 알림 설정, 비즈니스 스케줄 동기화 | 중 |
| Slack/Discord Webhook | 관리자 알림 (재생 폭증, 광고 수익 이상) | 상 |

### 8.3 API 설계 원칙

**RESTful 엔드포인트 예시**:
```
GET    /api/tracks              # 전체 트랙 리스트
GET    /api/tracks/:id          # 단일 트랙 조회
POST   /api/tracks              # 트랙 생성 (관리자)
PATCH  /api/tracks/:id          # 트랙 수정
DELETE /api/tracks/:id          # 트랙 삭제 (Soft)

GET    /api/playlists           # 플레이리스트 목록
POST   /api/playlists/auto      # 자동 생성 요청
GET    /api/playlists/business  # 비즈니스 템플릿 ⭐

GET    /api/recommend           # 추천 음악
  ?user_type=business
  &business_type=cafe
  &time=morning
  &limit=10

POST   /api/play-history        # 재생 기록 저장
GET    /api/play-history/me     # 내 재생 이력

POST   /api/ads/impression      # 광고 노출 기록 ⭐
POST   /api/ads/reward          # 보상형 광고 시청 완료 ⭐
GET    /api/ads/status          # 광고 없는 시간 남음 확인 ⭐

POST   /api/subscription        # 구독 시작 ⭐
DELETE /api/subscription        # 구독 취소 ⭐
GET    /api/subscription/status # 구독 상태 조회 ⭐

GET    /api/business/schedule   # 비즈니스 스케줄 조회 ⭐
POST   /api/business/schedule   # 스케줄 생성/수정 ⭐

GET    /api/admin/stats         # 관리자 통계
GET    /api/admin/revenue       # 광고 수익 대시보드 ⭐
POST   /api/admin/upload        # 음원 업로드
```

**확장성 보장**:
- **버저닝**: `/api/v1/tracks` (향후 v2 추가 가능)
- **Pagination**: `?page=1&limit=20`
- **필터링**: `?theme=focus&bpm=60-80&business_type=cafe`
- **응답 포맷 통일**:
  ```json
  {
    "success": true,
    "data": { ... },
    "meta": {
      "page": 1,
      "total": 100,
      "has_next": true
    },
    "ad_config": {
      "next_ad_in": 2,
      "ad_free_until": null
    }
  }
  ```

---

## 🖥️ 9. 서버 구성 및 사양

### 9.1 동접자 예측 및 목표

**Phase 1 (MVP)**:
- 목표 동접: 100명
- 일일 활성 사용자(DAU): 500명
- 평균 세션 시간: 15분
- 비즈니스 사용자 비율: 15% (75명)

**Phase 2 (6개월 후)**:
- 목표 동접: 1,000명
- DAU: 5,000명
- 비즈니스 사용자: 750명

**Phase 3 (1년 후)**:
- 목표 동접: 5,000명
- DAU: 20,000명
- 비즈니스 사용자: 3,000명

### 9.2 서버 사양 (VPS 기준)

#### MVP 단계 (동접 100명)
```
VPS Spec:
- CPU: 4 vCPU
- RAM: 8GB
- Storage: 100GB SSD
- Network: 10TB/month

PostgreSQL:
- Shared Pool: 2GB
- Max Connections: 100

Redis:
- Max Memory: 1GB
- Eviction Policy: allkeys-lru
- 용도: 세션, 캐싱, 광고 빈도 제어

추정 비용: $40/month (Vultr, Linode 기준)
```

#### 부하 계산
```
동접 100명 기준:
- API 요청: ~600 req/min (음악 메타데이터, 추천, 광고 로그)
- 스트리밍: 100 concurrent streams × 256kbps = 25.6 Mbps
- DB 쿼리: ~120 qps (캐싱 후)
- 광고 API 호출: ~20 req/min (AdMob, Meta)

→ 현재 VPS 사양으로 충분 (여유율 250%)
```

#### Scale-Up 시점
| 지표 | 임계값 | 조치 |
|------|--------|------|
| CPU 사용률 | 70% 지속 | vCPU +2 |
| RAM 사용률 | 80% 지속 | RAM +4GB |
| DB Connection | 80개 초과 | Connection Pool 확장 |
| 네트워크 대역폭 | 8TB/month | CDN 완전 이전 |
| Redis Memory | 800MB | Max Memory +512MB |

### 9.3 확장 전략

#### Horizontal Scaling (동접 1,000명 이상)
```
Architecture:
[Load Balancer - Nginx]
       ↓
┌──────┴──────┐
↓             ↓
[API Server 1] [API Server 2]
       ↓
[PostgreSQL Master]
       ↓
[PostgreSQL Replica 1]
       ↓
[Redis Cluster]
       ↓
[Bull Queue - 광고 로그 배치]
```

**도입 시점**: DAU 5,000명 돌파 시

#### CDN 전략
```
음원 파일:
- Cloudflare R2 (무료 Egress)
- Cache-Control: max-age=31536000 (1년)
- 지역별 엣지 서버 활용

API 응답 캐싱:
- Redis: 추천 음악 (5분)
- Redis: 플레이리스트 (30분)
- Redis: 트랙 메타데이터 (1시간)
- Redis: 광고 설정 (10분)
```

### 9.4 모니터링 및 알림

**모니터링 도구**:
- **Uptime Monitoring**: UptimeRobot (무료)
- **APM**: New Relic or Datadog (Lite 플랜)
- **로그**: Loki + Grafana (자체 호스팅)
- **광고 대시보드**: Google AdMob Console, 자체 대시보드

**알림 설정**:
| 이벤트 | 조건 | 알림 채널 |
|--------|------|-----------|
| 서버 다운 | 5분 이상 무응답 | Slack Webhook + SMS |
| 높은 오류율 | 5xx 에러 10회/분 | Email |
| 디스크 부족 | 저장공간 90% | Slack |
| 비정상 트래픽 | API 요청 1000/분 | Slack |
| 광고 수익 급락 | 전일 대비 50% 감소 | Slack + Email |
| 광고 로드 실패 | 성공률 80% 미만 | Slack |
| 결제 오류 | 실패율 10% 이상 | Slack + Email |

---

## 📱 10. 앱 기능 명세

### 10.1 기능 우선순위

| 우선순위 | 기능 | MVP 포함 여부 |
|----------|------|---------------|
| P0 (필수) | 음악 스트리밍 재생 | ✅ |
| P0 | 광고 삽입 및 표시 | ✅ |
| P0 | 테마별 음악 탐색 | ✅ |
| P0 | 추천 시스템 | ✅ |
| P0 | 백그라운드 재생 | ✅ |
| P0 | 구독 결제 (Stripe) | ✅ |
| P1 (중요) | 재생 이력 | ✅ |
| P1 | 즐겨찾기 | ✅ |
| P1 | 검색 | ✅ |
| P1 | 비즈니스 모드 기본 기능 | ✅ |
| P2 (추후) | 시간대별 자동 전환 | ❌ (Phase 2) |
| P2 | 오프라인 모드 | ❌ (Phase 2) |
| P2 | 루틴 알림 | ❌ (Phase 2) |
| P2 | 소셜 공유 | ❌ (Phase 2) |
| P3 (확장) | 명상 일지 | ❌ (Phase 3) |

### 10.2 사용자 플로우

#### 첫 실행 (온보딩)
```
1. 스플래시 화면 (1초)
   ↓
2. 사용 목적 선택 ⭐ 신규
   - 👤 개인 사용
   - 🏢 비즈니스 사용
   ↓
3-1. [개인] 직업 선택
   - 개발자
   - 디자이너
   - 작가
   - 학생
   - 기타
   ↓
3-2. [비즈니스] 업종 선택 ⭐ 신규
   - ☕ 카페/베이커리
   - 💆 마사지/스파
   - 🧘 요가/필라테스
   - 💇 미용실/네일샵
   - 📚 서점/북카페
   - 🎨 갤러리/작업실
   - 🏨 호텔/펜션
   - ➕ 기타
   ↓
4. 선호 테마 선택 (최대 2개)
   - 집중
   - 편안함
   - 수면
   - 아침 활력
   ↓
5. 회원가입 / 로그인 / 게스트 계속
   (비즈니스 사용자는 회원가입 유도)
   ↓
6. [비즈니스만] 무료 체험 안내
   "14일 무료로 비즈니스 플랜을 체험해보세요!"
   ↓
7. 홈 화면 진입
```

#### 음악 재생 플로우 (광고 포함)
```
홈 화면 → 음악 카드 탭
   ↓
미니 플레이어 바 표시
   ↓
재생 시작
   ↓
[3-5곡 후]
   ↓
"잠시 후 광고가 재생됩니다" (3초 예고)
   ↓
광고 재생 (15초, 5초 후 Skip 가능)
   ↓
   ├─ [Skip] → 다음 트랙 재생
   └─ [보상형 광고 시청] → 1시간 무광고
   ↓
음악 계속 재생
   ↓
(선택) 미니 플레이어 탭 → 전체 화면 플레이어
   ↓
백그라운드 재생 지속
```

#### 프리미엄 구독 플로우
```
프리미엄 버튼 탭 (홈/설정/광고 화면)
   ↓
플랜 선택
   ├─ 개인 프리미엄 $4.99/월
   └─ 비즈니스 플랜 $19.99/월
   ↓
Stripe 결제 화면
   ↓
결제 완료
   ↓
구독 활성화 (즉시 광고 제거)
   ↓
환영 화면 "프리미엄 회원이 되신 것을 축하합니다!"
```

#### 비즈니스 스케줄 설정 플로우 ⭐
```
설정 → 비즈니스 모드
   ↓
시간대별 플레이리스트 설정
   ↓
시간대 추가 (예: 오전 9시)
   ↓
플레이리스트 선택
   - 기존 플레이리스트
   - 새로 만들기
   - 템플릿 사용 (카페 아침 추천)
   ↓
볼륨 설정 (0-100%)
   ↓
저장
   ↓
자동 전환 시작
```

#### 관리자 플로우
```
관리자 로그인
   ↓
대시보드 (통계 확인)
   ├─ 재생수
   ├─ 광고 수익 (일/주/월)
   ├─ 구독자 수
   └─ 이탈률
   ↓
음원 업로드
   - 파일 선택
   - 제목, 설명 입력
   - 태그 선택 (직업/테마/업종)
   - BPM 입력
   - 썸네일 업로드
   - 라이선스 정보 입력
   ↓
업로드 완료 → S3 저장 → DB 저장
   ↓
자동으로 추천 시스템에 반영
```

---

## 🚀 11. 개발 로드맵

### Phase 1: MVP (6-8주)

**Week 1-2: 백엔드 개발**
- [ ] PostgreSQL 스키마 설계 및 마이그레이션 (광고, 구독 테이블 포함)
- [ ] Prisma ORM 설정
- [ ] API 엔드포인트 개발 (트랙, 플레이리스트, 광고, 구독)
- [ ] S3/R2 연동
- [ ] JWT 인증 구현
- [ ] Stripe 결제 연동
- [ ] AdMob API 연동

**Week 3-4: 프론트엔드 개발**
- [ ] React Native 프로젝트 초기 설정
- [ ] UI 컴포넌트 라이브러리 구축
- [ ] 온보딩 화면 개발 (개인/비즈니스 분기)
- [ ] 홈 화면 개발 (광고 배너 포함)
- [ ] 플레이어 화면 개발
- [ ] React Native Track Player 연동
- [ ] Google AdMob SDK 통합
- [ ] 광고 재생 화면 구현

**Week 5: 통합 및 테스트**
- [ ] API 통합
- [ ] 추천 알고리즘 구현 (개인/비즈니스 분리)
- [ ] 광고 삽입 로직 구현
- [ ] 백그라운드 재생 테스트
- [ ] iOS/Android 빌드 테스트
- [ ] 광고 빈도 제어 테스트

**Week 6-7: 결제 및 비즈니스 기능**
- [ ] Stripe 구독 결제 화면
- [ ] 프리미엄 전환 로직
- [ ] 비즈니스 모드 기본 UI
- [ ] 연속 재생 모드
- [ ] 보상형 광고 구현

**Week 8: 관리자 페이지 & 출시 준비**
- [ ] 관리자 대시보드 개발
- [ ] 광고 수익 리포트
- [ ] 음원 업로드 기능
- [ ] 통계 시각화
- [ ] 앱 스토어 제출 준비
- [ ] 법률 문서 준비 (이용약관, 개인정보처리방침)

### Phase 2: 확장 (3-6개월 후)
- [ ] 시간대별 자동 플레이리스트 전환
- [ ] 볼륨 스케줄러
- [ ] 오프라인 모드 (프리미엄 전용)
- [ ] 루틴 알림
- [ ] 소셜 공유
- [ ] 다국어 지원 (영어)
- [ ] 비즈니스 템플릿 라이브러리 확대

### Phase 3: 고도화 (6-12개월 후)
- [ ] AI 기반 감정 인식 추천
- [ ] 명상 일지 기능
- [ ] 커뮤니티 플레이리스트
- [ ] B2B 기업 라이선스
- [ ] 하드웨어 파트너십 (블루투스 스피커)
- [ ] 아티스트 파트너십 프로그램

---

## 📊 12. 성공 지표 (KPI)

### 12.1 사용자 지표

| 지표 | 목표 (3개월) | 측정 방법 |
|------|--------------|-----------|
| DAU | 500명 | Google Analytics |
| MAU | 2,000명 | Google Analytics |
| 평균 세션 시간 | 15분 (개인), 8시간 (비즈니스) | 자체 로그 |
| 재생 완료율 | 70% | PlayHistory 테이블 |
| 사용자 유지율 (7일) | 40% | Cohort 분석 |
| 앱 크래시율 | <1% | Sentry |
| API 응답 시간 | <200ms | New Relic |

### 12.2 수익 지표 ⭐

| 지표 | 목표 (3개월) | 측정 방법 |
|------|--------------|-----------|
| 월 광고 수익 | $300 | AdMob Dashboard |
| eCPM | $3-5 | AdMob Dashboard |
| 광고 완료율 | 70% | AdImpressions 테이블 |
| 광고 Skip률 | <30% | AdImpressions 테이블 |
| 프리미엄 전환율 | 5% | Subscriptions 테이블 |
| 비즈니스 플랜 전환율 | 80% (비즈니스 사용자 중) | Subscriptions 테이블 |
| 월 구독 수익 | $200 | Stripe Dashboard |
| 총 MRR (월 반복 수익) | $500 | 광고 + 구독 |
| ARPU (사용자당 평균 수익) | $1 | MRR / MAU |

### 12.3 참여 지표

| 지표 | 목표 (3개월) | 측정 방법 |
|------|--------------|-----------|
| 일평균 트랙 재생 | 10회 | PlayHistory |
| 보상형 광고 시청률 | 15% | AdImpressions |
| 플레이리스트 저장 | 2개/사용자 | Favorites |
| 검색 사용률 | 30% | Search Logs |
| 비즈니스 스케줄 설정률 | 60% (비즈니스 사용자) | BusinessSchedules |

---

## 🛡️ 13. 리스크 관리

| 리스크 | 영향도 | 완화 방안 |
|--------|--------|-----------|
| 음원 저작권 문제 | 🔴 높음 | 로열티 프리 음원만 사용, 라이선스 문서화, 법률 자문 |
| 광고 수익 불안정 | 🟡 중간 | 복수 광고 네트워크, 프리미엄 플랜 조기 출시, 목표 eCPM 지속 모니터링 |
| 상업 공간 저작권 분쟁 | 🔴 높음 | 명확한 라이선스 안내, 비즈니스 플랜 약관 강화, 증명서 발급 |
| 광고로 인한 사용자 이탈 | 🟡 중간 | 광고 빈도 최소화, Skip 기능, 수면 모드 광고 제외, A/B 테스트 |
| 서버 과부하 | 🟡 중간 | 초기 사용자 제한 (베타), 오토 스케일링 준비, CDN 활용 |
| 앱 스토어 승인 거부 | 🟡 중간 | 심사 가이드라인 사전 검토, 콘텐츠 정책 명확화 |
| 결제 오류 (Stripe) | 🟡 중간 | 샌드박스 충분히 테스트, 오류 처리 로직 강화, 고객 지원 준비 |
| 사용자 이탈 | 🟢 낮음 | 초기 온보딩 최적화, 프리미엄 혜택 강화 |
| 개발 지연 | 🟡 중간 | 기능 우선순위 조정, 외주 개발 고려 |
| 광고 품질 저하 | 🟡 중간 | 광고 카테고리 블랙리스트, 사용자 신고 시스템 |

---

## 📝 14. 부록

### 14.1 용어 정의
- **트랙(Track)**: 개별 음악 파일
- **플레이리스트(Playlist)**: 트랙의 모음
- **테마(Theme)**: 음악 분류 기준 (집중, 수면 등)
- **BPM**: Beats Per Minute, 음악의 템포
- **eCPM**: Effective Cost Per Mille, 1,000회 노출당 광고 수익
- **ARPU**: Average Revenue Per User, 사용자당 평균 수익
- **DAU**: Daily Active Users, 일일 활성 사용자
- **MAU**: Monthly Active Users, 월간 활성 사용자
- **MRR**: Monthly Recurring Revenue, 월간 반복 수익
- **보상형 광고**: 광고 시청 대가로 혜택을 주는 광고 형식

### 14.2 참고 자료
- [React Native Track Player 문서](https://react-native-track-player.js.org/)
- [Prisma ORM 문서](https://www.prisma.io/docs)
- [Cloudflare R2 가이드](https://developers.cloudflare.com/r2/)
- [Google AdMob 문서](https://developers.google.com/admob)
- [Stripe 구독 가이드](https://stripe.com/docs/billing/subscriptions/overview)
- [Meta Audience Network](https://developers.facebook.com/docs/audience-network)

### 14.3 법률 문서 체크리스트
- [ ] 이용약관 (Terms of Service)
- [ ] 개인정보 처리방침 (Privacy Policy)
- [ ] 광고 정책 (Ad Policy)
- [ ] 상업용 라이선스 약관 (Commercial License Agreement)
- [ ] 환불 정책 (Refund Policy)
- [ ] 저작권 정책 (Copyright Policy)
- [ ] GDPR 준수 문서 (EU 사용자 대상 시)

### 14.4 변경 이력
| 날짜 | 버전 | 변경 사항 |
|------|------|-----------|
| 2025-11-21 | 1.0 | 초안 작성 |
| 2025-11-21 | 2.0 | 광고 기반 수익 모델 추가, 상업 공간 타겟 추가, 비즈니스 기능 확장 |

---

## ✅ 체크리스트 (출시 전)

### 기술
- [ ] iOS/Android 앱 빌드 성공
- [ ] API 로드 테스트 (100 동접)
- [ ] 광고 SDK 통합 테스트 (AdMob, Meta)
- [ ] Stripe 결제 테스트 (샌드박스)
- [ ] 보안 취약점 스캔
- [ ] 백업 전략 수립
- [ ] 광고 빈도 제어 로직 검증
- [ ] 비즈니스 모드 자동 전환 테스트

### 법률/컴플라이언스
- [ ] 개인정보 처리방침 작성 (GDPR 포함)
- [ ] 이용약관 작성
- [ ] 광고 정책 작성
- [ ] 상업용 라이선스 약관 작성
- [ ] 음원 라이선스 확인 및 문서화
- [ ] 법률 검토 완료
- [ ] 앱 스토어 심사 가이드라인 준수 확인

### 마케팅
- [ ] 앱 아이콘 디자인
- [ ] 스토어 스크린샷 제작 (광고 없는 버전)
- [ ] 앱 설명 작성 (개인/비즈니스 혜택 강조)
- [ ] 랜딩 페이지 제작
- [ ] SNS 계정 개설
- [ ] 프레스 킷 준비
- [ ] 베타 테스터 모집 (카페 운영자 우선)

### 비즈니스
- [ ] 광고 네트워크 계정 생성 (AdMob, Meta)
- [ ] Stripe 계정 활성화
- [ ] 가격 전략 최종 확정
- [ ] 고객 지원 이메일 설정
- [ ] FAQ 문서 작성
- [ ] 비즈니스 플랜 혜택 명확화

---

**문서 종료**

---

## 📌 핵심 요약 (Executive Summary)

### 제품
힐링 음악 전문 스트리밍 플랫폼 (개인 + 상업 공간 타겟)

### 수익 모델
- 광고 기반 무료 서비스 (60%)
- 프리미엄 구독 $4.99/월 (25%)
- 비즈니스 플랜 $19.99/월 (15%)

### 차별화
- 100% 힐링 음악 (타 플랫폼은 일반 음악 중심)
- 상업 공간 특화 기능 (시간대별 자동 전환, 스케줄러)
- 저작권 안전성 (로열티 프리, 라이선스 증명)
- 광고 최소화 전략 (사용자 경험 우선)

### 3개월 목표
- DAU 500명
- MRR $500
- 프리미엄 전환율 8%

### 출시 일정
- MVP: 6-8주
- 베타 테스트: 2주
- 정식 출시: 3개월 내