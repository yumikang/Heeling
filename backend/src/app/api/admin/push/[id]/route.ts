import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type Params = Promise<{ id: string }>;

// ============================================
// GET /api/admin/push/:id - 푸시 발송 이력 상세
// ============================================
export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { id } = await params;

    const pushHistory = await prisma.pushHistory.findUnique({
      where: { id },
    });

    if (!pushHistory) {
      return NextResponse.json(
        { success: false, error: '발송 이력을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: pushHistory,
    });
  } catch (error) {
    console.error('GET /api/admin/push/:id error:', error);
    return NextResponse.json(
      { success: false, error: '발송 이력 조회에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE /api/admin/push/:id - 발송 이력 삭제 (예약 취소)
// ============================================
export async function DELETE(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { id } = await params;

    const pushHistory = await prisma.pushHistory.findUnique({
      where: { id },
    });

    if (!pushHistory) {
      return NextResponse.json(
        { success: false, error: '발송 이력을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 예약된 상태만 삭제 가능
    if (pushHistory.status !== 'SCHEDULED' && pushHistory.status !== 'PENDING') {
      return NextResponse.json(
        { success: false, error: '발송 완료된 알림은 삭제할 수 없습니다.' },
        { status: 400 }
      );
    }

    await prisma.pushHistory.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: '예약된 알림이 취소되었습니다.',
    });
  } catch (error) {
    console.error('DELETE /api/admin/push/:id error:', error);
    return NextResponse.json(
      { success: false, error: '발송 이력 삭제에 실패했습니다.' },
      { status: 500 }
    );
  }
}
