# Heeling 보안 개선 구현 계획

> review.md 기반 상세 구현 가이드 | 작성일: 2025-12-24

---

## 실행 요약

| 우선순위 | 작업 | 예상 시간 | 상태 |
|----------|------|-----------|------|
| **P0-1** | 소셜 로그인 토큰 검증 | 2-3시간 | ⏳ 대기 |
| **P0-2** | JWT Secret 강제화 | 30분 | ⏳ 대기 |
| **P1-1** | Suno 콜백 인증 | 1시간 | ⏳ 대기 |
| **P1-2** | Rate Limiting | 1-2시간 | ⏳ 대기 |
| **P1-3** | console.log 제거 | 1시간 | ⏳ 대기 |
| **P1-4** | Firebase 업그레이드 | 2시간 | ⏳ 대기 |

---

## P0-1: 소셜 로그인 토큰 서버 검증

### 현재 문제

```typescript
// backend/src/app/api/auth/social/route.ts:54
const { provider, providerId, email, name } = body;
// ❌ identityToken/idToken을 받지만 검증 없이 providerId만 사용
```

### 필요 패키지

```bash
cd backend
npm install google-auth-library apple-signin-auth
```

### 구현 계획

#### 1. 토큰 검증 유틸리티 생성

**파일**: `backend/src/lib/social-auth.ts`

```typescript
import { OAuth2Client } from 'google-auth-library';
import appleSignin from 'apple-signin-auth';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const APPLE_CLIENT_ID = process.env.APPLE_CLIENT_ID || 'com.heeling.app';

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

interface VerifiedUser {
  sub: string;        // 고유 식별자 (providerId로 사용)
  email?: string;
  name?: string;
}

/**
 * Google idToken 검증
 */
export async function verifyGoogleToken(idToken: string): Promise<VerifiedUser> {
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  if (!payload || !payload.sub) {
    throw new Error('Invalid Google token');
  }

  return {
    sub: payload.sub,
    email: payload.email,
    name: payload.name,
  };
}

/**
 * Apple identityToken 검증
 */
export async function verifyAppleToken(identityToken: string): Promise<VerifiedUser> {
  const payload = await appleSignin.verifyIdToken(identityToken, {
    audience: APPLE_CLIENT_ID,
    ignoreExpiration: false,
  });

  if (!payload.sub) {
    throw new Error('Invalid Apple token');
  }

  return {
    sub: payload.sub,
    email: payload.email,
  };
}
```

#### 2. social/route.ts 수정

```typescript
// 변경 전
const { provider, providerId, email, name } = body;

// 변경 후
let verifiedUser: VerifiedUser;

if (provider === 'google') {
  if (!body.idToken) {
    return NextResponse.json(
      { success: false, error: 'idToken이 필요합니다.' },
      { status: 400 }
    );
  }
  verifiedUser = await verifyGoogleToken(body.idToken);
} else if (provider === 'apple') {
  if (!body.identityToken) {
    return NextResponse.json(
      { success: false, error: 'identityToken이 필요합니다.' },
      { status: 400 }
    );
  }
  verifiedUser = await verifyAppleToken(body.identityToken);
}

// 검증된 sub를 providerId로 사용
const providerId = verifiedUser.sub;
const email = verifiedUser.email || body.email;
const name = verifiedUser.name || body.name;
```

#### 3. 환경변수 추가

```env
# backend/.env
GOOGLE_CLIENT_ID=722175251638-8s54sqq98jd8lnq4g4k4ec08193isv5b.apps.googleusercontent.com
APPLE_CLIENT_ID=com.heeling.app
```

---

## P0-2: JWT Secret 환경변수 강제화

### 현재 문제

```typescript
// backend/src/lib/auth.ts:10
const JWT_SECRET = process.env.JWT_SECRET || 'heeling-admin-jwt-secret-change-in-production';

// backend/src/app/api/auth/social/route.ts:29
const JWT_SECRET = process.env.JWT_SECRET || 'heeling-user-jwt-secret-change-in-production';
```

### 수정 방법

#### 1. 환경변수 검증 유틸리티

**파일**: `backend/src/lib/env.ts`

```typescript
function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`환경변수 ${key}가 설정되지 않았습니다.`);
  }
  return value;
}

export const JWT_SECRET = getRequiredEnv('JWT_SECRET');
export const GOOGLE_CLIENT_ID = getRequiredEnv('GOOGLE_CLIENT_ID');
```

#### 2. 기존 코드 수정

```typescript
// auth.ts, social/route.ts
import { JWT_SECRET } from '@/lib/env';
// fallback 제거
```

#### 3. .env 업데이트

```bash
# 32자 이상 랜덤 시크릿 생성
openssl rand -base64 32
```

```env
JWT_SECRET=생성된_랜덤_문자열_32자_이상
```

---

## P1-1: Suno 콜백 인증

### 현재 문제

```typescript
// backend/src/app/api/admin/generate/callback/route.ts
export async function POST(request: NextRequest) {
  const body = await request.json();
  // ❌ 인증 없이 모든 요청 수락
}
```

### 수정 방법

#### HMAC 서명 검증 추가

