/**
 * Home Screen Section Types
 * 홈 화면 섹션 기반 구조 - 앱 업데이트로 섹션 추가/수정 가능
 */

import { Track } from './index';

// 섹션 타입 정의
export type HomeSectionType =
  | 'hero_banner'      // 탑 히어로 배너 (풀 와이드, 자동 슬라이드)
  | 'track_carousel'   // 썸네일 음악 캐러셀 (가로 스크롤)
  | 'icon_menu'        // 아이콘 메뉴 (테마 카테고리)
  | 'banner'           // 중간 배너 (프로모션, 이벤트)
  | 'track_list'       // 트랙 리스트 (세로)
  | 'featured_track'   // 피처드 트랙 (큰 카드 1개)
  | 'recently_played'  // 최근 재생
  | 'spacer';          // 여백

// 기본 섹션 인터페이스
interface BaseSectionData {
  id: string;
  type: HomeSectionType;
  sortOrder: number;
  isVisible: boolean;
  // 선택적 메타데이터
  title?: string;
  subtitle?: string;
  showMoreButton?: boolean;
  moreButtonAction?: 'navigate' | 'filter';
  moreButtonTarget?: string; // 네비게이션 대상 또는 필터 값
}

// 히어로 배너 섹션
export interface HeroBannerItem {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  backgroundColor: string;
  action?: {
    type: 'navigate' | 'track' | 'link' | 'playlist';
    target: string;
  };
}

export interface HeroBannerSection extends BaseSectionData {
  type: 'hero_banner';
  data: {
    banners: HeroBannerItem[];
    autoScrollInterval: number; // ms
    showPagination: boolean;
  };
}

// 트랙 캐러셀 섹션
export interface TrackCarouselSection extends BaseSectionData {
  type: 'track_carousel';
  data: {
    tracks: Track[];
    cardStyle: 'small' | 'medium' | 'large';
    showArtist: boolean;
    showDuration: boolean;
  };
}

// 아이콘 메뉴 섹션
export interface IconMenuItem {
  id: string;
  name: string;
  icon: string;
  color: string;
  action: {
    type: 'filter' | 'navigate' | 'custom';
    target: string;
  };
}

export interface IconMenuSection extends BaseSectionData {
  type: 'icon_menu';
  data: {
    items: IconMenuItem[];
    showAddButton: boolean;
    columns: 4 | 5; // 한 줄에 표시할 아이콘 수
  };
}

// 중간 배너 섹션
export interface BannerSection extends BaseSectionData {
  type: 'banner';
  data: {
    imageUrl: string;
    backgroundColor?: string;
    title?: string;
    subtitle?: string;
    buttonText?: string;
    action?: {
      type: 'navigate' | 'link' | 'premium';
      target: string;
    };
    height: 'small' | 'medium' | 'large'; // 80, 120, 160
  };
}

// 트랙 리스트 섹션
export interface TrackListSection extends BaseSectionData {
  type: 'track_list';
  data: {
    tracks: Track[];
    maxItems: number;
    showIndex: boolean;
    showDuration: boolean;
  };
}

// 피처드 트랙 섹션
export interface FeaturedTrackSection extends BaseSectionData {
  type: 'featured_track';
  data: {
    track: Track;
    description?: string;
    badge?: string; // "NEW", "HOT", "추천" 등
  };
}

// 최근 재생 섹션
export interface RecentlyPlayedSection extends BaseSectionData {
  type: 'recently_played';
  data: {
    maxItems: number;
    cardStyle: 'small' | 'medium';
  };
}

// 여백 섹션
export interface SpacerSection extends BaseSectionData {
  type: 'spacer';
  data: {
    height: number;
  };
}

// 유니온 타입
export type HomeSection =
  | HeroBannerSection
  | TrackCarouselSection
  | IconMenuSection
  | BannerSection
  | TrackListSection
  | FeaturedTrackSection
  | RecentlyPlayedSection
  | SpacerSection;

// 홈 화면 설정
export interface HomeConfig {
  version: string;
  lastUpdated: string;
  sections: HomeSection[];
}
