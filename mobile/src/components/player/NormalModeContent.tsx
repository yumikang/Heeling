import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants';
import { CustomSlider } from './index';
import { Track } from '../../types';

type DownloadStatus = 'idle' | 'downloading' | 'completed' | 'failed';

interface NormalModeContentProps {
  track: Track;
  isPlaying: boolean;
  progress: { position: number; duration: number };
  isRepeat: boolean;
  isShuffle: boolean;
  isFavorite: boolean;
  isTimerActive: boolean;
  formatRemainingTime: () => string;
  brightness: number;
  downloadStatus: DownloadStatus | null;
  onClose: () => void;
  onPlayPause: () => void;
  onSkipPrevious: () => void;
  onSkipNext: () => void;
  onSeek: (position: number) => void;
  onTogglePlayMode: () => void;
  onFavoritePress: () => void;
  onDownloadPress: () => void;
  onBrightnessPress: () => void;
  onSleepTimerPress: () => void;
}

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const getBrightnessIcon = (brightness: number): string => {
  if (brightness <= 0.3) return 'sunny-outline';
  if (brightness <= 0.7) return 'partly-sunny-outline';
  return 'sunny';
};

const NormalModeContent: React.FC<NormalModeContentProps> = ({
  track,
  isPlaying,
  progress,
  isRepeat,
  isShuffle,
  isFavorite,
  isTimerActive,
  formatRemainingTime,
  brightness,
  downloadStatus,
  onClose,
  onPlayPause,
  onSkipPrevious,
  onSkipNext,
  onSeek,
  onTogglePlayMode,
  onFavoritePress,
  onDownloadPress,
  onBrightnessPress,
  onSleepTimerPress,
}) => {
  return (
    <SafeAreaView style={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.headerButton}>
          <Icon name="chevron-down" size={28} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Now Playing</Text>
          {isTimerActive && (
            <Text style={styles.timerText}>{formatRemainingTime()}</Text>
          )}
        </View>
        <View style={styles.headerRightButtons}>
          <TouchableOpacity
            onPress={onDownloadPress}
            style={styles.headerButton}
            disabled={downloadStatus === 'downloading'}
          >
            {downloadStatus === 'downloading' ? (
              <View style={styles.downloadingContainer}>
                <ActivityIndicator size="small" color={Colors.primary} />
              </View>
            ) : downloadStatus === 'completed' ? (
              <Icon name="checkmark-circle" size={24} color={Colors.primary} />
            ) : (
              <Icon name="download-outline" size={24} color={Colors.text} />
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={onBrightnessPress} style={styles.headerButton}>
            <Icon
              name={getBrightnessIcon(brightness)}
              size={24}
              color={brightness < 1 ? Colors.primary : Colors.text}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={onSleepTimerPress} style={styles.headerButton}>
            <Icon
              name={isTimerActive ? 'moon' : 'moon-outline'}
              size={24}
              color={isTimerActive ? Colors.primary : Colors.text}
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.spacer} />

      {/* Track Info */}
      <View style={styles.trackInfo}>
        {track.tags && track.tags.length > 0 && (
          <View style={styles.tags}>
            {track.tags.slice(0, 3).map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
        <Text style={styles.title}>{track.title}</Text>
        <Text style={styles.artist}>{track.artist}</Text>
      </View>

      {/* Progress */}
      <View style={styles.progressContainer}>
        <CustomSlider
          min={0}
          max={progress.duration || 100}
          value={progress.position}
          onSlidingComplete={onSeek}
          trackHeight={4}
          thumbSize={14}
        />
        <View style={styles.timeContainer}>
          <Text style={styles.timeText}>{formatTime(progress.position)}</Text>
          <Text style={styles.timeText}>{formatTime(progress.duration)}</Text>
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity onPress={onTogglePlayMode} style={styles.sideButton}>
          <Icon
            name={isShuffle ? 'shuffle' : 'repeat'}
            size={22}
            color={isRepeat || isShuffle ? Colors.primary : Colors.textSecondary}
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={onSkipPrevious} style={styles.skipButton}>
          <Icon name="play-skip-back-outline" size={28} color={Colors.text} />
        </TouchableOpacity>

        <TouchableOpacity onPress={onPlayPause} style={styles.playButton}>
          <Icon
            name={isPlaying ? 'pause' : 'play'}
            size={36}
            color={Colors.text}
            style={!isPlaying ? { marginLeft: 4 } : undefined}
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={onSkipNext} style={styles.skipButton}>
          <Icon name="play-skip-forward-outline" size={28} color={Colors.text} />
        </TouchableOpacity>

        <TouchableOpacity onPress={onFavoritePress} style={styles.sideButton}>
          <Icon
            name={isFavorite ? 'heart' : 'heart-outline'}
            size={22}
            color={isFavorite ? Colors.error : Colors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      <Text style={styles.hint}>더블 탭으로 몰입 모드 전환</Text>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
  },
  headerButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  downloadingContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    ...Typography.captionMedium,
    color: Colors.textSecondary,
  },
  timerText: {
    ...Typography.small,
    color: Colors.primary,
    marginTop: 2,
  },
  spacer: {
    flex: 1,
  },
  trackInfo: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  tags: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  tag: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  tagText: {
    ...Typography.small,
    color: Colors.text,
  },
  title: {
    ...Typography.heading2,
    color: Colors.text,
    textAlign: 'center',
  },
  artist: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  progressContainer: {
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.sm,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  timeText: {
    ...Typography.small,
    color: Colors.textSecondary,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sideButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: Colors.primary,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: {
    ...Typography.small,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
});

export default NormalModeContent;
