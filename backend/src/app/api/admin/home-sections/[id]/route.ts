import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { HomeSectionType } from '@prisma/client';

type Params = Promise<{ id: string }>;

// ============================================
// GET /api/admin/home-sections/:id - 홈 섹션 상세 조회
// ============================================
export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { id } = await params;

    const section = await prisma.homeSection.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!section) {
      return NextResponse.json(
        { success: false, error: '섹션을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: section,
    });
  } catch (error) {
    console.error('GET /api/admin/home-sections/:id error:', error);
    return NextResponse.json(
      { success: false, error: '섹션 조회에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// ============================================
// PUT /api/admin/home-sections/:id - 홈 섹션 수정
// ============================================
export async function PUT(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // 섹션 존재 확인
    const existingSection = await prisma.homeSection.findUnique({
      where: { id },
    });

    if (!existingSection) {
      return NextResponse.json(
        { success: false, error: '섹션을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 타입 검증 (변경 시)
    if (body.type) {
      const validTypes = Object.values(HomeSectionType);
      if (!validTypes.includes(body.type)) {
        return NextResponse.json(
          { success: false, error: `유효하지 않은 섹션 타입입니다. 허용: ${validTypes.join(', ')}` },
          { status: 400 }
        );
      }
    }

    // 업데이트할 필드만 추출
    const updateData: any = {};

    if (body.type !== undefined) updateData.type = body.type as HomeSectionType;
    if (body.title !== undefined) updateData.title = body.title;
    if (body.subtitle !== undefined) updateData.subtitle = body.subtitle;
    if (body.sortOrder !== undefined) updateData.sortOrder = body.sortOrder;
    if (body.isVisible !== undefined) updateData.isVisible = body.isVisible;
    if (body.showMoreButton !== undefined) updateData.showMoreButton = body.showMoreButton;
    if (body.moreButtonTarget !== undefined) updateData.moreButtonTarget = body.moreButtonTarget;
    if (body.config !== undefined) updateData.config = body.config;

    const section = await prisma.homeSection.update({
      where: { id },
      data: updateData,
      include: {
        items: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: section,
      message: '섹션이 수정되었습니다.',
    });
  } catch (error) {
    console.error('PUT /api/admin/home-sections/:id error:', error);
    return NextResponse.json(
      { success: false, error: '섹션 수정에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE /api/admin/home-sections/:id - 홈 섹션 삭제
// ============================================
export async function DELETE(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { id } = await params;

    // 섹션 존재 확인
    const existingSection = await prisma.homeSection.findUnique({
      where: { id },
      include: {
        _count: {
          select: { items: true },
        },
      },
    });

    if (!existingSection) {
      return NextResponse.json(
        { success: false, error: '섹션을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 섹션과 관련 아이템 삭제 (cascade)
    await prisma.homeSection.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: `섹션이 삭제되었습니다. (연결된 아이템 ${existingSection._count.items}개 함께 삭제)`,
    });
  } catch (error) {
    console.error('DELETE /api/admin/home-sections/:id error:', error);
    return NextResponse.json(
      { success: false, error: '섹션 삭제에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// ============================================
// PATCH /api/admin/home-sections/:id - 부분 수정 (토글 등)
// ============================================
export async function PATCH(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const section = await prisma.homeSection.update({
      where: { id },
      data: body,
      include: {
        items: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: section,
    });
  } catch (error) {
    console.error('PATCH /api/admin/home-sections/:id error:', error);
    return NextResponse.json(
      { success: false, error: '섹션 수정에 실패했습니다.' },
      { status: 500 }
    );
  }
}
