/**
 * HomeScreen 데이터 변환 유틸리티
 * 서버 응답 → 로컬 타입 변환 로직 분리
 */

import { Track } from '../types';
import {
  HomeSection,
  TrackCarouselSection,
  FeaturedTrackSection,
  TrackListSection,
  IconMenuSection,
  HeroBannerSection,
  BannerSection,
} from '../types/home';
import { API_BASE_URL } from '../constants';
import type {
  ServerCategory,
  ServerHomeSection,
  ServerBanner,
  ServerHomeSectionItem,
} from '../services/HomeService';

// ============================================
// URL 변환 유틸리티
// ============================================

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=600';

/**
 * 이미지 URL 변환 (기본값 제공)
 */
export const toImageUrl = (path: string | null | undefined): string => {
  if (!path) return DEFAULT_IMAGE;
  if (path.startsWith('http')) return encodeURI(path);
  if (path.startsWith('/')) return encodeURI(`${API_BASE_URL}${path}`);
  return encodeURI(path);
};

/**
 * 오디오 URL 변환 (빈 값 허용하지 않음)
 */
export const toAudioUrl = (path: string | null | undefined): string | null => {
  if (!path || path.trim() === '') return null;
  if (path.startsWith('http')) return encodeURI(path);
  if (path.startsWith('/')) return encodeURI(`${API_BASE_URL}${path}`);
  return encodeURI(path);
};

// ============================================
// 아이콘 매핑
// ============================================

const ICON_MAP: Record<string, string> = {
  // 카테고리 아이콘
  'musical-note': 'musical-note',
  'musical-notes': 'musical-notes',
  'film': 'film',
  'leaf': 'leaf',
  'moon': 'moon',
  'brain': 'bulb',
  'cafe': 'cafe',
  'headset': 'headset',
  // 레거시 매핑
  'heart': 'heart',
  'tree': 'leaf',
  'coffee': 'cafe',
  'spa': 'flower',
};

/**
 * 백엔드 아이콘 → Ionicons 매핑
 */
export const mapIconName = (backendIcon: string): string => {
  return ICON_MAP[backendIcon] || backendIcon;
};

// ============================================
// 서버 → 로컬 타입 변환
// ============================================

/**
 * 서버 트랙 아이템 → 로컬 Track 타입 변환
 */
export const serverItemToTrack = (item: ServerHomeSectionItem): Track | null => {
  if (!item.trackData) return null;
  const track = item.trackData;

  const audioFile = toAudioUrl(track.fileUrl);
  if (!audioFile) {
    console.warn('[homeTransformers] Skipping track with invalid fileUrl:', track.id, track.title);
    return null;
  }

  return {
    id: track.id,
    title: track.title,
    artist: track.artist || track.composer || 'BRIBI',
    category: track.category || 'healing',
    duration: track.duration,
    audioFile,
    backgroundImage: toImageUrl(track.thumbnailUrl),
    recommendedBrightness: 0.3,
    isFree: true,
    sortOrder: track.sortOrder || item.sortOrder,
    createdAt: new Date().toISOString(),
    tags: track.tags,
    playCount: track.playCount,
  };
};

/**
 * 백엔드 카테고리 배열 → IconMenu 섹션 변환
 */
export const categoriesToIconMenu = (
  categories: ServerCategory[],
  sortOrder: number = 3
): IconMenuSection => ({
  id: 'theme_categories',
  type: 'icon_menu',
  sortOrder,
  isVisible: true,
  data: {
    items: categories.map(cat => ({
      id: cat.slug,
      name: cat.name,
      icon: mapIconName(cat.icon),
      color: cat.color,
      action: { type: 'filter', target: cat.slug },
    })),
    showAddButton: false,
    columns: 4,
  },
});

/**
 * 백엔드 배너 배열 → HeroBanner 섹션 변환
 */
export const bannersToHeroBanner = (banners: ServerBanner[]): HeroBannerSection => ({
  id: 'hero_banner_main',
  type: 'hero_banner',
  sortOrder: 1,
  isVisible: true,
  data: {
    banners: banners.map(banner => ({
      id: banner.id,
      title: banner.title || '',
      subtitle: banner.subtitle || undefined,
      imageUrl: toImageUrl(banner.imageUrl),
      backgroundColor: banner.backgroundColor || '#1a2f4a',
      action: banner.linkType && banner.linkTarget
        ? { type: banner.linkType as 'filter' | 'playlist', target: banner.linkTarget }
        : undefined,
    })),
    autoScrollInterval: 5000,
    showPagination: true,
  },
});

/**
 * 서버 섹션 → 로컬 HomeSection 타입 변환
 */
