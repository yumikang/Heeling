/**
 * SectionRenderer - 홈 화면 섹션 렌더러
 * 섹션 타입에 따라 적절한 컴포넌트를 렌더링
 */

import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  FlatList,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors, Typography, Spacing } from '../../constants';
import { Track } from '../../types';
import {
  HomeSection,
  HeroBannerSection,
  TrackCarouselSection,
  IconMenuSection,
  BannerSection,
  TrackListSection,
  FeaturedTrackSection,
  RecentlyPlayedSection,
  SpacerSection,
  HeroBannerItem,
} from '../../types/home';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SectionRendererProps {
  section: HomeSection;
  onTrackPress: (track: Track) => void;
  onFavoritePress: (trackId: string) => void;
  onDownloadPress: (track: Track) => void;
  isFavorite: (trackId: string) => boolean;
  onBannerPress?: (action: { type: string; target: string }) => void;
  onIconPress?: (action: { type: string; target: string }) => void;
  recentTracks?: Track[];
  isOfflineMode?: boolean;
  isDownloaded?: (trackId: string) => boolean;
  getDownloadStatus?: (trackId: string) => string | null;
  getDownloadProgress?: (trackId: string) => number;
}

export const SectionRenderer: React.FC<SectionRendererProps> = ({
  section,
  onTrackPress,
  onFavoritePress,
  onDownloadPress,
  isFavorite,
  onBannerPress,
  onIconPress,
  recentTracks = [],
  isOfflineMode = false,
  isDownloaded = () => false,
  getDownloadStatus,
  getDownloadProgress,
}) => {
  switch (section.type) {
    case 'hero_banner':
      return (
        <HeroBanner
          section={section as HeroBannerSection}
          onBannerPress={onBannerPress}
        />
      );
    case 'track_carousel':
      return (
        <TrackCarousel
          section={section as TrackCarouselSection}
          onTrackPress={onTrackPress}
          onFavoritePress={onFavoritePress}
          onDownloadPress={onDownloadPress}
          isFavorite={isFavorite}
          isDownloaded={isDownloaded}
        />
      );
    case 'icon_menu':
      return (
        <IconMenu
          section={section as IconMenuSection}
          onIconPress={onIconPress}
        />
      );
    case 'banner':
      return (
        <Banner
          section={section as BannerSection}
          onBannerPress={onBannerPress}
        />
      );
    case 'track_list':
      return (
        <TrackList
          section={section as TrackListSection}
          onTrackPress={onTrackPress}
          onFavoritePress={onFavoritePress}
          isFavorite={isFavorite}
        />
      );
    case 'featured_track':
      return (
        <FeaturedTrack
          section={section as FeaturedTrackSection}
          onTrackPress={onTrackPress}
        />
      );
    case 'recently_played':
      return (
        <RecentlyPlayed
          section={section as RecentlyPlayedSection}
          tracks={recentTracks}
          onTrackPress={onTrackPress}
        />
      );
    case 'spacer':
      return <Spacer section={section as SpacerSection} />;
    default:
      return null;
  }
};

