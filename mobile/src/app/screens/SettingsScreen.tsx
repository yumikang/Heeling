import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
  Pressable,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors, Typography, Spacing, BorderRadius, APP_VERSION, BRIGHTNESS_PRESETS } from '../../constants';
import { useAuthStore, useUserStore, usePlayerStore } from '../../stores';
import { NetworkService, NotificationService, SettingsService } from '../../services';
import { NetworkMode, StreamingQuality, RootStackParamList } from '../../types';
import { CustomSlider } from '../../components';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// 언어 설정 타입
type LanguageCode = 'ko' | 'en' | 'ja';

interface LanguageOption {
  code: LanguageCode;
  flag: string;
  label: string;       // 해당 언어로 표시된 라벨
  nativeName: string;  // 선택값으로 표시될 이름
}

const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: 'ko', flag: '🇰🇷', label: '언어', nativeName: '한국어' },
  { code: 'en', flag: '🇺🇸', label: 'Language', nativeName: 'English' },
  { code: 'ja', flag: '🇯🇵', label: '言語', nativeName: '日本語' },
];

const LANGUAGE_STORAGE_KEY = '@heeling_language';

const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user, isGuest, logout } = useAuthStore();
  const { userType } = useUserStore();
  const { brightness, setBrightness, currentTrack } = usePlayerStore();

  // Brightness settings state
  const [defaultBrightness, setDefaultBrightness] = React.useState(0.5);
  const [autoBrightnessEnabled, setAutoBrightnessEnabled] = React.useState(true);

  // Network settings state
  const [networkMode, setNetworkMode] = React.useState<NetworkMode>('streaming');
  const [streamingQuality, setStreamingQuality] = React.useState<StreamingQuality>('auto');
  const [allowCellularDownload, setAllowCellularDownload] = React.useState(false);

  // Notification settings state
  const [pushEnabled, setPushEnabled] = React.useState(true);
  const [marketingEnabled, setMarketingEnabled] = React.useState(false);
  const [reminderEnabled, setReminderEnabled] = React.useState(true);
  const [nightModeEnabled, setNightModeEnabled] = React.useState(false);

  // Language settings state
  const [currentLanguage, setCurrentLanguage] = useState<LanguageCode>('ko');
  const [languageModalVisible, setLanguageModalVisible] = useState(false);

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      // Load brightness settings
      const brightnessSettings = await SettingsService.loadBrightnessSettings();
      setDefaultBrightness(brightnessSettings.defaultBrightness);
      setAutoBrightnessEnabled(brightnessSettings.autoBrightnessEnabled);

      // Load network settings
      const networkSettings = await NetworkService.loadSettings();
      setNetworkMode(networkSettings.networkMode);
      setStreamingQuality(networkSettings.streamingQuality);
      setAllowCellularDownload(networkSettings.allowCellularDownload);

      // Load notification settings
      const notificationSettings = await NotificationService.loadSettings();
      setPushEnabled(notificationSettings.pushEnabled);
      setMarketingEnabled(notificationSettings.marketingEnabled);
      setReminderEnabled(notificationSettings.reminderEnabled);
      setNightModeEnabled(notificationSettings.nightModeEnabled);

      // Load language setting
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (savedLanguage && ['ko', 'en', 'ja'].includes(savedLanguage)) {
        setCurrentLanguage(savedLanguage as LanguageCode);
      }
    };
    loadSettings();
  }, []);

  // Brightness settings handlers
  const handleDefaultBrightnessChange = useCallback(async (value: number) => {
    setDefaultBrightness(value);
    setBrightness(value); // Also apply to current session
    await SettingsService.saveBrightnessSettings({ defaultBrightness: value });
  }, [setBrightness]);

  const handleAutoBrightnessChange = useCallback(async (value: boolean) => {
    setAutoBrightnessEnabled(value);
    await SettingsService.saveBrightnessSettings({ autoBrightnessEnabled: value });
  }, []);

  // Save network mode
  const handleNetworkModeChange = useCallback(async (mode: NetworkMode) => {
    setNetworkMode(mode);
    await NetworkService.saveSettings({ networkMode: mode });
  }, []);

  // Save streaming quality
  const handleQualityChange = useCallback(async (quality: StreamingQuality) => {
    setStreamingQuality(quality);
    await NetworkService.saveSettings({ streamingQuality: quality });
  }, []);

  // Save cellular download setting
  const handleCellularDownloadChange = useCallback(async (value: boolean) => {
    setAllowCellularDownload(value);
    await NetworkService.saveSettings({ allowCellularDownload: value });
  }, []);

  // Notification settings handlers
  const handlePushEnabledChange = useCallback(async (value: boolean) => {
    setPushEnabled(value);
    await NotificationService.saveSettings({ pushEnabled: value });
    if (value) {
      await NotificationService.requestPermission();
    }
  }, []);

  const handleMarketingEnabledChange = useCallback(async (value: boolean) => {
    setMarketingEnabled(value);
    await NotificationService.saveSettings({ marketingEnabled: value });
  }, []);

  const handleReminderEnabledChange = useCallback(async (value: boolean) => {
    setReminderEnabled(value);
    await NotificationService.saveSettings({ reminderEnabled: value });
  }, []);

  const handleNightModeEnabledChange = useCallback(async (value: boolean) => {
    setNightModeEnabled(value);
    await NotificationService.saveSettings({ nightModeEnabled: value });
  }, []);

  // Language settings handler
  const handleLanguageChange = useCallback(async (langCode: LanguageCode) => {
    setCurrentLanguage(langCode);
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, langCode);
    setLanguageModalVisible(false);
    // TODO: 나중에 i18n 라이브러리 연동 시 여기서 언어 변경
  }, []);

  // 현재 언어 정보 가져오기
  const getCurrentLanguageOption = () => {
    return LANGUAGE_OPTIONS.find(lang => lang.code === currentLanguage) || LANGUAGE_OPTIONS[0];
  };

  const handleLogout = () => {
    Alert.alert(
      '로그아웃',
      '정말 로그아웃 하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '로그아웃',
          style: 'destructive',
          onPress: () => {
            logout();
          },
        },
      ]
    );
  };

  const handleLogin = () => {
    navigation.navigate('Login', { fromSettings: true });
  };

  const handlePremiumPress = () => {
    Alert.alert('준비 중', '프리미엄 업그레이드 기능은 곧 지원될 예정입니다.');
  };

  const renderSettingItem = (
    icon: string,
    title: string,
    onPress?: () => void,
    rightComponent?: React.ReactNode
  ) => (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.7}
    >
      <View style={styles.settingLeft}>
        <Icon name={icon} size={22} color={Colors.textSecondary} />
        <Text style={styles.settingTitle}>{title}</Text>
      </View>
      {rightComponent || (onPress && (
        <Icon name="chevron-forward" size={20} color={Colors.textSecondary} />
      ))}
    </TouchableOpacity>
  );

  const renderSwitch = (value: boolean, onValueChange: (value: boolean) => void) => (
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: Colors.surfaceLight, true: Colors.primaryDark }}
      thumbColor={'#FFFFFF'}
      ios_backgroundColor={Colors.surfaceLight}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>설정</Text>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>계정</Text>
          <View style={styles.sectionContent}>
            <View style={styles.profileCard}>
              <View style={styles.profileAvatar}>
                <Icon name="person" size={28} color={Colors.textSecondary} />
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>
                  {user?.displayName || (isGuest ? 'Guest' : '사용자')}
                </Text>
                <Text style={styles.profileEmail}>
                  {user?.email || (isGuest ? '게스트 모드' : '')}
                </Text>
                <Text style={styles.profileType}>
                  {userType === 'personal' ? '개인용' : userType === 'business' ? '비즈니스' : ''}
                </Text>
              </View>
            </View>
            {isGuest ? (
              renderSettingItem('log-in-outline', '로그인', handleLogin)
            ) : (
              renderSettingItem('log-out-outline', '로그아웃', handleLogout)
            )}
          </View>
        </View>

        {/* Brightness Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>화면 밝기</Text>
          <View style={styles.sectionContent}>
            {/* Auto Brightness Toggle */}
            {renderSettingItem(
              'color-wand-outline',
              '자동 밝기 (카테고리/무드별)',
              undefined,
              renderSwitch(autoBrightnessEnabled, handleAutoBrightnessChange)
            )}

            {/* Default Brightness Slider */}
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
                    onSlidingComplete={handleDefaultBrightnessChange}
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

        {/* Network Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>네트워크 설정</Text>
          <View style={styles.sectionContent}>
            {/* Network Mode Selection */}
            <View style={styles.settingGroup}>
              <View style={styles.settingGroupHeader}>
                <Icon name="wifi-outline" size={20} color={Colors.textSecondary} />
                <Text style={styles.settingGroupTitle}>연결 모드</Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.radioOption,
                  networkMode === 'wifi_only' && styles.radioOptionSelected,
                ]}
                onPress={() => handleNetworkModeChange('wifi_only')}
              >
                <View style={styles.radioCircle}>
                  {networkMode === 'wifi_only' && <View style={styles.radioInner} />}
                </View>
                <View style={styles.radioTextContainer}>
                  <Text style={styles.radioLabel}>Wi-Fi 전용</Text>
                  <Text style={styles.radioDescription}>Wi-Fi에서만 스트리밍/다운로드</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.radioOption,
                  networkMode === 'streaming' && styles.radioOptionSelected,
                ]}
                onPress={() => handleNetworkModeChange('streaming')}
              >
                <View style={styles.radioCircle}>
                  {networkMode === 'streaming' && <View style={styles.radioInner} />}
                </View>
                <View style={styles.radioTextContainer}>
                  <Text style={styles.radioLabel}>스트리밍</Text>
                  <Text style={styles.radioDescription}>모든 네트워크에서 스트리밍 허용</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.radioOption,
                  networkMode === 'offline' && styles.radioOptionSelected,
                ]}
                onPress={() => handleNetworkModeChange('offline')}
              >
                <View style={styles.radioCircle}>
                  {networkMode === 'offline' && <View style={styles.radioInner} />}
                </View>
                <View style={styles.radioTextContainer}>
                  <Text style={styles.radioLabel}>오프라인</Text>
                  <Text style={styles.radioDescription}>다운로드된 콘텐츠만 재생</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Streaming Quality */}
            <View style={styles.settingGroup}>
              <View style={styles.settingGroupHeader}>
                <Icon name="speedometer-outline" size={20} color={Colors.textSecondary} />
                <Text style={styles.settingGroupTitle}>스트리밍 품질</Text>
              </View>
              <View style={styles.qualitySelector}>
                <TouchableOpacity
                  style={[
                    styles.qualityOption,
                    streamingQuality === 'auto' && styles.qualityOptionSelected,
                  ]}
                  onPress={() => handleQualityChange('auto')}
                >
                  <Text
                    style={[
                      styles.qualityText,
                      streamingQuality === 'auto' && styles.qualityTextSelected,
                    ]}
                  >
                    자동
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.qualityOption,
                    streamingQuality === 'high' && styles.qualityOptionSelected,
                  ]}
                  onPress={() => handleQualityChange('high')}
                >
                  <Text
                    style={[
                      styles.qualityText,
                      streamingQuality === 'high' && styles.qualityTextSelected,
                    ]}
                  >
                    고품질
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.qualityOption,
                    streamingQuality === 'low' && styles.qualityOptionSelected,
                  ]}
                  onPress={() => handleQualityChange('low')}
                >
                  <Text
                    style={[
                      styles.qualityText,
                      streamingQuality === 'low' && styles.qualityTextSelected,
                    ]}
                  >
                    저품질
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Cellular Download Toggle */}
            {renderSettingItem(
              'cellular-outline',
              '셀룰러 다운로드 허용',
              undefined,
              renderSwitch(allowCellularDownload, handleCellularDownloadChange)
            )}
          </View>
        </View>

        {/* Notification Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>알림 설정</Text>
          <View style={styles.sectionContent}>
            {renderSettingItem(
              'notifications-outline',
              '푸시 알림',
              undefined,
              renderSwitch(pushEnabled, handlePushEnabledChange)
            )}
            {renderSettingItem(
              'megaphone-outline',
              '마케팅 알림',
              undefined,
              renderSwitch(marketingEnabled, handleMarketingEnabledChange)
            )}
            {renderSettingItem(
              'alarm-outline',
              '리마인더 알림',
              undefined,
              renderSwitch(reminderEnabled, handleReminderEnabledChange)
            )}
            {renderSettingItem(
              'moon-outline',
              '야간 방해 금지 (22:00 - 07:00)',
              undefined,
              renderSwitch(nightModeEnabled, handleNightModeEnabledChange)
            )}
          </View>
        </View>

        {/* Premium Section */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.premiumCard}
            onPress={handlePremiumPress}
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

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>고객 지원</Text>
          <View style={styles.sectionContent}>
            {renderSettingItem(
              'help-circle-outline',
              '자주 묻는 질문',
              () => navigation.navigate('ContentPage', { slug: 'faq', title: '자주 묻는 질문' })
            )}
            {renderSettingItem(
              'chatbubble-outline',
              '문의하기',
              () => Alert.alert('문의하기', '이메일: support@bribi.app')
            )}
          </View>
        </View>

        {/* Language Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {getCurrentLanguageOption().flag} {getCurrentLanguageOption().label}
          </Text>
          <View style={styles.sectionContent}>
            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => setLanguageModalVisible(true)}
              activeOpacity={0.7}
            >
              <View style={styles.settingLeft}>
                <Icon name="language-outline" size={22} color={Colors.textSecondary} />
                <Text style={styles.settingTitle}>
                  {getCurrentLanguageOption().label}
                </Text>
              </View>
              <View style={styles.languageValueContainer}>
                <Text style={styles.languageValue}>
                  {getCurrentLanguageOption().nativeName}
                </Text>
                <Icon name="chevron-forward" size={20} color={Colors.textSecondary} />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* App Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>앱 정보</Text>
          <View style={styles.sectionContent}>
            {renderSettingItem(
              'information-circle-outline',
              `버전 ${APP_VERSION}`,
              undefined
            )}
            {renderSettingItem(
              'document-text-outline',
              '이용약관',
              () => navigation.navigate('ContentPage', { slug: 'terms', title: '이용약관' })
            )}
            {renderSettingItem(
              'shield-checkmark-outline',
              '개인정보처리방침',
              () => navigation.navigate('ContentPage', { slug: 'privacy', title: '개인정보처리방침' })
            )}
          </View>
        </View>

        {/* Bottom padding - dynamic based on mini player visibility */}
        <View style={{ height: currentTrack ? 100 : 20 }} />
      </ScrollView>

      {/* Language Selection Modal (Bottom Sheet Style) */}
      <Modal
        visible={languageModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setLanguageModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setLanguageModalVisible(false)}
        >
          <Pressable style={styles.modalContent} onPress={e => e.stopPropagation()}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>
              {getCurrentLanguageOption().flag} {getCurrentLanguageOption().label}
            </Text>

            {LANGUAGE_OPTIONS.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.languageOption,
                  currentLanguage === lang.code && styles.languageOptionSelected,
                ]}
                onPress={() => handleLanguageChange(lang.code)}
                activeOpacity={0.7}
              >
                <View style={styles.languageOptionLeft}>
                  <Text style={styles.languageFlag}>{lang.flag}</Text>
                  <Text style={styles.languageOptionText}>{lang.nativeName}</Text>
                </View>
                {currentLanguage === lang.code && (
                  <Icon name="checkmark-circle" size={24} color={Colors.primary} />
                )}
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setLanguageModalVisible(false)}
            >
              <Text style={styles.modalCancelText}>취소</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
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
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  settingTitle: {
    ...Typography.body,
    color: Colors.text,
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
  // Network Settings Styles
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
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    marginBottom: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  radioOptionSelected: {
    backgroundColor: Colors.surfaceLight,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.textSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  radioTextContainer: {
    flex: 1,
  },
  radioLabel: {
    ...Typography.body,
    color: Colors.text,
  },
  radioDescription: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  qualitySelector: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.sm,
    padding: 4,
  },
  qualityOption: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: BorderRadius.xs,
  },
  qualityOptionSelected: {
    backgroundColor: Colors.primary,
  },
  qualityText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  qualityTextSelected: {
    color: Colors.text,
    fontWeight: '600',
  },
  // Brightness Settings Styles
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
  // Language Settings Styles
  languageValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  languageValue: {
    ...Typography.body,
    color: Colors.primary,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    paddingTop: Spacing.md,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  modalTitle: {
    ...Typography.heading3,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xs,
  },
  languageOptionSelected: {
    backgroundColor: Colors.surfaceLight,
  },
  languageOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  languageFlag: {
    fontSize: 24,
  },
  languageOptionText: {
    ...Typography.bodyMedium,
    color: Colors.text,
  },
  modalCancelButton: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceLight,
  },
  modalCancelText: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
  },
});

export default SettingsScreen;
