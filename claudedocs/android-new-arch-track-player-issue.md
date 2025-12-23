# Android New Architecture + react-native-track-player 호환성 문제

## 📋 문제 요약

React Native 0.82+ 에서는 New Architecture가 **강제**로 활성화되며, `react-native-track-player@4.1.2`가 TurboModule 시스템과 호환되지 않아 **앱 크래시 및 빌드 실패** 발생

## 🔍 원인 분석

### 1. React Native 0.82의 변경사항
```
WARNING: Setting `newArchEnabled=false` in your `gradle.properties` file is not
supported anymore since React Native 0.82.

The application will run with the New Architecture enabled by default.
```

- **RN 0.82부터 New Architecture 비활성화 불가능**
- `newArchEnabled=false` 설정은 완전히 무시됨
- 모든 네이티브 모듈이 TurboModule 호환 필요

### 2. react-native-track-player의 문제

#### Runtime 크래시 (Tombstone 분석)
```
Exception in HostObject::get for prop 'TrackPlayerModule':
com.facebook.react.internal.turbomodule.core.TurboModuleInteropUtils$ParsingException:
Unable to parse @ReactMethod annotations from native module: TrackPlayerModule.
Details: TurboModule system assumes returnType == void iff the method is synchronous.
	at com.facebook.react.internal.turbomodule.core.TurboModuleInteropUtils.getMethodDescriptorsFromModule(TurboModuleInteropUtils.kt:64)
```

**핵심 문제점:**
- TrackPlayerModule의 동기 메서드들이 `void`가 아닌 반환 타입을 가짐
- TurboModule 요구사항: 동기 메서드는 반드시 `void` 반환해야 함

#### Build 실패
```bash
FAILURE: Build failed with an exception.

* What went wrong:
Execution failed for task ':react-native-track-player:compileReleaseKotlin'.
> Compilation error. See log for more details

BUILD FAILED in 8s
243 actionable tasks: 108 executed, 135 up-to-date
```

### 3. 테스트 결과

#### Test 1: 기존 APK (newArchEnabled=true)
- **상태**: Runtime 크래시
- **로그**: TurboModule 파싱 에러
- **결과**: 앱 즉시 종료

#### Test 2: newArchEnabled=false로 빌드 시도
- **경고**: "newArchEnabled=false is not supported anymore"
- **상태**: 빌드 실패
- **에러**: `:react-native-track-player:compileReleaseKotlin` 실패
- **결과**: APK 생성 안됨

## 💡 해결 방안

### Option A: React Native 다운그레이드 (권장)
```json
{
  "react-native": "0.76.x" // 또는 "0.80.x"
}
```

**장점:**
- New Architecture 비활성화 가능
- react-native-track-player 그대로 사용
- 즉시 적용 가능

**단점:**
- 최신 RN 기능 사용 불가
- 보안/버그 패치 지연 가능성
- 장기적으로 유지보수 부담

### Option B: react-native-track-player 교체
```bash
npm uninstall react-native-track-player
npm install [alternative-audio-library]
```

**대안 라이브러리:**
- `react-native-sound` (간단한 오디오 재생)
- `@react-native-community/audio-toolkit` (더 강력한 기능)
- 직접 Expo Audio API 사용 (Expo 전환 시)

**장점:**
- RN 0.82+ 최신 버전 유지
- New Architecture 활용
- 장기적 안정성

**단점:**
- 코드 전면 수정 필요
- 기능 차이로 인한 재작업
- 테스트 시간 소요

### Option C: track-player v5.0.0 대기 (미확인)
```bash
# 아직 릴리스 안됨
npm install react-native-track-player@next
```

**주의사항:**
- v5.0.0이 TurboModule 지원 여부 미확정
- alpha/beta 버전의 안정성 문제
- 릴리스 일정 불명확

## 🎯 권장 결정 플로우

