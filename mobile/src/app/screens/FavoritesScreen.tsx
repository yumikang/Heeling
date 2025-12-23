import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
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
import { TrackCard, Button } from '../../components';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const FavoritesScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { favorites, toggleFavorite, isFavorite } = useFavoritesStore();
  const { playTrack, playQueue } = usePlayer();

  const [favoriteTracks, setFavoriteTracks] = useState<Track[]>([]);

  const loadFavorites = useCallback(async () => {
    if (favorites.length === 0) {
      setFavoriteTracks([]);
      return;
    }

    try {
      // Zustand 스토어의 favorites ID로 로컬 DB에서 트랙 조회
      const tracks = await TrackService.getTracksByIds(favorites);
      setFavoriteTracks(tracks);
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  }, [favorites]);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const handleTrackPress = (track: Track) => {
    playTrack(track);
    navigation.navigate('Player', { trackId: track.id });
  };

  const handleFavoritePress = (trackId: string) => {
    toggleFavorite(trackId);
  };

  const handlePlayAll = () => {
    if (favoriteTracks.length > 0) {
      playQueue(favoriteTracks, 0);
      navigation.navigate('Player', { trackId: favoriteTracks[0].id });
    }
  };

  const handleShuffle = () => {
    if (favoriteTracks.length > 0) {
      const shuffled = [...favoriteTracks].sort(() => Math.random() - 0.5);
      playQueue(shuffled, 0);
      navigation.navigate('Player', { trackId: shuffled[0].id });
    }
  };

  const handleBrowse = () => {
    navigation.navigate('MainTabs', { screen: 'Library' } as any);
  };

  // Empty State
  if (favoriteTracks.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>좋아요 목록</Text>
        </View>
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Icon name="heart-outline" size={64} color={Colors.textSecondary} />
          </View>
          <Text style={styles.emptyTitle}>아직 좋아요한 곡이 없어요</Text>
          <Text style={styles.emptySubtitle}>
            마음에 드는 트랙에 하트를 눌러보세요
          </Text>
          <Button
            title="트랙 둘러보기"
            onPress={handleBrowse}
            variant="primary"
            style={styles.browseButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>좋아요 목록</Text>
      </View>

      {/* Track Count & Actions */}
      <View style={styles.actionsContainer}>
        <Text style={styles.trackCount}>{favoriteTracks.length}곡</Text>
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handlePlayAll}
            activeOpacity={0.7}
          >
            <Icon name="play" size={20} color={Colors.text} />
            <Text style={styles.actionText}>전체 재생</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleShuffle}
            activeOpacity={0.7}
          >
            <Icon name="shuffle" size={20} color={Colors.text} />
            <Text style={styles.actionText}>셔플</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Track List */}
      <FlatList
        data={favoriteTracks}
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
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
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
  headerTitle: {
    ...Typography.heading2,
    color: Colors.text,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  trackCount: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  actionText: {
    ...Typography.captionMedium,
    color: Colors.text,
  },
  listContent: {
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    ...Typography.heading3,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  browseButton: {
    minWidth: 160,
  },
});

export default FavoritesScreen;
