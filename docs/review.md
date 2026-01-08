# Heeling 프로젝트 보안 리뷰

> 최종 피드백 통합 문서 | 작성일: 2025-01-XX

---

## 1. 문서 개요

이 문서는 Heeling(힐링 음악 테라피 앱) 프로젝트의 보안 분석 결과와 내/외부 피드백을 통합하여 정리한 최종 리뷰 문서입니다. 다음주 출시 일정을 고려하여 우선순위별로 조치 사항을 분류했습니다.

| 우선순위 | 시점 | 항목 수 |
|----------|------|---------|
| **P0 (Critical)** | 배포 전 필수 | 2개 |
| **P1 (High)** | 출시 후 1-2주 내 | 4개 |
| **P2 (Medium)** | 안정화 단계 (3-4주) | 5개 |

---

## 2. P0: 배포 전 필수 조치

> ⚠️ **이 항목들은 출시 전 반드시 완료해야 합니다.**

### 2.1 소셜 로그인 토큰 서버 검증 + 키 매칭

**현재 문제**

identityToken/idToken을 받지만 실제 검증 없이 providerId만으로 사용자 생성/조회 중. 공격자가 임의의 providerId를 보내 다른 사용자 계정에 접근 가능.

**수정 방향**

1. **Apple**: apple-signin-auth 라이브러리로 identityToken 서버 사이드 검증
2. **Google**: google-auth-library로 idToken 검증 후 sub claim 확인
3. **DB 키 전략**: (provider, providerSubject(sub)) 조합을 유니크로 설정. 앱에서 오는 providerId는 폐기하고 검증된 토큰의 sub 사용

**수정 위치**

`backend/src/app/api/auth/social/route.ts`

---

### 2.2 JWT Secret 환경변수 강제화

**현재 문제**

하드코딩된 fallback secret 사용 (auth.ts:10, social/route.ts:29). .env 설정 누락 시 프로덕션에서 동일한 시크릿으로 동작.

**수정 방향**

- .env에 강력한 JWT_SECRET 설정 (32자 이상 랜덤)
- Fallback 제거 또는 환경변수 미설정 시 서버 시작 차단
- Google Client ID도 환경변수로 이동 (AuthService.ts:44-45)

---

## 3. P1: 출시 후 1-2주 내 조치

### 3.1 Suno 콜백 인증

**문제**: 외부에서 가짜 콜백을 보내 음악 생성 상태 조작 가능

**인증 방식 후보**:
- HMAC 서명 검증 (콜백 바디 + timestamp)
- 콜백용 shared secret
- Allowlist IP (보조 수단)

---

### 3.2 Rate Limiting

**적용 대상**: 로그인/회원가입 API, AI 음악 생성 API

**구현 레이어 옵션**:

1. **Caddy (권장)**: 인프라 레벨에서 처리, 앱 코드 수정 불필요
2. **Next.js Middleware**: Edge에서 처리, 유연한 로직 가능
3. **Route Handler**: 가장 간단, 빠른 적용 가능

---

### 3.3 console.log 제거

**현황**: 345개 로그 호출 (프로덕션 성능 영향)

**조치**: 프로덕션 빌드에서 제거 또는 조건부 로깅 (winston/pino 등)

---

### 3.4 Mobile 취약점 패치

**현황**: 15개 취약점 (2 low, 13 moderate) - 모두 undici → Firebase SDK 체인 문제

**조치**: 출시 직후가 아닌 안정화 후 Firebase 21 → 23 업그레이드 (Breaking Changes 확인 필요). Analytics + Push만 사용 중이므로 리스크 낮음.

---

## 4. P2: 안정화 단계 (3-4주)

### 4.1 SQLite ↔ PostgreSQL 동기화 전략

**충돌 전략 키워드**:

1. **Last-write-wins (LWW)**: 가장 단순, 현재 단계에서 충분
2. **Server authoritative + client patch queue**: 서버 우선, 클라이언트 변경사항 큐잉
3. **oplog / revision / updatedAt 기반 merge**: 복잡하지만 정밀한 동기화

---

### 4.2 API 모니터링/로깅 구축

- Sentry 등 에러 리포팅 도입
- API 요청/응답 로깅
- 성능 메트릭 수집

---

### 4.3 에러 응답 일관성

클라이언트 에러 핸들링 패턴 통일을 위한 표준 에러 응답 포맷 정의

---

### 4.4 Firebase 업그레이드

- **현재**: @react-native-firebase 21.6.1
- **목표**: @react-native-firebase 23.7.0
- **주의**: Major 버전 업그레이드(21→23)이므로 Breaking Changes 확인 후 진행

---

### 4.5 VPS 자격증명 환경변수 이동

vps-storage.ts:17-18의 IP/사용자 기본값을 환경변수로 이동

---

## 5. 부록: 앱스토어 심사 관련

moderate 취약점으로 Apple/Google 심사에서 리젝되지 않습니다. 심사에서 주로 문제되는 항목:

- 하드코딩된 API 키 (코드 스캔)
- 암호화 미적용 (네트워크 트래픽)
- 개인정보 수집 미고지

→ **P0 항목만 완료하면 심사 통과에 문제없습니다.**

---

## 6. 요약

| 단계 | 핵심 항목 | 담당 |
|------|-----------|------|
| **지금** | 소셜 로그인 검증, JWT Secret | Backend |
| **출시 후** | Suno 콜백, Rate Limit, 로그 정리 | Backend + Infra |
| **안정화** | 동기화 전략, Firebase, 모니터링 | Full Stack |