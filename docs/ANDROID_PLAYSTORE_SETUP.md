# Android 빌드 및 Google Play 배포 완전 가이드

## 전체 진행 순서

```
1. Firebase에 Android 앱 등록
2. google-services.json 다운로드 및 설치
3. Release APK 빌드
4. Google Play 개발자 계정 등록 ($25 일회성)
5. Google Play Console에서 앱 등록
6. 내부 테스트 트랙에 APK 업로드
7. 테스터 초대
```

---

## 1단계: Firebase에 Android 앱 등록

### Firebase Console에서:

1. https://console.firebase.google.com/project/healing-e932e 접속

2. 좌측 상단 **톱니바퀴 아이콘** → **프로젝트 설정** 클릭

3. **일반** 탭에서 아래로 스크롤 → **앱 추가** 클릭

4. **Android** 아이콘 선택

5. Android 패키지 이름 입력:
   ```
   com.heelingmobile
   ```

6. 앱 닉네임 입력:
   ```
   Heeling Android
   ```

7. **앱 등록** 클릭

8. **google-services.json 다운로드** 클릭

9. 다운로드된 파일을 다음 위치에 저장:
   ```
   /Users/blee/Desktop/blee-project/heeling/mobile/android/app/google-services.json
   ```

10. **다음** → **콘솔로 이동**

---

## 2단계: Release APK 빌드

### 터미널에서:

```bash
# 프로젝트 디렉토리로 이동
cd /Users/blee/Desktop/blee-project/heeling/mobile/android

# 캐시 정리 (선택사항, 문제 발생시)
./gradlew clean

# Release APK 빌드
./gradlew assembleRelease
```

### 빌드 완료 후:

APK 파일 위치:
```
mobile/android/app/build/outputs/apk/release/app-release.apk
```

### APK 직접 테스트:

1. APK 파일을 Android 기기로 전송 (이메일, Google Drive, USB 등)
2. 기기에서 파일 열기
3. "알 수 없는 출처" 설치 허용
4. 설치 및 테스트

---

## 3단계: Google Play 개발자 계정 등록

### 계정 생성:

1. https://play.google.com/console 접속

2. Google 계정으로 로그인

3. **개발자 계정 만들기** 클릭

4. **계정 유형** 선택:
   - ◉ **개인** (개인 개발자인 경우)
   - 또는 **조직** (회사/단체인 경우)

5. **개발자 이름** 입력:
   ```
   본인 이름 또는 회사명
   ```

6. **연락처 정보** 입력:
   - 이메일 주소 (사용자 문의용)
   - 웹사이트 (선택사항)

7. **등록비 결제**: $25 USD (일회성, 평생 유효)

8. **본인 인증** (조직 계정의 경우 추가 서류 필요)

9. 계정 활성화까지 **최대 48시간** 소요

---

## 4단계: Google Play Console에서 앱 등록

### 앱 생성:

1. https://play.google.com/console 접속

2. **앱 만들기** 클릭

3. 앱 세부정보 입력:
   ```
   앱 이름: Heeling
   기본 언어: 한국어 - ko-KR
   앱 또는 게임: ◉ 앱
   무료 또는 유료: ◉ 무료
   ```

4. 선언 체크:
   - [x] 개발자 프로그램 정책 동의
   - [x] 미국 수출 법률 준수

5. **앱 만들기** 클릭

---

## 5단계: 스토어 등록정보 설정

### 기본 스토어 등록정보:

1. 좌측 메뉴에서 **기본 스토어 등록정보** 클릭

2. **앱 세부정보**:
   ```
   앱 이름: Heeling
   간단한 설명: 명상과 수면을 위한 힐링 음악 앱 (80자 이내)
   자세한 설명: (4000자 이내)

   Heeling은 당신의 마음을 편안하게 해주는 힐링 음악 스트리밍 앱입니다.

   주요 기능:
   • 명상을 위한 다양한 음악 컬렉션
   • 수면 유도를 위한 자연 소리
   • 맞춤형 재생목록
   • 백그라운드 재생 지원
   • 수면 타이머 기능

   지금 Heeling과 함께 편안한 휴식을 시작하세요.
   ```

3. **그래픽**:
   - 앱 아이콘: 512x512 PNG
   - 특성 그래픽: 1024x500 PNG
   - 스크린샷: 최소 2개 (폰 세로)
     - 16:9 또는 9:16 비율
     - 320~3840px 사이

4. **저장** 클릭

---

## 6단계: 앱 콘텐츠 설정

### 좌측 메뉴 → 정책 → 앱 콘텐츠:

1. **개인정보처리방침**:
   ```
   개인정보처리방침 URL 입력 (필수)
   예: https://heeling.one-q.xyz/privacy
   ```

2. **광고**:
   - ◉ 아니요, 광고 포함 안 함

