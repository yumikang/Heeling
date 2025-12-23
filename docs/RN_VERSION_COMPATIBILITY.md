# React Native 버전 호환성 가이드

Heeling Mobile 앱의 React Native 버전 관리 및 트러블슈팅 문서입니다.

## 현재 버전 구성

| 패키지 | 버전 | 비고 |
|--------|------|------|
| React Native | 0.77.0 | Legacy Architecture |
| React | 18.3.1 | React 19는 RN 0.77과 호환 불가 |
| react-native-reanimated | 3.16.7 | RN 0.77 호환 최신 버전 |
| react-native-track-player | 4.1.1 | TurboModules 미지원으로 인한 제약 |

### 아키텍처 설정

```properties
# android/gradle.properties
newArchEnabled=false
bridgelessEnabled=false
hermesEnabled=true
```

- **Legacy Architecture**: react-native-track-player가 TurboModules를 지원하지 않아 필수
- **Hermes Engine**: 성능 최적화를 위해 활성화

---

## 다운그레이드 배경

### 문제 상황

React Native 0.82.0에서 앱이 정상 빌드되었으나, **react-native-track-player**가 TurboModules를 지원하지 않아 런타임 오류 발생:

```
Error: TurboModuleRegistry.getEnforcing(...): 'TrackPlayerModule' could not be found
```

### 해결 방안

react-native-track-player의 TurboModule 지원이 추가될 때까지 **React Native 0.77.0**으로 다운그레이드하여 Legacy Architecture 사용.

---

## 발생한 문제 및 해결 방법

### 1. Android SoLoader 라이브러리 로딩 오류

#### 증상

앱 실행 직후 즉시 크래시:

```
java.lang.UnsatisfiedLinkError: dlopen failed: library "libreact_featureflagsjni.so" not found
```

#### 원인 분석

React Native 0.77에서는 여러 JNI 라이브러리들이 **병합(merged)**되어 단일 `.so` 파일로 제공됩니다:

| 원래 라이브러리 | 병합된 라이브러리 |
|---------------|-----------------|
| `libreact_featureflagsjni.so` | `libreactnative.so` |
| `libfabricjni.so` | `libreactnative.so` |
| `libyoga.so` | `libreactnative.so` |
| `libhermes_executor.so` | `libhermestooling.so` |

기본 `SoLoader.init(this, false)` 호출 시 병합 매핑을 인식하지 못하여 개별 라이브러리를 찾으려다 실패.

#### 해결 방법

`MainApplication.kt`에서 **OpenSourceMergedSoMapping** 사용:

```kotlin
// 변경 전 (오류 발생)
SoLoader.init(this, false)

// 변경 후 (정상 동작)
import com.facebook.react.soloader.OpenSourceMergedSoMapping
import com.facebook.soloader.SoLoader

SoLoader.init(this, OpenSourceMergedSoMapping)
```

#### 관련 파일

- [MainApplication.kt](../mobile/android/app/src/main/java/com/heelingmobile/MainApplication.kt)
- 참조: `node_modules/react-native/ReactAndroid/.../OpenSourceMergedSoMapping.kt`

---

### 2. iOS Podfile.lock 충돌

#### 증상

```bash
pod install
# 오류: Podfile.lock과 Pods/Manifest.lock이 일치하지 않음
```

#### 해결 방법

```bash
cd mobile/ios
rm -rf Pods Podfile.lock
pod install --repo-update
```

---

### 3. react-native-track-player 패치

#### 문제

track-player 4.1.1 버전에서 일부 메서드의 null 체크 누락.

#### 해결 방법

**patch-package** 사용:

```bash
npx patch-package react-native-track-player
```

패치 파일 위치: `mobile/patches/react-native-track-player+4.1.1.patch`

#### 패치 내용

```kotlin
// MusicModule.kt - getTrack, getActiveTrack 등에서 null 체크 추가
if (item != null) {
    callback.resolve(Arguments.fromBundle(item))
} else {
    callback.resolve(null)
}
```

---

## 빌드 명령어

### iOS

```bash
cd mobile/ios
pod install --repo-update
cd ..
npx react-native run-ios --simulator="iPhone 16"
```

### Android Debug

```bash
cd mobile/android
./gradlew clean
./gradlew assembleDebug
npx react-native run-android
```

### Android Release

```bash
cd mobile/android
./gradlew assembleRelease
# APK 위치: app/build/outputs/apk/release/app-release.apk
```

---

## 버전 업그레이드 시 주의사항

### React Native 업그레이드 전 체크리스트

1. **react-native-track-player TurboModule 지원 확인**
   - GitHub: https://github.com/doublesymmetry/react-native-track-player
   - 이슈: TurboModule 지원 여부 확인

2. **의존성 호환성 확인**
   ```bash
   npx react-native-upgrade-helper
   ```

3. **테스트 필수 항목**
   - 오디오 재생 기능
   - 백그라운드 재생
   - 알림 컨트롤

### 호환성 매트릭스

| RN Version | Track Player | Architecture | 상태 |
|------------|--------------|--------------|------|
| 0.77.0 | 4.1.1 | Legacy | ✅ 현재 사용 중 |
| 0.78.x | 4.1.x | Legacy | ⚠️ 테스트 필요 |
| 0.82.0+ | 4.1.x | New Arch | ❌ TurboModule 미지원 |
| 0.82.0+ | TBD | New Arch | 🔮 향후 지원 예정 |

---

## 프로젝트 구조

```
mobile/
├── android/
│   ├── app/
│   │   ├── src/main/java/com/heelingmobile/
│   │   │   ├── MainActivity.kt
│   │   │   └── MainApplication.kt  # SoLoader 설정
│   │   └── build.gradle
│   ├── gradle.properties           # newArchEnabled=false
│   └── build.gradle
├── ios/
│   ├── HeelingMobile/
│   │   └── AppDelegate.swift
│   ├── Podfile
│   └── Podfile.lock
├── patches/
│   └── react-native-track-player+4.1.1.patch
└── package.json
```

---

## 트러블슈팅 FAQ

### Q: 에뮬레이터에서 앱이 즉시 크래시됩니다

**A**: 이전 버전 APK가 설치되어 있을 수 있습니다:

```bash
adb uninstall com.heelingmobile
adb install app/build/outputs/apk/debug/app-debug.apk
```

### Q: Metro bundler 연결이 안 됩니다

**A**: 캐시 초기화 후 재시작:

```bash
npx react-native start --reset-cache
```

### Q: iOS 빌드 시 CocoaPods 오류

**A**: Pod 캐시 정리:

```bash
cd ios
rm -rf ~/Library/Caches/CocoaPods
rm -rf Pods
rm Podfile.lock
pod cache clean --all
pod install --repo-update
```

### Q: Android 빌드 시 Gradle 오류

**A**: Gradle 캐시 정리:

```bash
cd android
./gradlew clean
rm -rf ~/.gradle/caches
./gradlew assembleDebug
```

---

## 커밋 히스토리

| 커밋 해시 | 날짜 | 설명 |
|----------|------|------|
| `aa3de79` | 2024-XX-XX | RN 0.77.0 다운그레이드 + SoLoader 수정 |

---

## 참고 자료

- [React Native Releases](https://github.com/facebook/react-native/releases)
- [React Native Track Player](https://github.com/doublesymmetry/react-native-track-player)
- [SoLoader Documentation](https://github.com/facebook/SoLoader)
- [React Native Upgrade Helper](https://react-native-community.github.io/upgrade-helper/)
