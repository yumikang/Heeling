import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { BannerType } from '@prisma/client';

type Params = Promise<{ id: string }>;

// ============================================
// GET /api/admin/banners/:id - 배너 상세 조회
// ============================================
export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { id } = await params;

    const banner = await prisma.banner.findUnique({
      where: { id },
    });

    if (!banner) {
      return NextResponse.json(
        { success: false, error: '배너를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: banner,
    });
  } catch (error) {
    console.error('GET /api/admin/banners/:id error:', error);
    return NextResponse.json(
      { success: false, error: '배너 조회에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// ============================================
// PUT /api/admin/banners/:id - 배너 수정
// ============================================
export async function PUT(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // 배너 존재 확인
    const existingBanner = await prisma.banner.findUnique({
      where: { id },
    });

    if (!existingBanner) {
      return NextResponse.json(
        { success: false, error: '배너를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 타입 검증 (변경 시)
    if (body.type) {
      const validTypes = Object.values(BannerType);
      if (!validTypes.includes(body.type)) {
        return NextResponse.json(
          { success: false, error: `유효하지 않은 배너 타입입니다. 허용: ${validTypes.join(', ')}` },
          { status: 400 }
        );
      }
    }

    // 업데이트할 필드만 추출
    const updateData: any = {};

    if (body.type !== undefined) updateData.type = body.type as BannerType;
    if (body.title !== undefined) updateData.title = body.title;
    if (body.subtitle !== undefined) updateData.subtitle = body.subtitle;
    if (body.imageUrl !== undefined) updateData.imageUrl = body.imageUrl;
    if (body.linkType !== undefined) updateData.linkType = body.linkType;
    if (body.linkTarget !== undefined) updateData.linkTarget = body.linkTarget;
    if (body.backgroundColor !== undefined) updateData.backgroundColor = body.backgroundColor;
    if (body.sortOrder !== undefined) updateData.sortOrder = body.sortOrder;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    if (body.startDate !== undefined) updateData.startDate = body.startDate ? new Date(body.startDate) : null;
    if (body.endDate !== undefined) updateData.endDate = body.endDate ? new Date(body.endDate) : null;

    const banner = await prisma.banner.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: banner,
      message: '배너가 수정되었습니다.',
    });
  } catch (error) {
    console.error('PUT /api/admin/banners/:id error:', error);
    return NextResponse.json(
      { success: false, error: '배너 수정에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE /api/admin/banners/:id - 배너 삭제
// ============================================
export async function DELETE(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { id } = await params;

    // 배너 존재 확인
    const existingBanner = await prisma.banner.findUnique({
      where: { id },
    });

    if (!existingBanner) {
      return NextResponse.json(
        { success: false, error: '배너를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    await prisma.banner.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: '배너가 삭제되었습니다.',
    });
  } catch (error) {
    console.error('DELETE /api/admin/banners/:id error:', error);
    return NextResponse.json(
      { success: false, error: '배너 삭제에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// ============================================
// PATCH /api/admin/banners/:id - 부분 수정 (토글 등)
// ============================================
export async function PATCH(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const banner = await prisma.banner.update({
      where: { id },
      data: body,
    });

    return NextResponse.json({
      success: true,
      data: banner,
    });
  } catch (error) {
    console.error('PATCH /api/admin/banners/:id error:', error);
    return NextResponse.json(
      { success: false, error: '배너 수정에 실패했습니다.' },
      { status: 500 }
    );
  }
}
