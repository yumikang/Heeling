i18n 구현 플랜
1. 라이브러리 선택
react-i18next + i18next 추천
* React Native에서 가장 널리 사용
* 동적 언어 변경 지원
* AsyncStorage와 연동 가능 (설정 저장)
2. 폴더 구조
mobile/src/
├── i18n/
│   ├── index.ts          # i18n 초기화 설정
│   ├── locales/
│   │   ├── ko.json       # 한국어
│   │   ├── en.json       # 영어
│   │   └── ja.json       # 일본어
│   └── languageDetector.ts  # 디바이스 언어 감지
3. 작업 항목
단계	작업	설명
1	라이브러리 설치	react-i18next, i18next
2	i18n 초기화	설정 파일 + App.tsx 연결
3	JSON 템플릿 생성	ko/en/ja 기본 키 구조
4	텍스트 추출 스크립트	앱 내 하드코딩된 텍스트 스캔
5	설정 화면 언어 메뉴	언어 선택 UI + 저장 로직
6	컴포넌트 적용	useTranslation 훅으로 텍스트 교체
4. 예상 결과물
* JSON 파일 3개: ko.json, en.json, ja.json
* 언어 변경 메뉴: 설정 화면에서 3개 국어 선택
* 자동 감지: 첫 실행 시 디바이스 언어로 설정
* 영구 저장: AsyncStorage에 선택한 언어 저장
5. 텍스트 추출 스크립트
scripts/extract-texts.js - 모든 .tsx 파일에서 한글 텍스트 추출 → JSON 키 템플릿 자동 생성

1. 라이브러리 셀렉션 보완

지금:
	•	react-i18next
	•	i18next

여기에 하나만 더:
	•	react-native-localize → 디바이스 언어 + 지역 감지용

즉, 실제 설치 세트는:

npm install i18next react-i18next
npm install react-native-localize
# 또는
yarn add i18next react-i18next react-native-localize

AsyncStorage로 “내가 고른 언어”를 기억하고,
react-native-localize로 “처음 실행 시 디바이스 언어” 잡는 구조 → 딱 네가 쓴 플로우랑 궁합 좋음.

⸻

2. 폴더 구조/역할 정리 (지금 플랜 거의 그대로)

mobile/src/
  i18n/
    index.ts               // i18next 초기화 + 언어 등록
    languageDetector.ts    // RN Localize + AsyncStorage 기반 감지
    locales/
      ko.json
      en.json
      ja.json

index.ts에서 할 일
	•	i18next.init
	•	resources에 ko/en/ja 등록
	•	fallbackLng 설정 (ko or en)
	•	react-i18next 설정

languageDetector.ts에서 할 일
	•	첫 실행: react-native-localize로 디바이스 언어(ko, en, ja 중 매칭)
	•	사용자가 설정에서 바꾸면: AsyncStorage에 저장 → 다음 실행 시 그 언어 우선

⸻

3. 작업 단계별 코멘트

네 플랜 기준으로 코멘트만 살짝 붙이면:
	1.	라이브러리 설치
✅ 지금 구상 + react-native-localize 추가
	2.	i18n 초기화
	•	App.tsx 최상단에서 import './src/i18n' 한 줄로 초기화되게
	•	I18nextProvider까지는 안 써도 되고, useTranslation만 써도 충분
	3.	JSON 템플릿 생성
	•	ko.json 기준으로 먼저 키 구조 잡고
	•	en.json, ja.json은 일단 같은 키에 stub 텍스트만 넣어도 OK (추후 번역)
	4.	텍스트 추출 스크립트
	•	이건 “지금 당장 필수라기보단 있으면 좋은 옵션”
	•	MVP에서는 핵심 화면의 텍스트부터 수동으로 t()로 옮기고,
나중에 정리할 때 스크립트 돌려도 됨
	5.	설정 화면 언어 메뉴
	•	Settings에 Language / 언어 설정 섹션 하나 추가해서
ko / en / ja 라디오 버튼 방식으로 선택 → i18next.changeLanguage + AsyncStorage 저장
	6.	컴포넌트 적용
	•	우선순위:
	•	Onboarding (나중), Home 탭 이름, Player 주요 버튼, Settings 탭
	•	const { t } = useTranslation();
