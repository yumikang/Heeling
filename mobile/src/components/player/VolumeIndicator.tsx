import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors, Spacing, BorderRadius } from '../../constants';

const VOLUME_SLIDER_HEIGHT = 150;

interface VolumeIndicatorProps {
  visible: boolean;
  volume: number;
  volumeOpacity: { value: number };
}

const VolumeIndicator: React.FC<VolumeIndicatorProps> = ({
  visible,
  volume,
  volumeOpacity,
}) => {
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: volumeOpacity.value,
  }));

  if (!visible) return null;

  return (
    <Animated.View style={[styles.verticalVolumeContainer, animatedStyle]}>
      <Icon name="volume-high" size={18} color={Colors.text} />
      <View style={styles.verticalVolumeTrack}>
        <View style={[styles.verticalVolumeFill, { height: `${volume * 100}%` }]} />
      </View>
      <Icon name="volume-low" size={18} color={Colors.textSecondary} />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  verticalVolumeContainer: {
    position: 'absolute',
    right: 20,
    top: '50%',
    marginTop: -VOLUME_SLIDER_HEIGHT / 2 - 20,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    gap: Spacing.sm,
  },
  verticalVolumeTrack: {
    width: 4,
    height: VOLUME_SLIDER_HEIGHT,
    backgroundColor: Colors.surface,
    borderRadius: 2,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  verticalVolumeFill: {
    width: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
});

export default VolumeIndicator;
