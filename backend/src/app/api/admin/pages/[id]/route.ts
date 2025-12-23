import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET: 단일 페이지 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session.isAuthenticated) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const { id } = await params;

    const page = await prisma.page.findUnique({
      where: { id },
    });

    if (!page) {
      return NextResponse.json({ error: '페이지를 찾을 수 없습니다.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: page });
  } catch (error) {
    console.error('Page GET error:', error);
    return NextResponse.json({ error: '페이지 조회에 실패했습니다.' }, { status: 500 });
  }
}

// PUT: 페이지 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session.isAuthenticated) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { title, slug, content, type, status } = body;

    const existing = await prisma.page.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: '페이지를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 슬러그 중복 확인 (다른 페이지와 충돌 시)
    if (slug && slug !== existing.slug) {
      const slugExists = await prisma.page.findFirst({
        where: {
          slug,
          NOT: { id },
        },
      });

      if (slugExists) {
        return NextResponse.json({ error: '이미 사용 중인 슬러그입니다.' }, { status: 400 });
      }
    }

    // 발행 상태 변경 시 publishedAt 업데이트
    const publishedAt = status === 'PUBLISHED' && existing.status !== 'PUBLISHED'
      ? new Date()
      : existing.publishedAt;

    const page = await prisma.page.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(slug && { slug: slug.toLowerCase().replace(/\s+/g, '-') }),
        ...(content !== undefined && { content }),
        ...(type && { type }),
        ...(status && { status }),
        publishedAt,
      },
    });

    return NextResponse.json({ success: true, data: page });
  } catch (error) {
    console.error('Page PUT error:', error);
    return NextResponse.json({ error: '페이지 수정에 실패했습니다.' }, { status: 500 });
  }
}

// DELETE: 페이지 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session.isAuthenticated) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const { id } = await params;

    const existing = await prisma.page.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: '페이지를 찾을 수 없습니다.' }, { status: 404 });
    }

    await prisma.page.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: '페이지가 삭제되었습니다.' });
  } catch (error) {
    console.error('Page DELETE error:', error);
    return NextResponse.json({ error: '페이지 삭제에 실패했습니다.' }, { status: 500 });
  }
}
