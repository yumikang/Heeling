import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PopupType, UserType } from '@prisma/client';

type Params = Promise<{ id: string }>;

// ============================================
// GET /api/admin/popups/:id - 팝업 상세 조회
// ============================================
export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { id } = await params;

    const popup = await prisma.popup.findUnique({
      where: { id },
    });

    if (!popup) {
      return NextResponse.json(
        { success: false, error: '팝업을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: popup,
    });
  } catch (error) {
    console.error('GET /api/admin/popups/:id error:', error);
    return NextResponse.json(
      { success: false, error: '팝업 조회에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// ============================================
// PUT /api/admin/popups/:id - 팝업 수정
// ============================================
export async function PUT(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // 팝업 존재 확인
    const existingPopup = await prisma.popup.findUnique({
      where: { id },
    });

    if (!existingPopup) {
      return NextResponse.json(
        { success: false, error: '팝업을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 타입 검증
    if (body.type) {
      const validTypes = Object.values(PopupType);
      if (!validTypes.includes(body.type)) {
        return NextResponse.json(
          { success: false, error: `유효하지 않은 타입입니다.` },
          { status: 400 }
        );
      }
    }

    // 업데이트할 필드만 추출
    const updateData: any = {};

    if (body.type !== undefined) updateData.type = body.type as PopupType;
    if (body.title !== undefined) updateData.title = body.title;
    if (body.content !== undefined) updateData.content = body.content;
    if (body.imageUrl !== undefined) updateData.imageUrl = body.imageUrl;
    if (body.linkType !== undefined) updateData.linkType = body.linkType;
    if (body.linkTarget !== undefined) updateData.linkTarget = body.linkTarget;
    if (body.targetUserType !== undefined) updateData.targetUserType = body.targetUserType as UserType || null;
    if (body.priority !== undefined) updateData.priority = body.priority;
    if (body.showOnce !== undefined) updateData.showOnce = body.showOnce;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    if (body.startDate !== undefined) updateData.startDate = body.startDate ? new Date(body.startDate) : null;
    if (body.endDate !== undefined) updateData.endDate = body.endDate ? new Date(body.endDate) : null;

    const popup = await prisma.popup.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: popup,
      message: '팝업이 수정되었습니다.',
    });
  } catch (error) {
    console.error('PUT /api/admin/popups/:id error:', error);
    return NextResponse.json(
      { success: false, error: '팝업 수정에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE /api/admin/popups/:id - 팝업 삭제
// ============================================
export async function DELETE(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { id } = await params;

    const existingPopup = await prisma.popup.findUnique({
      where: { id },
    });

    if (!existingPopup) {
      return NextResponse.json(
        { success: false, error: '팝업을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    await prisma.popup.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: '팝업이 삭제되었습니다.',
    });
  } catch (error) {
    console.error('DELETE /api/admin/popups/:id error:', error);
    return NextResponse.json(
      { success: false, error: '팝업 삭제에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// ============================================
// PATCH /api/admin/popups/:id - 부분 수정 (토글 등)
// ============================================
export async function PATCH(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const popup = await prisma.popup.update({
      where: { id },
      data: body,
    });

    return NextResponse.json({
      success: true,
      data: popup,
    });
  } catch (error) {
    console.error('PATCH /api/admin/popups/:id error:', error);
    return NextResponse.json(
      { success: false, error: '팝업 수정에 실패했습니다.' },
      { status: 500 }
    );
  }
}
