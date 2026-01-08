# Heeling 앱 개발 환경 설정 가이드

프로젝트 진행 중 겪은 시행착오와 해결 방법을 정리한 종합 가이드입니다.

---

## 목차

1. [개발 환경 요구사항](#개발-환경-요구사항)
2. [Xcode 버전 호환성 (중요!)](#xcode-버전-호환성-중요)
3. [React Native 버전 선택](#react-native-버전-선택)
4. [iOS 개발 환경](#ios-개발-환경)
5. [Android 개발 환경](#android-개발-환경)
6. [자주 발생하는 문제 및 해결](#자주-발생하는-문제-및-해결)
7. [프로젝트별 주의사항](#프로젝트별-주의사항)

---

## 개발 환경 요구사항

### 필수 소프트웨어

| 소프트웨어 | 최소 버전 | 권장 버전 | 비고 |
|-----------|----------|----------|------|
| macOS | 14.0 (Sonoma) | 15.x (Sequoia) | iOS 개발 필수 |
| Xcode | 15.0 | **15.4 (정식)** | ⚠️ 베타 사용 금지 |
| Node.js | 20.x | 20.x LTS | engines 필드로 강제 |
| Java | 17 | 17 | Android 빌드 필수 |
| Ruby | 2.7 | 3.x | CocoaPods 설치 |
| CocoaPods | 1.14 | 최신 | iOS 의존성 관리 |
| Android Studio | Hedgehog | 최신 | Android SDK 관리 |

### 버전 확인 명령어

```bash
# 모든 환경 버전 한 번에 확인
node --version        # v20.x.x
java -version         # openjdk 17.x
ruby --version        # ruby 3.x
pod --version         # 1.14.x 이상
xcodebuild -version   # Xcode 15.x

# Xcode Command Line Tools
xcode-select -p
```

---

## Xcode 버전 호환성 (중요!)

### 베타 버전 사용 금지

프로젝트 초반에 Xcode 베타 버전 사용으로 많은 문제를 겪었습니다.

#### 베타 버전에서 발생한 문제들

1. **CocoaPods 호환성 문제**
   - 베타 SDK와 Pods 버전 불일치
   - 빌드 시 cryptic 에러 메시지
   - 의존성 해결 실패

2. **Swift 컴파일러 버그**
   - 정식 버전에서는 없는 컴파일 에러
   - Firebase SDK 빌드 실패
   - 모듈 인터페이스 파싱 오류

3. **시뮬레이터 불안정**
   - 앱 설치/실행 랜덤 실패
   - 디버거 연결 끊김
   - 시뮬레이터 부팅 실패

#### 권장 사항

```
✅ 사용해야 할 것: Xcode 15.4 또는 15.3 (정식 릴리스)
❌ 피해야 할 것: Xcode 16 beta, Xcode 17 beta 등
```

### Xcode 버전 확인 및 전환

```bash
# 현재 Xcode 버전 확인
xcodebuild -version

# 설치된 Xcode 목록 확인
ls /Applications/ | grep Xcode

# Xcode 전환 (여러 버전 설치 시)
sudo xcode-select -s /Applications/Xcode-15.4.app

# Command Line Tools 재설치
sudo xcode-select --install
```

### 정식 Xcode 다운로드

1. **App Store 사용 (권장)**
   - App Store에서 "Xcode" 검색
   - 정식 버전만 표시됨

2. **Apple Developer 사이트**
   - https://developer.apple.com/download/all/
   - "Release" 탭에서 다운로드
   - ⚠️ "Beta" 탭 사용 금지

### Xcode 버전별 iOS SDK 지원

| Xcode 버전 | iOS SDK | macOS 요구사항 | Swift 버전 |
|-----------|---------|--------------|-----------|
| 15.4 | iOS 17.5 | macOS 14.0+ | Swift 5.10 |
| 15.3 | iOS 17.4 | macOS 14.0+ | Swift 5.10 |
| 15.2 | iOS 17.2 | macOS 14.0+ | Swift 5.9 |
| 15.0 | iOS 17.0 | macOS 13.5+ | Swift 5.9 |

---

## React Native 버전 선택

### 현재 구성 (권장)

```json
{
  "react-native": "0.76.9",
  "react": "18.3.1",
  "expo": "^52.0.48"
}
```

### 왜 최신 버전(0.82+)을 사용하지 않는가?

#### react-native-track-player 호환성 문제

```
┌─────────────────────────────────────────────────────────────────┐
│ RN 0.82+ 에서는 New Architecture가 강제 활성화됩니다           │
│ react-native-track-player는 TurboModule을 지원하지 않습니다    │
│ → 앱 크래시 발생                                               │
└─────────────────────────────────────────────────────────────────┘
```

#### 버전별 호환성 매트릭스

| RN 버전 | Track Player | Architecture | 상태 |
|--------|--------------|--------------|------|
| 0.76.x | 4.1.1 | Legacy | ✅ 현재 사용 중 |
| 0.77.x | 4.1.x | Legacy | ✅ 호환 |
| 0.78.x | 4.1.x | Legacy | ⚠️ 테스트 필요 |
| 0.82.0+ | 4.1.x | New Arch (강제) | ❌ 크래시 |

#### New Architecture 관련 에러

```
# Android에서 발생하는 에러
Error: TurboModuleRegistry.getEnforcing(...):
'TrackPlayerModule' could not be found

# 또는
Exception in HostObject::get for prop 'TrackPlayerModule':
Unable to parse @ReactMethod annotations...
```

### 아키텍처 설정

```properties
# android/gradle.properties
newArchEnabled=false
bridgelessEnabled=false
hermesEnabled=true
```

```json
// ios/Podfile.properties.json
{
  "newArchEnabled": "false",
  "expo.jsEngine": "hermes"
}
```

---

## iOS 개발 환경

### 초기 설정

```bash
# 1. Ruby 설치 (rbenv 권장)
brew install rbenv
rbenv install 3.2.2
rbenv global 3.2.2

# 2. CocoaPods 설치
gem install cocoapods

# 3. iOS 의존성 설치
cd mobile/ios
pod install --repo-update
```

### Pod 설치 문제 해결

```bash
# 캐시 완전 정리 (문제 발생 시)
cd mobile/ios
rm -rf Pods Podfile.lock
rm -rf ~/Library/Caches/CocoaPods
pod cache clean --all
pod install --repo-update
```

### Firebase 설정

```ruby
# Podfile에 필수 설정 (이미 적용됨)
pod 'FirebaseCore', :modular_headers => true
pod 'FirebaseCoreInternal', :modular_headers => true
pod 'GoogleUtilities', :modular_headers => true
```

### 빌드 및 실행

```bash
# 시뮬레이터에서 실행
cd mobile
npx expo run:ios --simulator="iPhone 16"

# 실제 기기에서 실행
npx expo run:ios --device

# 빌드만 (Archive 전 테스트)
cd ios
xcodebuild -workspace BRIBI.xcworkspace -scheme BRIBI -sdk iphonesimulator
```

---

## Android 개발 환경

### Java 설정

```bash
# Homebrew로 OpenJDK 17 설치
brew install openjdk@17

# 환경 변수 설정 (~/.zshrc 또는 ~/.bash_profile)
export JAVA_HOME=/opt/homebrew/opt/openjdk@17
export PATH="$JAVA_HOME/bin:$PATH"

# 적용
source ~/.zshrc
```

### Android SDK 설정

```bash
# 환경 변수 (~/.zshrc)
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
```

### 빌드 및 실행

```bash
# 에뮬레이터에서 실행
cd mobile
npx expo run:android

# Release APK 빌드
cd android
./gradlew clean
./gradlew assembleRelease

# APK 위치
# app/build/outputs/apk/release/app-release.apk

# AAB 빌드 (Google Play 업로드용)
./gradlew bundleRelease
```

### SoLoader 설정 (RN 0.77 필수)

```kotlin
// MainApplication.kt
import com.facebook.react.soloader.OpenSourceMergedSoMapping
import com.facebook.soloader.SoLoader

// onCreate에서
SoLoader.init(this, OpenSourceMergedSoMapping)
```

이 설정 없이는 앱 시작 시 크래시 발생:
```
java.lang.UnsatisfiedLinkError:
dlopen failed: library "libreact_featureflagsjni.so" not found
```

---

## 자주 발생하는 문제 및 해결

### iOS 문제

#### 1. "No profiles for 'bundle.id' were found"

```bash
# Xcode → Signing & Capabilities → Automatically manage signing 해제
# Provisioning Profile 수동 선택
# 또는
xcodebuild clean -workspace BRIBI.xcworkspace -scheme BRIBI
```

#### 2. Pod 버전 충돌

```bash
# 완전 초기화
cd mobile/ios
rm -rf Pods Podfile.lock
rm -rf ~/Library/Developer/Xcode/DerivedData
pod deintegrate
pod setup
pod install --repo-update
```

#### 3. Archive 빌드 실패

```bash
# 1. Xcode 버전 확인 (정식 버전인지)
xcodebuild -version

# 2. 캐시 정리
rm -rf ~/Library/Developer/Xcode/DerivedData

# 3. 클린 빌드
xcodebuild clean -workspace BRIBI.xcworkspace -scheme BRIBI
```

#### 4. 시뮬레이터 부팅 실패

```bash
# 시뮬레이터 초기화
xcrun simctl shutdown all
xcrun simctl erase all
```

### Android 문제

#### 1. Gradle 빌드 실패

```bash
cd mobile/android

# 캐시 정리
./gradlew clean
rm -rf ~/.gradle/caches

# 다시 빌드
./gradlew assembleDebug
```

#### 2. "SDK location not found"

```bash
# local.properties 생성
echo "sdk.dir=$HOME/Library/Android/sdk" > mobile/android/local.properties
```

#### 3. 메모리 부족 에러

```properties
# gradle.properties에 추가
org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=1024m
org.gradle.parallel=true
```

#### 4. 에뮬레이터에서 앱 크래시

```bash
# 이전 버전 완전 제거
adb uninstall com.heeling

# 새로 설치
adb install app/build/outputs/apk/debug/app-debug.apk
```

### Metro Bundler 문제

```bash
# 캐시 초기화
npx react-native start --reset-cache

# 또는 완전 정리
cd mobile
rm -rf node_modules
rm package-lock.json
npm install
```

---

## 프로젝트별 주의사항

### 1. 의존성 버전 고정

```json
// package.json에서 정확한 버전 사용
{
  "react-native": "0.76.9",      // ^ 없이 고정
  "react-native-track-player": "4.1.1"
}
```

### 2. patch-package 사용

일부 라이브러리는 패치가 필요합니다:

```bash
# 패치 적용 (postinstall에서 자동 실행)
npx patch-package

# 새 패치 생성
# 1. node_modules 내 파일 수정
# 2. 패치 생성
npx patch-package react-native-track-player
```

패치 파일 위치: `mobile/patches/`

### 3. 환경별 빌드 설정

| 환경 | iOS | Android |
|------|-----|---------|
| Debug | `expo run:ios` | `expo run:android` |
| Release | Xcode Archive | `./gradlew assembleRelease` |
| TestFlight | Xcode → Distribute | - |
| Play Store | - | `./gradlew bundleRelease` |

### 4. 인증서 및 키 관리

**iOS:**
- Apple Developer Program 등록 ($99/년)
- Distribution 인증서
- Provisioning Profile
- 상세: [IOS_CERTIFICATES.md](./IOS_CERTIFICATES.md)

**Android:**
- Release keystore 생성
- `mobile/android/app/heeling-release.keystore`
- ⚠️ 키 분실 시 앱 업데이트 불가!
- 상세: [ANDROID_PLAYSTORE_SETUP.md](./ANDROID_PLAYSTORE_SETUP.md)

---

## 환경 설정 체크리스트

### macOS 초기 설정

- [ ] Homebrew 설치
- [ ] Node.js 20.x 설치
- [ ] Java 17 설치
- [ ] Ruby 3.x 설치
- [ ] CocoaPods 설치
- [ ] Android Studio 설치
- [ ] Xcode **정식 버전** 설치 (베타 금지!)
- [ ] Xcode Command Line Tools 설치

### 프로젝트 클론 후

- [ ] `cd mobile && npm install`
- [ ] `cd ios && pod install --repo-update`
- [ ] iOS 시뮬레이터 빌드 테스트
- [ ] Android 에뮬레이터 빌드 테스트

### 배포 전

- [ ] iOS: 인증서/프로파일 설정
- [ ] Android: Release keystore 생성
- [ ] 환경 변수 확인 (API 키 등)
- [ ] Release 빌드 테스트

---

## 문서 히스토리

| 날짜 | 내용 |
|-----|------|
| 2025-01 | 초기 작성 - Xcode 베타 이슈, RN 버전 호환성 정리 |

---

## 참고 문서

- [RN_VERSION_COMPATIBILITY.md](./RN_VERSION_COMPATIBILITY.md) - React Native 버전 상세
- [IOS_CERTIFICATES.md](./IOS_CERTIFICATES.md) - iOS 인증서 설정
- [TESTFLIGHT_SETUP.md](./TESTFLIGHT_SETUP.md) - TestFlight 배포
- [ANDROID_PLAYSTORE_SETUP.md](./ANDROID_PLAYSTORE_SETUP.md) - Android 배포
- [android-new-arch-track-player-issue.md](../claudedocs/android-new-arch-track-player-issue.md) - New Arch 이슈 상세
