import React, { useEffect, useState, useCallback, useRef, useMemo, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import { RootStackParamList, MainTabParamList, Track } from '../../types';
import { Colors, Typography, Spacing, BorderRadius, TRACK_CATEGORIES } from '../../constants';
import { TrackService, SyncService, DownloadService, ErrorLogger } from '../../services';
import { useFavoritesStore } from '../../stores';
import { usePlayer, useDownload } from '../../hooks';
import { TrackCard, TRACK_CARD_HEIGHT } from '../../components';

// Screen logger
const logger = ErrorLogger.forScreen('LibraryScreen');

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type LibraryRouteProp = RouteProp<MainTabParamList, 'Library'>;

const CATEGORY_LABELS: Record<string, string> = {
  all: '전체',
  sleep: '수면',
  meditation: '명상',
  nature: '자연',
  focus: '집중',
  healing: '힐링',
  cafe: '카페',
  piano: '피아노',
  cinema: '시네마',
};

type TabType = 'library' | 'downloads';

const LibraryScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<LibraryRouteProp>();
  const { toggleFavorite, isFavorite } = useFavoritesStore();
  const { playTrack } = usePlayer();
  const {
    downloadTrack,
    deleteDownload,
    getDownloadStatus,
    getDownloadProgress,
    downloadedCount,
    totalDownloadSize,
    refreshDownloads,
  } = useDownload();

  // route.params에서 카테고리 필터 가져오기
  const initialCategory = route.params?.category || 'all';

  const [activeTab, setActiveTab] = useState<TabType>('library');
  const [tracks, setTracks] = useState<Track[]>([]);
  const [downloadedTracks, setDownloadedTracks] = useState<Track[]>([]);
  const [filteredTracks, setFilteredTracks] = useState<Track[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // 마운트 상태 추적
  const isMountedRef = useRef(true);

  useEffect(() => {
    logger.info('mount', 'LibraryScreen mounted', { initialCategory });
    isMountedRef.current = true;

    return () => {
      logger.info('unmount', 'LibraryScreen unmounting');
      isMountedRef.current = false;
    };
  }, []);

  // route.params.category가 변경되면 카테고리 업데이트
  useEffect(() => {
    if (route.params?.category && route.params.category !== selectedCategory) {
      logger.debug('categoryChange', 'Category changed via params', { newCategory: route.params.category });
      setSelectedCategory(route.params.category);
    }
  }, [route.params?.category]);

  const loadTracks = useCallback(async () => {
    logger.debug('loadTracks', 'Loading tracks', { selectedCategory, searchQuery });
    try {
      const allTracks = await TrackService.getAllTracks();
      if (isMountedRef.current) {
        setTracks(allTracks);
        filterTracks(allTracks, selectedCategory, searchQuery);
        logger.info('loadTracks', 'Tracks loaded', { count: allTracks.length });
      }
    } catch (error) {
      logger.error('loadTracks', 'Error loading tracks', error as Error);
    }
  }, [selectedCategory, searchQuery]);

  // Load downloaded tracks
  const loadDownloadedTracks = useCallback(async () => {
    logger.debug('loadDownloadedTracks', 'Loading downloaded tracks');
    try {
      const downloads = await DownloadService.getDownloadedTracks();
      const allTracks = await TrackService.getAllTracks();

      // Match downloaded tracks with full track data
      const downloadedTrackIds = downloads.map(d => d.trackId);
      const downloaded = allTracks.filter(t => downloadedTrackIds.includes(t.id));
      if (isMountedRef.current) {
        setDownloadedTracks(downloaded);
        logger.info('loadDownloadedTracks', 'Downloaded tracks loaded', { count: downloaded.length });
      }
    } catch (error) {
      logger.error('loadDownloadedTracks', 'Error loading downloaded tracks', error as Error);
    }
  }, []);

  // 초기 데이터 로드 (의존성 수정)
  useEffect(() => {
    loadTracks();
    loadDownloadedTracks();
  }, [loadTracks, loadDownloadedTracks]);

  // Refresh downloaded tracks when download count changes
  useEffect(() => {
    loadDownloadedTracks();
  }, [downloadedCount, loadDownloadedTracks]);

  const filterTracks = (
    allTracks: Track[],
    category: string,
    query: string
  ) => {
    let filtered = allTracks;

    // Filter by category
    if (category !== 'all') {
      filtered = filtered.filter((t) => t.category === category);
    }

    // Filter by search query
    if (query.trim()) {
      const lowerQuery = query.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.title.toLowerCase().includes(lowerQuery) ||
          t.artist.toLowerCase().includes(lowerQuery)
      );
    }

    setFilteredTracks(filtered);
  };

  useEffect(() => {
    filterTracks(tracks, selectedCategory, searchQuery);
  }, [selectedCategory, searchQuery, tracks]);

  const onRefresh = async () => {
    logger.info('refresh', 'Pull-to-refresh triggered', { activeTab });
    setRefreshing(true);
    try {
      if (activeTab === 'library') {
        // 서버에서 동기화 후 로컬 DB에서 로드
        await SyncService.syncTracks();
        await loadTracks();
      } else {
        await loadDownloadedTracks();
        await refreshDownloads();
      }
    } catch (error) {
      logger.error('refresh', 'Error during refresh', error as Error);
    } finally {
      if (isMountedRef.current) {
        setRefreshing(false);
      }
    }
  };

  const handleTrackPress = (track: Track) => {
    logger.info('trackPress', 'Track pressed', { trackId: track.id, title: track.title });
    playTrack(track);
    navigation.navigate('Player', { trackId: track.id });
  };

  const handleFavoritePress = (trackId: string) => {
    logger.debug('favoritePress', 'Favorite toggled', { trackId });
    toggleFavorite(trackId);
  };

  const handleDownloadPress = (track: Track) => {
    const status = getDownloadStatus(track.id);
    logger.info('downloadPress', 'Download action', { trackId: track.id, currentStatus: status });
    if (status === 'completed') {
      // Already downloaded - confirm delete
      deleteDownload(track.id);
    } else if (!status || status === 'failed') {
      // Not downloaded or failed - start download
      downloadTrack(track);
    }
    // If downloading, do nothing (button is disabled)
  };

  const handleDeleteAllDownloads = async () => {
    logger.warn('deleteAllDownloads', 'User requested delete all downloads');
    Alert.alert(
      '전체 다운로드 삭제',
      '모든 오프라인 저장본을 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              await DownloadService.deleteAllDownloads();
              await loadDownloadedTracks();
              await refreshDownloads();
              logger.info('deleteAllDownloads', 'All downloads deleted successfully');
            } catch (error) {
              logger.error('deleteAllDownloads', 'Error deleting all downloads', error as Error);
            }
          },
        },
      ]
    );
  };

  const renderCategoryChip = (category: string) => {
    const isSelected = selectedCategory === category;
    return (
      <TouchableOpacity
        key={category}
        style={[styles.chip, isSelected && styles.chipSelected]}
        onPress={() => setSelectedCategory(category)}
        activeOpacity={0.7}
      >
        <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
          {CATEGORY_LABELS[category]}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with Tabs */}
      <View style={styles.header}>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'library' && styles.tabActive]}
            onPress={() => setActiveTab('library')}
          >
            <Text style={[styles.tabText, activeTab === 'library' && styles.tabTextActive]}>
              전체 라이브러리
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'downloads' && styles.tabActive]}
            onPress={() => setActiveTab('downloads')}
          >
            <Icon
              name="download"
              size={16}
              color={activeTab === 'downloads' ? Colors.primary : Colors.textSecondary}
              style={styles.tabIcon}
            />
            <Text style={[styles.tabText, activeTab === 'downloads' && styles.tabTextActive]}>
              오프라인 ({downloadedCount})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {activeTab === 'library' ? (
        <>
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Icon name="search" size={20} color={Colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="트랙 검색..."
              placeholderTextColor={Colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Icon name="close-circle" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Category Chips */}
          <View style={styles.chipContainer}>
            <FlatList
              horizontal
              data={['all', ...TRACK_CATEGORIES]}
              keyExtractor={(item) => item}
              renderItem={({ item }) => renderCategoryChip(item)}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipList}
            />
          </View>

          {/* Track List */}
          <FlatList
            data={filteredTracks}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TrackCard
                track={item}
                variant="vertical"
                onPress={() => handleTrackPress(item)}
                onFavoritePress={() => handleFavoritePress(item.id)}
                isFavorite={isFavorite(item.id)}
                showFavorite
              />
            )}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={Colors.primary}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Icon name="musical-notes" size={48} color={Colors.textSecondary} />
                <Text style={styles.emptyText}>
                  {searchQuery ? '검색 결과가 없습니다' : '트랙이 없습니다'}
                </Text>
              </View>
            }
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            // Performance optimizations
            initialNumToRender={10}
            maxToRenderPerBatch={5}
            windowSize={5}
            removeClippedSubviews={true}
            getItemLayout={(_, index) => ({
              length: TRACK_CARD_HEIGHT,
              offset: TRACK_CARD_HEIGHT * index,
              index,
            })}
          />
        </>
      ) : (
        <>
          {/* Downloads Header */}
          {downloadedTracks.length > 0 && (
            <View style={styles.downloadsHeader}>
              <Text style={styles.downloadInfo}>
                {downloadedCount}개 트랙 · {totalDownloadSize}
              </Text>
              <TouchableOpacity onPress={handleDeleteAllDownloads}>
                <Text style={styles.deleteAllText}>전체 삭제</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Downloaded Tracks List */}
          <FlatList
            data={downloadedTracks}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TrackCard
                track={item}
                variant="vertical"
                onPress={() => handleTrackPress(item)}
                onFavoritePress={() => handleFavoritePress(item.id)}
                isFavorite={isFavorite(item.id)}
                showFavorite
              />
            )}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={Colors.primary}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Icon name="cloud-download-outline" size={48} color={Colors.textSecondary} />
                <Text style={styles.emptyText}>오프라인 저장된 트랙이 없습니다</Text>
                <Text style={styles.emptySubtext}>
                  라이브러리에서 다운로드 버튼을 눌러{'\n'}오프라인으로 저장하세요
                </Text>
              </View>
            }
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            // Performance optimizations
            initialNumToRender={10}
            maxToRenderPerBatch={5}
            windowSize={5}
            removeClippedSubviews={true}
            getItemLayout={(_, index) => ({
              length: TRACK_CARD_HEIGHT,
              offset: TRACK_CARD_HEIGHT * index,
              index,
            })}
          />
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  tabContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  tabText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  tabTextActive: {
    ...Typography.bodyMedium,
    color: Colors.text,
  },
  tabIcon: {
    marginRight: 4,
  },
  headerTitle: {
    ...Typography.heading2,
    color: Colors.text,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    height: 44,
  },
  searchInput: {
    flex: 1,
    ...Typography.body,
    color: Colors.text,
    marginLeft: Spacing.sm,
  },
  chipContainer: {
    marginBottom: Spacing.sm,
  },
  chipList: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    marginRight: Spacing.sm,
  },
  chipSelected: {
    backgroundColor: Colors.primary,
  },
  chipText: {
    ...Typography.captionMedium,
    color: Colors.textSecondary,
  },
  chipTextSelected: {
    color: Colors.background,
  },
  listContent: {
    paddingBottom: 100,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  emptySubtext: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  downloadsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  downloadInfo: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  deleteAllText: {
    ...Typography.caption,
    color: Colors.error,
  },
});

export default memo(LibraryScreen);
