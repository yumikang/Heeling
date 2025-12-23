/**
 * Home Screen Configuration
 * 홈 화면 섹션 설정 - 앱 업데이트로 섹션 추가/수정 가능
 *
 * 구조:
 * 1. hero_banner: 탑 히어로 배너 슬라이더
 * 2. track_carousel: 추천 힐링 사운드
 * 3. icon_menu: 테마 카테고리 아이콘
 * 4. banner: 중간 프로모션 배너
 * 5. track_carousel: 집중을 위한 사운드
 * 6. recently_played: 최근 재생
 * 7. featured_track: 오늘의 추천
 * 8. track_list: 인기 차트
 */

import {
  HomeConfig,
  HeroBannerSection,
  TrackCarouselSection,
  IconMenuSection,
  BannerSection,
  FeaturedTrackSection,
  RecentlyPlayedSection,
  TrackListSection,
} from '../types/home';

// 히어로 배너 데이터 (기본값 - 백엔드 API에서 동적 로드)
const heroBannerSection: HeroBannerSection = {
  id: 'hero_banner_main',
  type: 'hero_banner',
  sortOrder: 1,
  isVisible: true,
  data: {
    banners: [
      {
        id: 'banner_1',
        title: '깊은 수면을 위한\n힐링 사운드',
        subtitle: '오늘 밤, 편안한 잠자리',
        imageUrl: 'https://images.unsplash.com/photo-1507400492013-162706c8c05e?w=800',
        backgroundColor: '#1a2f4a',
        action: { type: 'playlist', target: 'playlist_sleep_healing' },
      },
      {
        id: 'banner_2',
        title: '집중력 향상\n포커스 뮤직',
        subtitle: '업무 효율을 높이는 음악',
        imageUrl: 'https://images.unsplash.com/photo-1497032628192-86f99bcd76bc?w=800',
        backgroundColor: '#2d3a2f',
        action: { type: 'playlist', target: 'playlist_focus_music' },
      },
      {
        id: 'banner_3',
        title: '자연의 소리로\n마음의 평화',
        subtitle: '숲, 비, 파도 소리',
        imageUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800',
        backgroundColor: '#1f3d2a',
        action: { type: 'playlist', target: 'playlist_nature_sounds' },
      },
      {
        id: 'banner_4',
        title: '여유로운 카페에서\n흐르는 음악처럼',
        subtitle: '일상에 감성을 더하는 BGM',
        imageUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800',
        backgroundColor: '#3d2f1f',
        action: { type: 'playlist', target: 'playlist_cafe_bgm' },
      },
    ],
    autoScrollInterval: 5000,
    showPagination: true,
  },
};

// 추천 힐링 사운드 섹션 (트랙은 동적으로 로드)
const recommendedSection: TrackCarouselSection = {
  id: 'recommended_tracks',
  type: 'track_carousel',
  sortOrder: 2,
  isVisible: true,
  title: '추천 힐링 사운드',
  showMoreButton: true,
  moreButtonAction: 'navigate',
  moreButtonTarget: 'Library',
  data: {
    tracks: [], // 동적 로드
    cardStyle: 'medium',
    showArtist: true,
    showDuration: false,
  },
};

// 테마 카테고리 아이콘 메뉴
const iconMenuSection: IconMenuSection = {
  id: 'theme_categories',
  type: 'icon_menu',
  sortOrder: 3,
  isVisible: true,
  data: {
    items: [
      {
        id: 'piano',
        name: '피아노 선율',
        icon: 'musical-note',
        color: '#6B7FD7',
        action: { type: 'filter', target: 'piano' },
      },
      {
        id: 'cafe',
        name: '카페 BGM',
        icon: 'cafe',
        color: '#D4A574',
        action: { type: 'filter', target: 'cafe' },
      },
      {
        id: 'healing',
        name: '힐링 & 명상',
        icon: 'leaf',
        color: '#7CB98F',
        action: { type: 'filter', target: 'meditation' },
      },
      {
        id: 'cinema',
        name: '시네마 무드',
        icon: 'film',
        color: '#E8A0BF',
        action: { type: 'filter', target: 'cinema' },
      },
    ],
    showAddButton: true,
    columns: 4,
  },
};

