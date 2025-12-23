/**
 * PlaylistScreen - 플레이리스트 상세 화면
 * 히어로 배너 클릭 시 연결되는 큐레이션 페이지
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
// LinearGradient 대신 View + overlay 사용
import TrackPlayer from 'react-native-track-player';
import { RootStackParamList, Track } from '../../types';
import { Colors, Typography, Spacing } from '../../constants';
import { HomeService, ServerPlaylist } from '../../services/HomeService';
import { usePlayerStore, useFavoritesStore } from '../../stores';
import { resolveAudioFile } from '../../utils/audioAssets';
import { TrackService } from '../../services';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HEADER_HEIGHT = 280;

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type PlaylistRouteProp = RouteProp<RootStackParamList, 'Playlist'>;

const PlaylistScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<PlaylistRouteProp>();
  const { playlistId } = route.params;

  const { setTrack } = usePlayerStore();
  const { toggleFavorite, isFavorite } = useFavoritesStore();

  const [playlist, setPlaylist] = useState<ServerPlaylist | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 데이터 로드
  useEffect(() => {
    const loadPlaylist = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await HomeService.getPlaylist(playlistId);

        if (data) {
          setPlaylist(data);
          const localTracks = data.tracks.map(t => HomeService.playlistTrackToLocal(t));
          setTracks(localTracks);
        } else {
          setError('플레이리스트를 찾을 수 없습니다');
        }
      } catch (err) {
        console.error('Error loading playlist:', err);
        setError('플레이리스트를 불러오는데 실패했습니다');
      } finally {
        setIsLoading(false);
      }
    };

    loadPlaylist();
  }, [playlistId]);

  // 트랙 재생
  const playTrack = useCallback(async (track: Track, index: number) => {
    try {
      const resolvedUrl = resolveAudioFile(track.audioFile);
      await TrackPlayer.reset();

      // 현재 트랙부터 끝까지 큐에 추가
      const queue = tracks.slice(index).map(t => ({
        id: t.id,
        url: resolveAudioFile(t.audioFile) as any,
        title: t.title,
        artist: t.artist,
        artwork: t.backgroundImage,
        duration: t.duration,
      }));

      await TrackPlayer.add(queue);
      await TrackPlayer.play();
      setTrack(track);
      await TrackService.incrementPlayCount(track.id);
      navigation.navigate('Player', { trackId: track.id });
    } catch (error) {
      console.error('Error playing track:', error);
    }
  }, [tracks, setTrack, navigation]);

  // 전체 재생
  const playAll = useCallback(async () => {
    if (tracks.length > 0) {
      playTrack(tracks[0], 0);
    }
  }, [tracks, playTrack]);

  // 셔플 재생
  const shufflePlay = useCallback(async () => {
    if (tracks.length > 0) {
      const shuffled = [...tracks].sort(() => Math.random() - 0.5);
      const firstTrack = shuffled[0];

      await TrackPlayer.reset();
      const queue = shuffled.map(t => ({
        id: t.id,
        url: resolveAudioFile(t.audioFile) as any,
        title: t.title,
        artist: t.artist,
        artwork: t.backgroundImage,
        duration: t.duration,
      }));

      await TrackPlayer.add(queue);
      await TrackPlayer.play();
      setTrack(firstTrack);
      navigation.navigate('Player', { trackId: firstTrack.id });
    }
  }, [tracks, setTrack, navigation]);

  // 시간 포맷
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // 총 재생시간
  const totalDuration = tracks.reduce((sum, t) => sum + t.duration, 0);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>로딩 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !playlist) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.errorContainer}>
          <Icon name="alert-circle-outline" size={48} color={Colors.textSecondary} />
          <Text style={styles.errorText}>{error || '오류가 발생했습니다'}</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>돌아가기</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* 헤더 이미지 */}
      <View style={styles.headerContainer}>
        <Image
          source={{ uri: playlist.coverImage || 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=600' }}
          style={styles.headerImage}
        />
        <View style={styles.headerGradient} />

        {/* 뒤로가기 버튼 */}
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>

        {/* 헤더 정보 */}
        <View style={styles.headerInfo}>
          <Text style={styles.playlistName}>{playlist.name}</Text>
          {playlist.description && (
            <Text style={styles.playlistDescription}>{playlist.description}</Text>
          )}
          <Text style={styles.playlistMeta}>
            {tracks.length}곡 • {Math.floor(totalDuration / 60)}분
          </Text>
        </View>
      </View>

      {/* 재생 버튼들 */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.playAllButton} onPress={playAll}>
          <Icon name="play" size={24} color={Colors.text} />
          <Text style={styles.playAllText}>전체 재생</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.shuffleButton} onPress={shufflePlay}>
          <Icon name="shuffle" size={20} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* 트랙 목록 */}
      <ScrollView style={styles.trackList} showsVerticalScrollIndicator={false}>
        {tracks.map((track, index) => (
          <TouchableOpacity
            key={track.id}
            style={styles.trackItem}
            onPress={() => playTrack(track, index)}
          >
            <Text style={styles.trackIndex}>{index + 1}</Text>
            <Image
              source={{ uri: track.backgroundImage }}
              style={styles.trackImage}
            />
            <View style={styles.trackInfo}>
              <Text style={styles.trackTitle} numberOfLines={1}>
                {track.title}
              </Text>
              <Text style={styles.trackArtist} numberOfLines={1}>
                {track.artist}
              </Text>
            </View>
            <Text style={styles.trackDuration}>
              {formatDuration(track.duration)}
            </Text>
            <TouchableOpacity
              style={styles.favoriteButton}
              onPress={() => toggleFavorite(track.id)}
            >
              <Icon
                name={isFavorite(track.id) ? 'heart' : 'heart-outline'}
                size={20}
                color={isFavorite(track.id) ? Colors.primary : Colors.textSecondary}
              />
            </TouchableOpacity>
          </TouchableOpacity>
        ))}

        {/* 빈 트랙 안내 */}
        {tracks.length === 0 && (
          <View style={styles.emptyState}>
            <Icon name="musical-notes-outline" size={48} color={Colors.textSecondary} />
            <Text style={styles.emptyText}>아직 트랙이 없습니다</Text>
          </View>
        )}

        {/* 하단 여백 */}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  errorText: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  backButton: {
    marginTop: Spacing.lg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: 8,
  },
  backButtonText: {
    ...Typography.body,
    color: Colors.primary,
  },
  headerContainer: {
    height: HEADER_HEIGHT,
    position: 'relative',
  },
  headerImage: {
    width: SCREEN_WIDTH,
    height: HEADER_HEIGHT,
    position: 'absolute',
  },
  headerGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: HEADER_HEIGHT,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    left: Spacing.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    position: 'absolute',
    bottom: Spacing.lg,
    left: Spacing.lg,
    right: Spacing.lg,
  },
  playlistName: {
    ...Typography.heading2,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  playlistDescription: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  playlistMeta: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  playAllButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: 30,
    gap: Spacing.sm,
  },
  playAllText: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600',
  },
  shuffleButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackList: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  trackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  trackIndex: {
    ...Typography.body,
    color: Colors.textSecondary,
    width: 24,
    textAlign: 'center',
  },
  trackImage: {
    width: 48,
    height: 48,
    borderRadius: 6,
    marginLeft: Spacing.sm,
  },
  trackInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  trackTitle: {
    ...Typography.body,
    color: Colors.text,
    marginBottom: 2,
  },
  trackArtist: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  trackDuration: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginRight: Spacing.sm,
  },
  favoriteButton: {
    padding: Spacing.sm,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl * 2,
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

export default PlaylistScreen;
