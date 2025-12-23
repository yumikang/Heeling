/**
 * /api/push/topics - 토픽 구독 관리 API
 *
 * FCM 토픽 구독/구독 해제를 처리합니다.
 * 앱에서 디바이스 토큰과 함께 호출하여 토픽을 관리합니다.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  subscribeToTopic,
  unsubscribeFromTopic,
  FCM_TOPICS,
  type FCMTopic,
} from '@/lib/firebase-admin';

// 유효한 토픽 목록
const VALID_TOPICS = Object.values(FCM_TOPICS);

// 요청 바디 타입
interface TopicRequest {
  // FCM 디바이스 토큰 (필수)
  token: string;

  // 구독할 토픽 (단일 또는 배열)
  topic?: FCMTopic;
  topics?: FCMTopic[];
}

// POST /api/push/topics - 토픽 구독
export async function POST(request: NextRequest) {
  try {
    const body: TopicRequest = await request.json();

    // 토큰 검증
    if (!body.token) {
      return NextResponse.json(
        { success: false, error: 'FCM 토큰이 필요합니다.' },
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

    const topicsToSubscribe = body.topics || [body.topic!];
    const invalidTopics = topicsToSubscribe.filter(t => !VALID_TOPICS.includes(t));

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

    // 각 토픽에 구독
    const results = await Promise.allSettled(
      topicsToSubscribe.map(topic => subscribeToTopic([body.token], topic))
    );

    const subscriptionResults = results.map((result, index) => ({
      topic: topicsToSubscribe[index],
      success: result.status === 'fulfilled',
      successCount:
        result.status === 'fulfilled' ? result.value.successCount : 0,
      failureCount:
        result.status === 'fulfilled' ? result.value.failureCount : 1,
      error: result.status === 'rejected' ? String(result.reason) : undefined,
    }));

    const allSuccess = subscriptionResults.every(r => r.success && r.failureCount === 0);

    return NextResponse.json({
      success: allSuccess,
      data: {
        results: subscriptionResults,
        subscribedTopics: subscriptionResults
          .filter(r => r.success && r.failureCount === 0)
          .map(r => r.topic),
      },
    });
  } catch (error) {
    console.error('POST /api/push/topics error:', error);
    return NextResponse.json(
      { success: false, error: '토픽 구독에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// DELETE /api/push/topics - 토픽 구독 해제
export async function DELETE(request: NextRequest) {
  try {
    const body: TopicRequest = await request.json();

    // 토큰 검증
    if (!body.token) {
      return NextResponse.json(
        { success: false, error: 'FCM 토큰이 필요합니다.' },
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

    const topicsToUnsubscribe = body.topics || [body.topic!];
    const invalidTopics = topicsToUnsubscribe.filter(t => !VALID_TOPICS.includes(t));

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

    // 각 토픽에서 구독 해제
    const results = await Promise.allSettled(
      topicsToUnsubscribe.map(topic => unsubscribeFromTopic([body.token], topic))
    );

    const unsubscriptionResults = results.map((result, index) => ({
      topic: topicsToUnsubscribe[index],
      success: result.status === 'fulfilled',
      successCount:
        result.status === 'fulfilled' ? result.value.successCount : 0,
      failureCount:
        result.status === 'fulfilled' ? result.value.failureCount : 1,
      error: result.status === 'rejected' ? String(result.reason) : undefined,
    }));

    const allSuccess = unsubscriptionResults.every(r => r.success && r.failureCount === 0);

    return NextResponse.json({
      success: allSuccess,
      data: {
        results: unsubscriptionResults,
        unsubscribedTopics: unsubscriptionResults
          .filter(r => r.success && r.failureCount === 0)
          .map(r => r.topic),
      },
    });
  } catch (error) {
    console.error('DELETE /api/push/topics error:', error);
    return NextResponse.json(
      { success: false, error: '토픽 구독 해제에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// GET /api/push/topics - 사용 가능한 토픽 목록
export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      availableTopics: VALID_TOPICS,
      topicDescriptions: {
        [FCM_TOPICS.ALL_USERS]: '모든 사용자 (기본 구독)',
        [FCM_TOPICS.MARKETING]: '마케팅 알림 (설정에서 동의 시)',
        [FCM_TOPICS.PERSONAL]: '개인 사용자 그룹',
        [FCM_TOPICS.BUSINESS]: '직장인 사용자 그룹',
      },
      usage: {
        subscribe: 'POST /api/push/topics { token, topic | topics }',
        unsubscribe: 'DELETE /api/push/topics { token, topic | topics }',
      },
    },
  });
}
