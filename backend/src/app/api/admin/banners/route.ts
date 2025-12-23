import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { BannerType } from '@prisma/client';

// ============================================
// GET /api/admin/banners - 배너 목록 조회
// ============================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const activeOnly = searchParams.get('activeOnly') === 'true';

    const where: any = {};

    if (type) {
      where.type = type as BannerType;
    }

    if (activeOnly) {
      where.isActive = true;
      // 현재 시간 기준 노출 기간 체크
      const now = new Date();
      where.OR = [
        { startDate: null, endDate: null },
        { startDate: { lte: now }, endDate: null },
        { startDate: null, endDate: { gte: now } },
        { startDate: { lte: now }, endDate: { gte: now } },
      ];
    }

    const banners = await prisma.banner.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: banners,
    });
  } catch (error) {
    console.error('GET /api/admin/banners error:', error);
    return NextResponse.json(
      { success: false, error: '배너 목록을 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/admin/banners - 배너 생성
// ============================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 필수 필드 검증
    if (!body.type || !body.title || !body.imageUrl) {
      return NextResponse.json(
        { success: false, error: 'type, title, imageUrl은 필수입니다.' },
        { status: 400 }
      );
    }

    // 타입 검증
    const validTypes = Object.values(BannerType);
    if (!validTypes.includes(body.type)) {
      return NextResponse.json(
        { success: false, error: `유효하지 않은 배너 타입입니다. 허용: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // 마지막 sortOrder 가져오기
    const lastBanner = await prisma.banner.findFirst({
      where: { type: body.type },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });
    const newSortOrder = (lastBanner?.sortOrder ?? -1) + 1;

    // 배너 생성
    const banner = await prisma.banner.create({
      data: {
        type: body.type as BannerType,
        title: body.title,
        subtitle: body.subtitle,
        imageUrl: body.imageUrl,
        linkType: body.linkType,
        linkTarget: body.linkTarget,
        backgroundColor: body.backgroundColor,
        sortOrder: body.sortOrder ?? newSortOrder,
        isActive: body.isActive ?? true,
        startDate: body.startDate ? new Date(body.startDate) : null,
        endDate: body.endDate ? new Date(body.endDate) : null,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: banner,
        message: '배너가 생성되었습니다.',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/admin/banners error:', error);
    return NextResponse.json(
      { success: false, error: '배너 생성에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// ============================================
// PUT /api/admin/banners - 순서 일괄 변경
// ============================================
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    // body.banners: [{ id: string, sortOrder: number }]
    if (!body.banners || !Array.isArray(body.banners)) {
      return NextResponse.json(
        { success: false, error: 'banners 배열이 필요합니다.' },
        { status: 400 }
      );
    }

    // 트랜잭션으로 순서 업데이트
    await prisma.$transaction(
      body.banners.map((item: { id: string; sortOrder: number }) =>
        prisma.banner.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder },
        })
      )
    );

    // 업데이트된 목록 반환
    const banners = await prisma.banner.findMany({
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: banners,
      message: '순서가 변경되었습니다.',
    });
  } catch (error) {
    console.error('PUT /api/admin/banners error:', error);
    return NextResponse.json(
      { success: false, error: '순서 변경에 실패했습니다.' },
      { status: 500 }
    );
  }
}
