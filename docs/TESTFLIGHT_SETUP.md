# TestFlight 배포 완전 가이드 (처음부터 끝까지)

## 전체 진행 순서

```
1. Apple Developer 계정 활성화 확인
2. 인증서 서명 요청(CSR) 생성
3. Distribution 인증서 생성 및 설치
4. App ID 등록
5. 프로비저닝 프로파일 생성 및 설치
6. Xcode 프로젝트 설정
7. App Store Connect에서 앱 등록
8. Archive 빌드 및 업로드
9. TestFlight 테스터 초대
```

---

## 1단계: Apple Developer 계정 활성화 확인

### 확인 방법
1. https://developer.apple.com/account 접속
2. Apple ID로 로그인
3. **Membership** 클릭
4. **"Apple Developer Program"** 상태가 **Active**인지 확인

### 활성화 안 됐으면
- 결제 후 **최대 48시간** 소요 (보통 몇 시간)
- 이메일로 활성화 알림 옴
- 활성화될 때까지 대기

---

## 2단계: 인증서 서명 요청(CSR) 생성

Mac에서 진행:

1. **키체인 접근** 앱 실행
   - Spotlight (⌘ + Space) → "키체인 접근" 검색 → 실행

2. 메뉴 선택
   - 상단 메뉴: **키체인 접근 → 인증서 지원 → 인증 기관에서 인증서 요청**

3. 정보 입력
   ```
   사용자 이메일 주소: [Apple Developer 계정 이메일]
   일반 이름: [본인 이름 - 예: Dongeun Cheon]
   CA 이메일 주소: [비워둠]
   요청 항목: ◉ 디스크에 저장됨
   ```

4. **계속** 클릭 → 바탕화면에 저장
   - 파일명: `CertificateSigningRequest.certSigningRequest`

---

## 3단계: Distribution 인증서 생성

### Apple Developer 웹사이트에서:

1. https://developer.apple.com/account 접속

2. **Certificates, Identifiers & Profiles** 클릭

3. 왼쪽 메뉴에서 **Certificates** 클릭

4. **+** 버튼 클릭 (새 인증서 생성)

5. **Software** 섹션에서 선택:
   - ◉ **Apple Distribution** 선택
   - Continue 클릭

6. CSR 파일 업로드
   - **Choose File** 클릭
   - 2단계에서 만든 `CertificateSigningRequest.certSigningRequest` 선택
   - Continue 클릭

7. **Download** 클릭
   - `distribution.cer` 파일 다운로드됨

8. 다운로드된 파일 **더블클릭**
   - 키체인에 자동으로 설치됨
   - "로그인" 키체인에 "Apple Distribution: [이름]" 인증서 추가됨

### 설치 확인
```bash
# 터미널에서 확인
security find-identity -v -p codesigning
```
"Apple Distribution: Dongeun Cheon" 같은 항목이 보이면 성공

---

## 4단계: App ID 등록

### Apple Developer 웹사이트에서:

1. **Certificates, Identifiers & Profiles** → **Identifiers** 클릭

2. **+** 버튼 클릭

3. **App IDs** 선택 → Continue

4. **App** 선택 → Continue

5. 정보 입력:
   ```
   Description: Heeling Music App

   Bundle ID: ◉ Explicit 선택
   입력창: org.reactjs.native.example.HeelingMobile
   ```

6. **Capabilities** 섹션 (필요한 것만 체크):
   - [x] Background Modes (이미 체크되어 있을 수 있음)
   - 나머지는 기본값 유지

7. **Continue** → **Register** 클릭

---

## 5단계: 프로비저닝 프로파일 생성

### Apple Developer 웹사이트에서:

1. **Certificates, Identifiers & Profiles** → **Profiles** 클릭

2. **+** 버튼 클릭

3. **Distribution** 섹션에서:
   - ◉ **App Store Connect** 선택
   - Continue 클릭

4. **App ID** 선택:
   - 드롭다운에서 `Heeling Music App (org.reactjs.native.example.HeelingMobile)` 선택
   - Continue 클릭

5. **Certificate** 선택:
   - 3단계에서 만든 Distribution 인증서 체크
   - Continue 클릭

6. **Profile Name** 입력:
   ```
   Heeling App Store Distribution
   ```

7. **Generate** 클릭

8. **Download** 클릭
   - `Heeling_App_Store_Distribution.mobileprovision` 파일 다운로드

9. 다운로드된 파일 **더블클릭**
   - Xcode에 자동으로 설치됨

---

## 6단계: Xcode 프로젝트 설정

### Xcode에서:

1. 프로젝트 열기
   ```bash
   open /Users/blee/Desktop/blee-project/heeling/mobile/ios/HeelingMobile.xcworkspace
   ```

2. 왼쪽 Navigator에서 **HeelingMobile** (파란색 프로젝트 아이콘) 클릭

3. **TARGETS** → **HeelingMobile** 선택

4. **Signing & Capabilities** 탭 클릭

5. **Automatically manage signing** 체크 해제

6. **Release** 섹션에서:
   - **Team**: 본인 팀 선택 (Personal Team 아닌 유료 팀)
   - **Provisioning Profile**: `Heeling App Store Distribution` 선택
   - **Signing Certificate**: `Apple Distribution` 선택

