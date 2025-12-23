/**
 * FCM (Firebase Cloud Messaging) Service
 * 푸시 알림 관리 및 토픽 구독 처리
 *
 * 필요 패키지: @react-native-firebase/app, @react-native-firebase/messaging
 * 설치: npm install @react-native-firebase/app @react-native-firebase/messaging
 */

import { Platform } from 'react-native';
import { getFirstRow, runSql } from '../database';
import { UserType } from '../types';
import { API_BASE_URL } from '../constants';

// FCM 토픽 상수 (백엔드와 동일하게 유지)
export const FCM_TOPICS = {
  ALL_USERS: 'all_users',
  MARKETING: 'marketing',
  PERSONAL: 'personal',
  BUSINESS: 'business',
} as const;

export type FCMTopic = typeof FCM_TOPICS[keyof typeof FCM_TOPICS];

// SQLite 키
const KEYS = {
  FCM_TOKEN: 'fcm_token',
  FCM_PERMISSION_STATUS: 'fcm_permission_status',
  FCM_SUBSCRIBED_TOPICS: 'fcm_subscribed_topics',
};

// Firebase Messaging 타입 (동적 import 대비)
type FirebaseMessagingModule = {
  default: () => {
    requestPermission: () => Promise<number>;
    getToken: () => Promise<string>;
    deleteToken: () => Promise<void>;
    onMessage: (callback: (message: RemoteMessage) => void) => () => void;
    onNotificationOpenedApp: (callback: (message: RemoteMessage) => void) => () => void;
    getInitialNotification: () => Promise<RemoteMessage | null>;
    subscribeToTopic: (topic: string) => Promise<void>;
    unsubscribeFromTopic: (topic: string) => Promise<void>;
  };
  AuthorizationStatus: {
    AUTHORIZED: number;
    PROVISIONAL: number;
    DENIED: number;
    NOT_DETERMINED: number;
  };
};

interface RemoteMessage {
  messageId?: string;
  data?: { [key: string]: string };
  notification?: {
    title?: string;
    body?: string;
    imageUrl?: string;
  };
}

// Firebase Messaging 모듈 (lazy load)
let messagingModule: FirebaseMessagingModule | null = null;

const getMessaging = async () => {
  if (messagingModule) {
    return messagingModule;
  }

  try {
    // @ts-ignore - 동적 import
    messagingModule = await import('@react-native-firebase/messaging');
    return messagingModule;
  } catch (error) {
    console.warn('Firebase Messaging 모듈이 설치되지 않았습니다.');
    console.warn('npm install @react-native-firebase/app @react-native-firebase/messaging');
    return null;
  }
};

