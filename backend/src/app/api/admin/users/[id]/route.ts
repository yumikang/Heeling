import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SubscriptionTier, UserType } from '@prisma/client';

type Params = Promise<{ id: string }>;

// ============================================
// GET /api/admin/users/:id - 회원 상세 조회
// ============================================
export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        userType: true,
        occupation: true,
        businessType: true,
        preferredThemes: true,
        subscriptionTier: true,
        subscriptionEndDate: true,
        adFreeUntil: true,
        onboardingCompleted: true,
        createdAt: true,
        updatedAt: true,
        // 재생 이력 (최근 10개)
        playHistories: {
          select: {
            id: true,
            playedAt: true,
            completionRate: true,
            listenDuration: true,
            track: {
              select: {
                id: true,
                title: true,
                artist: true,
                thumbnailUrl: true,
                duration: true,
              },
            },
          },
          orderBy: { playedAt: 'desc' },
          take: 10,
        },
        // 즐겨찾기 (최근 10개)
        favorites: {
          select: {
            id: true,
            createdAt: true,
            track: {
              select: {
                id: true,
                title: true,
                artist: true,
                thumbnailUrl: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        // 구독 이력
        subscriptions: {
          select: {
            id: true,
            planType: true,
            status: true,
            startedAt: true,
            expiresAt: true,
            canceledAt: true,
            amount: true,
            currency: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        // 통계
        _count: {
          select: {
            playHistories: true,
            favorites: true,
            subscriptions: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: '회원을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 추가 통계 계산
    const [totalListenTime, uniqueTracksPlayed] = await Promise.all([
      prisma.playHistory.aggregate({
        where: { userId: id },
        _sum: { listenDuration: true },
      }),
      prisma.playHistory.groupBy({
        by: ['trackId'],
        where: { userId: id },
      }).then(result => result.length),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        ...user,
        stats: {
          totalPlayCount: user._count.playHistories,
          totalFavorites: user._count.favorites,
          totalListenTime: totalListenTime._sum.listenDuration || 0,
          uniqueTracksPlayed,
        },
      },
    });
  } catch (error) {
    console.error('GET /api/admin/users/:id error:', error);
    return NextResponse.json(
      { success: false, error: '회원 조회에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// ============================================
// PATCH /api/admin/users/:id - 회원 정보 수정
// ============================================
export async function PATCH(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // 허용된 필드만 업데이트
    const allowedFields = ['name', 'userType', 'subscriptionTier', 'subscriptionEndDate', 'adFreeUntil'];
    const updateData: any = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (field === 'subscriptionEndDate' || field === 'adFreeUntil') {
          updateData[field] = body[field] ? new Date(body[field]) : null;
        } else if (field === 'userType') {
          if (Object.values(UserType).includes(body[field])) {
            updateData[field] = body[field];
          }
        } else if (field === 'subscriptionTier') {
          if (Object.values(SubscriptionTier).includes(body[field])) {
            updateData[field] = body[field];
          }
        } else {
          updateData[field] = body[field];
        }
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        userType: true,
        subscriptionTier: true,
        subscriptionEndDate: true,
        adFreeUntil: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: user,
      message: '회원 정보가 수정되었습니다.',
    });
  } catch (error) {
    console.error('PATCH /api/admin/users/:id error:', error);
    return NextResponse.json(
      { success: false, error: '회원 정보 수정에 실패했습니다.' },
      { status: 500 }
    );
  }
}
