# FCM 푸시 알림 API 매뉴얼

## 개요

Heeling 앱의 FCM(Firebase Cloud Messaging) 푸시 알림 서버 API입니다.
토픽 기반 푸시 발송을 지원하며, 일주일에 1-2회 정도의 저빈도 푸시에 최적화되어 있습니다.

## 환경 설정

### 1. Firebase 프로젝트 설정

1. [Firebase Console](https://console.firebase.google.com)에서 프로젝트 생성
2. 프로젝트 설정 > 서비스 계정 > 새 비공개 키 생성
3. 다운로드된 JSON 파일에서 필요한 값 추출

### 2. 환경변수 설정

`.env` 파일에 다음 변수 추가:

```bash
# Firebase Admin SDK 설정
FIREBASE_PROJECT_ID=heeling-app-xxxxx
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@heeling-app-xxxxx.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBg...\n-----END PRIVATE KEY-----\n"
```

> **주의**: `FIREBASE_PRIVATE_KEY`는 반드시 따옴표로 감싸고, 줄바꿈은 `\n`으로 표기

---

## API 엔드포인트

### 1. 푸시 발송 API

#### POST `/api/push/send`

토픽으로 푸시 알림을 발송합니다.

**Request Body:**

```json
{
  "topic": "all_users",
  "title": "새로운 힐링 음악이 추가되었어요",
  "body": "오늘의 추천 음악을 들어보세요",
  "data": {
    "screen": "home",
    "trackId": "abc123"
  },
  "imageUrl": "https://example.com/image.jpg"
}
```

**Parameters:**

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `topic` | string | O* | 단일 토픽 |
| `topics` | string[] | O* | 다중 토픽 (topic과 택1) |
| `title` | string | O | 알림 제목 |
| `body` | string | O | 알림 내용 |
| `data` | object | X | 추가 데이터 (앱에서 처리) |
| `imageUrl` | string | X | 알림 이미지 URL |

**Response (성공):**

```json
{
  "success": true,
  "data": {
    "messageId": "projects/heeling-app/messages/0:1234567890",
    "topic": "all_users",
    "sentAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Response (다중 토픽):**

```json
{
  "success": true,
  "data": {
    "results": [
      { "topic": "all_users", "success": true, "messageId": "..." },
      { "topic": "marketing", "success": true, "messageId": "..." }
    ],
    "summary": {
      "total": 2,
      "success": 2,
      "failed": 0
    },
    "sentAt": "2024-01-15T10:30:00.000Z"
  }
}
```

#### GET `/api/push/send`

사용 가능한 토픽 목록을 조회합니다.

**Response:**

```json
{
  "success": true,
  "data": {
    "availableTopics": ["all_users", "marketing", "personal", "business"],
    "topicDescriptions": {
      "all_users": "모든 사용자",
      "marketing": "마케팅 알림 동의 사용자",
      "personal": "개인 사용자",
      "business": "직장인 사용자"
    }
  }
}
```

---

### 2. 토픽 구독 관리 API

#### POST `/api/push/topics`

디바이스를 토픽에 구독합니다.

**Request Body:**

```json
{
  "token": "fMC_device_token_here...",
  "topics": ["all_users", "business"]
}
```

**Parameters:**

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `token` | string | O | FCM 디바이스 토큰 |
| `topic` | string | O* | 단일 토픽 |
| `topics` | string[] | O* | 다중 토픽 (topic과 택1) |

**Response:**

```json
{
  "success": true,
  "data": {
    "results": [
      { "topic": "all_users", "success": true, "successCount": 1, "failureCount": 0 },
      { "topic": "business", "success": true, "successCount": 1, "failureCount": 0 }
    ],
    "subscribedTopics": ["all_users", "business"]
  }
}
```

#### DELETE `/api/push/topics`

디바이스를 토픽에서 구독 해제합니다.

**Request Body:**

```json
{
  "token": "fMC_device_token_here...",
  "topics": ["marketing"]
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "results": [
      { "topic": "marketing", "success": true, "successCount": 1, "failureCount": 0 }
    ],
    "unsubscribedTopics": ["marketing"]
  }
}
```

#### GET `/api/push/topics`

토픽 목록 및 API 사용법을 조회합니다.

---

## 토픽 구조

| 토픽 | 설명 | 구독 시점 |
|------|------|----------|
| `all_users` | 모든 사용자 | 앱 설치 시 자동 |
| `marketing` | 마케팅 알림 | 설정에서 동의 시 |
| `personal` | 개인 사용자 | 온보딩에서 선택 시 |
| `business` | 직장인 사용자 | 온보딩에서 선택 시 |

---

## 사용 예시

### cURL 예시

```bash
# 모든 사용자에게 푸시 발송
curl -X POST http://localhost:3000/api/push/send \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "all_users",
    "title": "이번 주 추천 음악",
    "body": "스트레스 해소에 좋은 새로운 음악이 추가되었어요"
  }'

