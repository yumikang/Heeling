# Heeling Mobile App - API 사용 가이드

VPS Backend API와 통신하는 TypeScript API 레이어 사용법

---

## 📁 파일 구조

```
mobile/src/
├── types/
│   └── api.ts           # API 타입 정의 (Request/Response)
└── api/
    ├── client.ts        # Base HTTP client (fetch wrapper)
    ├── auth.ts          # 인증 API
    ├── tracks.ts        # 트랙 API
    ├── categories.ts    # 카테고리 API
    ├── playlists.ts     # 플레이리스트 API
    ├── home.ts          # 홈 섹션 API (ETag 캐싱)
    ├── favorites.ts     # 즐겨찾기 API
    ├── history.ts       # 재생 기록 API
    └── index.ts         # API 모듈 통합 export
```

---

## 🎯 기본 사용법

### Import 방식

```typescript
// 방법 1: 전체 API 객체 import
import api from '@/api';
const tracks = await api.tracks.getTracks();

// 방법 2: 개별 모듈 import
import { tracks, favorites } from '@/api';
const trackList = await tracks.getTracks();

// 방법 3: 개별 함수 import
import { getTracks, addFavorite } from '@/api';
const result = await getTracks({ category: 'sleep' });
```

---

## 📚 API 모듈별 사용 예제

### 1. Tracks API - 트랙 조회

```typescript
import { tracks } from '@/api';

// 전체 트랙 조회
const allTracks = await tracks.getTracks();
console.log(allTracks.meta.total); // 전체 트랙 개수
console.log(allTracks.data);       // Track[]

// 카테고리별 필터링
const sleepTracks = await tracks.getTracks({
  category: 'sleep',
  limit: 20,
  page: 1
});

// 무드별 필터링
const calmTracks = await tracks.getTracks({ mood: 'calm' });

// 검색
const searchResults = await tracks.getTracks({ q: 'meditation' });

// 특정 트랙 상세 조회
const trackDetail = await tracks.getTrackById('track-123');
console.log(trackDetail.data.title);
console.log(trackDetail.data.duration);

// 편의 함수 사용
const sleepTracksList = await tracks.getTracksByCategory('sleep', 10);
const searchList = await tracks.searchTracks('rain', 15);
```

### 2. Categories API - 카테고리 조회

```typescript
import { categories } from '@/api';

// 전체 카테고리 조회
const allCategories = await categories.getCategories();
console.log(allCategories.data); // Category[]

// 편의 함수 사용 (배열로 직접 반환)
const categoryList = await categories.getCategoriesList();
categoryList.forEach(cat => {
  console.log(cat.name, cat.icon, cat.color);
});
```

### 3. Home API - 홈 섹션 (ETag 캐싱)

```typescript
import { home } from '@/api';

// 홈 섹션 조회 (ETag 캐싱 자동 사용)
const homeData = await home.getHomeSections();

if ('cached' in homeData && homeData.cached) {
  // 304 Not Modified - 캐시 유효, 로컬 데이터 사용
  console.log('Using cached home data');
} else {
  // 새 데이터
  console.log('New home data:', homeData.data.sections);
  console.log('ETag:', homeData.meta.etag);
}

// 강제 새로고침 (캐시 무시)
const freshData = await home.getHomeSections(true);

// 편의 함수 - 섹션 배열만 반환
const sections = await home.getHomeSectionsList();
if (sections === null) {
  // 캐시 유효
} else {
  // 새 섹션 데이터
}

// 캐시 초기화
await home.clearHomeCache();
```

### 4. Playlists API - 플레이리스트 조회

```typescript
import { playlists } from '@/api';

// 전체 플레이리스트 조회
const allPlaylists = await playlists.getPlaylists();

// 테마별 필터링
const sleepPlaylists = await playlists.getPlaylists({ theme: 'sleep' });

// 추천 플레이리스트만
const featured = await playlists.getPlaylists({ featured: 'true' });

// 플레이리스트 상세 조회 (트랙 목록 포함)
const playlistDetail = await playlists.getPlaylistById('playlist-123');
console.log(playlistDetail.data.name);
console.log(playlistDetail.data.tracks); // PlaylistTrackWithDetails[]

playlistDetail.data.tracks.forEach(item => {
  console.log(item.position, item.track.title);
});

// 편의 함수 사용
const featuredList = await playlists.getFeaturedPlaylists();
const themeList = await playlists.getPlaylistsByTheme('meditation');
```

### 5. Favorites API - 즐겨찾기 관리

