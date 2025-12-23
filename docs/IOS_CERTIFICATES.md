# iOS 인증서 및 TestFlight 배포 가이드

## 목차
1. [사전 준비](#사전-준비)
2. [인증서 생성](#인증서-생성)
3. [App ID 생성](#app-id-생성)
4. [프로비저닝 프로파일 생성](#프로비저닝-프로파일-생성)
5. [Xcode 설정](#xcode-설정)
6. [App Store Connect 설정](#app-store-connect-설정)
7. [TestFlight 배포](#testflight-배포)
8. [자동화 (선택사항)](#자동화-선택사항)

---

## 사전 준비

### 필요한 계정
- [x] Apple Developer Program 등록 ($99/년)
- [ ] App Store Connect 접근 권한

### 필요한 정보
| 항목 | 현재 값 | 권장 변경 |
|-----|--------|----------|
| Bundle ID | org.reactjs.native.example.HeelingMobile | com.heeling.app |
| 앱 이름 | HeelingMobile | Heeling |
| Team ID | Apple Developer에서 확인 | - |

### 필요한 파일
- GoogleService-Info.plist (Firebase) ✅ 설정됨

---

## 인증서 생성

### 1. 인증서 서명 요청 (CSR) 생성

1. **키체인 접근** 앱 열기 (Spotlight에서 "키체인" 검색)
2. 메뉴: **키체인 접근 → 인증서 지원 → 인증 기관에서 인증서 요청**
3. 정보 입력:
   - 사용자 이메일: Apple Developer 계정 이메일
   - 일반 이름: 개발자 이름
   - CA 이메일: 비워둠
   - **디스크에 저장됨** 선택
4. 계속 → CSR 파일 저장 (CertificateSigningRequest.certSigningRequest)

### 2. Development 인증서 생성

1. https://developer.apple.com/account 접속
2. **Certificates, Identifiers & Profiles** 선택
3. **Certificates** → **+** 버튼 클릭
4. **iOS App Development** 선택 → Continue
5. CSR 파일 업로드 → Continue
6. 인증서 다운로드 (development.cer)
7. 다운로드한 파일 더블클릭하여 키체인에 설치

### 3. Distribution 인증서 생성

1. **Certificates** → **+** 버튼 클릭
2. **iOS Distribution (App Store Connect and Ad Hoc)** 선택 → Continue
3. CSR 파일 업로드 → Continue
4. 인증서 다운로드 (distribution.cer)
5. 다운로드한 파일 더블클릭하여 키체인에 설치

### 인증서 확인
```bash
# 터미널에서 설치된 인증서 확인
security find-identity -v -p codesigning
```

---

## App ID 생성

### 새 App ID 생성 (권장: Bundle ID 변경)

1. **Identifiers** → **+** 버튼 클릭
2. **App IDs** 선택 → Continue
3. **App** 선택 → Continue
4. 정보 입력:
   - **Description**: Heeling Music App
   - **Bundle ID**: Explicit → `com.heeling.app`
5. **Capabilities** 선택:
   - [x] Push Notifications (나중에 필요시)
   - [x] Sign In with Apple (나중에 필요시)
6. Continue → Register

### 현재 Bundle ID 사용시
- 기존 `org.reactjs.native.example.HeelingMobile` 그대로 사용 가능
- 단, App Store 출시 전 변경 권장

---

## 프로비저닝 프로파일 생성

### Development Profile (개발용)

1. **Profiles** → **+** 버튼 클릭
2. **iOS App Development** 선택 → Continue
3. App ID 선택: `com.heeling.app` (또는 기존 Bundle ID)
4. Development 인증서 선택 → Continue
5. 테스트 기기 선택 → Continue
6. Profile Name: `Heeling Development`
7. Generate → Download

### Distribution Profile (배포용)

1. **Profiles** → **+** 버튼 클릭
2. **App Store Connect** 선택 → Continue
3. App ID 선택 → Continue
4. Distribution 인증서 선택 → Continue
5. Profile Name: `Heeling Distribution`
6. Generate → Download

### 프로파일 설치
```bash
# 다운로드된 프로파일을 더블클릭하거나:
open ~/Downloads/Heeling_Development.mobileprovision
open ~/Downloads/Heeling_Distribution.mobileprovision
```

---

## Xcode 설정

### 프로젝트 열기
```bash
cd mobile/ios
open HeelingMobile.xcworkspace
```

### Bundle ID 변경 (선택)

1. Project Navigator에서 **HeelingMobile** 프로젝트 선택
2. **TARGETS** → **HeelingMobile** 선택
3. **General** 탭:
   - **Bundle Identifier**: `com.heeling.app` 입력
   - **Version**: `1.0.0`
   - **Build**: `1`

### Signing 설정

1. **Signing & Capabilities** 탭
2. **Automatically manage signing** 체크 해제 (수동 관리)
3. **Debug** 섹션:
   - Team: 본인 팀 선택
   - Provisioning Profile: `Heeling Development` 선택
4. **Release** 섹션:
   - Team: 본인 팀 선택
   - Provisioning Profile: `Heeling Distribution` 선택

### 또는 자동 서명 (간편)

1. **Automatically manage signing** 체크
2. Team 선택
3. Xcode가 자동으로 프로파일 관리

---

## App Store Connect 설정

### 새 앱 등록

1. https://appstoreconnect.apple.com 접속
2. **나의 앱** → **+** → **새 앱**
3. 정보 입력:
   - **플랫폼**: iOS
   - **이름**: Heeling
   - **기본 언어**: 한국어
   - **번들 ID**: 위에서 생성한 App ID 선택
   - **SKU**: heeling-app-001 (고유값)
   - **사용자 접근 권한**: 전체 접근

### 앱 정보 입력

1. **앱 정보** 섹션:
   - 개인정보 처리방침 URL (필수)
   - 카테고리: 건강 및 피트니스 / 음악

2. **가격 및 사용 가능 여부**:
   - 가격: 무료
   - 사용 가능 국가 선택

---

## TestFlight 배포

### 1. Archive 빌드 생성

```bash
# Xcode에서:
# 1. 시뮬레이터 대신 "Any iOS Device (arm64)" 선택
# 2. Product → Scheme → Edit Scheme
# 3. Run → Build Configuration → Release
# 4. Product → Archive
```

### 2. App Store Connect 업로드

1. Archive 완료 후 **Organizer** 창 자동 오픈
2. 빌드 선택 → **Distribute App**
3. **App Store Connect** 선택 → Next
4. **Upload** 선택 → Next
5. 옵션 확인:
   - [x] Include bitcode for iOS content
   - [x] Strip Swift symbols
   - [x] Upload your app's symbols
6. Next → Upload

### 3. TestFlight 테스터 설정

1. App Store Connect → 앱 선택 → **TestFlight** 탭
2. 업로드된 빌드 확인 (처리에 몇 분 소요)
3. **내부 테스팅** 설정:
   - **+** 버튼 → 그룹 생성 (예: "개발팀")
   - 테스터 추가 (Apple ID 이메일)
   - 빌드 선택 → 테스트 시작

### 4. 테스터 초대

- 초대받은 테스터는 이메일 수신
- TestFlight 앱 설치 (App Store에서)
- 초대 수락 후 앱 설치 가능

### 5. 외부 테스팅 (선택)

1. **외부 테스팅** 섹션
2. 빌드 제출 (Apple 심사 필요, 1-2일 소요)
3. 최대 10,000명 테스터 초대 가능

---

## 자동화 (선택사항)

### Fastlane 설정

```bash
# Fastlane 설치
brew install fastlane

# 프로젝트에서 초기화
cd mobile/ios
fastlane init
```

### Fastfile 예시
```ruby
# fastlane/Fastfile
default_platform(:ios)

platform :ios do
  desc "Push a new beta build to TestFlight"
  lane :beta do
    increment_build_number
    build_app(
      workspace: "HeelingMobile.xcworkspace",
      scheme: "HeelingMobile",
      export_method: "app-store"
    )
    upload_to_testflight
  end

  desc "Push a new release build to the App Store"
  lane :release do
    build_app(
      workspace: "HeelingMobile.xcworkspace",
      scheme: "HeelingMobile"
    )
    upload_to_app_store
  end
end
```

### 사용법
```bash
# TestFlight 배포
fastlane beta

# App Store 배포
fastlane release
```

---

## 체크리스트

### 초기 설정 (1회)
- [ ] CSR 파일 생성
- [ ] Development 인증서 생성 및 설치
- [ ] Distribution 인증서 생성 및 설치
- [ ] App ID 생성 (com.heeling.app)
- [ ] Development 프로비저닝 프로파일 생성
- [ ] Distribution 프로비저닝 프로파일 생성
- [ ] Xcode Signing 설정
- [ ] App Store Connect 앱 등록

### 매 배포시
- [ ] 버전 번호 확인/증가
- [ ] 빌드 번호 증가
- [ ] Archive 생성
- [ ] App Store Connect 업로드
- [ ] TestFlight 테스트
- [ ] (정식 출시시) App Store 제출

---

## 문제 해결

### "Provisioning profile doesn't include signing certificate"
- 프로비저닝 프로파일 재생성 필요
- 현재 인증서를 선택하여 새 프로파일 생성

### "No signing certificate found"
- 인증서가 키체인에 설치되었는지 확인
- 개인 키가 포함되어 있는지 확인 (인증서 확장하여 키 확인)

### 빌드 업로드 실패
```bash
# Xcode 캐시 정리
rm -rf ~/Library/Developer/Xcode/DerivedData

# 프로젝트 정리
cd mobile/ios
xcodebuild clean -workspace HeelingMobile.xcworkspace -scheme HeelingMobile
```

### TestFlight 빌드가 보이지 않음
- 처리 중일 수 있음 (최대 30분 소요)
- App Store Connect에서 이메일 확인 (문제 발생시 알림)

---

## 참고 자료

- [Apple Developer Documentation - Code Signing](https://developer.apple.com/support/code-signing/)
- [App Store Connect Help](https://help.apple.com/app-store-connect/)
- [TestFlight Overview](https://developer.apple.com/testflight/)
- [Fastlane Documentation](https://docs.fastlane.tools/)
