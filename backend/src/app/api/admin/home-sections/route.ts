import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { HomeSectionType } from '@prisma/client';

// ============================================
// GET /api/admin/home-sections - 홈 섹션 목록 조회
// ============================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeItems = searchParams.get('includeItems') === 'true';
    const visibleOnly = searchParams.get('visibleOnly') === 'true';

    const where: any = {};
    if (visibleOnly) {
      where.isVisible = true;
    }

    const sections = await prisma.homeSection.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
      include: includeItems ? {
        items: {
          orderBy: { sortOrder: 'asc' },
        },
      } : undefined,
    });

    return NextResponse.json({
      success: true,
      data: sections,
    });
  } catch (error) {
    console.error('GET /api/admin/home-sections error:', error);
    return NextResponse.json(
      { success: false, error: '홈 섹션 목록을 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/admin/home-sections - 홈 섹션 생성
// ============================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 필수 필드 검증
    if (!body.type) {
      return NextResponse.json(
        { success: false, error: '섹션 타입은 필수입니다.' },
        { status: 400 }
      );
    }

    // 타입 검증
    const validTypes = Object.values(HomeSectionType);
    if (!validTypes.includes(body.type)) {
      return NextResponse.json(
        { success: false, error: `유효하지 않은 섹션 타입입니다. 허용: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // 마지막 sortOrder 가져오기
    const lastSection = await prisma.homeSection.findFirst({
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });
    const newSortOrder = (lastSection?.sortOrder ?? -1) + 1;

    // 섹션 생성
    const section = await prisma.homeSection.create({
      data: {
        type: body.type as HomeSectionType,
        title: body.title,
        subtitle: body.subtitle,
        sortOrder: body.sortOrder ?? newSortOrder,
        isVisible: body.isVisible ?? true,
        showMoreButton: body.showMoreButton ?? false,
        moreButtonTarget: body.moreButtonTarget,
        config: body.config,
      },
      include: {
        items: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: section,
        message: '홈 섹션이 생성되었습니다.',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/admin/home-sections error:', error);
    return NextResponse.json(
      { success: false, error: '홈 섹션 생성에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// ============================================
// PUT /api/admin/home-sections - 순서 일괄 변경
// ============================================
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    // body.sections: [{ id: string, sortOrder: number }]
    if (!body.sections || !Array.isArray(body.sections)) {
      return NextResponse.json(
        { success: false, error: 'sections 배열이 필요합니다.' },
        { status: 400 }
      );
    }

    // 트랜잭션으로 순서 업데이트
    await prisma.$transaction(
      body.sections.map((item: { id: string; sortOrder: number }) =>
        prisma.homeSection.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder },
        })
      )
    );

    // 업데이트된 목록 반환
    const sections = await prisma.homeSection.findMany({
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: sections,
      message: '순서가 변경되었습니다.',
    });
  } catch (error) {
    console.error('PUT /api/admin/home-sections error:', error);
    return NextResponse.json(
      { success: false, error: '순서 변경에 실패했습니다.' },
      { status: 500 }
    );
  }
}
