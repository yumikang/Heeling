# Heeling Project Documentation

> **Version**: 2.0 (Phase 1 - Local-First MVP)
> **Last Updated**: 2025-11-26

---

## Documentation Structure

```
docs/
├── README.md           # 이 파일 (문서 구조 안내)
├── PRD.md              # Product Requirements Document (현재 버전)
├── SCREEN_FLOW.md      # 화면 구성 및 네비게이션 플로우
├── BACKEND_API.md      # Backend API 문서 (Phase 2용)
└── archive/            # 이전 버전 문서 (참고용)
    ├── prd.md                  # 이전 PRD v2.0
    ├── DEVELOPMENT_PLAN.md     # 이전 개발 계획
    ├── EXECUTIVE_SUMMARY.md    # 이전 요약 문서
    └── module.md               # React Native 라이브러리 분석
```

---

## Current Phase

### Phase 1: Local-First MVP (현재)

**목표**: 100% 로컬 기반 기능 구현

| 항목 | 내용 |
|------|------|
| **데이터베이스** | SQLite (로컬) |
| **콘텐츠** | 번들 에셋 (5-10개 트랙) |
| **인증** | Apple Sign In + Google Sign In |
| **결제** | 없음 (Freemium 모델) |
| **광고** | 없음 |
| **오프라인** | 완전 지원 |

**주요 문서**: [PRD.md](./PRD.md)

### Phase 2: Server Integration (예정)

**목표**: 백엔드 연동 및 확장 기능

| 항목 | 내용 |
|------|------|
| **데이터베이스** | PostgreSQL + SQLite (하이브리드) |
| **콘텐츠** | 서버 스트리밍 + 로컬 캐시 |
| **인증** | JWT 토큰 기반 |
| **결제** | Stripe 연동 |
| **광고** | AdMob + Meta |

**주요 문서**: [BACKEND_API.md](./BACKEND_API.md)

---

## Key Documents

### [PRD.md](./PRD.md)

Product Requirements Document - 현재 개발 기준 문서

**주요 섹션**:
- Product Vision & Core Concept
- Data Architecture (SQLite)
- UI/UX Specifications
- Audio Playback System
- Screen Dimming Feature
- Development Timeline

### [SCREEN_FLOW.md](./SCREEN_FLOW.md)

화면 구성 및 네비게이션 플로우

**주요 섹션**:
- 전체 화면 목록 (9개)
- Bottom Tab Bar (홈/전체/좋아요/설정)
- 각 화면별 UI 와이어프레임
- Navigation Structure (Stack + Tab)
- Guest Mode / Phase 구분

### [BACKEND_API.md](./BACKEND_API.md)

Phase 2 백엔드 API 명세 - 서버 연동 시 참고

**주요 섹션**:
- Database Schema (Prisma)
- REST API Endpoints
- Authentication (예정)
- Subscription (예정)

---

## Quick Reference

### Tech Stack (Phase 1)

| Layer | Technology |
|-------|------------|
| **Mobile Framework** | React Native |
| **Navigation** | expo-router |
| **State Management** | Zustand |
| **Local Database** | SQLite (expo-sqlite) |
| **Audio Player** | react-native-track-player |
| **Authentication** | Apple Sign In, Google Sign In |
| **Styling** | NativeWind (Tailwind CSS) |

### Project Structure

```
heeling/
├── docs/                   # 문서
├── backend/                # Phase 2 백엔드 (보존)
├── mobile/                 # React Native 앱 (예정)
│   ├── app/               # expo-router 페이지
│   ├── components/        # 재사용 컴포넌트
│   ├── services/          # 비즈니스 로직
│   ├── stores/            # Zustand 스토어
│   ├── database/          # SQLite 관련
│   └── assets/            # 번들 에셋
└── prd2.md                 # 원본 PRD (참고용)
```

---

## Development Workflow

### Starting Development

1. PRD.md 확인
2. Phase 1 요구사항 기준으로 개발
3. 로컬 SQLite 우선 구현
4. 서버 연동은 Phase 2에서 처리

### When to Reference Archive

- 광고 시스템 구현 시 → `archive/prd.md` (AdMob 명세)
- 비즈니스 로직 참고 시 → `archive/EXECUTIVE_SUMMARY.md`
- 라이브러리 선택 시 → `archive/module.md`

---

**Contact**: Development Team
**Repository**: heeling-app