# 직장인에게만 푸시 발송
curl -X POST http://localhost:3000/api/push/send \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "business",
    "title": "월요일 아침 힐링",
    "body": "출근 전 들으면 좋은 음악 추천"
  }'

# 마케팅 + 전체 사용자에게 동시 발송
curl -X POST http://localhost:3000/api/push/send \
  -H "Content-Type: application/json" \
  -d '{
    "topics": ["all_users", "marketing"],
    "title": "프리미엄 50% 할인",
    "body": "이번 주말까지만! 놓치지 마세요"
  }'
```

### JavaScript/TypeScript 예시

```typescript
// 푸시 발송
const sendPush = async () => {
  const response = await fetch('/api/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      topic: 'all_users',
      title: '새로운 음악 추가',
      body: '지금 바로 들어보세요!',
      data: {
        screen: 'library',
        action: 'refresh'
      }
    })
  });

  const result = await response.json();
  console.log(result);
};

// 토픽 구독 (앱에서 호출)
const subscribeTopic = async (fcmToken: string, userType: string) => {
  const topics = ['all_users'];
  if (userType === 'business') topics.push('business');
  if (userType === 'personal') topics.push('personal');

  const response = await fetch('/api/push/topics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token: fcmToken,
      topics
    })
  });

  return response.json();
};
```

---

## 앱 연동 가이드

### 1. React Native Firebase 설정

```bash
# 패키지 설치
npm install @react-native-firebase/app @react-native-firebase/messaging
cd ios && pod install
```

### 2. FCM 토큰 획득 및 토픽 구독

```typescript
// mobile/src/services/FCMService.ts
import messaging from '@react-native-firebase/messaging';

export const FCMService = {
  // FCM 토큰 획득
  async getToken(): Promise<string | null> {
    const authStatus = await messaging().requestPermission();
    const enabled = authStatus === messaging.AuthorizationStatus.AUTHORIZED;

    if (enabled) {
      const token = await messaging().getToken();
      return token;
    }
    return null;
  },

  // 토픽 구독 (서버 API 호출)
  async subscribeTopics(token: string, userType: 'personal' | 'business') {
    const topics = ['all_users', userType];

    await fetch(`${API_BASE_URL}/api/push/topics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, topics })
    });
  },

  // 마케팅 토픽 구독/해제
  async toggleMarketingTopic(token: string, enabled: boolean) {
    const method = enabled ? 'POST' : 'DELETE';

    await fetch(`${API_BASE_URL}/api/push/topics`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, topic: 'marketing' })
    });
  }
};
```

### 3. 앱 시작 시 초기화

```typescript
// App.tsx 또는 초기화 로직
useEffect(() => {
  const initFCM = async () => {
    const token = await FCMService.getToken();
    if (token) {
      const userType = await getUserType(); // 온보딩에서 저장된 값
      await FCMService.subscribeTopics(token, userType);
    }
  };

  initFCM();
}, []);
```

---

## 에러 처리

| 에러 코드 | 설명 | 해결 방법 |
|-----------|------|----------|
| 400 | 필수 파라미터 누락 | title, body, topic 확인 |
| 400 | 유효하지 않은 토픽 | availableTopics 확인 |
| 500 | Firebase 인증 실패 | 환경변수 확인 |
| 500 | FCM 발송 실패 | Firebase Console에서 상태 확인 |

---

## 운영 가이드

### 푸시 발송 시나리오

1. **주간 추천 음악** (일요일 저녁)
   - 토픽: `all_users`
   - 내용: 이번 주 추천 음악 안내

2. **신규 콘텐츠 알림** (수시)
   - 토픽: `all_users`
   - 내용: 새로운 음악/기능 추가 안내

3. **프로모션 알림** (마케팅)
   - 토픽: `marketing`
   - 내용: 할인, 이벤트 안내

4. **직장인 타겟** (월요일 아침)
   - 토픽: `business`
   - 내용: 출근길 음악 추천

### 야간 방해 금지

앱에서 `nightModeEnabled` 설정 시 22:00~07:00 사이 로컬 알림 차단
(서버에서는 발송하되, 앱에서 필터링)

---

## 보안 고려사항

1. **관리자 인증** (TODO)
   - 현재는 인증 없이 접근 가능
   - 프로덕션 배포 전 관리자 인증 미들웨어 추가 필요

2. **Rate Limiting** (권장)
   - 과도한 푸시 발송 방지
   - 일일 발송 한도 설정

3. **환경변수 보안**
   - `.env` 파일 git 제외
   - Vercel/AWS 등 배포 환경에서 안전하게 관리
