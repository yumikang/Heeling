/**
 * Firebase Admin SDK 설정
 * FCM 푸시 알림 발송을 위한 서버 사이드 Firebase 연동
 *
 * 환경변수 설정 필요:
 * - FIREBASE_PROJECT_ID: Firebase 프로젝트 ID
 * - FIREBASE_CLIENT_EMAIL: 서비스 계정 이메일
 * - FIREBASE_PRIVATE_KEY: 서비스 계정 비공개 키 (Base64 인코딩 또는 JSON 이스케이프)
 */

import * as admin from 'firebase-admin';

// Firebase Admin 초기화 (싱글톤 패턴)
function initializeFirebase(): admin.app.App {
  // 이미 초기화된 경우 기존 앱 반환
  if (admin.apps.length > 0) {
    return admin.apps[0]!;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  // 환경변수 검증
  if (!projectId || !clientEmail || !privateKey) {
    console.warn('Firebase Admin SDK 환경변수가 설정되지 않았습니다.');
    console.warn('FCM 푸시 알림 기능이 비활성화됩니다.');
    console.warn('필요한 환경변수: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY');

    // 개발 환경에서는 더미 앱 초기화 (실제 푸시는 비활성화)
    return admin.initializeApp({
      projectId: 'heeling-dev',
    });
  }

  // Private key 처리 (줄바꿈 문자 복원)
  // Vercel 등에서는 환경변수의 줄바꿈이 \\n으로 저장됨
  privateKey = privateKey.replace(/\\n/g, '\n');

  return admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}

// Firebase Admin 앱 인스턴스
export const firebaseAdmin = initializeFirebase();

// Firebase Messaging 인스턴스
export const messaging = admin.messaging();

/**
 * FCM 토픽 목록
 * - all_users: 모든 사용자
 * - marketing: 마케팅 알림 동의 사용자
 * - personal: 개인 사용자 (직장인 외)
 * - business: 직장인 사용자
 */
export const FCM_TOPICS = {
  ALL_USERS: 'all_users',
  MARKETING: 'marketing',
  PERSONAL: 'personal',
  BUSINESS: 'business',
} as const;

export type FCMTopic = typeof FCM_TOPICS[keyof typeof FCM_TOPICS];

/**
 * 토픽으로 푸시 알림 발송
 */
export async function sendToTopic(
  topic: FCMTopic,
  title: string,
  body: string,
  data?: Record<string, string>,
  imageUrl?: string
): Promise<string> {
  const message: admin.messaging.Message = {
    topic,
    notification: {
      title,
      body,
      ...(imageUrl && { imageUrl }),
    },
    data: {
      ...data,
      click_action: 'FLUTTER_NOTIFICATION_CLICK', // React Native 호환
    },
    android: {
      priority: 'high',
      notification: {
        channelId: 'heeling_default',
        priority: 'high',
        defaultSound: true,
        defaultVibrateTimings: true,
      },
    },
    apns: {
      payload: {
        aps: {
          sound: 'default',
          badge: 1,
        },
      },
    },
  };

  try {
    const response = await messaging.send(message);
    console.log(`푸시 발송 성공 [${topic}]:`, response);
    return response;
  } catch (error) {
    console.error(`푸시 발송 실패 [${topic}]:`, error);
    throw error;
  }
}

/**
 * 여러 토픽으로 동시에 푸시 발송
 */
export async function sendToMultipleTopics(
  topics: FCMTopic[],
  title: string,
  body: string,
  data?: Record<string, string>,
  imageUrl?: string
): Promise<{ topic: string; success: boolean; messageId?: string; error?: string }[]> {
  const results = await Promise.allSettled(
    topics.map(topic => sendToTopic(topic, title, body, data, imageUrl))
  );

  return results.map((result, index) => ({
    topic: topics[index],
    success: result.status === 'fulfilled',
    messageId: result.status === 'fulfilled' ? result.value : undefined,
    error: result.status === 'rejected' ? String(result.reason) : undefined,
  }));
}

/**
 * 특정 디바이스 토큰으로 푸시 발송 (개별 발송용)
 */
export async function sendToDevice(
  token: string,
  title: string,
  body: string,
  data?: Record<string, string>,
  imageUrl?: string
): Promise<string> {
  const message: admin.messaging.Message = {
    token,
    notification: {
      title,
      body,
      ...(imageUrl && { imageUrl }),
    },
    data: {
      ...data,
      click_action: 'FLUTTER_NOTIFICATION_CLICK',
    },
    android: {
      priority: 'high',
      notification: {
        channelId: 'heeling_default',
        priority: 'high',
        defaultSound: true,
      },
    },
    apns: {
      payload: {
        aps: {
          sound: 'default',
          badge: 1,
        },
      },
    },
  };

  try {
    const response = await messaging.send(message);
    console.log('디바이스 푸시 발송 성공:', response);
    return response;
  } catch (error) {
    console.error('디바이스 푸시 발송 실패:', error);
    throw error;
  }
}

/**
 * 디바이스를 토픽에 구독
 */
export async function subscribeToTopic(
  tokens: string[],
  topic: FCMTopic
): Promise<admin.messaging.MessagingTopicManagementResponse> {
  try {
    const response = await messaging.subscribeToTopic(tokens, topic);
    console.log(`토픽 구독 성공 [${topic}]:`, response);
    return response;
  } catch (error) {
    console.error(`토픽 구독 실패 [${topic}]:`, error);
    throw error;
  }
}

/**
 * 디바이스를 토픽에서 구독 해제
 */
export async function unsubscribeFromTopic(
  tokens: string[],
  topic: FCMTopic
): Promise<admin.messaging.MessagingTopicManagementResponse> {
  try {
    const response = await messaging.unsubscribeFromTopic(tokens, topic);
    console.log(`토픽 구독 해제 성공 [${topic}]:`, response);
    return response;
  } catch (error) {
    console.error(`토픽 구독 해제 실패 [${topic}]:`, error);
    throw error;
  }
}

export default firebaseAdmin;
