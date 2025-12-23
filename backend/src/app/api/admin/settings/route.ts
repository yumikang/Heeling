import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, hashPassword, verifyPassword } from '@/lib/auth';

// GET: 현재 관리자 정보 조회
export async function GET() {
  try {
    const session = await getSession();
    if (!session.isAuthenticated || !session.admin) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const admin = await prisma.admin.findUnique({
      where: { id: session.admin.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    if (!admin) {
      return NextResponse.json({ error: '관리자를 찾을 수 없습니다.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: admin });
  } catch (error) {
    console.error('Settings GET error:', error);
    return NextResponse.json({ error: '설정 조회에 실패했습니다.' }, { status: 500 });
  }
}

// PUT: 관리자 정보 수정
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session.isAuthenticated || !session.admin) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const body = await request.json();
    const { name, email, currentPassword, newPassword } = body;

    const admin = await prisma.admin.findUnique({
      where: { id: session.admin.id },
    });

    if (!admin) {
      return NextResponse.json({ error: '관리자를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 비밀번호 변경 요청인 경우
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: '현재 비밀번호를 입력해주세요.' }, { status: 400 });
      }

      const isValidPassword = await verifyPassword(currentPassword, admin.passwordHash);
      if (!isValidPassword) {
        return NextResponse.json({ error: '현재 비밀번호가 올바르지 않습니다.' }, { status: 400 });
      }

      if (newPassword.length < 6) {
        return NextResponse.json({ error: '새 비밀번호는 6자 이상이어야 합니다.' }, { status: 400 });
      }

      const newPasswordHash = await hashPassword(newPassword);

      await prisma.admin.update({
        where: { id: session.admin.id },
        data: {
          passwordHash: newPasswordHash,
          ...(name && { name }),
          ...(email && { email: email.toLowerCase() }),
        },
      });

      return NextResponse.json({ success: true, message: '비밀번호가 변경되었습니다.' });
    }

    // 일반 정보 수정
    const updateData: { name?: string; email?: string } = {};
    if (name) updateData.name = name;
    if (email) {
      // 이메일 중복 확인
      const existingAdmin = await prisma.admin.findFirst({
        where: {
          email: email.toLowerCase(),
          NOT: { id: session.admin.id },
        },
      });

      if (existingAdmin) {
        return NextResponse.json({ error: '이미 사용 중인 이메일입니다.' }, { status: 400 });
      }

      updateData.email = email.toLowerCase();
    }

    const updatedAdmin = await prisma.admin.update({
      where: { id: session.admin.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    return NextResponse.json({ success: true, data: updatedAdmin });
  } catch (error) {
    console.error('Settings PUT error:', error);
    return NextResponse.json({ error: '설정 저장에 실패했습니다.' }, { status: 500 });
  }
}
