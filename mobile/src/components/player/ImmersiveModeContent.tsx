import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Typography, Spacing } from '../../constants';

interface ImmersiveModeContentProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  onSkipPrevious: () => void;
  onSkipNext: () => void;
}

const ImmersiveModeContent: React.FC<ImmersiveModeContentProps> = ({
  isPlaying,
  onPlayPause,
  onSkipPrevious,
  onSkipNext,
}) => {
  return (
    <View style={styles.immersiveContent}>
      <View style={styles.controlsImmersive}>
        <TouchableOpacity onPress={onSkipPrevious} style={styles.skipButtonImmersive}>
          <Icon name="play-skip-back" size={44} color="rgba(255, 255, 255, 0.7)" />
        </TouchableOpacity>

        <TouchableOpacity onPress={onPlayPause} style={styles.playButtonImmersive}>
          <Icon
            name={isPlaying ? 'pause' : 'play'}
            size={56}
            color="rgba(255, 255, 255, 0.85)"
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={onSkipNext} style={styles.skipButtonImmersive}>
          <Icon name="play-skip-forward" size={44} color="rgba(255, 255, 255, 0.7)" />
        </TouchableOpacity>
      </View>

      <Text style={styles.immersiveHint}>더블 탭으로 시계 모드</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  immersiveContent: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlsImmersive: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xl,
  },
  skipButtonImmersive: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButtonImmersive: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  immersiveHint: {
    ...Typography.small,
    color: 'rgba(255, 255, 255, 0.4)',
    textAlign: 'center',
    marginTop: Spacing.xl * 2,
  },
});

export default ImmersiveModeContent;
