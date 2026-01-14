import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, APP_VERSION } from '../../constants';
import SettingItem from './SettingItem';

interface AppInfoSectionProps {
  onTermsPress: () => void;
  onPrivacyPress: () => void;
}

export default function AppInfoSection({
  onTermsPress,
  onPrivacyPress,
}: AppInfoSectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>앱 정보</Text>
      <View style={styles.sectionContent}>
        <SettingItem
          icon="information-circle-outline"
          title={`버전 ${APP_VERSION}`}
        />
        <SettingItem
          icon="document-text-outline"
          title="이용약관"
          onPress={onTermsPress}
        />
        <SettingItem
          icon="shield-checkmark-outline"
          title="개인정보처리방침"
          onPress={onPrivacyPress}
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
