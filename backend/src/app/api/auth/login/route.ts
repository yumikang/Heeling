import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  verifyPassword,
  generateToken,
  setAuthCookie,
  AdminPayload,
} from '@/lib/auth';

interface LoginRequest {
  email: string;
  password: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json();
    const { email, password } = body;

    // 입력 검증
    if (!email || !password) {
      return NextResponse.json(
        { error: '이메일과 비밀번호를 입력해주세요.' },
        { status: 400 }
      );
    }

    // 어드민 조회
    const admin = await prisma.admin.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!admin) {
      return NextResponse.json(
        { error: '이메일 또는 비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      );
    }

    // 활성 상태 확인
    if (!admin.isActive) {
      return NextResponse.json(
        { error: '비활성화된 계정입니다. 관리자에게 문의하세요.' },
        { status: 403 }
      );
    }

    // 비밀번호 검증
    const isValidPassword = await verifyPassword(password, admin.passwordHash);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: '이메일 또는 비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      );
    }

    // JWT 토큰 생성
    const payload: AdminPayload = {
      id: admin.id,
      email: admin.email,
      role: admin.role,
    };
    const token = generateToken(payload);

    // 쿠키 설정
    await setAuthCookie(token);

    // 마지막 로그인 시간 업데이트
    await prisma.admin.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    // 개발 환경에서 상세 에러 반환
    const errorMessage = process.env.NODE_ENV === 'development' && error instanceof Error
      ? error.message
      : '로그인 처리 중 오류가 발생했습니다.';
    return NextResponse.json(
      { error: errorMessage, stack: process.env.NODE_ENV === 'development' ? String(error) : undefined },
      { status: 500 }
    );
  }
}
