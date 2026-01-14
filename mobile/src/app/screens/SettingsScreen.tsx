import React, { useEffect, useState, useRef, memo } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Typography, Spacing } from '../../constants';
import { useAuthStore, useUserStore, usePlayerStore } from '../../stores';
import { ErrorLogger } from '../../services';
import { RootStackParamList } from '../../types';
import { useSettings } from '../../hooks';
import {
  AccountSection,
  BrightnessSection,
  NetworkSection,
  NotificationSection,
  LanguageSection,
  PremiumCard,
  SupportSection,
  AppInfoSection,
} from '../../components/settings';

const logger = ErrorLogger.forScreen('SettingsScreen');

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user, isGuest, logout } = useAuthStore();
  const { userType } = useUserStore();
  const { currentTrack } = usePlayerStore();

  // Language modal state
  const [languageModalVisible, setLanguageModalVisible] = useState(false);

  // Mount tracking for logging
  const isMountedRef = useRef(true);

  useEffect(() => {
    logger.info('mount', 'SettingsScreen mounted');
    isMountedRef.current = true;

    return () => {
      logger.info('unmount', 'SettingsScreen unmounting');
      isMountedRef.current = false;
    };
  }, []);

  // Use settings hook
  const {
    defaultBrightness,
    autoBrightnessEnabled,
    onDefaultBrightnessChange,
    onAutoBrightnessChange,
    networkMode,
    streamingQuality,
    allowCellularDownload,
    onNetworkModeChange,
    onQualityChange,
    onCellularDownloadChange,
    pushEnabled,
    marketingEnabled,
    reminderEnabled,
    nightModeEnabled,
    onPushEnabledChange,
    onMarketingEnabledChange,
    onReminderEnabledChange,
    onNightModeEnabledChange,
    currentLanguage,
    onLanguageChange,
    getCurrentLanguageOption,
  } = useSettings();

  // Account handlers
  const handleLogout = () => {
    Alert.alert(
      '로그아웃',
      '정말 로그아웃 하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '로그아웃',
          style: 'destructive',
          onPress: () => logout(),
        },
      ]
    );
  };

  const handleLogin = () => {
    navigation.navigate('Login', { fromSettings: true });
  };

  // Premium handler
  const handlePremiumPress = () => {
    Alert.alert('준비 중', '프리미엄 업그레이드 기능은 곧 지원될 예정입니다.');
  };

  // Support handlers
  const handleFAQPress = () => {
    navigation.navigate('ContentPage', { slug: 'faq', title: '자주 묻는 질문' });
  };

  const handleContactPress = () => {
    Alert.alert('문의하기', '이메일: support@bribi.app');
  };

  // App info handlers
  const handleTermsPress = () => {
    navigation.navigate('ContentPage', { slug: 'terms', title: '이용약관' });
  };

  const handlePrivacyPress = () => {
    navigation.navigate('ContentPage', { slug: 'privacy', title: '개인정보처리방침' });
  };

  // Language handler
  const handleLanguageSelect = (langCode: typeof currentLanguage) => {
    onLanguageChange(langCode);
    setLanguageModalVisible(false);
  };

  // Get user display info
  const userName = user?.displayName || (isGuest ? 'Guest' : '사용자');
  const userEmail = user?.email || (isGuest ? '게스트 모드' : '');
  const userTypeLabel = userType === 'personal' ? '개인용' : userType === 'business' ? '비즈니스' : '';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>설정</Text>
        </View>

        {/* Account Section */}
        <AccountSection
          userName={userName}
          userEmail={userEmail}
          userType={userTypeLabel}
          isGuest={isGuest}
          onLogin={handleLogin}
          onLogout={handleLogout}
        />

        {/* Brightness Settings */}
        <BrightnessSection
          defaultBrightness={defaultBrightness}
          autoBrightnessEnabled={autoBrightnessEnabled}
          onDefaultBrightnessChange={onDefaultBrightnessChange}
          onAutoBrightnessChange={onAutoBrightnessChange}
        />

        {/* Network Settings */}
        <NetworkSection
          networkMode={networkMode}
          streamingQuality={streamingQuality}
          allowCellularDownload={allowCellularDownload}
          onNetworkModeChange={onNetworkModeChange}
          onQualityChange={onQualityChange}
          onCellularDownloadChange={onCellularDownloadChange}
        />

        {/* Notification Settings */}
        <NotificationSection
          pushEnabled={pushEnabled}
          marketingEnabled={marketingEnabled}
          reminderEnabled={reminderEnabled}
          nightModeEnabled={nightModeEnabled}
          onPushEnabledChange={onPushEnabledChange}
          onMarketingEnabledChange={onMarketingEnabledChange}
          onReminderEnabledChange={onReminderEnabledChange}
          onNightModeEnabledChange={onNightModeEnabledChange}
        />

        {/* Premium Card */}
        <PremiumCard onPress={handlePremiumPress} />

        {/* Support Section */}
        <SupportSection
          onFAQPress={handleFAQPress}
          onContactPress={handleContactPress}
        />

        {/* Language Section */}
        <LanguageSection
          currentLanguage={currentLanguage}
          getCurrentLanguageOption={getCurrentLanguageOption}
          modalVisible={languageModalVisible}
          onOpenModal={() => setLanguageModalVisible(true)}
          onCloseModal={() => setLanguageModalVisible(false)}
          onLanguageChange={handleLanguageSelect}
        />

        {/* App Info Section */}
        <AppInfoSection
          onTermsPress={handleTermsPress}
          onPrivacyPress={handlePrivacyPress}
        />

        {/* Bottom padding - dynamic based on mini player visibility */}
        <View style={{ height: currentTrack ? 100 : 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  headerTitle: {
    ...Typography.heading2,
    color: Colors.text,
  },
});

export default memo(SettingsScreen);