export const FCMService = {
  /**
   * FCM 초기화 및 권한 요청
   */
  async initialize(): Promise<boolean> {
    const firebase = await getMessaging();
    if (!firebase) {
      console.log('FCM 초기화 스킵: Firebase 모듈 없음');
      return false;
    }

    try {
      const messaging = firebase.default();
      const authStatus = await messaging.requestPermission();
      const enabled =
        authStatus === firebase.AuthorizationStatus.AUTHORIZED ||
        authStatus === firebase.AuthorizationStatus.PROVISIONAL;

      // 권한 상태 저장
      await this.setMetadata(KEYS.FCM_PERMISSION_STATUS, String(authStatus));

      if (enabled) {
        console.log('FCM 푸시 알림 권한 획득');

        // 토큰 획득 및 저장
        const token = await messaging.getToken();
        await this.setMetadata(KEYS.FCM_TOKEN, token);
        console.log('FCM 토큰 획득:', token.substring(0, 20) + '...');

        return true;
      } else {
        console.log('FCM 푸시 알림 권한 거부됨');
        return false;
      }
    } catch (error) {
      console.error('FCM 초기화 실패:', error);
      return false;
    }
  },

  /**
   * 현재 FCM 토큰 가져오기
   */
  async getToken(): Promise<string | null> {
    // 먼저 저장된 토큰 확인
    const savedToken = await this.getMetadata(KEYS.FCM_TOKEN);
    if (savedToken) {
      return savedToken;
    }

    // 없으면 새로 획득
    const firebase = await getMessaging();
    if (!firebase) return null;

    try {
      const messaging = firebase.default();
      const token = await messaging.getToken();
      await this.setMetadata(KEYS.FCM_TOKEN, token);
      return token;
    } catch (error) {
      console.error('FCM 토큰 획득 실패:', error);
      return null;
    }
  },

  /**
   * 토큰 갱신 (로그아웃 시 호출)
   */
  async refreshToken(): Promise<string | null> {
    const firebase = await getMessaging();
    if (!firebase) return null;

    try {
      const messaging = firebase.default();
      await messaging.deleteToken();
      const newToken = await messaging.getToken();
      await this.setMetadata(KEYS.FCM_TOKEN, newToken);
      return newToken;
    } catch (error) {
      console.error('FCM 토큰 갱신 실패:', error);
      return null;
    }
  },

  /**
   * 사용자 유형에 따른 토픽 구독 설정
   */
  async setupTopicsForUser(userType: UserType, marketingEnabled: boolean): Promise<void> {
    const token = await this.getToken();
    if (!token) {
      console.warn('FCM 토큰 없음: 토픽 구독 스킵');
      return;
    }

    // 기본 토픽 구독
    const topics: FCMTopic[] = [FCM_TOPICS.ALL_USERS];

    // 사용자 유형별 토픽
    if (userType === 'personal') {
      topics.push(FCM_TOPICS.PERSONAL);
    } else {
      topics.push(FCM_TOPICS.BUSINESS);
    }

    // 마케팅 동의 시
    if (marketingEnabled) {
      topics.push(FCM_TOPICS.MARKETING);
    }

    // 서버에 토픽 구독 요청
    await this.subscribeToTopicsViaAPI(token, topics);

    // 로컬에도 저장
    await this.setMetadata(KEYS.FCM_SUBSCRIBED_TOPICS, JSON.stringify(topics));
  },

  /**
   * 서버 API를 통한 토픽 구독
   */
  async subscribeToTopicsViaAPI(token: string, topics: FCMTopic[]): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/push/topics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, topics }),
      });

      const result = await response.json();
      if (result.success) {
        console.log('토픽 구독 성공:', topics);
        return true;
      } else {
        console.error('토픽 구독 실패:', result.error);
        return false;
      }
    } catch (error) {
      console.error('토픽 구독 API 호출 실패:', error);

      // API 실패 시 로컬 구독으로 폴백
      return this.subscribeToTopicsLocally(topics);
    }
  },

  /**
   * 로컬 Firebase SDK를 통한 토픽 구독 (폴백)
   */
  async subscribeToTopicsLocally(topics: FCMTopic[]): Promise<boolean> {
    const firebase = await getMessaging();
    if (!firebase) return false;

    try {
      const messaging = firebase.default();
      await Promise.all(topics.map(topic => messaging.subscribeToTopic(topic)));
      console.log('로컬 토픽 구독 성공:', topics);
      return true;
    } catch (error) {
      console.error('로컬 토픽 구독 실패:', error);
      return false;
    }
  },

  /**
   * 서버 API를 통한 토픽 구독 해제
   */
  async unsubscribeFromTopicsViaAPI(token: string, topics: FCMTopic[]): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/push/topics`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, topics }),
      });

      const result = await response.json();
      if (result.success) {
        console.log('토픽 구독 해제 성공:', topics);
        return true;
      } else {
        console.error('토픽 구독 해제 실패:', result.error);
        return false;
      }
    } catch (error) {
      console.error('토픽 구독 해제 API 호출 실패:', error);
      return false;
    }
  },

  /**
   * 마케팅 토픽 토글
   */
  async toggleMarketingTopic(enabled: boolean): Promise<void> {
    const token = await this.getToken();
    if (!token) return;

    if (enabled) {
      await this.subscribeToTopicsViaAPI(token, [FCM_TOPICS.MARKETING]);
    } else {
      await this.unsubscribeFromTopicsViaAPI(token, [FCM_TOPICS.MARKETING]);
    }

    // 로컬 저장된 토픽 목록 업데이트
    const savedTopics = await this.getMetadata(KEYS.FCM_SUBSCRIBED_TOPICS);
    let topics: FCMTopic[] = savedTopics ? JSON.parse(savedTopics) : [];

    if (enabled && !topics.includes(FCM_TOPICS.MARKETING)) {
      topics.push(FCM_TOPICS.MARKETING);
    } else if (!enabled) {
      topics = topics.filter(t => t !== FCM_TOPICS.MARKETING);
    }

    await this.setMetadata(KEYS.FCM_SUBSCRIBED_TOPICS, JSON.stringify(topics));
  },

  /**
   * 포그라운드 메시지 리스너 등록
   */
  async onForegroundMessage(callback: (message: RemoteMessage) => void): Promise<() => void> {
    const firebase = await getMessaging();
    if (!firebase) return () => {};

    const messaging = firebase.default();
    return messaging.onMessage(callback);
  },

  /**
   * 백그라운드에서 알림 탭 리스너
   */
  async onNotificationOpened(callback: (message: RemoteMessage) => void): Promise<() => void> {
    const firebase = await getMessaging();
    if (!firebase) return () => {};

    const messaging = firebase.default();
    return messaging.onNotificationOpenedApp(callback);
  },

  /**
   * 앱이 종료된 상태에서 알림으로 열린 경우
   */
  async getInitialNotification(): Promise<RemoteMessage | null> {
    const firebase = await getMessaging();
    if (!firebase) return null;

    const messaging = firebase.default();
    return messaging.getInitialNotification();
  },

  /**
   * 현재 권한 상태 확인
   */
  async getPermissionStatus(): Promise<'authorized' | 'denied' | 'not_determined'> {
    const saved = await this.getMetadata(KEYS.FCM_PERMISSION_STATUS);
    if (!saved) return 'not_determined';

    const firebase = await getMessaging();
    if (!firebase) return 'not_determined';

    const status = parseInt(saved, 10);
    if (status === firebase.AuthorizationStatus.AUTHORIZED ||
        status === firebase.AuthorizationStatus.PROVISIONAL) {
      return 'authorized';
    } else if (status === firebase.AuthorizationStatus.DENIED) {
      return 'denied';
    }
    return 'not_determined';
  },

  /**
   * 현재 구독 중인 토픽 목록
   */
  async getSubscribedTopics(): Promise<FCMTopic[]> {
    const saved = await this.getMetadata(KEYS.FCM_SUBSCRIBED_TOPICS);
    return saved ? JSON.parse(saved) : [];
  },

  /**
   * 모든 토픽 구독 해제 (로그아웃 시)
   */
  async unsubscribeAll(): Promise<void> {
    const token = await this.getToken();
    if (!token) return;

    const topics = await this.getSubscribedTopics();
    if (topics.length > 0) {
      await this.unsubscribeFromTopicsViaAPI(token, topics);
    }

    // 로컬 데이터 초기화
    await runSql('DELETE FROM app_metadata WHERE key LIKE ?', ['fcm_%']);
  },

  // Helper: 메타데이터 조회
  async getMetadata(key: string): Promise<string | null> {
    const row = await getFirstRow<{ value: string }>(
      'SELECT value FROM app_metadata WHERE key = ?',
      [key]
    );
    return row?.value ?? null;
  },

  // Helper: 메타데이터 저장
  async setMetadata(key: string, value: string): Promise<void> {
    await runSql(
      `INSERT INTO app_metadata (key, value, updated_at)
       VALUES (?, ?, datetime('now'))
       ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = datetime('now')`,
      [key, value, value]
    );
  },
};

export default FCMService;
