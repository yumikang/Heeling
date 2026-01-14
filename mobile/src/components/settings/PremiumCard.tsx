import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants';

interface PremiumCardProps {
  onPress: () => void;
}

export default function PremiumCard({ onPress }: PremiumCardProps) {
  return (
    <View style={styles.section}>
      <TouchableOpacity
        style={styles.premiumCard}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <View style={styles.premiumLeft}>
          <Icon name="diamond" size={24} color={Colors.accent} />
          <View style={styles.premiumInfo}>
            <Text style={styles.premiumTitle}>프리미엄으로 업그레이드</Text>
            <Text style={styles.premiumSubtitle}>
              모든 트랙과 기능을 즐겨보세요
            </Text>
          </View>
        </View>
        <Icon name="chevron-forward" size={20} color={Colors.textSecondary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: Spacing.lg,
  },
  premiumCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  premiumLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  premiumInfo: {
    gap: 2,
  },
  premiumTitle: {
    ...Typography.bodyMedium,
    color: Colors.text,
  },
  premiumSubtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
});
