import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors, Typography, Spacing, BorderRadius, BRIGHTNESS_PRESETS } from '../../constants';
import { CustomSlider } from './index';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface BrightnessModalProps {
  visible: boolean;
  brightness: number;
  onBrightnessChange: (value: number) => void;
  onClose: () => void;
}

const PRESETS = [
  { key: 'sleep', icon: 'bed', label: '수면', value: BRIGHTNESS_PRESETS.sleep },
  { key: 'meditation', icon: 'leaf', label: '명상', value: BRIGHTNESS_PRESETS.meditation },
  { key: 'relax', icon: 'cafe', label: '휴식', value: BRIGHTNESS_PRESETS.relax },
  { key: 'normal', icon: 'sunny', label: '일반', value: BRIGHTNESS_PRESETS.normal },
] as const;

const BrightnessModal: React.FC<BrightnessModalProps> = ({
  visible,
  brightness,
  onBrightnessChange,
  onClose,
}) => {
  if (!visible) return null;

  return (
    <TouchableOpacity
      style={styles.modalOverlay}
      activeOpacity={1}
      onPress={onClose}
    >
      <Pressable style={styles.brightnessModalContent} onPress={(e) => e.stopPropagation()}>
        <Text style={styles.modalTitle}>화면 밝기</Text>

        <View style={styles.brightnessSliderContainer}>
          <Icon name="moon" size={20} color={Colors.textSecondary} />
          <View style={styles.brightnessSliderWrapper}>
            <CustomSlider
              min={0.05}
              max={1}
              value={brightness}
              onSlidingComplete={onBrightnessChange}
              trackHeight={6}
              thumbSize={20}
            />
          </View>
          <Icon name="sunny" size={20} color={Colors.primary} />
        </View>

        <Text style={styles.brightnessValue}>{Math.round(brightness * 100)}%</Text>

        <View style={styles.brightnessPresets}>
          {PRESETS.map((preset) => (
            <TouchableOpacity
              key={preset.key}
              style={[
                styles.presetButton,
                brightness === preset.value && styles.presetButtonActive,
              ]}
              onPress={() => onBrightnessChange(preset.value)}
            >
              <Icon
                name={preset.icon}
                size={18}
                color={brightness === preset.value ? Colors.background : Colors.text}
              />
              <Text
                style={[
                  styles.presetText,
                  brightness === preset.value && styles.presetTextActive,
                ]}
              >
                {preset.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Pressable>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  brightnessModalContent: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    width: SCREEN_WIDTH - 60,
  },
  modalTitle: {
    ...Typography.heading3,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  brightnessSliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  brightnessSliderWrapper: {
    flex: 1,
  },
  brightnessValue: {
    ...Typography.bodyMedium,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  brightnessPresets: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  presetButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xs,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    gap: Spacing.xs,
  },
  presetButtonActive: {
    backgroundColor: Colors.primary,
  },
  presetText: {
    ...Typography.small,
    color: Colors.text,
  },
  presetTextActive: {
    color: Colors.background,
    fontWeight: '600',
  },
});

export default BrightnessModal;