// 중간 프로모션 배너
const promoBannerSection: BannerSection = {
  id: 'promo_premium',
  type: 'banner',
  sortOrder: 4,
  isVisible: true,
  data: {
    imageUrl: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800',
    title: '프리미엄으로 업그레이드',
    subtitle: '광고 없이 모든 트랙을 즐기세요',
    buttonText: '자세히 보기',
    action: { type: 'premium', target: 'Premium' },
    height: 'medium',
  },
};

// 집중을 위한 사운드
const focusSection: TrackCarouselSection = {
  id: 'focus_tracks',
  type: 'track_carousel',
  sortOrder: 5,
  isVisible: true,
  title: '집중을 위한 사운드',
  subtitle: '업무, 공부할 때 들으면 좋은 음악',
  showMoreButton: true,
  data: {
    tracks: [], // 동적 로드
    cardStyle: 'medium',
    showArtist: true,
    showDuration: false,
  },
};

// 최근 재생
const recentlyPlayedSection: RecentlyPlayedSection = {
  id: 'recently_played',
  type: 'recently_played',
  sortOrder: 6,
  isVisible: true,
  title: '최근 재생',
  showMoreButton: true,
  data: {
    maxItems: 10,
    cardStyle: 'small',
  },
};

// 오늘의 추천 (피처드 트랙)
const featuredSection: FeaturedTrackSection = {
  id: 'featured_today',
  type: 'featured_track',
  sortOrder: 7,
  isVisible: true,
  title: '오늘의 추천',
  data: {
    track: {
      id: '',
      title: '',
      artist: '',
      category: 'sleep',
      duration: 0,
      audioFile: '',
      backgroundImage: '',
      recommendedBrightness: 0.3,
      isFree: true,
      sortOrder: 0,
      createdAt: '',
    }, // 동적 로드
    description: '오늘 하루 지친 당신을 위한 힐링 사운드',
    badge: '추천',
  },
};

// 수면 사운드 섹션
const sleepSection: TrackCarouselSection = {
  id: 'sleep_tracks',
  type: 'track_carousel',
  sortOrder: 8,
  isVisible: true,
  title: '수면을 위한 사운드',
  subtitle: '잠들기 전 듣는 편안한 음악',
  showMoreButton: true,
  data: {
    tracks: [], // 동적 로드
    cardStyle: 'medium',
    showArtist: true,
    showDuration: false,
  },
};

// 인기 차트
const popularSection: TrackListSection = {
  id: 'popular_chart',
  type: 'track_list',
  sortOrder: 9,
  isVisible: true,
  title: '인기 차트',
  subtitle: '이번 주 가장 많이 들은 트랙',
  showMoreButton: true,
  data: {
    tracks: [], // 동적 로드
    maxItems: 5,
    showIndex: true,
    showDuration: true,
  },
};

// 전체 홈 설정
export const DEFAULT_HOME_CONFIG: HomeConfig = {
  version: '1.0.0',
  lastUpdated: new Date().toISOString(),
  sections: [
    heroBannerSection,
    recommendedSection,
    iconMenuSection,
    promoBannerSection,
    focusSection,
    recentlyPlayedSection,
    featuredSection,
    sleepSection,
    popularSection,
  ],
};

// 섹션 ID로 섹션 찾기
export const getSectionById = (config: HomeConfig, sectionId: string) => {
  return config.sections.find((section) => section.id === sectionId);
};

// 활성화된 섹션만 필터링
export const getVisibleSections = (config: HomeConfig) => {
  return config.sections
    .filter((section) => section.isVisible)
    .sort((a, b) => a.sortOrder - b.sortOrder);
};
