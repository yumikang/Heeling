/**
 * SearchScreen - 음악 검색 화면
 * 트랙 검색, 필터링, 검색 히스토리 관리
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import { RootStackParamList, Track } from '../../types';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants';
import { TrackService } from '../../services';
import { useFavoritesStore } from '../../stores';
import { usePlayer } from '../../hooks';
import { TrackCard } from '../../components';
import AsyncStorage from '@react-native-async-storage/async-storage';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const SEARCH_HISTORY_KEY = 'search_history';
const MAX_HISTORY_ITEMS = 10;

// 인기 검색어 (정적 데이터, 추후 API 연동 가능)
const POPULAR_KEYWORDS = [
  '수면',
  '피아노',
  '자연',
  '명상',
  '카페',
  '집중',
  '빗소리',
  '파도',
];

// 카테고리 필터
const CATEGORY_FILTERS = [
  { id: 'all', label: '전체', value: undefined },
  { id: 'sleep', label: '수면', value: 'sleep' as const },
  { id: 'meditation', label: '명상', value: 'meditation' as const },
  { id: 'nature', label: '자연', value: 'nature' as const },
  { id: 'focus', label: '집중', value: 'focus' as const },
];

const SearchScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { toggleFavorite, isFavorite } = useFavoritesStore();
  const { playTrack } = usePlayer();

  const inputRef = useRef<TextInput>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // 검색 히스토리 로드
  useEffect(() => {
    loadSearchHistory();
    // 화면 진입 시 키보드 자동 포커스
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const loadSearchHistory = async () => {
    try {
      const saved = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
      if (saved) {
        setSearchHistory(JSON.parse(saved));
      }
    } catch (error) {
      console.error('검색 히스토리 로드 실패:', error);
    }
  };

  const saveSearchHistory = async (newHistory: string[]) => {
    try {
      await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
      setSearchHistory(newHistory);
    } catch (error) {
      console.error('검색 히스토리 저장 실패:', error);
    }
  };

  const addToHistory = (keyword: string) => {
    const trimmed = keyword.trim();
    if (!trimmed) return;

    const filtered = searchHistory.filter(
      item => item.toLowerCase() !== trimmed.toLowerCase()
    );
    const newHistory = [trimmed, ...filtered].slice(0, MAX_HISTORY_ITEMS);
    saveSearchHistory(newHistory);
  };

  const removeFromHistory = (keyword: string) => {
    const newHistory = searchHistory.filter(item => item !== keyword);
    saveSearchHistory(newHistory);
  };

  const clearHistory = () => {
    saveSearchHistory([]);
  };

  const performSearch = useCallback(async (searchQuery: string, category?: string) => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    setIsLoading(true);
    setHasSearched(true);
    Keyboard.dismiss();

    try {
      // TrackService를 통해 검색
      const allTracks = await TrackService.getAllTracks();

      // 필터링 로직
      const filtered = allTracks.filter(track => {
        // 카테고리 필터
        if (category && category !== 'all' && track.category !== category) {
          return false;
        }

        // 검색어 매칭 (제목, 아티스트, 태그)
        const lowerQuery = trimmed.toLowerCase();
        const matchTitle = track.title.toLowerCase().includes(lowerQuery);
        const matchArtist = track.artist.toLowerCase().includes(lowerQuery);
        const matchTags = track.tags?.some(tag =>
          tag.toLowerCase().includes(lowerQuery)
        );

        return matchTitle || matchArtist || matchTags;
      });

      setResults(filtered);
      addToHistory(trimmed);
    } catch (error) {
      console.error('검색 실패:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [searchHistory]);

  const handleSearch = () => {
    const categoryValue = CATEGORY_FILTERS.find(c => c.id === selectedCategory)?.value;
    performSearch(query, categoryValue as string | undefined);
  };

  const handleKeywordPress = (keyword: string) => {
    setQuery(keyword);
    const categoryValue = CATEGORY_FILTERS.find(c => c.id === selectedCategory)?.value;
    performSearch(keyword, categoryValue as string | undefined);
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    if (query.trim()) {
      const categoryValue = CATEGORY_FILTERS.find(c => c.id === categoryId)?.value;
      performSearch(query, categoryValue as string | undefined);
    }
  };

  const handleTrackPress = (track: Track) => {
    playTrack(track);
    navigation.navigate('Player', { trackId: track.id });
  };

  const handleFavoritePress = (trackId: string) => {
    toggleFavorite(trackId);
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleClearQuery = () => {
    setQuery('');
    setResults([]);
    setHasSearched(false);
    inputRef.current?.focus();
  };

  // 검색 결과 아이템 렌더링
  const renderResultItem = ({ item }: { item: Track }) => (
    <TrackCard
      track={item}
      variant="vertical"
      onPress={() => handleTrackPress(item)}
      onFavoritePress={() => handleFavoritePress(item.id)}
      isFavorite={isFavorite(item.id)}
      showFavorite
    />
  );

  // 검색 전 화면 (히스토리 + 인기 검색어)
  const renderPreSearchContent = () => (
    <View style={styles.preSearchContainer}>
      {/* 최근 검색어 */}
      {searchHistory.length > 0 && (
        <View style={styles.historySection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>최근 검색어</Text>
            <TouchableOpacity onPress={clearHistory}>
              <Text style={styles.clearButton}>전체 삭제</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.keywordList}>
            {searchHistory.map((keyword, index) => (
              <TouchableOpacity
                key={`history-${index}`}
                style={styles.keywordChip}
                onPress={() => handleKeywordPress(keyword)}
              >
                <Icon name="time-outline" size={14} color={Colors.textSecondary} />
                <Text style={styles.keywordText}>{keyword}</Text>
                <TouchableOpacity
                  onPress={() => removeFromHistory(keyword)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Icon name="close" size={14} color={Colors.textMuted} />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* 인기 검색어 */}
      <View style={styles.popularSection}>
        <Text style={styles.sectionTitle}>인기 검색어</Text>
        <View style={styles.keywordList}>
          {POPULAR_KEYWORDS.map((keyword, index) => (
            <TouchableOpacity
              key={`popular-${index}`}
              style={[styles.keywordChip, styles.popularChip]}
              onPress={() => handleKeywordPress(keyword)}
            >
              <Text style={styles.keywordText}>{keyword}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  // 검색 결과 없음
  const renderEmptyResult = () => (
    <View style={styles.emptyContainer}>
      <Icon name="search-outline" size={64} color={Colors.textMuted} />
      <Text style={styles.emptyTitle}>검색 결과가 없습니다</Text>
      <Text style={styles.emptySubtitle}>
        다른 검색어로 시도해 보세요
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* 검색 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>

        <View style={styles.searchInputContainer}>
          <Icon name="search" size={20} color={Colors.textSecondary} />
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder="트랙, 아티스트 검색"
            placeholderTextColor={Colors.textMuted}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={handleClearQuery}>
              <Icon name="close-circle" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 카테고리 필터 */}
      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          data={CATEGORY_FILTERS}
          keyExtractor={item => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterChip,
                selectedCategory === item.id && styles.filterChipActive,
              ]}
              onPress={() => handleCategoryChange(item.id)}
            >
              <Text
                style={[
                  styles.filterText,
                  selectedCategory === item.id && styles.filterTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* 콘텐츠 영역 */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>검색 중...</Text>
        </View>
      ) : !hasSearched ? (
        renderPreSearchContent()
      ) : results.length === 0 ? (
        renderEmptyResult()
      ) : (
        <FlatList
          data={results}
          keyExtractor={item => item.id}
          renderItem={renderResultItem}
          contentContainerStyle={styles.resultList}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text style={styles.resultCount}>
              {results.length}개의 결과
            </Text>
          }
        />
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  backButton: {
    padding: Spacing.xs,
    marginRight: Spacing.sm,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    height: 44,
  },
  searchInput: {
    flex: 1,
    ...Typography.body,
    color: Colors.text,
    marginLeft: Spacing.sm,
    marginRight: Spacing.sm,
  },
  filterContainer: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filterList: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    marginRight: Spacing.sm,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
  },
  filterText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  filterTextActive: {
    color: Colors.text,
    fontWeight: '600',
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
  preSearchContainer: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
  },
  historySection: {
    marginBottom: Spacing.xl,
  },
  popularSection: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    ...Typography.heading4,
    color: Colors.text,
  },
  clearButton: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  keywordList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  keywordChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.sm,
    marginBottom: Spacing.sm,
    gap: 4,
  },
  popularChip: {
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
  },
  keywordText: {
    ...Typography.caption,
    color: Colors.text,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: {
    ...Typography.heading3,
    color: Colors.text,
    marginTop: Spacing.lg,
  },
  emptySubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  resultList: {
    paddingHorizontal: Spacing.md,
    paddingBottom: 100,
  },
  resultCount: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginVertical: Spacing.md,
  },
});

export default SearchScreen;