7. **Debug** 섹션에서:
   - **Team**: 본인 팀 선택
   - **Provisioning Profile**: `Automatic` 또는 개발용 프로파일

8. 오류 없이 ✅ 표시되면 성공

---

## 7단계: App Store Connect에서 앱 등록

### 웹사이트에서:

1. https://appstoreconnect.apple.com 접속

2. Apple ID로 로그인

3. **나의 앱** 클릭

4. **+** 버튼 → **신규 앱** 클릭

5. 정보 입력:
   ```
   플랫폼: ☑ iOS
   이름: Heeling
   기본 언어: 한국어
   번들 ID: org.reactjs.native.example.HeelingMobile (드롭다운에서 선택)
   SKU: heeling-app-001 (고유 식별자, 아무거나)
   사용자 액세스: ◉ 전체 액세스
   ```

6. **생성** 클릭

---

## 8단계: Archive 빌드 및 업로드

### Xcode에서:

1. **빌드 대상 변경**
   - Xcode 상단에서 시뮬레이터 선택 부분 클릭
   - **Any iOS Device (arm64)** 선택 (시뮬레이터 아님!)

2. **Archive 생성**
   - 메뉴: **Product → Archive**
   - 빌드 완료까지 대기 (5-10분 소요)

3. **Organizer** 창에서:
   - Archive 완료되면 자동으로 Organizer 열림
   - 방금 만든 Archive 선택

4. **Distribute App** 클릭

5. 배포 방법 선택:
   - ◉ **App Store Connect** 선택
   - Next 클릭

6. 배포 옵션:
   - ◉ **Upload** 선택
   - Next 클릭

7. 옵션 확인 (기본값 유지):
   - [x] Upload your app's symbols
   - [x] Manage Version and Build Number
   - Next 클릭

8. 인증서 선택:
   - Distribution certificate: 자동 선택됨
   - Next 클릭

9. **Upload** 클릭
   - 업로드 완료까지 대기 (5-10분)

10. **Done** 클릭

---

## 9단계: TestFlight 테스터 초대

### App Store Connect에서:

1. https://appstoreconnect.apple.com 접속

2. **나의 앱** → **Heeling** 선택

3. **TestFlight** 탭 클릭

4. 빌드 확인:
   - 업로드된 빌드가 "처리 중"으로 표시됨
   - **30분-1시간** 후 "테스트 준비됨"으로 변경

5. **내부 테스팅** 설정:
   - 왼쪽 메뉴에서 **내부 테스팅** 클릭
   - **+** 버튼 → 그룹 생성 (예: "개발팀")

6. **테스터 추가**:
   - **테스터** 탭에서 **+** 클릭
   - 테스터 이메일 입력 (Apple ID)
   - 초대 전송

7. **빌드 추가**:
   - 그룹 선택 → **빌드** 탭
   - **+** 버튼 → 업로드된 빌드 선택
   - **다음** → **제출**

---

## 테스터가 해야 할 것

1. 이메일에서 **TestFlight 초대** 확인

2. App Store에서 **TestFlight** 앱 설치

3. TestFlight 앱 열기 → **사용** 클릭

4. 초대 코드 입력 또는 자동으로 앱 표시됨

5. **설치** 클릭 → 앱 테스트 시작

---

## 문제 해결

### "No profiles for 'org.reactjs.native.example.HeelingMobile' were found"
- 프로비저닝 프로파일이 설치 안 됨
- 5단계 다시 진행, .mobileprovision 파일 더블클릭

### "Signing certificate not found"
- 인증서가 키체인에 없음
- 3단계 다시 진행, .cer 파일 더블클릭

### Archive 빌드 실패
```bash
# Xcode 캐시 정리
rm -rf ~/Library/Developer/Xcode/DerivedData
# iOS 폴더에서 정리
cd mobile/ios
pod deintegrate && pod install
```

### 업로드 실패
- 인터넷 연결 확인
- Bundle ID가 App Store Connect와 일치하는지 확인
- 버전 번호가 이전 업로드보다 높은지 확인

---

## 체크리스트

### 준비물 확인
- [ ] Apple Developer Program 활성화됨 (유료 $99/년)
- [ ] Mac에 Xcode 설치됨
- [ ] Apple Developer 계정 이메일/비밀번호

### 인증서/프로파일
- [ ] CSR 파일 생성됨
- [ ] Distribution 인증서 생성 및 키체인에 설치됨
- [ ] App ID 등록됨
- [ ] 프로비저닝 프로파일 생성 및 설치됨

### Xcode 설정
- [ ] Team 선택됨 (유료 팀)
- [ ] Provisioning Profile 선택됨
- [ ] 오류 없이 ✅ 표시됨

### 배포
- [ ] App Store Connect에 앱 등록됨
- [ ] Archive 빌드 성공
- [ ] App Store Connect에 업로드됨
- [ ] TestFlight에서 빌드 처리 완료됨
- [ ] 테스터 초대됨

---

## 다음 단계 (활성화 후)

Apple Developer 계정이 활성화되면:

1. 이 문서의 **2단계**부터 시작
2. 막히는 부분 있으면 스크린샷과 함께 질문
3. 단계별로 진행하며 확인

**예상 소요 시간**: 약 30분-1시간 (계정 활성화 후)