3. **앱 액세스 권한**:
   - ◉ 모든 기능 제한 없이 사용 가능

4. **콘텐츠 등급**:
   - 설문지 작성 (게임이 아닌 앱 선택)
   - 대부분 "아니요" 선택
   - 등급 계산 → 적용

5. **타겟층**:
   - 타겟 연령대: 18세 이상 선택 (가장 간단)

6. **뉴스 앱**:
   - ◉ 아니요

7. **데이터 보안**:
   - 수집하는 데이터 유형 선택
   - 데이터 암호화 여부
   - 삭제 요청 가능 여부

---

## 7단계: 내부 테스트 트랙에 APK 업로드

### 테스트 → 내부 테스트:

1. 좌측 메뉴에서 **테스트** → **내부 테스트** 클릭

2. **새 버전 만들기** 클릭

3. **앱 번들** 섹션:
   - **업로드** 클릭
   - `app-release.apk` 파일 선택
   - 업로드 완료까지 대기

4. **버전 세부정보**:
   ```
   버전 이름: 1.0.0
   출시 노트:
   - 최초 테스트 버전
   - 힐링 음악 스트리밍 기능
   ```

5. **저장** → **버전 검토** → **내부 테스트 트랙에 출시 시작**

---

## 8단계: 테스터 초대

### 테스터 관리:

1. **내부 테스트** → **테스터** 탭

2. **이메일 목록 만들기** 클릭:
   ```
   이름: 개발팀
   이메일 주소 추가:
   - tester1@gmail.com
   - tester2@gmail.com
   ```

3. **변경사항 저장**

4. **복사** 버튼으로 테스트 링크 복사

### 테스터가 해야 할 것:

1. 받은 테스트 링크 클릭

2. Google 계정으로 로그인

3. **테스터로 참여** 클릭

4. Play 스토어에서 앱 설치

---

## 9단계: AAB 빌드 (Google Play 권장)

Google Play는 APK보다 AAB(Android App Bundle) 형식을 권장합니다:

```bash
cd /Users/blee/Desktop/blee-project/heeling/mobile/android

# AAB 빌드
./gradlew bundleRelease
```

AAB 파일 위치:
```
mobile/android/app/build/outputs/bundle/release/app-release.aab
```

**AAB 장점:**
- 파일 크기 최적화 (기기별로 필요한 리소스만 다운로드)
- Google Play 앱 서명 자동 관리
- 더 작은 다운로드 크기

---

## 문제 해결

### "google-services.json not found" 에러
```bash
# google-services.json이 올바른 위치에 있는지 확인
ls -la mobile/android/app/google-services.json
```

### 빌드 실패
```bash
# Gradle 캐시 정리
cd mobile/android
./gradlew clean

# 다시 빌드
./gradlew assembleRelease
```

### Java 버전 문제
```bash
# Java 버전 확인
java -version

# Java 17 이상 필요
# macOS에서 Homebrew로 설치:
brew install openjdk@17
```

### 메모리 부족
```bash
# gradle.properties에 메모리 설정 확인
# org.gradle.jvmargs=-Xmx2048m -XX:MaxMetaspaceSize=512m
```

---

## 체크리스트

### 사전 준비
- [ ] Firebase에 Android 앱 등록
- [ ] google-services.json 다운로드 및 설치
- [ ] Release 서명 키 생성 (이미 완료: heeling-release.keystore)

### 빌드
- [ ] Release APK 또는 AAB 빌드 성공
- [ ] APK 직접 설치 테스트

### Google Play
- [ ] 개발자 계정 등록 및 결제 ($25)
- [ ] 앱 생성 완료
- [ ] 스토어 등록정보 작성
- [ ] 앱 콘텐츠 설정 완료
- [ ] 내부 테스트 트랙에 업로드
- [ ] 테스터 초대

---

## 서명 키 정보 (중요 - 안전하게 보관)

```
키 파일: mobile/android/app/heeling-release.keystore
키 별칭: heeling-key
키 비밀번호: heeling2024
스토어 비밀번호: heeling2024
```

**주의**: 이 키를 분실하면 앱 업데이트가 불가능합니다!
키 파일을 안전한 곳에 백업해두세요.

---

## 다음 단계

1. Firebase Console에서 Android 앱 등록 후 google-services.json 다운로드
2. APK 빌드 테스트
3. Google Play 개발자 계정 등록 ($25)
4. 내부 테스트 배포
5. 테스터 피드백 수집
6. 프로덕션 출시 준비

---

## 참고 자료

- [React Native - Android 서명 APK](https://reactnative.dev/docs/signed-apk-android)
- [Google Play Console 도움말](https://support.google.com/googleplay/android-developer)
- [Firebase Android 설정](https://firebase.google.com/docs/android/setup)
- [Android App Bundle 가이드](https://developer.android.com/guide/app-bundle)