### 프로젝트 상황 고려
```
1. 출시 일정이 급한가?
   → YES: Option A (RN 다운그레이드)
   → NO: 계속

2. 오디오 기능이 핵심인가?
   → YES: track-player 이슈 트래커 확인 → v5 대기 또는 교체
   → NO: Option B (라이브러리 교체)

3. 장기 유지보수 중요한가?
   → YES: Option B (최신 RN + 호환 라이브러리)
   → NO: Option A (빠른 해결)
```

## 📝 추가 정보

### 환경 정보
- React Native: 0.82.1
- react-native-track-player: 4.1.2
- Android Gradle Plugin: 9.0.0
- Target SDK: 36
- Min SDK: 24

### 관련 파일
- [mobile/android/gradle.properties](../mobile/android/gradle.properties)
- [mobile/package.json](../mobile/package.json)
- [Tombstone 로그](../mobile/android/tombstone_05.txt) (에뮬레이터)

### 참고 링크
- [React Native 0.82 Release Notes](https://github.com/facebook/react-native/releases/tag/v0.82.0)
- [react-native-track-player GitHub Issues](https://github.com/doublesymmetry/react-native-track-player/issues)
- [TurboModule Documentation](https://reactnative.dev/docs/the-new-architecture/pillars-turbomodules)

## ⚠️ 중요 참고사항

**이 이슈는 단순한 설정 문제가 아닙니다:**
- `newArchEnabled=false` 설정은 RN 0.82+에서 **무시됨**
- 다른 gradle 설정 변경으로 해결 **불가능**
- 반드시 위 3가지 Option 중 선택 필요

## 🍎 iOS 테스트 결과

### iOS New Architecture 상태
```bash
# iOS Pods에서 확인된 컴파일 플래그
COMPILER_FLAGS = "-DRCT_NEW_ARCH_ENABLED=1"
```

**발견사항:**
- iOS에서도 New Architecture가 활성화되어 있음
- **하지만 앱이 정상 작동함** (시뮬레이터에서 크래시 없이 실행)
- iOS에서는 `react-native-track-player`가 Interop 레이어를 통해 호환됨

### iOS vs Android 차이점

| 항목 | Android | iOS |
|------|---------|-----|
| New Arch 상태 | 강제 활성화 (RN 0.82+) | 활성화됨 |
| track-player 빌드 | ❌ Kotlin 컴파일 실패 | ✅ 성공 |
| 앱 실행 | ❌ 크래시 (TurboModule 에러) | ✅ 정상 작동 |
| Interop 레이어 | 불완전 | 정상 작동 |

### 왜 iOS는 작동하고 Android는 안 되는가?

**Android의 문제:**
- TurboModule 시스템이 Kotlin/Java 네이티브 모듈의 메서드 시그니처를 엄격하게 검증
- `@ReactMethod` 어노테이션 파싱 시 동기 메서드의 반환 타입을 강제 체크
- **빌드 타임에 컴파일 실패** + **런타임에 파싱 에러**

**iOS의 우회:**
- Objective-C 네이티브 모듈은 더 유연한 브리지 메커니즘
- Interop 레이어가 Old/New Architecture 간 호환성 제공
- **빌드 성공** + **런타임 정상 동작**

## 🎯 업데이트된 권장 사항

### Android만의 문제라면?

**Option D: iOS 우선 출시 + Android 대응 준비**
```
1. iOS는 현재 상태로 먼저 출시
2. Android는 다음 중 선택:
   - Option A: RN 다운그레이드
   - Option B: react-native-track-player 교체
   - Option C: v5.0.0 대기
```

**장점:**
- iOS 사용자에게 먼저 서비스 제공 가능
- Android 해결책 준비 시간 확보
- 시장 반응 테스트 가능

**단점:**
- 플랫폼 간 출시 시기 차이
- Android 사용자 불만 가능성

**추가 테스트가 필요한 부분:**
- 실제 iOS 디바이스에서도 정상 작동하는지 확인
- 다른 네이티브 라이브러리들의 TurboModule 호환성
- iOS Production 빌드 테스트