// Hero Banner Component
const HeroBanner: React.FC<{
  section: HeroBannerSection;
  onBannerPress?: (action: { type: string; target: string }) => void;
}> = ({ section, onBannerPress }) => {
  const { banners, autoScrollInterval, showPagination } = section.data;
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (banners.length <= 1 || autoScrollInterval <= 0) return;

    const timer = setInterval(() => {
      const nextIndex = (currentIndex + 1) % banners.length;
      scrollViewRef.current?.scrollTo({
        x: nextIndex * SCREEN_WIDTH,
        animated: true,
      });
      setCurrentIndex(nextIndex);
    }, autoScrollInterval);

    return () => clearInterval(timer);
  }, [currentIndex, banners.length, autoScrollInterval]);

  return (
    <View style={styles.heroBannerContainer}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
          setCurrentIndex(index);
        }}
      >
        {banners.map((banner) => (
          <TouchableOpacity
            key={banner.id}
            style={[styles.heroBannerItem, { backgroundColor: banner.backgroundColor || Colors.primary }]}
            onPress={() => banner.action && onBannerPress?.(banner.action)}
            activeOpacity={0.9}
          >
            {banner.imageUrl && (
              <Image
                source={typeof banner.imageUrl === 'number' ? banner.imageUrl : { uri: banner.imageUrl }}
                style={styles.heroBannerImage}
                resizeMode="cover"
              />
            )}
            {(banner.title || banner.subtitle) && (
              <View style={styles.heroBannerOverlay}>
                {banner.title && <Text style={styles.heroBannerTitle}>{banner.title}</Text>}
                {banner.subtitle && (
                  <Text style={styles.heroBannerSubtitle}>{banner.subtitle}</Text>
                )}
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
      {showPagination && banners.length > 1 && (
        <View style={styles.pagination}>
          {banners.map((_, index) => (
            <View
              key={index}
              style={[styles.paginationDot, currentIndex === index && styles.paginationDotActive]}
            />
          ))}
        </View>
      )}
    </View>
  );
};

// Track Carousel Component
const TrackCarousel: React.FC<{
  section: TrackCarouselSection;
  onTrackPress: (track: Track) => void;
  onFavoritePress: (trackId: string) => void;
  onDownloadPress: (track: Track) => void;
  isFavorite: (trackId: string) => boolean;
  isDownloaded: (trackId: string) => boolean;
}> = ({ section, onTrackPress, onFavoritePress, onDownloadPress, isFavorite, isDownloaded }) => {
  const { tracks, cardStyle } = section.data;
  const cardWidth = cardStyle === 'small' ? 120 : cardStyle === 'medium' ? 150 : 180;

  if (tracks.length === 0) return null;

  return (
    <View style={styles.sectionContainer}>
      {section.title && (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
        </View>
      )}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carouselContent}>
        {tracks.map((track) => (
          <TouchableOpacity
            key={track.id}
            style={[styles.trackCard, { width: cardWidth }]}
            onPress={() => onTrackPress(track)}
          >
            <Image
              source={{ uri: track.backgroundImage || 'https://via.placeholder.com/150' }}
              style={[styles.trackImage, { width: cardWidth, height: cardWidth }]}
            />
            <Text style={styles.trackTitle} numberOfLines={1}>{track.title}</Text>
            {section.data.showArtist && track.artist && (
              <Text style={styles.trackArtist} numberOfLines={1}>{track.artist}</Text>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

// Icon Menu Component
const IconMenu: React.FC<{
  section: IconMenuSection;
  onIconPress?: (action: { type: string; target: string }) => void;
}> = ({ section, onIconPress }) => {
  const { items, columns } = section.data;
  const itemWidth = (SCREEN_WIDTH - Spacing.lg * 2) / columns;

  return (
    <View style={styles.iconMenuContainer}>
      <View style={styles.iconMenuGrid}>
        {items.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.iconMenuItem, { width: itemWidth }]}
            onPress={() => onIconPress?.(item.action)}
          >
            <View style={[styles.iconCircle, { backgroundColor: item.color + '20' }]}>
              <Icon name={item.icon} size={24} color={item.color} />
            </View>
            <Text style={styles.iconLabel} numberOfLines={1}>{item.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

// Banner Component
const Banner: React.FC<{
  section: BannerSection;
  onBannerPress?: (action: { type: string; target: string }) => void;
}> = ({ section, onBannerPress }) => {
  const { data } = section;
  const height = data.height === 'small' ? 80 : data.height === 'medium' ? 120 : 160;

  return (
    <TouchableOpacity
      style={[styles.bannerContainer, { height, backgroundColor: data.backgroundColor || Colors.surface }]}
      onPress={() => data.action && onBannerPress?.(data.action)}
    >
      {data.imageUrl && (
        <Image source={{ uri: data.imageUrl }} style={styles.bannerImage} resizeMode="cover" />
      )}
      <View style={styles.bannerContent}>
        {data.title && <Text style={styles.bannerTitle}>{data.title}</Text>}
        {data.subtitle && <Text style={styles.bannerSubtitle}>{data.subtitle}</Text>}
        {data.buttonText && (
          <View style={styles.bannerButton}>
            <Text style={styles.bannerButtonText}>{data.buttonText}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

// Track List Component
const TrackList: React.FC<{
  section: TrackListSection;
  onTrackPress: (track: Track) => void;
  onFavoritePress: (trackId: string) => void;
  isFavorite: (trackId: string) => boolean;
}> = ({ section, onTrackPress, onFavoritePress, isFavorite }) => {
  const { tracks, maxItems, showIndex, showDuration } = section.data;
  const displayTracks = tracks.slice(0, maxItems);

  if (displayTracks.length === 0) return null;

  return (
    <View style={styles.sectionContainer}>
      {section.title && (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          {section.subtitle && <Text style={styles.sectionSubtitle}>{section.subtitle}</Text>}
        </View>
      )}
      {displayTracks.map((track, index) => (
        <TouchableOpacity
          key={track.id}
          style={styles.trackListItem}
          onPress={() => onTrackPress(track)}
        >
          {showIndex && <Text style={styles.trackIndex}>{index + 1}</Text>}
          <Image
            source={{ uri: track.backgroundImage || 'https://via.placeholder.com/50' }}
            style={styles.trackListImage}
          />
          <View style={styles.trackListInfo}>
            <Text style={styles.trackListTitle} numberOfLines={1}>{track.title}</Text>
            <Text style={styles.trackListArtist} numberOfLines={1}>{track.artist}</Text>
          </View>
          {showDuration && track.duration && (
            <Text style={styles.trackDuration}>{formatDuration(track.duration)}</Text>
          )}
          <TouchableOpacity onPress={() => onFavoritePress(track.id)}>
            <Icon
              name={isFavorite(track.id) ? 'heart' : 'heart-outline'}
              size={20}
              color={isFavorite(track.id) ? Colors.primary : Colors.textSecondary}
            />
          </TouchableOpacity>
        </TouchableOpacity>
      ))}
    </View>
  );
};

// Featured Track Component
const FeaturedTrack: React.FC<{
  section: FeaturedTrackSection;
  onTrackPress: (track: Track) => void;
}> = ({ section, onTrackPress }) => {
  const { track, description, badge } = section.data;
  if (!track) return null;

  return (
    <View style={styles.sectionContainer}>
      {section.title && (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
        </View>
      )}
      <TouchableOpacity style={styles.featuredCard} onPress={() => onTrackPress(track)}>
        <Image
          source={{ uri: track.backgroundImage || 'https://via.placeholder.com/300' }}
          style={styles.featuredImage}
        />
        {badge && (
          <View style={styles.featuredBadge}>
            <Text style={styles.featuredBadgeText}>{badge}</Text>
          </View>
        )}
        <View style={styles.featuredInfo}>
          <Text style={styles.featuredTitle}>{track.title}</Text>
          <Text style={styles.featuredArtist}>{track.artist}</Text>
          {description && <Text style={styles.featuredDescription}>{description}</Text>}
        </View>
      </TouchableOpacity>
    </View>
  );
};

// Recently Played Component
const RecentlyPlayed: React.FC<{
  section: RecentlyPlayedSection;
  tracks: Track[];
  onTrackPress: (track: Track) => void;
}> = ({ section, tracks, onTrackPress }) => {
  const { maxItems, cardStyle } = section.data;
  const displayTracks = tracks.slice(0, maxItems);
  const cardWidth = cardStyle === 'small' ? 100 : 130;

  if (displayTracks.length === 0) return null;

  return (
    <View style={styles.sectionContainer}>
      {section.title && (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
        </View>
      )}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carouselContent}>
        {displayTracks.map((track) => (
          <TouchableOpacity
            key={track.id}
            style={[styles.trackCard, { width: cardWidth }]}
            onPress={() => onTrackPress(track)}
          >
            <Image
              source={{ uri: track.backgroundImage || 'https://via.placeholder.com/100' }}
              style={[styles.trackImage, { width: cardWidth, height: cardWidth }]}
            />
            <Text style={styles.trackTitle} numberOfLines={1}>{track.title}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

// Spacer Component
const Spacer: React.FC<{ section: SpacerSection }> = ({ section }) => (
  <View style={{ height: section.data.height }} />
);

// Helper function
const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const styles = StyleSheet.create({
  // Hero Banner
  heroBannerContainer: {
    marginBottom: Spacing.lg,
  },
  heroBannerItem: {
    width: SCREEN_WIDTH,
    height: 200,
    justifyContent: 'flex-end',
  },
  heroBannerImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  heroBannerOverlay: {
    padding: Spacing.lg,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  heroBannerTitle: {
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 30,
    color: Colors.text,
  },
  heroBannerSubtitle: {
    ...Typography.body,
    color: Colors.text,
    marginTop: Spacing.xs,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.sm,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.textSecondary,
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: Colors.primary,
  },

  // Section Container
  sectionContainer: {
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
    color: Colors.text,
  },
  sectionSubtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },

  // Track Carousel
  carouselContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  trackCard: {
    marginRight: Spacing.md,
  },
  trackImage: {
    borderRadius: 8,
    backgroundColor: Colors.surface,
  },
  trackTitle: {
    ...Typography.bodySmall,
    color: Colors.text,
    marginTop: Spacing.xs,
  },
  trackArtist: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },

  // Icon Menu
  iconMenuContainer: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  iconMenuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  iconMenuItem: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconLabel: {
    ...Typography.caption,
    color: Colors.text,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },

  // Banner
  bannerContainer: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    borderRadius: 12,
    overflow: 'hidden',
  },
  bannerImage: {
    ...StyleSheet.absoluteFillObject,
  },
  bannerContent: {
    flex: 1,
    padding: Spacing.md,
    justifyContent: 'center',
  },
  bannerTitle: {
    ...Typography.h3,
    color: Colors.text,
  },
  bannerSubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  bannerButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginTop: Spacing.sm,
  },
  bannerButtonText: {
    ...Typography.bodySmall,
    color: Colors.background,
    fontWeight: '600',
  },

  // Track List
  trackListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  trackIndex: {
    ...Typography.body,
    color: Colors.textSecondary,
    width: 24,
  },
  trackListImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: Spacing.md,
  },
  trackListInfo: {
    flex: 1,
  },
  trackListTitle: {
    ...Typography.body,
    color: Colors.text,
  },
  trackListArtist: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  trackDuration: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginRight: Spacing.md,
  },

  // Featured Track
  featuredCard: {
    marginHorizontal: Spacing.lg,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
  },
  featuredImage: {
    width: '100%',
    height: 200,
  },
  featuredBadge: {
    position: 'absolute',
    top: Spacing.md,
    left: Spacing.md,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 12,
  },
  featuredBadgeText: {
    ...Typography.caption,
    color: Colors.background,
    fontWeight: '600',
  },
  featuredInfo: {
    padding: Spacing.md,
  },
  featuredTitle: {
    ...Typography.h3,
    color: Colors.text,
  },
  featuredArtist: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  featuredDescription: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
});

export default SectionRenderer;
