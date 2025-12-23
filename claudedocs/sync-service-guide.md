# SyncService 사용 가이드

VPS Backend API ↔️ SQLite 동기화 서비스 (YouTube Music 방식)

---

## 📊 아키텍처

```
📱 모바일 앱
  ├─ SQLite (로컬 캐시)
  │   └─ 트랙 메타데이터 저장 (id, title, artist, fileUrl 등)
  │
  ├─ react-native-track-player
  │   └─ fileUrl로 VPS에서 스트리밍 재생
  │
  └─ SyncService (동기화 엔진)
      ├─ VPS → SQLite: 트랙 메타데이터 다운로드
      └─ SQLite → VPS: 즐겨찾기, 재생 기록 업로드
```

### 데이터 흐름

1. **앱 시작** → `SyncService.syncTracks()` → VPS에서 메타데이터 가져와 SQLite 저장
2. **트랙 탐색** → SQLite에서 빠르게 로드 (오프라인 가능)
3. **재생 버튼** → react-native-track-player가 `fileUrl`로 VPS 스트리밍
4. **즐겨찾기/재생** → SQLite에 즉시 저장 → 백그라운드로 VPS 동기화

---

## 🚀 기본 사용법

### 1. 앱 시작 시 동기화

```typescript
// App.tsx 또는 초기화 로직
import SyncService from '@/services/SyncService';

useEffect(() => {
  const initializeApp = async () => {
    try {
      // 동기화 필요 여부 확인 (1시간마다)
      const needsSync = await SyncService.needsSync();

      if (needsSync) {
        console.log('Starting sync...');
        const result = await SyncService.syncTracks();
        console.log(`Sync done: ${result.added} added, ${result.updated} updated`);
      }
    } catch (error) {
      console.error('Sync failed:', error);
      // 오프라인 모드로 계속 진행
    }
  };

  initializeApp();
}, []);
```

### 2. 강제 동기화 (설정 화면 등)

```typescript
import SyncService from '@/services/SyncService';

const handleForceSync = async () => {
  setSyncing(true);
  try {
    const result = await SyncService.forceSync();
    Alert.alert(
      '동기화 완료',
      `${result.added}개 추가, ${result.updated}개 업데이트`
    );
  } catch (error) {
    Alert.alert('동기화 실패', '네트워크를 확인해주세요.');
  } finally {
    setSyncing(false);
  }
};
```

### 3. 사용자 데이터 동기화

```typescript
// 즐겨찾기 추가 후
import SyncService from '@/services/SyncService';
import FavoritesService from '@/services/FavoritesService';

const handleAddFavorite = async (trackId: string) => {
  const userId = 'user-123'; // 실제 userId 가져오기

  // 1. SQLite에 즉시 저장 (오프라인 지원)
  await FavoritesService.addFavorite(userId, trackId);

  // 2. 백그라운드 동기화 (실패해도 나중에 재시도)
  SyncService.syncUserData(userId).catch(console.error);
};
```

---

## 📋 API 메서드

### syncTracks(): Promise<SyncResult>

VPS에서 모든 트랙 메타데이터를 가져와 SQLite에 저장

```typescript
const result = await SyncService.syncTracks();
// { added: 10, updated: 5, deleted: 2 }
```

**동작:**
1. VPS API에서 페이지네이션으로 모든 트랙 조회
2. SQLite의 기존 트랙과 비교
3. UPSERT (없으면 INSERT, 있으면 UPDATE)
4. 서버에 없는 트랙은 DELETE

**사용 시기:**
- 앱 시작 시 (1시간마다)
- 백그라운드 자동 동기화
- 설정 화면 "강제 동기화" 버튼

---

### syncUserData(userId): Promise<{ success: boolean }>

로컬 SQLite의 사용자 데이터를 VPS로 전송

```typescript
await SyncService.syncUserData('user-123');
```

**동작:**
1. SQLite의 즐겨찾기 조회 → VPS와 비교 → 없는 항목만 전송
2. SQLite의 재생 기록 조회 → VPS로 배치 전송

**사용 시기:**
- 즐겨찾기 추가/제거 후
- 재생 기록 저장 후
- 주기적 백그라운드 동기화

---

### needsSync(): Promise<boolean>

동기화가 필요한지 확인 (마지막 동기화 후 1시간 경과 시 true)

```typescript
if (await SyncService.needsSync()) {
  await SyncService.syncTracks();
}
```

---

### forceSync(): Promise<SyncResult>

캐시 무시하고 강제 동기화

```typescript
const result = await SyncService.forceSync();
```

---

### getLastSyncTime(): Promise<Date | null>

마지막 동기화 시간 조회

```typescript
const lastSync = await SyncService.getLastSyncTime();
console.log(lastSync); // Date object or null
```

---

### resetSyncState(): Promise<void>

동기화 상태 초기화 (디버깅용)

```typescript
await SyncService.resetSyncState();
```

---

## 🔄 동기화 전략

### 서버 → 로컬 (메타데이터)

```typescript
VPS API
  └─ GET /api/tracks?page=1&limit=100
     └─ { id, title, artist, fileUrl, thumbnailUrl, duration, ... }
        └─ SQLite INSERT/UPDATE
           └─ tracks 테이블에 저장
```

**매핑:**
- `fileUrl` → `audio_file` (스트리밍 URL)
- `thumbnailUrl` → `background_image`
- `playCount`, `sortOrder` 등 서버 값 사용

