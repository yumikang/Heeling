import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type Params = Promise<{ id: string }>;

// ============================================
// GET /api/admin/categories/:id - 카테고리 상세 조회
// ============================================
export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { id } = await params;

    const category = await prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      return NextResponse.json(
        { success: false, error: '카테고리를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error('GET /api/admin/categories/:id error:', error);
    return NextResponse.json(
      { success: false, error: '카테고리 조회에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// ============================================
// PUT /api/admin/categories/:id - 카테고리 수정
// ============================================
export async function PUT(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // 카테고리 존재 확인
    const existingCategory = await prisma.category.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      return NextResponse.json(
        { success: false, error: '카테고리를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // slug 변경 시 중복 검사
    if (body.slug && body.slug !== existingCategory.slug) {
      const slugExists = await prisma.category.findUnique({
        where: { slug: body.slug },
      });

      if (slugExists) {
        return NextResponse.json(
          { success: false, error: '이미 존재하는 slug입니다.' },
          { status: 400 }
        );
      }
    }

    // 업데이트할 필드만 추출
    const updateData: any = {};

    if (body.slug !== undefined) updateData.slug = body.slug;
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.icon !== undefined) updateData.icon = body.icon;
    if (body.color !== undefined) updateData.color = body.color;
    if (body.sortOrder !== undefined) updateData.sortOrder = body.sortOrder;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    const category = await prisma.category.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: category,
      message: '카테고리가 수정되었습니다.',
    });
  } catch (error) {
    console.error('PUT /api/admin/categories/:id error:', error);
    return NextResponse.json(
      { success: false, error: '카테고리 수정에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE /api/admin/categories/:id - 카테고리 삭제
// ============================================
export async function DELETE(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { id } = await params;

    // 카테고리 존재 확인
    const existingCategory = await prisma.category.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      return NextResponse.json(
        { success: false, error: '카테고리를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    await prisma.category.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: '카테고리가 삭제되었습니다.',
    });
  } catch (error) {
    console.error('DELETE /api/admin/categories/:id error:', error);
    return NextResponse.json(
      { success: false, error: '카테고리 삭제에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// ============================================
// PATCH /api/admin/categories/:id - 부분 수정 (토글 등)
// ============================================
export async function PATCH(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const category = await prisma.category.update({
      where: { id },
      data: body,
    });

    return NextResponse.json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error('PATCH /api/admin/categories/:id error:', error);
    return NextResponse.json(
      { success: false, error: '카테고리 수정에 실패했습니다.' },
      { status: 500 }
    );
  }
}
