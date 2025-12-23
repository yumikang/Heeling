import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type Params = Promise<{ id: string; itemId: string }>;

// ============================================
// GET /api/admin/home-sections/:id/items/:itemId - 아이템 상세
// ============================================
export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { id: sectionId, itemId } = await params;

    const item = await prisma.homeSectionItem.findFirst({
      where: {
        id: itemId,
        sectionId,
      },
    });

    if (!item) {
      return NextResponse.json(
        { success: false, error: '아이템을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: item,
    });
  } catch (error) {
    console.error('GET /api/admin/home-sections/:id/items/:itemId error:', error);
    return NextResponse.json(
      { success: false, error: '아이템 조회에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// ============================================
// PUT /api/admin/home-sections/:id/items/:itemId - 아이템 수정
// ============================================
export async function PUT(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { id: sectionId, itemId } = await params;
    const body = await request.json();

    // 아이템 존재 확인
    const existingItem = await prisma.homeSectionItem.findFirst({
      where: {
        id: itemId,
        sectionId,
      },
    });

    if (!existingItem) {
      return NextResponse.json(
        { success: false, error: '아이템을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 업데이트할 필드만 추출
    const updateData: any = {};

    if (body.itemType !== undefined) updateData.itemType = body.itemType;
    if (body.itemId !== undefined) updateData.itemId = body.itemId;
    if (body.sortOrder !== undefined) updateData.sortOrder = body.sortOrder;
    if (body.config !== undefined) updateData.config = body.config;

    const item = await prisma.homeSectionItem.update({
      where: { id: itemId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: item,
      message: '아이템이 수정되었습니다.',
    });
  } catch (error) {
    console.error('PUT /api/admin/home-sections/:id/items/:itemId error:', error);
    return NextResponse.json(
      { success: false, error: '아이템 수정에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE /api/admin/home-sections/:id/items/:itemId - 아이템 삭제
// ============================================
export async function DELETE(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { id: sectionId, itemId } = await params;

    // 아이템 존재 확인
    const existingItem = await prisma.homeSectionItem.findFirst({
      where: {
        id: itemId,
        sectionId,
      },
    });

    if (!existingItem) {
      return NextResponse.json(
        { success: false, error: '아이템을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    await prisma.homeSectionItem.delete({
      where: { id: itemId },
    });

    return NextResponse.json({
      success: true,
      message: '아이템이 삭제되었습니다.',
    });
  } catch (error) {
    console.error('DELETE /api/admin/home-sections/:id/items/:itemId error:', error);
    return NextResponse.json(
      { success: false, error: '아이템 삭제에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// ============================================
// PATCH /api/admin/home-sections/:id/items/:itemId - 부분 수정
// ============================================
export async function PATCH(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { id: sectionId, itemId } = await params;
    const body = await request.json();

    // 아이템 존재 확인
    const existingItem = await prisma.homeSectionItem.findFirst({
      where: {
        id: itemId,
        sectionId,
      },
    });

    if (!existingItem) {
      return NextResponse.json(
        { success: false, error: '아이템을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const item = await prisma.homeSectionItem.update({
      where: { id: itemId },
      data: body,
    });

    return NextResponse.json({
      success: true,
      data: item,
    });
  } catch (error) {
    console.error('PATCH /api/admin/home-sections/:id/items/:itemId error:', error);
    return NextResponse.json(
      { success: false, error: '아이템 수정에 실패했습니다.' },
      { status: 500 }
    );
  }
}