**주기:**
- 앱 시작 시 (1시간마다)
- 백그라운드 자동 동기화

---

### 로컬 → 서버 (사용자 데이터)

```typescript
SQLite favorites
  └─ 로컬에만 있는 즐겨찾기
     └─ POST /api/sync/favorites
        └─ VPS에 저장

SQLite play_history
  └─ 최근 100개 재생 기록
     └─ POST /api/sync/history
        └─ VPS에 배치 전송
```

**주기:**
- 즐겨찾기 추가/제거 직후
- 재생 완료 직후
- 백그라운드 주기적 동기화

---

## 🎬 실제 사용 시나리오

### 시나리오 1: 첫 앱 실행

```typescript
// App.tsx
useEffect(() => {
  const init = async () => {
    // 1. SQLite 초기화
    await initDatabase();

    // 2. 시드 데이터 로드 (로컬 기본 트랙)
    await seedDatabase();

    // 3. VPS 동기화
    const result = await SyncService.syncTracks();
    console.log(`${result.added} tracks synced`);

    // 화면 렌더링 → SQLite에서 트랙 로드
  };

  init();
}, []);
```

### 시나리오 2: 즐겨찾기 토글

```typescript
// FavoriteButton.tsx
const handleToggle = async () => {
  const userId = await getUserId();

  if (isFavorite) {
    // 1. SQLite에서 즉시 제거 (UI 업데이트 빠름)
    await FavoritesService.removeFavorite(userId, trackId);
    setIsFavorite(false);
  } else {
    // 1. SQLite에 즉시 추가 (UI 업데이트 빠름)
    await FavoritesService.addFavorite(userId, trackId);
    setIsFavorite(true);
  }

  // 2. 백그라운드 동기화 (실패해도 나중에 재시도)
  SyncService.syncUserData(userId).catch(console.error);
};
```

### 시나리오 3: 재생 기록 저장

```typescript
// PlaybackService.ts
TrackPlayer.addEventListener(Event.PlaybackActiveTrackChanged, async (event) => {
  if (event.lastTrack) {
    const userId = await getUserId();

    // 1. SQLite에 재생 기록 저장
    await HistoryService.addPlayHistory(userId, event.lastTrack.id, event.lastPosition);

    // 2. 백그라운드 동기화
    SyncService.syncUserData(userId).catch(console.error);
  }
});
```

### 시나리오 4: 오프라인 → 온라인 전환

```typescript
// App.tsx - 네트워크 상태 모니터링
import NetInfo from '@react-native-community/netinfo';

useEffect(() => {
  const unsubscribe = NetInfo.addEventListener(state => {
    if (state.isConnected && state.isInternetReachable) {
      console.log('Network available, syncing...');

      // 온라인 전환 시 자동 동기화
      SyncService.syncTracks().catch(console.error);
      SyncService.syncUserData(userId).catch(console.error);
    }
  });

  return () => unsubscribe();
}, []);
```

---

## ⚙️ 고급 설정

### 동기화 주기 변경

```typescript
// SyncService.ts 파일에서 수정
async needsSync(): Promise<boolean> {
  // 기본: 1시간 (60 * 60 * 1000)
  // 30분으로 변경: 30 * 60 * 1000
  const oneHourAgo = Date.now() - 30 * 60 * 1000;
  return lastSyncTime < oneHourAgo;
}
```

### 페이지 제한 변경

```typescript
// SyncService.ts - fetchServerTracks()
// 기본: 100곡씩, 최대 10페이지 (1000곡)
// 변경 가능:
const limit = 200; // 200곡씩
if (page > 20) break; // 최대 20페이지 (4000곡)
```

---

## 🐛 디버깅

### 동기화 로그 확인

```typescript
// iOS 시뮬레이터
npm run ios

// Console 확인
[Sync] Starting sync from VPS...
[Sync] Fetched page 1: 100 tracks
[Sync] Total tracks fetched: 250
[Sync] Tracks to delete: 5
[Sync] ✅ Completed: 10 added, 240 updated, 5 deleted
```

### 동기화 상태 리셋

```typescript
// 문제 발생 시 완전히 초기화
await SyncService.resetSyncState();
await SyncService.forceSync();
```

---

## 📝 주의사항

1. **오디오 파일은 다운로드 안함**: fileUrl만 SQLite에 저장, 실제 재생은 스트리밍
2. **오프라인 지원**: SQLite에 있는 메타데이터로 탐색 가능, 재생은 온라인 필요
3. **중복 방지**: 동기화 진행 중에는 다시 시작 안됨
4. **에러 허용**: 즐겨찾기/재생 기록 동기화 실패해도 앱 계속 작동
5. **트랜잭션**: 모든 DB 작업은 트랜잭션으로 안전하게 처리

---

## 🚀 다음 단계

1. **백그라운드 동기화**: Background Task 사용하여 주기적 동기화
2. **다운로드 기능**: 오프라인 재생용 파일 다운로드 (선택적)
3. **충돌 해결**: 서버/로컬 데이터 충돌 시 해결 전략
4. **분석 연동**: 동기화 성공률, 실패 원인 분석

---

**문서 버전**: 1.0.0
**최종 업데이트**: 2025-12-08
**관련 파일**: `mobile/src/services/SyncService.ts`