```typescript
import crypto from 'crypto';

const SUNO_CALLBACK_SECRET = process.env.SUNO_CALLBACK_SECRET;

function verifySignature(body: string, signature: string): boolean {
  if (!SUNO_CALLBACK_SECRET) return true; // 개발 환경 허용

  const expectedSig = crypto
    .createHmac('sha256', SUNO_CALLBACK_SECRET)
    .update(body)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSig)
  );
}

export async function POST(request: NextRequest) {
  const signature = request.headers.get('x-suno-signature');
  const rawBody = await request.text();

  if (!verifySignature(rawBody, signature || '')) {
    return NextResponse.json(
      { success: false, error: 'Invalid signature' },
      { status: 401 }
    );
  }

  const body = JSON.parse(rawBody);
  // ... 기존 로직
}
```

---

## P1-2: Rate Limiting

### 구현 옵션

**권장: Next.js Middleware 방식**

**파일**: `backend/src/middleware.ts` (수정)

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 간단한 인메모리 Rate Limiter (프로덕션에서는 Redis 권장)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT_CONFIG = {
  '/api/auth/': { maxRequests: 10, windowMs: 60000 },      // 분당 10회
  '/api/admin/generate/music': { maxRequests: 5, windowMs: 60000 }, // 분당 5회
};

function getRateLimit(pathname: string) {
  for (const [path, config] of Object.entries(RATE_LIMIT_CONFIG)) {
    if (pathname.startsWith(path)) return config;
  }
  return null;
}

function checkRateLimit(ip: string, config: { maxRequests: number; windowMs: number }): boolean {
  const now = Date.now();
  const key = ip;
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + config.windowMs });
    return true;
  }

  if (entry.count >= config.maxRequests) {
    return false;
  }

  entry.count++;
  return true;
}

export function middleware(request: NextRequest) {
  const config = getRateLimit(request.nextUrl.pathname);

  if (config) {
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';

    if (!checkRateLimit(ip, config)) {
      return NextResponse.json(
        { success: false, error: 'Too many requests' },
        { status: 429 }
      );
    }
  }

  // 기존 미들웨어 로직 계속...
}
```

---

## P1-3: console.log 프로덕션 제거

### 방법 1: Babel 플러그인 (권장)

```bash
cd backend
npm install -D babel-plugin-transform-remove-console
```

**next.config.ts 수정**:

```typescript
const nextConfig = {
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
};
```

### 방법 2: 조건부 로깅 래퍼

**파일**: `backend/src/lib/logger.ts`

```typescript
const isDev = process.env.NODE_ENV === 'development';

export const logger = {
  log: (...args: any[]) => isDev && console.log(...args),
  error: (...args: any[]) => console.error(...args), // 에러는 항상 로깅
  warn: (...args: any[]) => isDev && console.warn(...args),
};
```

---

## P1-4: Firebase 업그레이드

### 현재 vs 목표

| 패키지 | 현재 | 목표 |
|--------|------|------|
| @react-native-firebase/app | 21.6.1 | 23.7.0 |
| @react-native-firebase/analytics | 21.6.1 | 23.7.0 |

### Breaking Changes 확인 필요

1. [Migration Guide 21→22](https://rnfirebase.io/migrating-to-v22)
2. [Migration Guide 22→23](https://rnfirebase.io/migrating-to-v23)

### 업그레이드 절차

```bash
cd mobile

# 1. 패키지 업데이트
npm install @react-native-firebase/app@latest @react-native-firebase/analytics@latest

# 2. iOS 의존성 업데이트
cd ios && pod install --repo-update && cd ..

# 3. Android 빌드 확인
cd android && ./gradlew clean && cd ..

# 4. 테스트
npm run ios
npm run android
```

---

## 체크리스트

### P0 (배포 전 필수)

- [ ] `google-auth-library`, `apple-signin-auth` 설치
- [ ] `backend/src/lib/social-auth.ts` 생성
- [ ] `backend/src/app/api/auth/social/route.ts` 토큰 검증 추가
- [ ] `backend/src/lib/env.ts` 생성 (환경변수 강제화)
- [ ] `auth.ts`, `social/route.ts`에서 fallback 제거
- [ ] `.env`에 JWT_SECRET, GOOGLE_CLIENT_ID 설정
- [ ] 로컬 테스트 완료

### P1 (출시 후 1-2주)

- [ ] Suno 콜백 HMAC 검증 추가
- [ ] Rate Limiting 미들웨어 구현
- [ ] console.log 프로덕션 제거 설정
- [ ] Firebase 23.x 업그레이드 (Breaking Changes 확인 후)

### P2 (안정화 단계)

- [ ] SQLite ↔ PostgreSQL 동기화 전략 결정
- [ ] Sentry 에러 리포팅 도입
- [ ] API 응답 포맷 표준화
- [ ] VPS 자격증명 환경변수 이동

---

## 참고 자료

- [google-auth-library](https://github.com/googleapis/google-auth-library-nodejs)
- [apple-signin-auth](https://github.com/a-simarfakis/apple-signin-auth)
- [Next.js Rate Limiting](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [React Native Firebase Migration](https://rnfirebase.io/migrating-to-v22)
