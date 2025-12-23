import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PushTargetType, PushStatus } from '@prisma/client';

// ============================================
// GET /api/admin/push - 푸시 발송 이력 조회
// ============================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const targetType = searchParams.get('targetType');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = {};

    if (status && Object.values(PushStatus).includes(status as PushStatus)) {
      where.status = status;
    }

    if (targetType && Object.values(PushTargetType).includes(targetType as PushTargetType)) {
      where.targetType = targetType;
    }

    const [histories, total] = await Promise.all([
      prisma.pushHistory.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.pushHistory.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: histories,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('GET /api/admin/push error:', error);
    return NextResponse.json(
      { success: false, error: '발송 이력 조회에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/admin/push - 푸시 알림 발송
// ============================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 필수 필드 검증
    if (!body.title || !body.body) {
      return NextResponse.json(
        { success: false, error: '제목과 내용은 필수입니다.' },
        { status: 400 }
      );
    }

    // targetType 검증
    const targetType = body.targetType || 'ALL';
    if (!Object.values(PushTargetType).includes(targetType as PushTargetType)) {
      return NextResponse.json(
        { success: false, error: `유효하지 않은 타겟 타입입니다. 허용: ${Object.values(PushTargetType).join(', ')}` },
        { status: 400 }
      );
    }

    // TOPIC 타입일 경우 targetValue 필수
    if (targetType === 'TOPIC' && !body.targetValue) {
      return NextResponse.json(
        { success: false, error: 'TOPIC 타입은 토픽명(targetValue)이 필요합니다.' },
        { status: 400 }
      );
    }

    // 예약 발송 여부
    const isScheduled = body.scheduledAt ? new Date(body.scheduledAt) > new Date() : false;

    // 푸시 이력 생성
    const pushHistory = await prisma.pushHistory.create({
      data: {
        title: body.title,
        body: body.body,
        targetType: targetType as PushTargetType,
        targetValue: body.targetValue || null,
        imageUrl: body.imageUrl || null,
        linkType: body.linkType || null,
        linkTarget: body.linkTarget || null,
        status: isScheduled ? 'SCHEDULED' : 'SENDING',
        scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
        createdBy: body.createdBy || null,
      },
    });

    // 즉시 발송인 경우 FCM 발송 시도
    if (!isScheduled) {
      try {
        // FCM 발송 (현재는 시뮬레이션)
        const result = await sendPushNotification({
          title: body.title,
          body: body.body,
          targetType: targetType as PushTargetType,
          targetValue: body.targetValue,
          imageUrl: body.imageUrl,
          data: {
            linkType: body.linkType,
            linkTarget: body.linkTarget,
          },
        });

        // 결과 업데이트
        await prisma.pushHistory.update({
          where: { id: pushHistory.id },
          data: {
            status: result.success ? 'COMPLETED' : 'FAILED',
            sentAt: new Date(),
            sentCount: result.sentCount || 0,
            successCount: result.successCount || 0,
            failCount: result.failCount || 0,
          },
        });

        return NextResponse.json({
          success: true,
          data: {
            ...pushHistory,
            ...result,
          },
          message: '푸시 알림이 발송되었습니다.',
        });
      } catch (sendError) {
        console.error('FCM send error:', sendError);

        await prisma.pushHistory.update({
          where: { id: pushHistory.id },
          data: {
            status: 'FAILED',
            sentAt: new Date(),
          },
        });

        return NextResponse.json({
          success: false,
          error: '푸시 알림 발송에 실패했습니다.',
          data: pushHistory,
        }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      data: pushHistory,
      message: isScheduled ? '푸시 알림이 예약되었습니다.' : '푸시 알림이 발송 중입니다.',
    });
  } catch (error) {
    console.error('POST /api/admin/push error:', error);
    return NextResponse.json(
      { success: false, error: '푸시 알림 생성에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// ============================================
// FCM 발송 함수 (Firebase Admin SDK 연동 예정)
// ============================================
interface SendPushParams {
  title: string;
  body: string;
  targetType: PushTargetType;
  targetValue?: string | null;
  imageUrl?: string | null;
  data?: Record<string, string | undefined | null>;
}

interface SendPushResult {
  success: boolean;
  sentCount: number;
  successCount: number;
  failCount: number;
  messageId?: string;
  error?: string;
}

async function sendPushNotification(params: SendPushParams): Promise<SendPushResult> {
  // TODO: Firebase Admin SDK 연동
  // 현재는 시뮬레이션으로 성공 반환

  // FCM 토픽 매핑
  const topicMap: Record<string, string> = {
    ALL: 'all_users',
    PERSONAL: 'personal_users',
    BUSINESS: 'business_users',
  };

  const topic = params.targetType === 'TOPIC'
    ? params.targetValue
    : topicMap[params.targetType] || 'all_users';

  console.log('Simulated FCM Send:', {
    topic,
    notification: {
      title: params.title,
      body: params.body,
      imageUrl: params.imageUrl,
    },
    data: params.data,
  });

  // 시뮬레이션 - 실제 FCM 연동 시 아래 코드 활성화
  /*
  const admin = require('firebase-admin');

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  }

  const message = {
    notification: {
      title: params.title,
      body: params.body,
      ...(params.imageUrl && { imageUrl: params.imageUrl }),
    },
    data: Object.fromEntries(
      Object.entries(params.data || {}).filter(([_, v]) => v != null)
    ),
    topic,
  };

  const response = await admin.messaging().send(message);
  */

  // 시뮬레이션 결과
  return {
    success: true,
    sentCount: 1,
    successCount: 1,
    failCount: 0,
    messageId: `simulated-${Date.now()}`,
  };
}
