# Heeling App 배포 및 운영 매뉴얼

## 목차
1. [프로젝트 개요](#프로젝트-개요)
2. [아키텍처](#아키텍처)
3. [개발 환경 설정](#개발-환경-설정)
4. [백엔드 배포](#백엔드-배포)
5. [iOS 앱 배포](#ios-앱-배포)
6. [Firebase 설정](#firebase-설정)
7. [모니터링 및 분석](#모니터링-및-분석)
8. [문제 해결](#문제-해결)

---

## 프로젝트 개요

**Heeling**은 명상과 수면을 위한 음악 스트리밍 앱입니다.

### 기술 스택
- **모바일**: React Native (TypeScript)
- **백엔드**: Next.js 15 (App Router)
- **데이터베이스**: PostgreSQL (Prisma ORM)
- **스토리지**: Firebase Storage
- **분석**: Firebase Analytics
- **호스팅**: VPS (Vultr)

### 주요 URL
| 서비스 | URL |
|--------|-----|
| API 서버 | https://heeling.one-q.xyz |
| Firebase Console | https://console.firebase.google.com/project/healing-e932e |

---

## 아키텍처

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   iOS App       │────▶│   Caddy (SSL)   │────▶│   Next.js API   │
│  (React Native) │     │  :443 → :3400   │     │   Port 3400     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                                               │
         │                                               ▼
         │                                      ┌─────────────────┐
         │                                      │   PostgreSQL    │
         │                                      │   Port 5432     │
         │                                      └─────────────────┘
         ▼
┌─────────────────┐
│ Firebase Storage│
│ (Audio/Images)  │
└─────────────────┘
```

---

## 개발 환경 설정

### 필수 요구사항
- Node.js 20+
- npm 10+
- Xcode 15+ (iOS 빌드용)
- CocoaPods
- PostgreSQL 15+

### 로컬 개발 시작

```bash
# 1. 저장소 클론
git clone <repository-url>
cd heeling

# 2. 백엔드 설정
cd backend
npm install
cp .env.example .env  # 환경 변수 설정
npx prisma generate
npx prisma db push
npm run dev

# 3. 모바일 앱 설정 (새 터미널)
cd mobile
npm install
cd ios && pod install && cd ..
npx react-native start

# 4. iOS 시뮬레이터에서 실행 (새 터미널)
npx react-native run-ios --simulator="iPhone 17 Pro"
```

### 환경 변수 (backend/.env)
```env
DATABASE_URL="postgresql://user:password@localhost:5432/heeling"
FIREBASE_PROJECT_ID="healing-e932e"
FIREBASE_CLIENT_EMAIL="..."
FIREBASE_PRIVATE_KEY="..."
```

---

## 백엔드 배포

### VPS 서버 정보
- **IP**: 141.164.60.51
- **OS**: Ubuntu 22.04
- **위치**: 서울
- **스펙**: 1 vCPU, 1GB RAM

### 배포 절차

#### 1. SSH 접속
```bash
ssh root@141.164.60.51
```

#### 2. 코드 업데이트
```bash
cd /root/heeling/backend
git pull origin main
npm install
npx prisma generate
npx prisma db push  # 스키마 변경시
```

#### 3. PM2로 서버 재시작
```bash
pm2 restart heeling-backend
# 또는 처음 시작시
pm2 start npm --name "heeling-backend" -- run start
pm2 save
```

#### 4. 로그 확인
```bash
pm2 logs heeling-backend
```

### Caddy 설정 (/etc/caddy/Caddyfile)
```caddy
heeling.one-q.xyz {
    reverse_proxy localhost:3400

    header {
        Strict-Transport-Security "max-age=31536000"
        X-Content-Type-Options "nosniff"
        X-Frame-Options "SAMEORIGIN"
        Access-Control-Allow-Origin "*"
        Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
        Access-Control-Allow-Headers "Content-Type, Authorization"
    }

    encode gzip

    log {
        output file /var/log/caddy/heeling.log
    }
}
```

### 서버 상태 확인
```bash
# PM2 상태
pm2 status

# API 테스트
curl https://heeling.one-q.xyz/api/tracks

# Caddy 로그
tail -f /var/log/caddy/heeling.log
```

---

## iOS 앱 배포

### 1. 인증서 및 프로비저닝 프로파일

#### Apple Developer Portal에서 생성
1. https://developer.apple.com 접속
2. Certificates, Identifiers & Profiles 선택

#### Bundle ID 설정
- **Bundle ID**: org.reactjs.native.example.HeelingMobile
- 나중에 변경 필요: com.heeling.app (권장)

#### 인증서 생성
1. **Development Certificate**: iOS App Development
2. **Distribution Certificate**: iOS Distribution (App Store and Ad Hoc)

#### 프로비저닝 프로파일 생성
1. **Development Profile**: iOS App Development 선택
2. **Distribution Profile**: App Store 선택

### 2. Xcode 설정

```bash
cd mobile/ios
open HeelingMobile.xcworkspace
```

#### Signing & Capabilities 설정
1. Target → HeelingMobile 선택
2. Signing & Capabilities 탭
3. Team: Apple Developer 계정 선택
4. Bundle Identifier 확인
5. Provisioning Profile 선택

### 3. TestFlight 배포

#### 빌드 생성
```bash
# Xcode에서:
# 1. Product → Scheme → Edit Scheme
# 2. Build Configuration → Release 선택
# 3. Product → Archive
```

#### App Store Connect 업로드
1. Xcode Organizer (Window → Organizer)
2. 아카이브 선택 → Distribute App
3. App Store Connect 선택
4. Upload

#### TestFlight 설정
1. https://appstoreconnect.apple.com 접속
2. 앱 선택 → TestFlight 탭
3. 테스터 추가 (이메일로 초대)
4. 빌드 승인 후 테스터에게 자동 알림

### 4. 버전 관리

```bash
# mobile/ios/HeelingMobile/Info.plist
CFBundleShortVersionString: 1.0.0  # 사용자 표시 버전
CFBundleVersion: 1                   # 빌드 번호 (매 업로드마다 증가)
```

---

## Firebase 설정

### 프로젝트 정보
- **Project ID**: healing-e932e
- **Bundle ID**: org.reactjs.native.example.HeelingMobile

### Firebase Console 접속
1. https://console.firebase.google.com
2. healing-e932e 프로젝트 선택

### iOS 앱 등록 (이미 완료)
- GoogleService-Info.plist 파일이 mobile/ios/HeelingMobile/ 에 위치

### Analytics 설정
```typescript
// mobile/src/services/AnalyticsService.ts
import analytics from '@react-native-firebase/analytics';

// 화면 조회 기록
await analytics().logScreenView({
  screen_name: 'HomeScreen',
  screen_class: 'HomeScreen',
});

// 커스텀 이벤트
await analytics().logEvent('track_play', {
  track_id: '123',
  track_title: 'Peaceful Piano',
});
```

### Analytics 이벤트 종류

| 이벤트명 | 설명 | 파라미터 |
|---------|------|---------|
| track_play | 트랙 재생 시작 | track_id, track_title, category |
| track_complete | 트랙 재생 완료 | track_id, duration |
| search | 검색 수행 | search_term, results_count |
| add_favorite | 즐겨찾기 추가 | track_id, track_title |
| sleep_timer_set | 수면 타이머 설정 | minutes |
| playlist_play | 플레이리스트 재생 | playlist_id, playlist_name |

---

## 모니터링 및 분석

### Firebase Analytics 대시보드
1. Firebase Console → Analytics 선택
2. 주요 지표:
   - **활성 사용자**: 일별/주별/월별
   - **세션 시간**: 평균 앱 사용 시간
   - **이벤트**: 커스텀 이벤트 발생 현황
   - **사용자 속성**: 구독 상태, 사용자 유형 등

### 실시간 모니터링
- Firebase Console → Analytics → Realtime
- 현재 활성 사용자 및 발생 중인 이벤트 확인

### 서버 모니터링

```bash
# VPS 서버에서
# CPU/메모리 사용량
htop

# 디스크 사용량
df -h

# PM2 모니터링
pm2 monit

# 로그 실시간 확인
pm2 logs heeling-backend --lines 100
```

### 알림 설정 (권장)
1. Firebase Crashlytics 활성화 (앱 크래시 알림)
2. Performance Monitoring 활성화 (성능 저하 알림)
3. VPS에 Uptime 모니터링 설정

---

## 문제 해결

### 일반적인 문제

#### 1. iOS 빌드 실패
```bash
# Pod 캐시 정리 후 재설치
cd mobile/ios
pod deintegrate
pod cache clean --all
pod install

# 빌드 캐시 정리
cd ..
npx react-native start --reset-cache
```

#### 2. API 연결 실패
```bash
# 서버 상태 확인
curl -v https://heeling.one-q.xyz/api/health

# 서버 로그 확인
ssh root@141.164.60.51 "pm2 logs heeling-backend --lines 50"
```

#### 3. Firebase Analytics 이벤트가 보이지 않음
- 이벤트는 최대 24시간 후에 대시보드에 표시됨
- DebugView에서 실시간 확인 가능:
  1. 시뮬레이터/기기에서 앱 실행
  2. Firebase Console → Analytics → DebugView

#### 4. 데이터베이스 연결 문제
```bash
# VPS에서 PostgreSQL 상태 확인
ssh root@141.164.60.51 "systemctl status postgresql"

# Prisma Studio로 데이터 확인
cd backend
npx prisma studio
```

### 긴급 복구 절차

#### 서버 다운 시
```bash
# 1. VPS 접속
ssh root@141.164.60.51

# 2. 서비스 상태 확인
pm2 status
systemctl status caddy
systemctl status postgresql

# 3. 서비스 재시작
pm2 restart heeling-backend
systemctl restart caddy
```

#### 롤백 절차
```bash
# 이전 버전으로 롤백
cd /root/heeling/backend
git log --oneline -10  # 커밋 히스토리 확인
git checkout <previous-commit>
npm install
pm2 restart heeling-backend
```

---

## 업데이트 체크리스트

### 백엔드 업데이트
- [ ] 코드 변경 커밋 및 푸시
- [ ] VPS에서 git pull
- [ ] npm install (의존성 변경시)
- [ ] prisma generate (스키마 변경시)
- [ ] prisma db push (스키마 변경시)
- [ ] pm2 restart
- [ ] API 테스트

### iOS 앱 업데이트
- [ ] 버전 번호 증가 (CFBundleVersion)
- [ ] 빌드 및 테스트
- [ ] Archive 생성
- [ ] App Store Connect 업로드
- [ ] TestFlight에서 테스트
- [ ] App Store 제출 (정식 출시시)

---

## 연락처 및 리소스

### 서비스 대시보드
- [Firebase Console](https://console.firebase.google.com/project/healing-e932e)
- [App Store Connect](https://appstoreconnect.apple.com)
- [Apple Developer Portal](https://developer.apple.com)
- [Vultr VPS Console](https://my.vultr.com)

### 문서
- [React Native 공식 문서](https://reactnative.dev)
- [Firebase React Native 문서](https://rnfirebase.io)
- [Next.js 문서](https://nextjs.org/docs)
- [Prisma 문서](https://prisma.io/docs)
