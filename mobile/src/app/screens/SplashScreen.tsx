import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types';
import { Colors, Typography, Spacing, ENABLE_ONBOARDING } from '../../constants';
import { initDatabase } from '../../database';
import { setupPlayer, OnboardingService, SyncService, NetworkService, DownloadService } from '../../services';
import { useAuthStore, useUserStore } from '../../stores';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Splash'>;

const SplashScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { isLoggedIn, setLoading } = useAuthStore();
  const { onboardingCompleted, syncFromSQLite } = useUserStore();

  useEffect(() => {
    const initialize = async () => {
      try {
        // Initialize database
        await initDatabase();

        // Initialize network service and sync tracks from server
        await NetworkService.initialize();
        // Initialize download service (create directory)
        await DownloadService.initialize();
        // 개발 중에는 항상 동기화 실행
        console.log('Syncing tracks from server...');
        const syncResult = await SyncService.syncTracks();
        console.log('Sync result:', syncResult);

        // SQLite에서 온보딩 데이터 로드 및 동기화
        const onboardingData = await OnboardingService.loadOnboardingData();
        if (onboardingData.completed) {
          syncFromSQLite(onboardingData);
        }

        // Setup audio player
        await setupPlayer();

        // Minimum splash duration
        await new Promise<void>(resolve => setTimeout(resolve, 1500));

        // Navigate based on state
        setLoading(false);

        // SQLite에서 로드한 데이터 기준으로 판단
        const isOnboardingDone = onboardingData.completed;

        // MVP: 온보딩 비활성화 시 온보딩 완료 여부와 관계없이 로그인 화면으로
        // 로그인/건너뛰기 후 바로 MainTabs로 이동
        if (!ENABLE_ONBOARDING) {
          // 이미 로그인했거나 게스트로 진입한 적 있으면 바로 홈으로
          if (isLoggedIn || isOnboardingDone) {
            navigation.replace('MainTabs');
          } else {
            navigation.replace('Login');
          }
        } else {
          // 온보딩 활성화 시 기존 로직
          if (isLoggedIn) {
            if (isOnboardingDone) {
              navigation.replace('MainTabs');
            } else {
              navigation.replace('Onboarding');
            }
          } else {
            // 게스트 모드에서도 온보딩 완료 여부 확인
            if (isOnboardingDone) {
              navigation.replace('MainTabs');
            } else {
              navigation.replace('Login');
            }
          }
        }
      } catch (error) {
        console.error('Initialization error:', error);
        // Still navigate to login on error
        navigation.replace('Login');
      }
    };

    initialize();
  }, []);

  return (
    <View style={styles.container}>
      {/* Logo */}
      <View style={styles.logoContainer}>
        <Image
          source={require('../../assets/images/bribi-logo.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
      </View>
      <Text style={styles.tagline}>마음의 평화를 찾아서</Text>

      {/* Loading Indicator */}
      <ActivityIndicator
        style={styles.loader}
        size="small"
        color={Colors.primary}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    marginBottom: Spacing.lg,
  },
  logoImage: {
    width: 200,
    height: 80,
  },
  tagline: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.xxl,
  },
  loader: {
    position: 'absolute',
    bottom: 100,
  },
});

export default SplashScreen;
