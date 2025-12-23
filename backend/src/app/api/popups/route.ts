import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateETag, shouldReturn304, getETagHeaders, generateETagFromDates } from '@/lib/etag';
import { PopupType, UserType } from '@prisma/client';

// ============================================
// GET /api/popups - 앱용 활성 팝업 조회
// ============================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const userType = searchParams.get('userType'); // PERSONAL, BUSINESS, GUEST

    const now = new Date();

    const where: any = {
      isActive: true,
      OR: [
        { startDate: null },
        { startDate: { lte: now } },
      ],
      AND: [
        {
          OR: [
            { endDate: null },
            { endDate: { gte: now } },
          ],
        },
      ],
    };

    // 타입 필터
    if (type && Object.values(PopupType).includes(type as PopupType)) {
      where.type = type;
    }

    // 사용자 타입 필터 (null 또는 일치하는 것만)
    if (userType && Object.values(UserType).includes(userType as UserType)) {
      where.AND.push({
        OR: [
          { targetUserType: null },
          { targetUserType: userType },
        ],
      });
    }

    const popups = await prisma.popup.findMany({
      where,
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        type: true,
        title: true,
        content: true,
        imageUrl: true,
        linkType: true,
        linkTarget: true,
        priority: true,
        showOnce: true,
        startDate: true,
        endDate: true,
      },
    });

    // ETag 생성
    const etag = generateETag({
      popups: popups.map(p => p.id).join(','),
      type,
      userType,
      timestamp: Math.floor(Date.now() / 60000), // 1분 단위
    });

    // 304 응답 체크
    const ifNoneMatch = request.headers.get('If-None-Match');
    if (shouldReturn304(ifNoneMatch, etag)) {
      return new NextResponse(null, {
        status: 304,
        headers: getETagHeaders(etag, 60), // 1분 캐시
      });
    }

    return NextResponse.json(
      {
        success: true,
        data: popups,
        meta: {
          count: popups.length,
          syncedAt: now.toISOString(),
        },
      },
      {
        headers: getETagHeaders(etag, 60),
      }
    );
  } catch (error) {
    console.error('GET /api/popups error:', error);
    return NextResponse.json(
      { success: false, error: '팝업 조회에 실패했습니다.' },
      { status: 500 }
    );
  }
}
