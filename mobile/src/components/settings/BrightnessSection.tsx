import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants';
import { CustomSlider } from '../../components';
import { SettingItemWithSwitch } from './SettingItem';

interface BrightnessSectionProps {
  defaultBrightness: number;
  autoBrightnessEnabled: boolean;
  onDefaultBrightnessChange: (value: number) => void;
  onAutoBrightnessChange: (value: boolean) => void;
}

export default function BrightnessSection({
  defaultBrightness,
  autoBrightnessEnabled,
  onDefaultBrightnessChange,
  onAutoBrightnessChange,
}: BrightnessSectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>화면 밝기</Text>
      <View style={styles.sectionContent}>
        <SettingItemWithSwitch
          icon="color-wand-outline"
          title="자동 밝기 (카테고리/무드별)"
          value={autoBrightnessEnabled}
          onValueChange={onAutoBrightnessChange}
        />

        <View style={styles.settingGroup}>
          <View style={styles.settingGroupHeader}>
            <Icon name="sunny-outline" size={20} color={Colors.textSecondary} />
            <Text style={styles.settingGroupTitle}>기본 밝기</Text>
            <Text style={styles.brightnessPercent}>{Math.round(defaultBrightness * 100)}%</Text>
          </View>
          <View style={styles.brightnessSliderRow}>
            <Icon name="moon" size={18} color={Colors.textSecondary} />
            <View style={styles.brightnessSliderContainer}>
              <CustomSlider
                min={0.05}
                max={1}
                value={defaultBrightness}
                onSlidingComplete={onDefaultBrightnessChange}
                trackHeight={4}
                thumbSize={18}
              />
            </View>
            <Icon name="sunny" size={18} color={Colors.primary} />
          </View>
          <Text style={styles.brightnessHint}>
            {autoBrightnessEnabled
              ? '자동 밝기가 없는 콘텐츠에 적용됩니다'
              : '모든 재생 화면에 적용됩니다'}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.captionMedium,
    color: Colors.textSecondary,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
  },
  sectionContent: {
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  settingGroup: {
    padding: Spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  settingGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  settingGroupTitle: {
    ...Typography.bodyMedium,
    color: Colors.text,
  },
  brightnessPercent: {
    ...Typography.caption,
    color: Colors.primary,
    marginLeft: 'auto',
  },
  brightnessSliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  brightnessSliderContainer: {
    flex: 1,
  },
  brightnessHint: {
    ...Typography.small,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});
