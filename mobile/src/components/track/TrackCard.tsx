import React, { memo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  Platform,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Track } from '../../types';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants';
import { DownloadStatus } from '../../services';

type TrackCardVariant = 'horizontal' | 'vertical' | 'list';

interface TrackCardProps {
  track: Track;
  onPress: () => void;
  onFavoritePress?: () => void;
  onDownloadPress?: () => void;
  variant?: TrackCardVariant;
  showFavorite?: boolean;
  isFavorite?: boolean;
  // 오프라인 모드 관련
  isOfflineMode?: boolean;
  isDownloaded?: boolean;
  downloadStatus?: DownloadStatus;
  downloadProgress?: number;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HORIZONTAL_CARD_SIZE = 160;
export const TRACK_CARD_HEIGHT = 72; // For FlatList getItemLayout

// Format duration from seconds to mm:ss
const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const TrackCard: React.FC<TrackCardProps> = ({
  track,
  onPress,
  onFavoritePress,
  onDownloadPress,
  variant = 'horizontal',
  showFavorite = true,
  isFavorite = false,
  isOfflineMode = false,
  isDownloaded = false,
  downloadStatus = 'pending',
  downloadProgress = 0,
}) => {
  const isHorizontal = variant === 'horizontal';

  // 오프라인 모드에서 다운로드 버튼 표시 여부
  const showDownloadButton = isOfflineMode && !isDownloaded;

  if (isHorizontal) {
    return (
      <TouchableOpacity
        style={styles.horizontalContainer}
        onPress={showDownloadButton ? onDownloadPress : onPress}
        activeOpacity={0.8}
      >
        <View style={styles.horizontalImageContainer}>
          <Image
            source={{ uri: track.backgroundImage }}
            style={styles.horizontalImage}
            {...(Platform.OS === 'ios' && { defaultSource: require('../../../assets/images/placeholder.png') })}
          />
          {/* 오프라인 모드: 다운로드 오버레이 */}
          {showDownloadButton && (
            <View style={styles.downloadOverlay}>
              {downloadStatus === 'downloading' ? (
                <View style={styles.downloadProgressContainer}>
                  <ActivityIndicator size="small" color={Colors.text} />
                  <Text style={styles.downloadProgressText}>
                    {Math.round(downloadProgress * 100)}%
                  </Text>
                </View>
              ) : (
                <View style={styles.downloadIconContainer}>
                  <Icon name="download-outline" size={32} color={Colors.text} />
                  <Text style={styles.downloadText}>다운로드</Text>
                </View>
              )}
            </View>
          )}
          {!track.isFree && (
            <View style={styles.lockBadge}>
              <Icon name="lock-closed" size={12} color={Colors.text} />
            </View>
          )}
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>
              {formatDuration(track.duration)}
            </Text>
          </View>
        </View>
        <Text style={styles.horizontalTitle} numberOfLines={1}>
          {track.title}
        </Text>
        <Text style={styles.horizontalArtist} numberOfLines={1}>
          {track.artist}
        </Text>
      </TouchableOpacity>
    );
  }

  // Vertical variant
  return (
    <TouchableOpacity
      style={styles.verticalContainer}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.verticalImageContainer}>
        <Image
          source={{ uri: track.backgroundImage }}
          style={styles.verticalImage}
          {...(Platform.OS === 'ios' && { defaultSource: require('../../../assets/images/placeholder.png') })}
        />
        {/* 오프라인 모드: 다운로드 오버레이 (vertical) */}
        {showDownloadButton && (
          <TouchableOpacity
            style={styles.verticalDownloadOverlay}
            onPress={onDownloadPress}
            activeOpacity={0.8}
          >
            {downloadStatus === 'downloading' ? (
              <ActivityIndicator size="small" color={Colors.text} />
            ) : (
              <Icon name="download-outline" size={24} color={Colors.text} />
            )}
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.verticalContent}>
        <View style={styles.verticalInfo}>
          <Text style={styles.verticalTitle} numberOfLines={1}>
            {track.title}
          </Text>
          <Text style={styles.verticalArtist} numberOfLines={1}>
            {track.artist}
          </Text>
        </View>
        <View style={styles.verticalMeta}>
          <Text style={styles.verticalDuration}>
            {formatDuration(track.duration)}
          </Text>
          {!track.isFree && (
            <Icon name="lock-closed" size={14} color={Colors.textSecondary} />
          )}
          {/* 오프라인 모드: 다운로드 버튼 (vertical meta) */}
          {showDownloadButton ? (
            <TouchableOpacity
              onPress={onDownloadPress}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              {downloadStatus === 'downloading' ? (
                <View style={styles.downloadingIndicator}>
                  <ActivityIndicator size="small" color={Colors.primary} />
                  <Text style={styles.downloadingPercentText}>
                    {Math.round(downloadProgress * 100)}%
                  </Text>
                </View>
              ) : (
                <Icon name="download-outline" size={22} color={Colors.primary} />
              )}
            </TouchableOpacity>
          ) : showFavorite ? (
            <TouchableOpacity
              onPress={onFavoritePress}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Icon
                name={isFavorite ? 'heart' : 'heart-outline'}
                size={22}
                color={isFavorite ? Colors.error : Colors.textSecondary}
              />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Horizontal Card
  horizontalContainer: {
    width: HORIZONTAL_CARD_SIZE,
    marginRight: Spacing.md,
  },
  horizontalImageContainer: {
    width: HORIZONTAL_CARD_SIZE,
    height: HORIZONTAL_CARD_SIZE,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  horizontalImage: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.surface,
  },
  lockBadge: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: BorderRadius.full,
    padding: 4,
  },
  durationBadge: {
    position: 'absolute',
    bottom: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: BorderRadius.xs,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
  },
  durationText: {
    ...Typography.small,
    color: Colors.text,
  },
  horizontalTitle: {
    ...Typography.bodyMedium,
    color: Colors.text,
  },
  horizontalArtist: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },

  // Vertical Card
  verticalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  verticalImage: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.surface,
  },
  verticalContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: Spacing.md,
  },
  verticalInfo: {
    flex: 1,
  },
  verticalTitle: {
    ...Typography.bodyMedium,
    color: Colors.text,
  },
  verticalArtist: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  verticalMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  verticalDuration: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  // 오프라인 모드 다운로드 오버레이 스타일
  downloadOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
  },
  downloadIconContainer: {
    alignItems: 'center',
  },
  downloadText: {
    ...Typography.small,
    color: Colors.text,
    marginTop: Spacing.xs,
  },
  downloadProgressContainer: {
    alignItems: 'center',
  },
  downloadProgressText: {
    ...Typography.small,
    color: Colors.text,
    marginTop: Spacing.xs,
  },
  verticalImageContainer: {
    width: 56,
    height: 56,
    position: 'relative',
  },
  verticalDownloadOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.sm,
  },
  downloadingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  downloadingPercentText: {
    ...Typography.small,
    color: Colors.primary,
  },
});

// React.memo로 불필요한 리렌더링 방지
// props가 변경되지 않으면 리렌더링하지 않음
export default memo(TrackCard, (prevProps, nextProps) => {
  // Custom comparison for performance
  return (
    prevProps.track.id === nextProps.track.id &&
    prevProps.isFavorite === nextProps.isFavorite &&
    prevProps.isDownloaded === nextProps.isDownloaded &&
    prevProps.downloadStatus === nextProps.downloadStatus &&
    prevProps.downloadProgress === nextProps.downloadProgress &&
    prevProps.isOfflineMode === nextProps.isOfflineMode &&
    prevProps.variant === nextProps.variant
  );
});
