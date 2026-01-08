# Claude Code Instructions

## Task Master AI Instructions
**Import Task Master's development workflow commands and guidelines, treat as if import is in the main CLAUDE.md file.**
@./.taskmaster/CLAUDE.md

## iOS 빌드 주의사항

### expo prebuild --clean 사용 금지
- `--clean` 옵션은 ios 폴더를 완전히 재생성하여 Xcode 설정(Team, Signing, 앱 아이콘)이 모두 초기화됨
- **대안:** Podfile 수정 후 `cd ios && pod install`만 실행
- 실수로 실행한 경우: `git checkout <commit> -- ios/BRIBI.xcodeproj/project.pbxproj` 후 `pod install`

### Pod 에러 해결
Firebase/GoogleUtilities 충돌 시 Podfile에 추가:
```ruby
pod 'GoogleUtilities', :modular_headers => true
```

### 빌드 순서
1. `cd mobile/ios && pod install`
2. `open BRIBI.xcworkspace`
3. Xcode: Product → Archive → Distribute to TestFlight

## 개발일지
시행착오 및 해결책은 `docs/DEV_LOG.md`에 기록
