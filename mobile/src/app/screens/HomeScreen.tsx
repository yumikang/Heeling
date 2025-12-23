/**
 * HomeScreen - 홈 화면 (백엔드 연동)
 * 관리자 페이지에서 설정한 섹션과 카테고리를 표시
 *
 * 우선순위:
 * 1. 서버 섹션 데이터 (어드민에서 설정)
 * 2. 로컬 DEFAULT_HOME_CONFIG (서버 데이터 없을 때 fallback)
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import { RootStackParamList, Track } from '../../types';
import { HomeSection, TrackCarouselSection, FeaturedTrackSection, TrackListSection, IconMenuSection, HeroBannerSection, BannerSection, HomeSectionType } from '../../types/home';
import { Colors, Typography, Spacing, API_BASE_URL } from '../../constants';
import { HomeService, TrackService, DownloadService } from '../../services';
import { useFavoritesStore } from '../../stores';
import { SectionRenderer } from '../../components';
import { DEFAULT_HOME_CONFIG, getVisibleSections } from '../../config/homeConfig';
import { usePlayer, useOfflineMode, useDownload } from '../../hooks';
import type { ServerCategory, ServerHomeSection, ServerBanner, ServerHomeSectionItem } from '../../services/HomeService';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const favoritesStore = useFavoritesStore();
  const { playQueue } = usePlayer();
  const { isOfflineMode } = useOfflineMode();
  const { downloadTrack, getDownloadStatus, getDownloadProgress } = useDownload();

  const [sections, setSections] = useState<HomeSection[]>([]);
  const [recentTracks, setRecentTracks] = useState<Track[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [downloadedTrackIds, setDownloadedTrackIds] = useState<Set<string>>(new Set());

  const toggleFavorite = favoritesStore.toggleFavorite;
  const isFavorite = favoritesStore.isFavorite;

  // 다운로드된 트랙 ID 로드
  useEffect(() => {
    const loadDownloadedTracks = async () => {
      try {
        const downloads = await DownloadService.getDownloadedTracks();
        setDownloadedTrackIds(new Set(downloads.map(d => d.trackId)));
      } catch (error) {
        console.error('Failed to load downloaded tracks:', error);
      }
    };
    loadDownloadedTracks();
  }, []);

  // 다운로드 여부 확인
  const isDownloaded = useCallback((trackId: string) => {
    return downloadedTrackIds.has(trackId);
  }, [downloadedTrackIds]);

  // 다운로드 핸들러
  const handleDownloadPress = useCallback((track: Track) => {
    downloadTrack(track);
    // 다운로드 완료 후 목록 업데이트
    setTimeout(async () => {
      const downloads = await DownloadService.getDownloadedTracks();
      setDownloadedTrackIds(new Set(downloads.map(d => d.trackId)));
    }, 1000);
  }, [downloadTrack]);

  // 섹션에서 트랙을 찾아 해당 섹션의 모든 트랙을 큐에 추가
  const getTracksForSection = useCallback((clickedTrack: Track): Track[] => {
    // 클릭한 트랙이 속한 섹션 찾기
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

      // 섹션에서 클릭한 트랙을 찾으면 해당 섹션의 트랙들 반환
      if (sectionTracks.some(t => t.id === clickedTrack.id)) {
        return sectionTracks;
      }
    }

    // 섹션을 찾지 못한 경우 단일 트랙만 반환
    return [clickedTrack];
  }, [sections]);

  // 아이콘 이름 매핑 (백엔드 → Ionicons)
  const mapIconName = (backendIcon: string): string => {
    const iconMap: Record<string, string> = {
      'heart': 'heart',
      'brain': 'bulb',
      'moon': 'moon',
      'tree': 'leaf',
      'coffee': 'cafe',
      'spa': 'flower',
    };
    return iconMap[backendIcon] || 'help-circle';
  };

  // 백엔드 카테고리를 IconMenu 섹션으로 변환
  const categoriesToIconMenu = (categories: ServerCategory[]): IconMenuSection => ({
    id: 'theme_categories',
    type: 'icon_menu',
    sortOrder: 3,
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

  // URL 변환 유틸리티
  const toFullUrl = (path: string | null | undefined): string => {
    if (!path) return 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=600';

    // 이미 전체 URL인 경우
    if (path.startsWith('http')) return path;

    // 상대 경로를 절대 경로로 변환
    if (path.startsWith('/')) {
      return `${API_BASE_URL}${path}`;
    }

    return path;
  };

  // 서버 트랙 아이템을 로컬 Track 타입으로 변환
  const serverItemToTrack = (item: ServerHomeSectionItem): Track | null => {
    if (!item.trackData) return null;
    const track = item.trackData;
    return {
      id: track.id,
      title: track.title,
      artist: track.artist || track.composer || 'BRIBI',
      category: track.category || 'healing',
      duration: track.duration,
      audioFile: toFullUrl(track.fileUrl),
      backgroundImage: toFullUrl(track.thumbnailUrl),
      recommendedBrightness: 0.3,
      isFree: true,
      sortOrder: track.sortOrder || item.sortOrder,
      createdAt: new Date().toISOString(),
      tags: track.tags,
      playCount: track.playCount,
    };
  };

  // 서버 섹션을 로컬 HomeSection 타입으로 변환
  const serverSectionToLocal = (serverSection: ServerHomeSection, allTracks: Track[]): HomeSection | null => {
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
            imageUrl: toFullUrl(serverSection.config?.imageUrl),
            backgroundColor: serverSection.config?.backgroundColor,
            title: serverSection.title || undefined,
            subtitle: serverSection.subtitle || undefined,
            buttonText: serverSection.config?.buttonText,
            action: serverSection.config?.action,
            height: serverSection.config?.height || 'medium',
          },
        } as BannerSection;

      case 'icon_menu':
        // 아이콘 메뉴는 별도로 categories API에서 가져옴
        return null;

      case 'hero_banner':
        // 히어로 배너는 별도로 banners API에서 가져옴
        return null;

      default:
        console.log('Unknown section type:', serverSection.type);
        return null;
    }
  };

  // 백엔드 배너를 HeroBanner 섹션으로 변환
  const bannersToHeroBanner = (banners: ServerBanner[]): HeroBannerSection => ({
    id: 'hero_banner_main',
    type: 'hero_banner',
    sortOrder: 1,
    isVisible: true,
    data: {
      banners: banners.map(banner => ({
        id: banner.id,
        title: banner.title || '',
        subtitle: banner.subtitle || undefined,
        imageUrl: toFullUrl(banner.imageUrl),
        backgroundColor: banner.backgroundColor || '#1a2f4a',
        action: banner.linkType === 'playlist' && banner.linkTarget
          ? { type: 'playlist' as const, target: banner.linkTarget }
          : undefined,
      })),
      autoScrollInterval: 5000,
      showPagination: true,
    },
  });

  // 데이터 로드 (서버 섹션 우선, 실패 시 로컬 fallback)
  const loadData = useCallback(async () => {
    try {
      // 백엔드에서 데이터 로드 시도 (섹션, 트랙, 카테고리, 배너 병렬)
      const [serverSections, backendTracks, categories, heroBanners] = await Promise.all([
        HomeService.getHomeSections(),
        HomeService.getTracks({ limit: 50 }),
        HomeService.getCategories(),
        HomeService.getHeroBanners(),
      ]);

      console.log('Server sections loaded:', serverSections.length);
      console.log('Backend tracks loaded:', backendTracks.length);

      // 백엔드 트랙이 있으면 사용, 없으면 로컬 DB 사용
      let allTracks: Track[] = [];
      if (backendTracks.length > 0) {
        allTracks = backendTracks;
      } else {
        console.log('Using local DB tracks as fallback');
        allTracks = await TrackService.getAllTracks();
      }

      // 서버 섹션이 있으면 우선 사용
      if (serverSections.length > 0) {
        console.log('Using server sections (admin configured)');

        // 서버 섹션을 로컬 타입으로 변환
        const convertedSections: HomeSection[] = [];

        // 1. 히어로 배너 추가 (있으면)
        if (heroBanners.length > 0) {
          convertedSections.push(bannersToHeroBanner(heroBanners));
        }

        // 2. 서버 섹션 변환 및 추가
        serverSections
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .forEach(serverSection => {
            // icon_menu는 categories API에서 가져온 데이터 사용
            if (serverSection.type === 'icon_menu' && categories.length > 0) {
              convertedSections.push({
                ...categoriesToIconMenu(categories),
                sortOrder: serverSection.sortOrder,
              });
              return;
            }

            const localSection = serverSectionToLocal(serverSection, allTracks);
            if (localSection) {
              convertedSections.push(localSection);
            }
          });

        // 정렬 후 설정
        convertedSections.sort((a, b) => a.sortOrder - b.sortOrder);
        setSections(convertedSections);
        setRecentTracks(allTracks.slice(0, 5));

        console.log('Final sections count:', convertedSections.length);
        convertedSections.forEach(s => console.log(`  - ${s.id} (${s.type}) order:${s.sortOrder}`));
      } else {
        // 서버 섹션 없음 → 로컬 설정 사용 (기존 로직)
        console.log('No server sections, using local config');

        const visibleSections = getVisibleSections(DEFAULT_HOME_CONFIG);

        // 카테고리별 트랙 분류
        const sleepTracks = allTracks.filter(t => t.category === 'sleep');
        const focusTracks = allTracks.filter(t => t.category === 'focus');
        const meditationTracks = allTracks.filter(t => t.category === 'meditation' || t.category === 'healing');
        const popularTracks = [...allTracks]
          .sort((a, b) => (b.playCount || 0) - (a.playCount || 0))
          .slice(0, 10);
        const featuredTracks = allTracks.slice(0, 5);

        // 섹션에 동적 데이터 주입
        const updatedSections = visibleSections.map(section => {
          // 히어로 배너 - 백엔드 데이터가 있으면 사용
          if (section.id === 'hero_banner_main' && heroBanners.length > 0) {
            return bannersToHeroBanner(heroBanners);
          }

          // 카테고리 메뉴 - 백엔드 데이터가 있으면 사용
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
                  tracks: sleepTracks.length > 0 ? sleepTracks : meditationTracks.length > 0 ? meditationTracks : featuredTracks,
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

        setSections(updatedSections);
        setRecentTracks(featuredTracks.slice(0, 5));
      }
    } catch (error) {
      console.error('Error loading home data:', error);
      // 완전 실패 시 로컬 데이터로 fallback
      try {
        const localTracks = await TrackService.getAllTracks();
        const visibleSections = getVisibleSections(DEFAULT_HOME_CONFIG);
        setSections(visibleSections);
        setRecentTracks(localTracks.slice(0, 5));
      } catch (e) {
        console.error('Fallback also failed:', e);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleTrackPress = async (track: Track) => {
    try {
      console.log('handleTrackPress:', track.title);

      // 클릭한 트랙이 속한 섹션의 모든 트랙을 가져옴
      const sectionTracks = getTracksForSection(track);
      console.log('Section tracks:', sectionTracks.length, 'tracks');

      // 클릭한 트랙의 인덱스 찾기
      const trackIndex = sectionTracks.findIndex(t => t.id === track.id);
      console.log('Track index:', trackIndex);

      // 큐에 섹션의 모든 트랙 추가하고 클릭한 트랙부터 재생
      await playQueue(sectionTracks, trackIndex >= 0 ? trackIndex : 0);

      navigation.navigate('Player', { trackId: track.id });
    } catch (error) {
      console.error('Failed to play track:', error);
      Alert.alert('오류', '재생 중 오류가 발생했습니다.');
    }
  };

  const handleFavoritePress = (trackId: string) => {
    toggleFavorite(trackId);
  };

  const handleBannerPress = async (action: { type: string; target: string }) => {
    switch (action.type) {
      case 'navigate':
        // @ts-ignore - 동적 네비게이션
        navigation.navigate(action.target);
        break;
      case 'premium':
        navigation.navigate('Premium');
        break;
      case 'playlist':
        navigation.navigate('Playlist', { playlistId: action.target });
        break;
      case 'track':
        const track = sections
          .flatMap(s =>
            s.type === 'track_carousel' ? (s as TrackCarouselSection).data.tracks : []
          )
          .find(t => t.id === action.target);
        if (track) {
          await handleTrackPress(track);
        }
        break;
      case 'link':
        console.log('Open link:', action.target);
        break;
    }
  };

  const handleIconPress = (action: { type: string; target: string }) => {
    switch (action.type) {
      case 'filter':
        // Library 탭으로 카테고리 필터와 함께 이동
        navigation.navigate('MainTabs', {
          screen: 'Library',
          params: { category: action.target },
        } as any);
        break;
      case 'navigate':
        // @ts-ignore
        navigation.navigate(action.target);
        break;
      case 'custom':
        if (action.target === 'add_theme') {
          console.log('Add custom theme');
        }
        break;
    }
  };

  // 로딩 상태
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Image
            source={require('../../assets/images/bribi-logo.png')}
            style={styles.headerLogo}
            resizeMode="contain"
          />
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>로딩 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Image
          source={require('../../assets/images/bribi-logo.png')}
          style={styles.headerLogo}
          resizeMode="contain"
        />
        <TouchableOpacity onPress={() => navigation.navigate('Search')}>
          <Icon name="search" size={24} color={Colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
      >
        {/* 섹션 렌더링 */}
        {sections.map(section => (
          <SectionRenderer
            key={section.id}
            section={section}
            onTrackPress={handleTrackPress}
            onFavoritePress={handleFavoritePress}
            onDownloadPress={handleDownloadPress}
            isFavorite={isFavorite}
            onBannerPress={handleBannerPress}
            onIconPress={handleIconPress}
            recentTracks={recentTracks}
            isOfflineMode={isOfflineMode}
            isDownloaded={isDownloaded}
            getDownloadStatus={getDownloadStatus}
            getDownloadProgress={getDownloadProgress}
          />
        ))}

        {/* 섹션이 없는 경우 */}
        {sections.length === 0 && (
          <View style={styles.emptyState}>
            <Icon name="musical-notes" size={48} color={Colors.textSecondary} />
            <Text style={styles.emptyText}>콘텐츠를 불러오는 중...</Text>
          </View>
        )}

        {/* Bottom padding for mini player */}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  headerTitle: {
    ...Typography.heading3,
    color: Colors.primary,
  },
  headerLogo: {
    width: 100,
    height: 34,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  bottomPadding: {
    height: 100,
  },
});

export default HomeScreen;
