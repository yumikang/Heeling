# 개발일지 (Development Log)

---

## 2025-01-07

### iOS 빌드 시행착오

#### 문제 1: Firebase/GoogleUtilities Pod 충돌
**에러 메시지:**
```
The Swift pod `FirebaseCoreInternal` depends upon `GoogleUtilities`,
which does not define modules.
```

**해결:**
Podfile에 추가:
```ruby
pod 'GoogleUtilities', :modular_headers => true
```

#### 문제 2: `expo prebuild --clean` 사용 시 주의
**상황:**
- Pod 에러 해결을 위해 `expo prebuild --platform ios --clean` 실행
- ios 폴더 전체가 초기화됨
- Xcode Signing 설정, Team 설정, 앱 아이콘 등 모두 초기화

**교훈:**
- `--clean` 옵션은 ios 폴더를 완전히 재생성함
- 기존 Xcode 프로젝트 설정이 모두 날아감
- **대안:** Podfile 수정 후 `pod install`만 실행

**복구 방법:**
```bash
# git에서 이전 project.pbxproj 복구
git checkout <commit-hash> -- ios/BRIBI.xcodeproj/project.pbxproj
pod install
```

#### 문제 3: 앱 아이콘이 빈 흰색 이미지로 대체됨
**상황:**
- `expo prebuild --clean` 후 앱 아이콘이 5.8KB 빈 흰색 PNG로 대체됨
- 원본 아이콘은 242KB (실제 BRIBI 초록색 아이콘)
- Xcode에서 아이콘이 안 보이거나 빈 상태로 표시

**확인 방법:**
```bash
# 파일 크기 확인 (5KB 이하면 빈 이미지일 가능성 높음)
ls -la ios/BRIBI/Images.xcassets/AppIcon.appiconset/
# 이미지 유효성 확인
file ios/BRIBI/Images.xcassets/AppIcon.appiconset/App-Icon-1024x1024@1x.png
```

**복구 방법:**
```bash
git checkout <commit-hash> -- ios/BRIBI/Images.xcassets/AppIcon.appiconset/App-Icon-1024x1024@1x.png
```

### 홈 화면 MVP 구조 확정 (7개 섹션)

| 순서 | 섹션 | 데이터 소스 |
|------|------|-------------|
| 1 | 히어로 배너 | 서버 (HERO + PROMOTION 타입) |
| 2 | 카테고리 아이콘 | 서버 |
| 3 | 추천 트랙 | 인기순 상위 15개 → 셔플 → 6개 |
| 4 | 집중 트랙 | focus 카테고리 인기순 12개 → 셔플 → 6개 |
| 5 | 수면 트랙 | sleep 카테고리 인기순 12개 → 셔플 → 6개 |
| 6 | 최근 재생 | 로컬 |
| 7 | 인기 차트 | 서버 playCount 기준 (셔플 없음) |

### 트랙 정렬 알고리즘 (인기순 셔플)
**목적:** 매번 홈이 똑같지 않으면서 인기 트랙 위주 유지

```typescript
const getPopularShuffled = (tracks: Track[], topN = 12, displayCount = 6) => {
  const sorted = [...tracks].sort((a, b) => (b.playCount || 0) - (a.playCount || 0));
  const topTracks = sorted.slice(0, Math.min(topN, sorted.length));
  // Fisher-Yates shuffle
  for (let i = topTracks.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [topTracks[i], topTracks[j]] = [topTracks[j], topTracks[i]];
  }
  return topTracks.slice(0, displayCount);
};
```

---

## 빌드 체크리스트

### iOS TestFlight 빌드 전 확인사항
- [ ] `expo prebuild --clean` 사용 자제 (설정 초기화됨)
- [ ] Podfile 변경 시 `pod install`만 실행
- [ ] Xcode에서 Team 설정 확인
- [ ] Bundle Identifier 확인 (com.ymn9639.bribi)
- [ ] GoogleService-Info.plist 존재 확인

### 빌드 명령어
```bash
# iOS
cd mobile/ios
pod install
open BRIBI.xcworkspace
# Xcode: Product → Archive → Distribute to TestFlight
```

---

## 2025-01-06

### 작업 요약

1. **MusicPreset duration hint 추가** - 트랙 길이 일관성 개선
2. **사전 생성된 제목 캐시 경로 문제 해결**
3. **PM2 중복 프로세스 정리**
4. **iOS TestFlight 빌드 12 배포**

### 1. 트랙 길이 일관성 개선

**문제:**
- Suno AI로 생성된 트랙 길이가 1분 ~ 7분으로 들쭉날쭉함
- Suno API에는 직접적인 duration 파라미터가 없음

**해결:**
1. `suno-client.ts`의 HEALING_STYLES에 duration hint 추가
2. MusicPreset DB 테이블도 함께 업데이트 (이게 우선 적용됨)

```sql
UPDATE "MusicPreset"
SET "stylePrompt" = "stylePrompt" || ', 3-4 minutes long, extended composition'
WHERE "stylePrompt" NOT LIKE '%3-4 minutes%';
```

### 2. 사전 생성된 제목 캐시 문제

**문제:** 관리자 페이지에서 사전 생성된 제목이 0개로 표시됨

**원인:** 경로 불일치
- 실제 파일: `/root/heeling/storage/data/title-cache/`
- 백엔드가 찾는 위치: `/root/heeling/backend/data/title-cache/`

**해결:**
```bash
# PM2 실제 working directory 확인
pm2 show heeling-backend | grep "exec cwd"

# 올바른 위치에 symlink 생성
mkdir -p /root/heeling/backend/data
ln -sf /root/heeling/storage/data/title-cache /root/heeling/backend/data/title-cache
```

### 3. iOS TestFlight 빌드 12

**시행착오:**
- `pod install` 실행 시 인코딩 에러 → `LANG=en_US.UTF-8` 설정으로 해결
- 터미널에서 App Store Connect 업로드 실패 → Xcode GUI 사용

```bash
# Archive 생성
xcodebuild -workspace BRIBI.xcworkspace \
  -scheme BRIBI \
  -configuration Release \
  -destination generic/platform=iOS \
  archive \
  -archivePath ./build/BRIBI.xcarchive

# Xcode Organizer에서 열어서 업로드
open ./build/BRIBI.xcarchive
```

---

## 참고 명령어

### VPS 서버
```bash
ssh root@141.164.60.51
pm2 status
pm2 logs heeling-backend
pm2 restart heeling-backend
```

### iOS 빌드
```bash
cd mobile/ios
LANG=en_US.UTF-8 pod install
open BRIBI.xcworkspace
# Xcode: Product → Archive → Distribute to TestFlight
```
