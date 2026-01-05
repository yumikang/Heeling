import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

type Params = Promise<{ id: string }>;

/**
 * 사용자 인증 검증 헬퍼
 */
function getUserFromRequest(request: NextRequest): { userId: string } | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.slice(7);
  const payload = verifyToken(token);

  if (!payload || !payload.id) {
    return null;
  }

  return { userId: payload.id };
}

// ============================================
// DELETE /api/users/:id - 계정 삭제 (Apple App Store 필수 요구사항)
// ============================================
export async function DELETE(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { id } = await params;
    const auth = getUserFromRequest(request);

    // 인증 확인
    if (!auth) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    // 본인 계정만 삭제 가능
    if (auth.userId !== id) {
      return NextResponse.json(
        { success: false, error: '본인 계정만 삭제할 수 있습니다.' },
        { status: 403 }
      );
    }

    // 사용자 존재 확인
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 트랜잭션으로 관련 데이터 삭제 후 계정 삭제
    await prisma.$transaction(async (tx) => {
      // 1. 재생 기록 삭제
      await tx.playHistory.deleteMany({
        where: { userId: id },
      });

      // 2. 즐겨찾기 삭제
      await tx.favorite.deleteMany({
        where: { userId: id },
      });

      // 3. 구독 정보 삭제
      await tx.subscription.deleteMany({
        where: { userId: id },
      });

      // 4. 사용자 계정 삭제
      await tx.user.delete({
        where: { id },
      });
    });

    return NextResponse.json({
      success: true,
      message: '계정이 성공적으로 삭제되었습니다.',
    });
  } catch (error) {
    console.error('DELETE /api/users/:id error:', error);
    return NextResponse.json(
      { success: false, error: '계정 삭제에 실패했습니다.' },
      { status: 500 }
    );
  }
}
