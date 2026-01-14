/**
 * HomeScreen - 홈 화면
 *
 * 리팩토링 완료:
 * - 데이터 변환 로직 → utils/homeTransformers.ts
 * - 데이터 로딩 로직 → hooks/useHomeData.ts
 * - 컴포넌트는 UI 렌더링에만 집중
 */

import React, { useEffect, useCallback, useRef, memo } from 'react';
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
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';

import type { RootStackParamList, Track } from '../../types';
import type { TrackCarouselSection } from '../../types/home';
import { Colors, Typography, Spacing } from '../../constants';
import { ErrorLogger } from '../../services';
import { useFavoritesStore, usePlayerStore } from '../../stores';
import { SectionRenderer } from '../../components';
import { usePlayer, useOfflineMode, useDownload } from '../../hooks';
import { useHomeData } from '../../hooks/useHomeData';
import { getTracksFromSection } from '../../utils/homeTransformers';

const logger = ErrorLogger.forScreen('HomeScreen');

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// ============================================
// 서브 컴포넌트
// ============================================

interface HeaderProps {
  onSearchPress: () => void;
}

const Header = memo<HeaderProps>(({ onSearchPress }) => (
  <View style={styles.header}>
    <Image
      source={require('../../assets/images/bribi-logo.png')}
      style={styles.headerLogo}
      resizeMode="contain"
    />
    <TouchableOpacity onPress={onSearchPress}>
      <Icon name="search" size={24} color={Colors.text} />
    </TouchableOpacity>
  </View>
));

const LoadingState = memo(() => (
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
));

const EmptyState = memo(() => (
  <View style={styles.emptyState}>
    <Icon name="musical-notes" size={48} color={Colors.textSecondary} />
    <Text style={styles.emptyText}>콘텐츠를 불러오는 중...</Text>
  </View>
));

// ============================================
// 메인 컴포넌트
// ============================================

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();

  // Stores
  const { toggleFavorite, isFavorite } = useFavoritesStore();
  const currentTrack = usePlayerStore(state => state.currentTrack);

  // Hooks
  const { playQueue } = usePlayer();
  const { isOfflineMode } = useOfflineMode();
  const { downloadTrack, getDownloadStatus, getDownloadProgress } = useDownload();
  const {
    sections,
    recentTracks,
    isLoading,
    refreshing,
    downloadedTrackIds,
    loadData,
    onRefresh,
    refreshDownloadedTracks,
  } = useHomeData();

  // 다운로드 새로고침 타이머
  const downloadRefreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 초기 데이터 로드
  useEffect(() => {
    logger.info('mount', 'HomeScreen mounted');
    loadData();

    return () => {
      logger.info('unmount', 'HomeScreen unmounting');
      if (downloadRefreshTimerRef.current) {
        clearTimeout(downloadRefreshTimerRef.current);
      }
    };
  }, [loadData]);

  // ============================================
  // 핸들러
  // ============================================

  const isDownloaded = useCallback(
    (trackId: string) => downloadedTrackIds.has(trackId),
    [downloadedTrackIds]
  );

  const handleDownloadPress = useCallback(
    (track: Track) => {
      logger.info('downloadPress', 'Download requested', { trackId: track.id });
      downloadTrack(track);

      // 타이머 클린업 및 새로고침 예약
      if (downloadRefreshTimerRef.current) {
        clearTimeout(downloadRefreshTimerRef.current);
      }
      downloadRefreshTimerRef.current = setTimeout(refreshDownloadedTracks, 1000);
    },
    [downloadTrack, refreshDownloadedTracks]
  );

  const handleTrackPress = useCallback(
    async (track: Track) => {
      logger.info('trackPress', 'Track pressed', { trackId: track.id, title: track.title });

      try {
        const sectionTracks = getTracksFromSection(sections, track);
        const trackIndex = sectionTracks.findIndex(t => t.id === track.id);

        await playQueue(sectionTracks, trackIndex >= 0 ? trackIndex : 0);
        navigation.navigate('Player', { trackId: track.id });
      } catch (error) {
        logger.error('trackPress', 'Failed to play track', error as Error);
        Alert.alert('오류', '재생 중 오류가 발생했습니다.');
      }
    },
    [sections, playQueue, navigation]
  );

  const handleFavoritePress = useCallback(
    (trackId: string) => toggleFavorite(trackId),
    [toggleFavorite]
  );

  const handleBannerPress = useCallback(
    async (action: { type: string; target: string }) => {
      switch (action.type) {
        case 'navigate':
          navigation.navigate(action.target as keyof RootStackParamList);
          break;
        case 'premium':
          navigation.navigate('Premium');
          break;
        case 'filter':
          navigation.navigate('MainTabs', {
            screen: 'Library',
            params: { category: action.target },
          } as never);
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
          logger.info('bannerPress', 'Open link', { target: action.target });
          break;
      }
    },
    [navigation, sections, handleTrackPress]
  );

  const handleIconPress = useCallback(
    (action: { type: string; target: string }) => {
      switch (action.type) {
        case 'filter':
          navigation.navigate('MainTabs', {
            screen: 'Library',
            params: { category: action.target },
          } as never);
          break;
        case 'navigate':
          navigation.navigate(action.target as keyof RootStackParamList);
          break;
        case 'custom':
          if (action.target === 'add_theme') {
            logger.info('iconPress', 'Add custom theme');
          }
          break;
      }
    },
    [navigation]
  );

  const handleSearchPress = useCallback(() => {
    navigation.navigate('Search');
  }, [navigation]);

  // ============================================
  // 렌더링
  // ============================================

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header onSearchPress={handleSearchPress} />

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

        {sections.length === 0 && <EmptyState />}

        {/* Bottom padding */}
        <View style={{ height: currentTrack ? 80 : 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

// ============================================
// 스타일
// ============================================

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
});

export default memo(HomeScreen);
