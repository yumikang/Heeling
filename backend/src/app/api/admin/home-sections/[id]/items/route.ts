import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type Params = Promise<{ id: string }>;

// ============================================
// GET /api/admin/home-sections/:id/items - 섹션 아이템 목록
// ============================================
export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { id: sectionId } = await params;

    // 섹션 존재 확인
    const section = await prisma.homeSection.findUnique({
      where: { id: sectionId },
    });

    if (!section) {
      return NextResponse.json(
        { success: false, error: '섹션을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const items = await prisma.homeSectionItem.findMany({
      where: { sectionId },
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: items,
    });
  } catch (error) {
    console.error('GET /api/admin/home-sections/:id/items error:', error);
    return NextResponse.json(
      { success: false, error: '아이템 목록 조회에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/admin/home-sections/:id/items - 섹션 아이템 추가
// ============================================
export async function POST(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { id: sectionId } = await params;
    const body = await request.json();

    // 섹션 존재 확인
    const section = await prisma.homeSection.findUnique({
      where: { id: sectionId },
    });

    if (!section) {
      return NextResponse.json(
        { success: false, error: '섹션을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 마지막 sortOrder 가져오기
    const lastItem = await prisma.homeSectionItem.findFirst({
      where: { sectionId },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });
    const newSortOrder = (lastItem?.sortOrder ?? -1) + 1;

    // 필수 필드 검증
    if (!body.itemType) {
      return NextResponse.json(
        { success: false, error: 'itemType은 필수입니다.' },
        { status: 400 }
      );
    }

    // 아이템 생성
    const item = await prisma.homeSectionItem.create({
      data: {
        sectionId,
        itemType: body.itemType,
        itemId: body.itemId,
        sortOrder: body.sortOrder ?? newSortOrder,
        config: body.config,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: item,
        message: '아이템이 추가되었습니다.',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/admin/home-sections/:id/items error:', error);
    return NextResponse.json(
      { success: false, error: '아이템 추가에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// ============================================
// PUT /api/admin/home-sections/:id/items - 아이템 순서 일괄 변경
// ============================================
export async function PUT(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { id: sectionId } = await params;
    const body = await request.json();

    // 섹션 존재 확인
    const section = await prisma.homeSection.findUnique({
      where: { id: sectionId },
    });

    if (!section) {
      return NextResponse.json(
        { success: false, error: '섹션을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // body.items: [{ id: string, sortOrder: number }]
    if (!body.items || !Array.isArray(body.items)) {
      return NextResponse.json(
        { success: false, error: 'items 배열이 필요합니다.' },
        { status: 400 }
      );
    }

    // 트랜잭션으로 순서 업데이트
    await prisma.$transaction(
      body.items.map((item: { id: string; sortOrder: number }) =>
        prisma.homeSectionItem.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder },
        })
      )
    );

    // 업데이트된 목록 반환
    const items = await prisma.homeSectionItem.findMany({
      where: { sectionId },
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: items,
      message: '순서가 변경되었습니다.',
    });
  } catch (error) {
    console.error('PUT /api/admin/home-sections/:id/items error:', error);
    return NextResponse.json(
      { success: false, error: '순서 변경에 실패했습니다.' },
      { status: 500 }
    );
  }
}
