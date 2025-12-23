/**
 * POST /api/push/send - 푸시 알림 발송 API
 *
 * 토픽 기반 FCM 푸시 알림을 발송합니다.
 * 관리자 전용 API로, 실제 운영 시 인증 미들웨어 추가 필요
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  sendToTopic,
  sendToMultipleTopics,
  FCM_TOPICS,
  type FCMTopic,
} from '@/lib/firebase-admin';

// 유효한 토픽 목록
const VALID_TOPICS = Object.values(FCM_TOPICS);

// 요청 바디 타입
interface SendPushRequest {
  // 단일 토픽 또는 토픽 배열
  topic?: FCMTopic;
  topics?: FCMTopic[];

  // 알림 내용
  title: string;
  body: string;

  // 선택적 데이터
  data?: Record<string, string>;
  imageUrl?: string;
}

// POST /api/push/send - 푸시 발송
export async function POST(request: NextRequest) {
  try {
    // TODO: 실제 운영 시 관리자 인증 추가
    // const authHeader = request.headers.get('authorization');
    // if (!isValidAdminToken(authHeader)) {
    //   return NextResponse.json(
    //     { success: false, error: '인증이 필요합니다.' },
    //     { status: 401 }
    //   );
    // }

    const body: SendPushRequest = await request.json();

    // 필수 필드 검증
    if (!body.title || !body.body) {
      return NextResponse.json(
        { success: false, error: 'title과 body는 필수입니다.' },
        { status: 400 }
      );
    }

    // 토픽 검증
    if (!body.topic && (!body.topics || body.topics.length === 0)) {
      return NextResponse.json(
        { success: false, error: 'topic 또는 topics가 필요합니다.' },
        { status: 400 }
      );
    }

    // 토픽 유효성 검사
    const topicsToSend = body.topics || [body.topic!];
    const invalidTopics = topicsToSend.filter(t => !VALID_TOPICS.includes(t));

    if (invalidTopics.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `유효하지 않은 토픽: ${invalidTopics.join(', ')}`,
          validTopics: VALID_TOPICS,
        },
        { status: 400 }
      );
    }

    // 단일 토픽 발송
    if (topicsToSend.length === 1) {
      const messageId = await sendToTopic(
        topicsToSend[0],
        body.title,
        body.body,
        body.data,
        body.imageUrl
      );

      return NextResponse.json({
        success: true,
        data: {
          messageId,
          topic: topicsToSend[0],
          sentAt: new Date().toISOString(),
        },
      });
    }

    // 다중 토픽 발송
    const results = await sendToMultipleTopics(
      topicsToSend,
      body.title,
      body.body,
      body.data,
      body.imageUrl
    );

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    return NextResponse.json({
      success: failCount === 0,
      data: {
        results,
        summary: {
          total: results.length,
          success: successCount,
          failed: failCount,
        },
        sentAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('POST /api/push/send error:', error);

    // Firebase 관련 에러 처리
    const errorMessage =
      error instanceof Error ? error.message : '푸시 발송에 실패했습니다.';

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

// GET /api/push/send - 사용 가능한 토픽 목록 조회
export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      availableTopics: VALID_TOPICS,
      topicDescriptions: {
        [FCM_TOPICS.ALL_USERS]: '모든 사용자',
        [FCM_TOPICS.MARKETING]: '마케팅 알림 동의 사용자',
        [FCM_TOPICS.PERSONAL]: '개인 사용자',
        [FCM_TOPICS.BUSINESS]: '직장인 사용자',
      },
    },
  });
}