```typescript
import { favorites } from '@/api';

const userId = 'user-123';
const trackId = 'track-456';

// 즐겨찾기 목록 조회
const userFavorites = await favorites.getFavorites(userId);
userFavorites.data.forEach(fav => {
  console.log(fav.track.title); // 트랙 정보 포함
});

// 즐겨찾기 추가
const result = await favorites.addFavorite(userId, trackId);
console.log('Added:', result.data.id);

// 즐겨찾기 제거
await favorites.removeFavorite('favorite-789');

// 편의 함수들
const favoriteList = await favorites.getFavoritesList(userId);
const isFav = await favorites.isFavorite(userId, trackId);
await favorites.removeFavoriteByTrackId(userId, trackId);

// 즐겨찾기 토글 (있으면 제거, 없으면 추가)
const newState = await favorites.toggleFavorite(userId, trackId);
console.log('Is favorite:', newState); // true or false
```

### 6. History API - 재생 기록

```typescript
import { history } from '@/api';

const userId = 'user-123';
const trackId = 'track-456';

// 기본 재생 기록 저장
const result = await history.savePlayHistory({
  userId,
  trackId,
  completionRate: 95,      // 0-100
  listenDuration: 285,     // 초
  deviceType: 'iOS',       // 'iOS' | 'Android'
  wasAdShown: false,
});
console.log('History saved:', result.data.id);

// 편의 함수: 자동으로 deviceType 설정
await history.recordPlayHistory(userId, trackId, 100, 300, false);

// 트랙 완료 기록 (completionRate = 100)
await history.recordCompletedPlay(userId, trackId, 300);

// 부분 재생 기록 (completionRate 자동 계산)
await history.recordPartialPlay(
  userId,
  trackId,
  150,  // 재생한 시간
  300   // 전체 시간
);
```

---

## 🔧 Client 설정 및 유틸리티

### 인증 토큰 관리

```typescript
import { setAuthToken, getAuthToken, clearAuthToken } from '@/api';

// 토큰 설정 (로그인 후)
setAuthToken('jwt-token-here');

// 토큰 조회
const token = getAuthToken();

// 토큰 제거 (로그아웃 시)
clearAuthToken();
```

### 에러 처리

```typescript
import { getTracks } from '@/api';
import { ApiError, NetworkError, TimeoutError } from '@/api/client';

try {
  const tracks = await getTracks();
  console.log(tracks.data);
} catch (error) {
  if (error instanceof ApiError) {
    // API 에러 (4xx, 5xx)
    console.error('API Error:', error.message);
    console.error('Status:', error.statusCode);
    console.error('Response:', error.response);
  } else if (error instanceof NetworkError) {
    // 네트워크 에러
    console.error('Network error:', error.message);
  } else if (error instanceof TimeoutError) {
    // 타임아웃
    console.error('Request timeout');
  } else {
    console.error('Unknown error:', error);
  }
}
```

### 응답 타입 체크

```typescript
import { isApiError, isApiSuccess } from '@/api';
import type { ApiResponse, Track } from '@/types/api';

const response: ApiResponse<Track[]> = await someFetch();

if (isApiSuccess(response)) {
  // TypeScript가 response.data가 Track[]임을 알게 됨
  console.log(response.data);
} else if (isApiError(response)) {
  // TypeScript가 response.error가 string임을 알게 됨
  console.error(response.error);
}
```

---

## 🎨 React Native 컴포넌트 예제

### HomeScreen.tsx

```typescript
import React, { useEffect, useState } from 'react';
import { View, FlatList, ActivityIndicator } from 'react-native';
import api from '@/api';
import type { HomeSection } from '@/types/api';

export const HomeScreen = () => {
  const [sections, setSections] = useState<HomeSection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHomeSections();
  }, []);

  const loadHomeSections = async () => {
    try {
      const response = await api.home.getHomeSections();

      if ('cached' in response && response.cached) {
        // 캐시 유효, 로컬 데이터 사용
        console.log('Using cached data');
      } else {
        setSections(response.data.sections);
      }
    } catch (error) {
      console.error('Failed to load home sections:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <ActivityIndicator />;
  }

  return (
    <FlatList
      data={sections}
      keyExtractor={item => item.id}
      renderItem={({ item }) => <SectionRenderer section={item} />}
    />
  );
};
```

### TracksScreen.tsx