export const serverSectionToLocal = (
  serverSection: ServerHomeSection,
  allTracks: Track[]
): HomeSection | null => {
  const baseSection = {
    id: serverSection.id,
    sortOrder: serverSection.sortOrder,
    isVisible: true,
    title: serverSection.title || undefined,
    subtitle: serverSection.subtitle || undefined,
    showMoreButton: serverSection.showMoreButton,
    moreButtonTarget: serverSection.moreButtonTarget || undefined,
  };

  // 섹션 아이템에서 트랙 추출
  const sectionTracks = serverSection.items
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(serverItemToTrack)
    .filter((t): t is Track => t !== null);

  switch (serverSection.type) {
    case 'track_carousel':
      return {
        ...baseSection,
        type: 'track_carousel',
        data: {
          tracks: sectionTracks.length > 0 ? sectionTracks : allTracks.slice(0, 10),
          cardStyle: serverSection.config?.cardStyle || 'medium',
          showArtist: serverSection.config?.showArtist ?? true,
          showDuration: serverSection.config?.showDuration ?? false,
        },
      } as TrackCarouselSection;

    case 'track_list':
      return {
        ...baseSection,
        type: 'track_list',
        data: {
          tracks: sectionTracks.length > 0 ? sectionTracks : allTracks.slice(0, 10),
          maxItems: serverSection.config?.maxItems || 5,
          showIndex: serverSection.config?.showIndex ?? true,
          showDuration: serverSection.config?.showDuration ?? true,
        },
      } as TrackListSection;

    case 'featured_track':
      const featuredTrack = sectionTracks[0] || allTracks[0];
      if (!featuredTrack) return null;
      return {
        ...baseSection,
        type: 'featured_track',
        data: {
          track: featuredTrack,
          description: serverSection.config?.description || serverSection.subtitle || '',
          badge: serverSection.config?.badge || '추천',
        },
      } as FeaturedTrackSection;

    case 'banner':
      return {
        ...baseSection,
        type: 'banner',
        data: {
          imageUrl: toImageUrl(serverSection.config?.imageUrl),
          backgroundColor: serverSection.config?.backgroundColor,
          title: serverSection.title || undefined,
          subtitle: serverSection.subtitle || undefined,
          buttonText: serverSection.config?.buttonText,
          action: serverSection.config?.action,
          height: serverSection.config?.height || 'medium',
        },
      } as BannerSection;

    case 'icon_menu':
    case 'hero_banner':
      // 별도 API에서 처리
      return null;

    default:
      console.log('[homeTransformers] Unknown section type:', serverSection.type);
      return null;
  }
};

// ============================================
// 섹션 트랙 추출 유틸리티
// ============================================

/**
 * 섹션에서 클릭한 트랙이 속한 섹션의 모든 트랙 반환
 */
export const getTracksFromSection = (
  sections: HomeSection[],
  clickedTrack: Track
): Track[] => {
  for (const section of sections) {
    let sectionTracks: Track[] = [];

    if (section.type === 'track_carousel') {
      sectionTracks = (section as TrackCarouselSection).data.tracks;
    } else if (section.type === 'track_list') {
      sectionTracks = (section as TrackListSection).data.tracks;
    } else if (section.type === 'featured_track') {
      const featuredTrack = (section as FeaturedTrackSection).data.track;
      if (featuredTrack) {
        sectionTracks = [featuredTrack];
      }
    }

    if (sectionTracks.some(t => t.id === clickedTrack.id)) {
      return sectionTracks;
    }
  }

  // 섹션을 찾지 못한 경우 단일 트랙만 반환
  return [clickedTrack];
};

// ============================================
// 로컬 설정 기반 섹션 업데이트
// ============================================

interface UpdateSectionsParams {
  visibleSections: HomeSection[];
  allTracks: Track[];
  heroBanners: ServerBanner[];
  categories: ServerCategory[];
}

/**
 * 로컬 설정 기반 섹션에 동적 데이터 주입
 */
export const updateLocalSections = ({
  visibleSections,
  allTracks,
  heroBanners,
  categories,
}: UpdateSectionsParams): HomeSection[] => {
  // 카테고리별 트랙 분류
  const sleepTracks = allTracks.filter(t => t.category === 'sleep');
  const focusTracks = allTracks.filter(t => t.category === 'focus');
  const meditationTracks = allTracks.filter(
    t => t.category === 'meditation' || t.category === 'healing'
  );
  const popularTracks = [...allTracks]
    .sort((a, b) => (b.playCount || 0) - (a.playCount || 0))
    .slice(0, 10);
  const featuredTracks = allTracks.slice(0, 5);

  return visibleSections.map(section => {
    // 히어로 배너
    if (section.id === 'hero_banner_main' && heroBanners.length > 0) {
      return bannersToHeroBanner(heroBanners);
    }

    // 카테고리 메뉴
    if (section.id === 'theme_categories' && categories.length > 0) {
      return categoriesToIconMenu(categories);
    }

    switch (section.id) {
      case 'recommended_tracks':
        return {
          ...section,
          data: {
            ...(section as TrackCarouselSection).data,
            tracks: featuredTracks,
          },
        } as TrackCarouselSection;

      case 'focus_tracks':
        return {
          ...section,
          data: {
            ...(section as TrackCarouselSection).data,
            tracks: focusTracks.length > 0 ? focusTracks : featuredTracks,
          },
        } as TrackCarouselSection;

      case 'sleep_tracks':
        return {
          ...section,
          data: {
            ...(section as TrackCarouselSection).data,
            tracks:
              sleepTracks.length > 0
                ? sleepTracks
                : meditationTracks.length > 0
                ? meditationTracks
                : featuredTracks,
          },
        } as TrackCarouselSection;

      case 'featured_today':
        const featuredTrack = featuredTracks[0] || allTracks[0];
        if (featuredTrack) {
          return {
            ...section,
            data: {
              ...(section as FeaturedTrackSection).data,
              track: featuredTrack,
            },
          } as FeaturedTrackSection;
        }
        return { ...section, isVisible: false };

      case 'popular_chart':
        return {
          ...section,
          data: {
            ...(section as TrackListSection).data,
            tracks: popularTracks,
          },
        } as TrackListSection;

      default:
        return section;
    }
  });
};
