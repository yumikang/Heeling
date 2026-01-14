import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants';
import { SettingItemWithSwitch } from './SettingItem';

interface NotificationSectionProps {
  pushEnabled: boolean;
  marketingEnabled: boolean;
  reminderEnabled: boolean;
  nightModeEnabled: boolean;
  onPushEnabledChange: (value: boolean) => void;
  onMarketingEnabledChange: (value: boolean) => void;
  onReminderEnabledChange: (value: boolean) => void;
  onNightModeEnabledChange: (value: boolean) => void;
}

export default function NotificationSection({
  pushEnabled,
  marketingEnabled,
  reminderEnabled,
  nightModeEnabled,
  onPushEnabledChange,
  onMarketingEnabledChange,
  onReminderEnabledChange,
  onNightModeEnabledChange,
}: NotificationSectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>알림 설정</Text>
      <View style={styles.sectionContent}>
        <SettingItemWithSwitch
          icon="notifications-outline"
          title="푸시 알림"
          value={pushEnabled}
          onValueChange={onPushEnabledChange}
        />
        <SettingItemWithSwitch
          icon="megaphone-outline"
          title="마케팅 알림"
          value={marketingEnabled}
          onValueChange={onMarketingEnabledChange}
        />
        <SettingItemWithSwitch
          icon="alarm-outline"
          title="리마인더 알림"
          value={reminderEnabled}
          onValueChange={onReminderEnabledChange}
        />
        <SettingItemWithSwitch
          icon="moon-outline"
          title="야간 방해 금지 (22:00 - 07:00)"
          value={nightModeEnabled}
          onValueChange={onNightModeEnabledChange}
        />
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
});
