import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET: 페이지 목록 조회
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session.isAuthenticated) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status');

    const where: Record<string, unknown> = {};
    if (type) where.type = type;
    if (status) where.status = status;

    const pages = await prisma.page.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: pages });
  } catch (error) {
    console.error('Pages GET error:', error);
    return NextResponse.json({ error: '페이지 목록 조회에 실패했습니다.' }, { status: 500 });
  }
}

// POST: 새 페이지 생성
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session.isAuthenticated) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const body = await request.json();
    const { title, slug, content, type, status } = body;

    if (!title || !slug) {
      return NextResponse.json({ error: '제목과 슬러그는 필수입니다.' }, { status: 400 });
    }

    // 슬러그 중복 확인
    const existing = await prisma.page.findUnique({
      where: { slug },
    });

    if (existing) {
      return NextResponse.json({ error: '이미 사용 중인 슬러그입니다.' }, { status: 400 });
    }

    const page = await prisma.page.create({
      data: {
        title,
        slug: slug.toLowerCase().replace(/\s+/g, '-'),
        content: content || '',
        type: type || 'NOTICE',
        status: status || 'DRAFT',
        publishedAt: status === 'PUBLISHED' ? new Date() : null,
      },
    });

    return NextResponse.json({ success: true, data: page });
  } catch (error) {
    console.error('Pages POST error:', error);
    return NextResponse.json({ error: '페이지 생성에 실패했습니다.' }, { status: 500 });
  }
}
