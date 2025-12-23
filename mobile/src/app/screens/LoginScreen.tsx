import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import { RootStackParamList } from '../../types';
import { Colors, Typography, Spacing, BorderRadius, ENABLE_ONBOARDING } from '../../constants';
import { useAuthStore } from '../../stores';
import { AuthService } from '../../services';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;
type LoginRouteProp = RouteProp<RootStackParamList, 'Login'>;

const LoginScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<LoginRouteProp>();
  const { login, setGuest } = useAuthStore();

  const [isAppleLoading, setIsAppleLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isAppleSupported, setIsAppleSupported] = useState(false);

  // 설정 화면에서 왔는지 확인
  const fromSettings = route.params?.fromSettings ?? false;

  useEffect(() => {
    // Google Sign-In 초기화
    AuthService.configureGoogleSignIn();

    // Apple Sign-In 지원 여부 확인
    AuthService.isAppleSignInSupported().then(setIsAppleSupported);
  }, []);

  const handleAppleLogin = async () => {
    if (!isAppleSupported) {
      Alert.alert('지원 안 함', 'Apple 로그인은 iOS 13 이상에서만 지원됩니다.');
      return;
    }

    setIsAppleLoading(true);
    try {
      const user = await AuthService.signInWithApple();
      login(user);

      if (fromSettings) {
        navigation.goBack();
      } else if (ENABLE_ONBOARDING) {
        navigation.replace('Onboarding');
      } else {
        navigation.replace('MainTabs');
      }
    } catch (error: any) {
      if (error.message !== 'CANCELLED') {
        Alert.alert('로그인 실패', 'Apple 로그인 중 오류가 발생했습니다.');
      }
    } finally {
      setIsAppleLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      const user = await AuthService.signInWithGoogle();
      login(user);

      if (fromSettings) {
        navigation.goBack();
      } else if (ENABLE_ONBOARDING) {
        navigation.replace('Onboarding');
      } else {
        navigation.replace('MainTabs');
      }
    } catch (error: any) {
      if (error.message === 'CANCELLED') {
        // 사용자가 취소한 경우 무시
      } else if (error.message === 'Google Play Services is not available') {
        Alert.alert('오류', 'Google Play Services가 필요합니다.');
      } else {
        Alert.alert('로그인 실패', 'Google 로그인 중 오류가 발생했습니다.');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleSkip = async () => {
    if (fromSettings) {
      // 설정에서 온 경우: 기존 설정 유지하고 뒤로 가기
      navigation.goBack();
    } else {
      // 초기 진입: 게스트 모드
      await setGuest();
      // MVP: 온보딩 비활성화 시 바로 홈으로
      if (ENABLE_ONBOARDING) {
        navigation.replace('Onboarding');
      } else {
        navigation.replace('MainTabs');
      }
    }
  };

  const isLoading = isAppleLoading || isGoogleLoading;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoSection}>
          <Image
            source={require('../../assets/images/bribi-logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.tagline}>당신의 휴식을 위한 사운드</Text>
        </View>

        {/* Login Buttons */}
        <View style={styles.buttonSection}>
          {/* Apple Login - iOS only */}
          {Platform.OS === 'ios' && (
            <TouchableOpacity
              style={[styles.appleButton, isLoading && styles.buttonDisabled]}
              onPress={handleAppleLogin}
              activeOpacity={0.8}
              disabled={isLoading}
            >
              {isAppleLoading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <>
                  <Icon name="logo-apple" size={20} color="#000" />
                  <Text style={styles.appleButtonText}>Apple로 계속하기</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {/* Google Login */}
          <TouchableOpacity
            style={[styles.googleButton, isLoading && styles.buttonDisabled]}
            onPress={handleGoogleLogin}
            activeOpacity={0.8}
            disabled={isLoading}
          >
            {isGoogleLoading ? (
              <ActivityIndicator color={Colors.text} />
            ) : (
              <>
                <Icon name="logo-google" size={20} color="#DB4437" />
                <Text style={styles.googleButtonText}>Google로 계속하기</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Skip Link */}
        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkip}
          activeOpacity={0.7}
          disabled={isLoading}
        >
          <Text style={[styles.skipText, isLoading && styles.textDisabled]}>건너뛰기</Text>
        </TouchableOpacity>

        {/* Terms */}
        <Text style={styles.terms}>
          계속 진행하면 이용약관 및 개인정보처리방침에 동의하게 됩니다.
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    justifyContent: 'center',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: Spacing.xxl * 2,
  },
  logoImage: {
    width: 180,
    height: 70,
    marginBottom: Spacing.md,
  },
  tagline: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  buttonSection: {
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  appleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    minHeight: 50,
  },
  appleButtonText: {
    ...Typography.button,
    color: '#000000',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 50,
  },
  googleButtonText: {
    ...Typography.button,
    color: Colors.text,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    marginBottom: Spacing.lg,
  },
  skipText: {
    ...Typography.body,
    color: Colors.primary,
  },
  textDisabled: {
    opacity: 0.5,
  },
  terms: {
    ...Typography.small,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
  },
});

export default LoginScreen;
