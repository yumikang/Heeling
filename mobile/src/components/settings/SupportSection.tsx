import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants';
import SettingItem from './SettingItem';

interface SupportSectionProps {
  onFAQPress: () => void;
  onContactPress: () => void;
}

export default function SupportSection({
  onFAQPress,
  onContactPress,
}: SupportSectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>고객 지원</Text>
      <View style={styles.sectionContent}>
        <SettingItem
          icon="help-circle-outline"
          title="자주 묻는 질문"
          onPress={onFAQPress}
        />
        <SettingItem
          icon="chatbubble-outline"
          title="문의하기"
          onPress={onContactPress}
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
