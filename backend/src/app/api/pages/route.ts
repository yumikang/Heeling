import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// ============================================
// GET /api/pages - 공개 페이지 목록 조회
// ============================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const slug = searchParams.get('slug');

    // 단일 페이지 조회 (slug로)
    if (slug) {
      const page = await prisma.page.findFirst({
        where: {
          slug,
          status: 'PUBLISHED',
        },
        select: {
          id: true,
          slug: true,
          title: true,
          content: true,
          type: true,
          publishedAt: true,
          updatedAt: true,
        },
      });

      if (!page) {
        return NextResponse.json(
          { success: false, error: '페이지를 찾을 수 없습니다.' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: page,
      });
    }

    // 페이지 목록 조회
    const where: any = {
      status: 'PUBLISHED',
    };

    if (type) {
      where.type = type;
    }

    const pages = await prisma.page.findMany({
      where,
      select: {
        id: true,
        slug: true,
        title: true,
        type: true,
        publishedAt: true,
        updatedAt: true,
      },
      orderBy: { publishedAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: pages,
    });
  } catch (error) {
    console.error('GET /api/pages error:', error);
    return NextResponse.json(
      { success: false, error: '페이지를 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}
