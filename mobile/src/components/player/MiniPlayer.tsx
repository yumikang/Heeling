import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import { usePlayer } from '../../hooks';
import { RootStackParamList } from '../../types';
import { Colors, Typography, Spacing } from '../../constants';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const MiniPlayer: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const {
    currentTrack,
    isPlaying,
    progress,
    togglePlayPause,
    skipToNext,
    skipToPrevious,
  } = usePlayer();

  // Don't render if no track
  if (!currentTrack) return null;

  const progressPercent = progress.duration > 0
    ? (progress.position / progress.duration) * 100
    : 0;

  const handlePress = () => {
    navigation.navigate('Player', { trackId: currentTrack.id });
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.95}
    >
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { width: `${progressPercent}%` }]} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Thumbnail */}
        <Image
          source={{ uri: currentTrack.backgroundImage }}
          style={styles.thumbnail}
          {...(Platform.OS === 'ios' && { defaultSource: require('../../../assets/images/placeholder.png') })}
        />

        {/* Track Info */}
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>
            {currentTrack.title}
          </Text>
          <Text style={styles.artist} numberOfLines={1}>
            {currentTrack.artist}
          </Text>
        </View>

        {/* Control Buttons */}
        <View style={styles.controls}>
          {/* Previous Button */}
          <TouchableOpacity
            style={styles.controlButton}
            onPress={skipToPrevious}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon
              name="play-skip-back"
              size={22}
              color={Colors.text}
            />
          </TouchableOpacity>

          {/* Play/Pause Button */}
          <TouchableOpacity
            style={styles.playButton}
            onPress={togglePlayPause}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon
              name={isPlaying ? 'pause' : 'play'}
              size={28}
              color={Colors.text}
            />
          </TouchableOpacity>

          {/* Next Button */}
          <TouchableOpacity
            style={styles.controlButton}
            onPress={skipToNext}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon
              name="play-skip-forward"
              size={22}
              color={Colors.text}
            />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 85, // Above tab bar
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: 'rgba(10, 26, 21, 0.95)',
    borderTopWidth: 0.5,
    borderTopColor: Colors.border,
  },
  progressContainer: {
    height: 2,
    backgroundColor: Colors.surface,
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
  },
  thumbnail: {
    width: 44,
    height: 44,
    borderRadius: 6,
    backgroundColor: Colors.surface,
  },
  info: {
    flex: 1,
    marginLeft: Spacing.sm,
    marginRight: Spacing.sm,
  },
  title: {
    ...Typography.bodyMedium,
    color: Colors.text,
  },
  artist: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default MiniPlayer;
