/**
 * AuthService - Apple/Google 소셜 로그인 처리
 */

import { Platform } from 'react-native';
import { User } from '../types';
import { post, setAuthToken } from '../api/client';

// 서버 응답 타입
interface SocialLoginResponse {
  success: boolean;
  data?: {
    user: {
      id: string;
      email: string | null;
      name: string | null;
      provider: string;
      userType: string;
      subscriptionTier: string;
      subscriptionEndDate: string | null;
      onboardingCompleted: boolean;
      createdAt: string;
    };
    token: string;
    isNewUser: boolean;
  };
  error?: string;
}

// Apple Authentication (iOS only)
let appleAuth: typeof import('@invertase/react-native-apple-authentication').default | null = null;
if (Platform.OS === 'ios') {
  try {
    appleAuth = require('@invertase/react-native-apple-authentication').default;
  } catch (e) {
    console.log('Apple Auth not available');
  }
}

// Google Sign-In
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

// Google Sign-In 설정
const GOOGLE_WEB_CLIENT_ID = '722175251638-8s54sqq98jd8lnq4g4k4ec08193isv5b.apps.googleusercontent.com';
const GOOGLE_IOS_CLIENT_ID = '722175251638-0o886a7f95n1i9gc0694b3c9bffbo76r.apps.googleusercontent.com';

export const AuthService = {
  /**
   * Google Sign-In 초기화
   */
  configureGoogleSignIn: () => {
    GoogleSignin.configure({
      webClientId: GOOGLE_WEB_CLIENT_ID,
      iosClientId: Platform.OS === 'ios' ? GOOGLE_IOS_CLIENT_ID : undefined,
      offlineAccess: true,
    });
  },

  /**
   * Apple 로그인 지원 여부 확인 (iOS 13+)
   */
  isAppleSignInSupported: async (): Promise<boolean> => {
    if (Platform.OS !== 'ios' || !appleAuth) {
      return false;
    }
    try {
      const { appleAuthAndroid } = await import('@invertase/react-native-apple-authentication');
      return appleAuth.isSupported;
    } catch {
      return false;
    }
  },

  /**
   * Apple Sign-In (iOS)
   */
  signInWithApple: async (): Promise<User> => {
    if (Platform.OS !== 'ios' || !appleAuth) {
      throw new Error('Apple Sign-In is only available on iOS');
    }

    try {
      // 로그인 요청
      const appleAuthRequestResponse = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
      });

      // 자격 증명 상태 확인
      const credentialState = await appleAuth.getCredentialStateForUser(
        appleAuthRequestResponse.user
      );

      if (credentialState !== appleAuth.State.AUTHORIZED) {
        throw new Error('Apple Sign-In failed: Not authorized');
      }

      // 사용자 정보 추출
      const { user, email, fullName, identityToken } = appleAuthRequestResponse;

      // 이름 조합 (Apple은 첫 로그인 시에만 이름 제공)
      let displayName = 'Apple User';
      if (fullName?.givenName || fullName?.familyName) {
        displayName = [fullName.givenName, fullName.familyName]
          .filter(Boolean)
          .join(' ');
      }

      // 백엔드에 소셜 로그인 요청
      try {
        const response = await post<SocialLoginResponse>('/auth/social', {
          provider: 'apple',
          providerId: user,
          email: email || undefined,
          name: displayName !== 'Apple User' ? displayName : undefined,
          identityToken,
        });

        if (response.success && response.data) {
          // JWT 토큰 저장
          setAuthToken(response.data.token);

          const serverUser = response.data.user;
          return {
            id: serverUser.id,
            provider: 'apple',
            email: serverUser.email || undefined,
            displayName: serverUser.name || displayName,
            createdAt: serverUser.createdAt,
            lastLogin: new Date().toISOString(),
            isPremium: serverUser.subscriptionTier !== 'FREE',
          };
        }
      } catch (serverError) {
        // 서버 연결 실패 시 로컬 사용자 정보로 진행 (오프라인 지원)
        console.warn('Apple Sign-In server sync failed, using local data:', serverError);
      }

      // 서버 연결 실패 시 로컬 사용자 반환
      return {
        id: user,
        provider: 'apple',
        email: email || undefined,
        displayName,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      };
    } catch (error: any) {
      // 사용자가 취소한 경우
      if (error.code === appleAuth?.Error?.CANCELED) {
        throw new Error('CANCELLED');
      }
      console.error('Apple Sign-In error:', error);
      throw error;
    }
  },

  /**
   * Google Sign-In
   */
  signInWithGoogle: async (): Promise<User> => {
    try {
      // Google Play Services 확인 (Android only)
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

      // 로그인 수행
      const response = await GoogleSignin.signIn();

      if (!response.data?.user) {
        throw new Error('Google Sign-In failed: No user data');
      }

      const { user: googleUser } = response.data;

      const displayName = googleUser.name || googleUser.email.split('@')[0];

      // 백엔드에 소셜 로그인 요청
      try {
        const { idToken } = await GoogleSignin.getTokens();

        const response = await post<SocialLoginResponse>('/auth/social', {
          provider: 'google',
          providerId: googleUser.id,
          email: googleUser.email,
          name: displayName,
          idToken,
        });

        if (response.success && response.data) {
          // JWT 토큰 저장
          setAuthToken(response.data.token);

          const serverUser = response.data.user;
          return {
            id: serverUser.id,
            provider: 'google',
            email: serverUser.email || googleUser.email,
            displayName: serverUser.name || displayName,
            createdAt: serverUser.createdAt,
            lastLogin: new Date().toISOString(),
            isPremium: serverUser.subscriptionTier !== 'FREE',
          };
        }
      } catch (serverError) {
        // 서버 연결 실패 시 로컬 사용자 정보로 진행 (오프라인 지원)
        console.warn('Google Sign-In server sync failed, using local data:', serverError);
      }

      // 서버 연결 실패 시 로컬 사용자 반환
      return {
        id: googleUser.id,
        provider: 'google',
        email: googleUser.email,
        displayName,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      };
    } catch (error: any) {
      // 사용자가 취소한 경우
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        throw new Error('CANCELLED');
      }
      // Google Play Services 필요
      if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        throw new Error('Google Play Services is not available');
      }
      // 로그인 진행 중
      if (error.code === statusCodes.IN_PROGRESS) {
        throw new Error('Sign-In already in progress');
      }
      console.error('Google Sign-In error:', error);
      throw error;
    }
  },

  /**
   * Google 로그아웃
   */
  signOutGoogle: async (): Promise<void> => {
    try {
      await GoogleSignin.signOut();
    } catch (error) {
      console.error('Google Sign-Out error:', error);
    }
  },

  /**
   * Google 로그인 상태 확인
   */
  isGoogleSignedIn: async (): Promise<boolean> => {
    try {
      const user = await GoogleSignin.getCurrentUser();
      return user !== null;
    } catch {
      return false;
    }
  },
};

export default AuthService;
