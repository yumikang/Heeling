# UI/UX 앱스토어 리젝 방지 체크리스트

> Apple App Store 심사 통과를 위한 프론트엔드 작업 목록

---

## 실행 요약

| 우선순위 | 작업 | 예상 시간 | 리젝 위험도 |
|----------|------|-----------|-------------|
| **P0-1** | PrivacyInfo.xcprivacy 생성 | 15분 | 🔴 필수 |
| **P0-2** | NSLocationWhenInUseUsageDescription 제거 | 5분 | 🔴 필수 |
| **P0-3** | PremiumScreen IAP 미작동 처리 | 30분 | 🔴 필수 |
| **P1-1** | LoginScreen 약관 링크 추가 | 20분 | 🟡 중간 |
| **P1-2** | Sign in with Apple 공식 버튼 | 30분 | 🟡 중간 |
| **P2-1** | Dynamic Type 기본 지원 | 1시간 | 🟢 권장 |

**총 예상 시간**: 약 2.5시간

---

## P0: 배포 전 필수 (리젝 확정)

### P0-1: PrivacyInfo.xcprivacy 생성

**상태**: ❌ 파일 없음

**리젝 사유**: 2024년 5월부터 Apple 필수 요구사항

**작업 내용**:

1. `ios/HeelingMobile/PrivacyInfo.xcprivacy` 파일 생성
2. Xcode에서 프로젝트에 추가

**파일 내용**:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>NSPrivacyTracking</key>
  <false/>
  <key>NSPrivacyTrackingDomains</key>
  <array/>
  <key>NSPrivacyCollectedDataTypes</key>
  <array>
    <dict>
      <key>NSPrivacyCollectedDataType</key>
      <string>NSPrivacyCollectedDataTypeEmailAddress</string>
      <key>NSPrivacyCollectedDataTypeLinked</key>
      <true/>
      <key>NSPrivacyCollectedDataTypeTracking</key>
      <false/>
      <key>NSPrivacyCollectedDataTypePurposes</key>
      <array>
        <string>NSPrivacyCollectedDataTypePurposeAppFunctionality</string>
      </array>
    </dict>
    <dict>
      <key>NSPrivacyCollectedDataType</key>
      <string>NSPrivacyCollectedDataTypeUserID</string>
      <key>NSPrivacyCollectedDataTypeLinked</key>
      <true/>
      <key>NSPrivacyCollectedDataTypeTracking</key>
      <false/>
      <key>NSPrivacyCollectedDataTypePurposes</key>
      <array>
        <string>NSPrivacyCollectedDataTypePurposeAppFunctionality</string>
      </array>
    </dict>
  </array>
  <key>NSPrivacyAccessedAPITypes</key>
  <array>
    <dict>
      <key>NSPrivacyAccessedAPIType</key>
      <string>NSPrivacyAccessedAPICategoryUserDefaults</string>
      <key>NSPrivacyAccessedAPITypeReasons</key>
      <array>
        <string>CA92.1</string>
      </array>
    </dict>
  </array>
</dict>
</plist>
```

**검증 방법**:
```bash
# Xcode에서 빌드 후 확인
xcodebuild -showBuildSettings | grep PRIVACY
```

---

### P0-2: NSLocationWhenInUseUsageDescription 제거

**상태**: ❌ 빈 문자열로 존재

**현재 코드** (`ios/HeelingMobile/Info.plist`):
```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string/>  <!-- 빈 문자열 = 리젝 사유 -->
```

**작업 내용**:
- 위치 기능 미사용 시 해당 키 완전 제거
- 또는 사용 시 명확한 설명 추가

**수정 후**:
```xml
<!-- 해당 두 줄 삭제 -->
```

---

### P0-3: PremiumScreen IAP 미작동 처리

**상태**: ❌ 결제 시도 시 에러

**현재 동작**:
```typescript
// IAPService.ts - 스텁 상태
async purchaseSubscription(): Promise<void> {
  throw new Error('IAP_NOT_AVAILABLE');
}

// PremiumScreen.tsx - 에러 처리
if (error.message === 'IAP_NOT_AVAILABLE') {
  Alert.alert('알림', '인앱 결제 기능이 아직 준비 중입니다.');
}
```

**Apple 리젝 사유**:
> "The app offers in-app purchase but the purchase functionality does not work."

**해결 옵션**:

| 옵션 | 설명 | 권장도 | 코드 변경량 |
|------|------|--------|-------------|
| **A** | IAP 완전 구현 | ✅ 최선 | 많음 |
| **B** | Premium 기능 숨김 (Feature Flag) | ⚠️ 차선 | 적음 |
| **C** | 버튼 비활성화 + "준비 중" 명시 | ⚠️ 리스크 | 최소 |

**권장안 (옵션 B)**: Feature Flag로 Premium 숨김

```typescript
// constants/index.ts
export const ENABLE_PREMIUM = false; // 출시 후 true로 변경

