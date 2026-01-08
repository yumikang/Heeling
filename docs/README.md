# Heeling (BRIBI) 프로젝트 문서

사람이 읽는 가이드, 절차서, 요구사항 문서입니다.

---

## 문서 목록

### 핵심 문서

| 파일 | 설명 |
|------|------|
| **PRD.md** | 제품 요구사항 문서 |
| **MVP-RULES.md** | MVP 운영 규칙 및 Scope Freeze |
| **SCREEN_FLOW.md** | 화면 구성 및 네비게이션 플로우 |

### 개발 환경

| 파일 | 설명 |
|------|------|
| **DEV_ENVIRONMENT_SETUP.md** | 개발 환경 설정 가이드 (Xcode, RN 버전 등) |
| **DEV_LOG.md** | 개발 일지 (시행착오 및 해결 기록) |

### 배포

| 파일 | 설명 |
|------|------|
| **DEPLOYMENT.md** | 서버 배포 가이드 |
| **TESTFLIGHT_SETUP.md** | iOS TestFlight 배포 절차 |
| **ANDROID_PLAYSTORE_SETUP.md** | Android Play Store 배포 절차 |
| **ui-ux-checklist.md** | 앱스토어 리젝 방지 체크리스트 |

### 설정 및 메타데이터

| 파일 | 설명 |
|------|------|
| **lang.md** | 다국어 설정 |
| **setting.md** | 앱 설정 항목 |
| **store-metadata.md** | 앱스토어 메타데이터 |

---

## claudedocs/ 폴더와의 차이

- **docs/** = 사람이 읽는 문서 (가이드, 절차서, 요구사항)
- **claudedocs/** = 기술 참조 문서 (API 스펙, 코드 패턴, 타입 정의)

---

## 프로젝트 구조

```
heeling/
├── docs/                   # 이 폴더 (사람용 문서)
├── claudedocs/             # 기술 참조 문서 (Claude용)
├── backend/                # Next.js 백엔드
├── mobile/                 # React Native 앱
│   ├── src/
│   │   ├── app/           # 화면 및 네비게이션
│   │   ├── components/    # 재사용 컴포넌트
│   │   ├── services/      # 비즈니스 로직
│   │   ├── api/           # API 클라이언트
│   │   └── hooks/         # 커스텀 훅
│   ├── ios/               # iOS 네이티브
│   └── android/           # Android 네이티브
└── .taskmaster/           # Task Master 설정
```

---

## 개발 시작하기

1. [DEV_ENVIRONMENT_SETUP.md](./DEV_ENVIRONMENT_SETUP.md) 확인
2. [PRD.md](./PRD.md)로 요구사항 파악
3. [MVP-RULES.md](./MVP-RULES.md)로 Scope 확인
4. 개발 진행 → [DEV_LOG.md](./DEV_LOG.md)에 기록