```typescript
import React, { useEffect, useState } from 'react';
import { View, FlatList } from 'react-native';
import api from '@/api';
import type { Track } from '@/types/api';

interface Props {
  category: string;
}

export const TracksScreen = ({ category }: Props) => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadTracks();
  }, [category, page]);

  const loadTracks = async () => {
    try {
      const response = await api.tracks.getTracks({
        category,
        page,
        limit: 20
      });

      setTracks(prev => page === 1 ? response.data : [...prev, ...response.data]);
      setHasMore(response.meta.hasNext);
    } catch (error) {
      console.error('Failed to load tracks:', error);
    }
  };

  const loadMore = () => {
    if (hasMore) {
      setPage(prev => prev + 1);
    }
  };

  return (
    <FlatList
      data={tracks}
      keyExtractor={item => item.id}
      renderItem={({ item }) => <TrackItem track={item} />}
      onEndReached={loadMore}
      onEndReachedThreshold={0.5}
    />
  );
};
```

### FavoriteButton.tsx

```typescript
import React, { useState, useEffect } from 'react';
import { TouchableOpacity, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import api from '@/api';

interface Props {
  userId: string;
  trackId: string;
}

export const FavoriteButton = ({ userId, trackId }: Props) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkFavoriteStatus();
  }, [trackId]);

  const checkFavoriteStatus = async () => {
    try {
      const status = await api.favorites.isFavorite(userId, trackId);
      setIsFavorite(status);
    } catch (error) {
      console.error('Failed to check favorite status:', error);
    }
  };

  const handleToggle = async () => {
    setLoading(true);
    try {
      const newStatus = await api.favorites.toggleFavorite(userId, trackId);
      setIsFavorite(newStatus);
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <ActivityIndicator size="small" />;
  }

  return (
    <TouchableOpacity onPress={handleToggle}>
      <Icon
        name={isFavorite ? 'heart' : 'heart-outline'}
        size={24}
        color={isFavorite ? 'red' : 'gray'}
      />
    </TouchableOpacity>
  );
};
```

---

## ⚙️ 환경 설정

### API Base URL 변경

`mobile/src/api/client.ts` 파일에서 수정:

```typescript
const API_BASE_URL = __DEV__
  ? 'http://localhost:3000/api'      // 개발 환경
  : 'https://yourdomain.com/api';    // 프로덕션 환경
```

### 타임아웃 및 재시도 설정

```typescript
// client.ts 파일에서 수정 가능
const DEFAULT_TIMEOUT = 30000;       // 30초
const MAX_RETRIES = 3;                // 최대 3회 재시도
const RETRY_DELAY = 1000;             // 1초 지연
```

---

## 🧪 테스트 예제

```typescript
import { getTracks, getCategories } from '@/api';

describe('API Tests', () => {
  test('getTracks should return track list', async () => {
    const response = await getTracks({ limit: 10 });

    expect(response.success).toBe(true);
    expect(response.data).toBeInstanceOf(Array);
    expect(response.data.length).toBeLessThanOrEqual(10);
    expect(response.meta.page).toBe(1);
  });

  test('getCategories should return categories', async () => {
    const response = await getCategories();

    expect(response.success).toBe(true);
    expect(response.data).toBeInstanceOf(Array);
    expect(response.data[0]).toHaveProperty('slug');
    expect(response.data[0]).toHaveProperty('name');
  });
});
```

---

## 📝 TypeScript 타입 정의

모든 API 요청/응답 타입은 `@/types/api.ts`에 정의되어 있습니다.

### 주요 타입들

```typescript
import type {
  Track,
  Category,
  Playlist,
  HomeSection,
  Favorite,
  ApiResponse,
  PaginatedResponse,
  SyncResponse,
} from '@/types/api';
```

### 타입 활용 예제

```typescript
import type { Track, ApiResponse } from '@/types/api';

// 함수 타입 정의
const processTrack = (track: Track): void => {
  console.log(track.title, track.duration);
};

// 제네릭 활용
const handleApiResponse = <T>(response: ApiResponse<T>): T | null => {
  if (response.success) {
    return response.data;
  }
  console.error(response.error);
  return null;
};
```

---

## 🚀 다음 단계

1. **API 통합 테스트**: Postman/curl로 백엔드 API 테스트
2. **화면 구현**: API 레이어를 사용하여 각 화면 개발
3. **상태 관리**: Zustand store에서 API 호출 통합
4. **에러 처리**: 전역 에러 핸들러 구현
5. **로딩 상태**: 로딩 인디케이터 UI 추가

---

**문서 버전**: 1.0.0
**최종 업데이트**: 2025-12-08
**관련 문서**: [mobile-api-spec.md](./mobile-api-spec.md)