// SettingsScreen.tsx - Premium 섹션 조건부 렌더링
{ENABLE_PREMIUM && (
  <View style={styles.section}>
    <TouchableOpacity style={styles.premiumCard} ...>
```

```typescript
// App.tsx 또는 Navigation - Premium 화면 조건부 등록
{ENABLE_PREMIUM && (
  <Stack.Screen name="Premium" component={PremiumScreen} />
)}
```

---

## P1: 중간 위험도 (심사관 재량)

### P1-1: LoginScreen 약관 링크 추가

**상태**: ⚠️ 텍스트만 있고 터치 불가

**현재 코드** (`LoginScreen.tsx:178-180`):
```tsx
<Text style={styles.terms}>
  계속 진행하면 이용약관 및 개인정보처리방침에 동의하게 됩니다.
</Text>
```

**수정 후**:
```tsx
import { Linking } from 'react-native';

// 또는 앱 내 ContentPage로 이동
const handleTermsPress = () => {
  navigation.navigate('ContentPage', { slug: 'terms', title: '이용약관' });
};

const handlePrivacyPress = () => {
  navigation.navigate('ContentPage', { slug: 'privacy', title: '개인정보처리방침' });
};

// JSX
<Text style={styles.terms}>
  계속 진행하면{' '}
  <Text style={styles.termsLink} onPress={handleTermsPress}>
    이용약관
  </Text>
  {' '}및{' '}
  <Text style={styles.termsLink} onPress={handlePrivacyPress}>
    개인정보처리방침
  </Text>
  에 동의하게 됩니다.
</Text>

// 스타일 추가
termsLink: {
  color: Colors.primary,
  textDecorationLine: 'underline',
},
```

---

### P1-2: Sign in with Apple 공식 버튼

**상태**: ⚠️ 커스텀 버튼 사용 중

**현재 코드** (`LoginScreen.tsx:131-146`):
```tsx
<TouchableOpacity style={styles.appleButton}>
  <Icon name="logo-apple" size={20} color="#000" />
  <Text style={styles.appleButtonText}>Apple로 계속하기</Text>
</TouchableOpacity>
```

**Apple HIG 요구사항**:
- 공식 SF Symbol 또는 AppleButton 컴포넌트 사용 권장
- 버튼 높이 최소 44pt
- 모서리 반경 일관성

**수정 후** (공식 버튼 사용):
```tsx
import { appleAuth, AppleButton } from '@invertase/react-native-apple-authentication';

{Platform.OS === 'ios' && isAppleSupported && (
  <AppleButton
    buttonStyle={AppleButton.Style.WHITE}
    buttonType={AppleButton.Type.SIGN_IN}
    style={styles.appleButton}
    onPress={handleAppleLogin}
  />
)}

// 스타일
appleButton: {
  width: '100%',
  height: 50,
  marginBottom: Spacing.md,
},
```

**대안** (커스텀 유지 시):
- Apple SF Symbols 폰트 사용
- 버튼 스타일을 Apple HIG에 정확히 맞춤
  - 흰색 배경 + 검은 텍스트 + 검은 아이콘
  - 또는 검은 배경 + 흰색 텍스트 + 흰색 아이콘

---

## P2: 권장 사항 (접근성)

### P2-1: Dynamic Type 기본 지원

**상태**: ❌ 고정 폰트 사이즈 사용

**현재 코드** (`typography.ts`):
```typescript
body: {
  fontSize: 16,  // 고정값
  fontWeight: '400',
  lineHeight: 24,
},
```

**영향**: 시력이 약한 사용자가 시스템 폰트 크기를 키워도 앱에 반영 안 됨

**수정 방법**:

```typescript
import { PixelRatio } from 'react-native';

// 시스템 폰트 스케일 적용
const fontScale = PixelRatio.getFontScale();

export const Typography = {
  body: {
    fontSize: 16 * Math.min(fontScale, 1.3), // 최대 130%까지 스케일
    fontWeight: '400',
    lineHeight: 24 * Math.min(fontScale, 1.3),
  },
  // ...
};
```

**또는 react-native-size-matters 사용**:
```bash
npm install react-native-size-matters
```

```typescript
import { moderateScale } from 'react-native-size-matters';

body: {
  fontSize: moderateScale(16),
  lineHeight: moderateScale(24),
},
```

---

## 작업 순서 권장

```
1. P0-1: PrivacyInfo.xcprivacy 생성 (15분)
   ↓
2. P0-2: 빈 Location 권한 제거 (5분)
   ↓
3. P0-3: Premium Feature Flag 적용 (30분)
   ↓
4. P1-1: 약관 링크 추가 (20분)
   ↓
5. P1-2: Apple 버튼 교체 (30분)
   ↓
6. P2-1: Dynamic Type (선택, 1시간)
```

---

## 검증 체크리스트

### 빌드 전 확인

- [ ] `PrivacyInfo.xcprivacy` 파일이 Xcode 프로젝트에 포함됨
- [ ] `Info.plist`에 빈 Usage Description 없음
- [ ] Premium 화면 접근 불가 또는 IAP 정상 동작

### 테스트 항목

- [ ] 로그인 화면에서 약관/개인정보 링크 터치 가능
- [ ] Sign in with Apple 버튼 정상 동작
- [ ] 게스트 모드로 앱 전체 탐색 가능
- [ ] VoiceOver 켜고 주요 화면 탐색 가능

### 제출 전 확인

- [ ] TestFlight 빌드 성공
- [ ] App Store Connect 메타데이터 작성
- [ ] 스크린샷 5.5" / 6.5" 준비
- [ ] 개인정보처리방침 URL 등록

---

## 참고 자료

- [Apple App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Apple Human Interface Guidelines - Sign in with Apple](https://developer.apple.com/design/human-interface-guidelines/sign-in-with-apple)
- [Privacy Manifest Files](https://developer.apple.com/documentation/bundleresources/privacy_manifest_files)
- [Dynamic Type](https://developer.apple.com/design/human-interface-guidelines/typography#Dynamic-Type)
