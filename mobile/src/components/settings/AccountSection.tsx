import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants';
import SettingItem from './SettingItem';

interface AccountSectionProps {
  userName: string;
  userEmail: string;
  userType: string;
  isGuest: boolean;
  onLogin: () => void;
  onLogout: () => void;
}

export default function AccountSection({
  userName,
  userEmail,
  userType,
  isGuest,
  onLogin,
  onLogout,
}: AccountSectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>계정</Text>
      <View style={styles.sectionContent}>
        <View style={styles.profileCard}>
          <View style={styles.profileAvatar}>
            <Icon name="person" size={28} color={Colors.textSecondary} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{userName}</Text>
            <Text style={styles.profileEmail}>{userEmail}</Text>
            {userType && <Text style={styles.profileType}>{userType}</Text>}
          </View>
        </View>
        {isGuest ? (
          <SettingItem icon="log-in-outline" title="로그인" onPress={onLogin} />
        ) : (
          <SettingItem icon="log-out-outline" title="로그아웃" onPress={onLogout} />
        )}
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
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  profileAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    marginLeft: Spacing.md,
  },
  profileName: {
    ...Typography.bodyMedium,
    color: Colors.text,
  },
  profileEmail: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  profileType: {
    ...Typography.small,
    color: Colors.primary,
    marginTop: 2,
  },
});
