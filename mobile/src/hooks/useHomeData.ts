/**
 * useHomeData - 홈 화면 데이터 관리 훅
 * 데이터 로딩, 캐싱, 새로고침 로직 분리
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { Track } from '../types';
import { HomeSection } from '../types/home';
import { HomeService, TrackService, DownloadService, ErrorLogger } from '../services';
import { DEFAULT_HOME_CONFIG, getVisibleSections } from '../config/homeConfig';
import {
  bannersToHeroBanner,
  categoriesToIconMenu,
  serverSectionToLocal,
  updateLocalSections,
} from '../utils/homeTransformers';

const logger = ErrorLogger.forScreen('useHomeData');

interface UseHomeDataReturn {
  sections: HomeSection[];
  recentTracks: Track[];
  isLoading: boolean;
  refreshing: boolean;
  downloadedTrackIds: Set<string>;
  loadData: () => Promise<void>;
  onRefresh: () => Promise<void>;
  refreshDownloadedTracks: () => Promise<void>;
}

export const useHomeData = (): UseHomeDataReturn => {
  const [sections, setSections] = useState<HomeSection[]>([]);
  const [recentTracks, setRecentTracks] = useState<Track[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [downloadedTrackIds, setDownloadedTrackIds] = useState<Set<string>>(new Set());

  // 마운트 상태 추적
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // 다운로드된 트랙 목록 새로고침
  const refreshDownloadedTracks = useCallback(async () => {
    try {
      const downloads = await DownloadService.getDownloadedTracks();
      if (isMountedRef.current) {
        setDownloadedTrackIds(new Set(downloads.map(d => d.trackId)));
      }
    } catch (error) {
      logger.error('refreshDownloadedTracks', 'Failed to refresh', error as Error);
    }
  }, []);

  // 초기 다운로드 목록 로드
  useEffect(() => {
    refreshDownloadedTracks();
  }, [refreshDownloadedTracks]);

  // 메인 데이터 로드
  const loadData = useCallback(async () => {
    logger.info('loadData', 'Starting data load');

    try {
      // 병렬 API 호출
      const [serverSections, backendTracks, categories, heroBanners] = await Promise.all([
        HomeService.getHomeSections(),
        HomeService.getTracks({ limit: 50 }),
        HomeService.getCategories(),
        HomeService.getHeroBanners(),
      ]);

      if (!isMountedRef.current) {
        logger.debug('loadData', 'Component unmounted during load');
        return;
      }

      logger.info('loadData', 'Server data loaded', {
        sections: serverSections.length,
        tracks: backendTracks.length,
        categories: categories.length,
        banners: heroBanners.length,
      });

      // 트랙 결정 (서버 → 로컬 fallback)
      let allTracks: Track[] = [];
      if (backendTracks.length > 0) {
        allTracks = backendTracks;
      } else {
        logger.info('loadData', 'Using local DB tracks as fallback');
        allTracks = await TrackService.getAllTracks();
      }

      // 서버 섹션 우선 사용
      if (serverSections.length > 0) {
        logger.info('loadData', 'Using server sections');
        const convertedSections: HomeSection[] = [];

        // 히어로 배너 추가
        if (heroBanners.length > 0) {
          convertedSections.push(bannersToHeroBanner(heroBanners));
        }

        // 서버 섹션 변환
        serverSections
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .forEach(serverSection => {
            if (serverSection.type === 'icon_menu' && categories.length > 0) {
              convertedSections.push({
                ...categoriesToIconMenu(categories, serverSection.sortOrder),
              });
              return;
            }

            const localSection = serverSectionToLocal(serverSection, allTracks);
            if (localSection) {
              convertedSections.push(localSection);
            }
          });

        convertedSections.sort((a, b) => a.sortOrder - b.sortOrder);
        setSections(convertedSections);
        setRecentTracks(allTracks.slice(0, 5));

        logger.debug('loadData', 'Final sections', {
          count: convertedSections.length,
          ids: convertedSections.map(s => s.id),
        });
      } else {
        // 로컬 설정 사용
        logger.info('loadData', 'Using local config');
        const visibleSections = getVisibleSections(DEFAULT_HOME_CONFIG);

        const updatedSections = updateLocalSections({
          visibleSections,
          allTracks,
          heroBanners,
          categories,
        });

        setSections(updatedSections);
        setRecentTracks(allTracks.slice(0, 5));
      }
    } catch (error) {
      logger.error('loadData', 'Error loading data', error as Error);

      // 완전 실패 시 로컬 fallback
      try {
        if (!isMountedRef.current) return;
        const localTracks = await TrackService.getAllTracks();
        const visibleSections = getVisibleSections(DEFAULT_HOME_CONFIG);

        if (isMountedRef.current) {
          setSections(visibleSections);
          setRecentTracks(localTracks.slice(0, 5));
          logger.info('loadData', 'Using local fallback', { trackCount: localTracks.length });
        }
      } catch (e) {
        logger.fatal('loadData', 'Fallback failed', e as Error);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  // Pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await HomeService.clearCache();
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  return {
    sections,
    recentTracks,
    isLoading,
    refreshing,
    downloadedTrackIds,
    loadData,
    onRefresh,
    refreshDownloadedTracks,
  };
};

export default useHomeData;