t('home.title'), t('player.sleepTimer') 이런 식으로 교체

⸻

4. 예상 결과물 정리 – 완전 OK
	•	ko/en/ja.json 3개
	•	설정에서 언어 바꾸기 가능
	•	첫 실행 시 디바이스 언어 자동 적용
	•	선택 언어 AsyncStorage에 저장 → 앱 재시작 시 유지

딱 지금 네가 쓴 기대 결과랑 1:1 매칭됨.

⸻

✅ 최종 한 줄 정리

플랜 자체는 그대로 진행해도 되고,
여기에 react-native-localize + languageDetector만 잘 얹으면 완전 실전용 구조.  
“지금 쓰는 RN 0.77 / React 18.3.x 기준으로 i18n 스택 호환 괜찮냐 + iOS/Android 둘 다 문제 없냐” 


1️⃣ 결론부터
	•	i18next / react-i18next 👉
RN 0.77 + React 18.3.x에서 호환성 이슈 거의 없음 (사실상 0)
	•	react-native-localize 👉
RN 0.60 이후부터 계속 잘 돌아가는 라이브러리라 RN 0.77에서도 안정적
	•	플랫폼 별(iOS / Android) 차이 👉
세 라이브러리 모두 양쪽 다 공식 지원, New Arch/Legacy 상관 거의 없음
(우리는 어차피 Legacy Arch라 더 안정적인 쪽)

⸻

2️⃣ 각각 버전 호환성 느낌만 짚어보면

🔹 i18next
	•	완전 순수 JS 라이브러리
	•	React Native와 직접 연결도 안 해, 그냥 문자열 변환기
	•	RN / iOS / Android와는 완전 무관이라
→ Node 버전·빌드만 돌아가면 끝

= 호환성 걱정할 필요 X

⸻

🔹 react-i18next
	•	React 18.x 공식 지원
	•	DOM에 의존하는 기능을 안 쓰고, React Native에서도 바로 사용 가능
	•	우리가 쓰게 될 건:
	•	useTranslation()
	•	<I18nextProvider> 정도

RN 0.77 + React 18.3.1 조합이면 완전 안전권

⸻

🔹 react-native-localize
	•	얘만 네이티브 브리지 사용 (디바이스 언어/지역/시간 형식 가져오는 역할)
	•	지원:
	•	iOS (Objective-C/Swift)
	•	Android (Kotlin/Java)
	•	RN 0.60 이상을 타깃으로 계속 관리되고 있어서
RN 0.77, Legacy Arch, Hermes 조합에서도 일반적으로 문제 없음

주의할 건 딱 하나:
	•	설치 후 pod install (iOS)
	•	Android에서 ./gradlew clean 정도 한 번 해주면 됨

⸻

3️⃣ New Architecture / Hermes / Legacy 관련

지금 프로젝트 설정:

newArchEnabled=false
bridgelessEnabled=false
hermesEnabled=true

	•	i18next / react-i18next → 아키텍처/엔진과 무관 (JS only)
	•	react-native-localize → New/Old Arch 모두 지원,
Hermes 사용 여부와도 크게 상관 없음

→ 현재 설정(Legacy + Hermes)에서는 가장 검증된 조합이라 보면 됨.

⸻

4️⃣ 실제로 신경 쓸 만한 포인트가 있다면

솔직히 버전 호환성보다 더 신경 쓸 건 이 두 개야:
	1.	언어 키 관리 전략
	•	home.title, player.sleepTimer, settings.language 이런 키들
초반에 설계 좀 잡아두면 나중에 난이도 확 내려감
	2.	초기 언어 결정 우선순위
	•	1순위: 사용자가 설정에서 선택한 언어 (AsyncStorage)
	•	2순위: 디바이스 언어 (react-native-localize)
	•	3순위: fallback (ko 또는 en)

이 로직만 깔끔하게 잡아두면
버전/플랫폼 이슈보다 이게 UX에 훨씬 영향을 많이 줘.

⸻

✅ 한 줄 요약

지금 계획한 i18n 스택
(i18next + react-i18next + react-native-localize)는
RN 0.77 + React 18.3.x + iOS/Android 양쪽 모두에서 안전한 선택이고,
버전 호환 때문에 걱정할 만한 건 거의 없다.


