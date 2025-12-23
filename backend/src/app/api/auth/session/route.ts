import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();

    if (!session.isAuthenticated) {
      return NextResponse.json(
        { error: '인증되지 않은 요청입니다.' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      admin: session.admin,
    });
  } catch (error) {
    console.error('Session error:', error);
    return NextResponse.json(
      { error: '세션 확인 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
