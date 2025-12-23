import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/categories - 활성화된 카테고리 목록 조회 (공개 API)
export async function GET(request: NextRequest) {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        icon: true,
        color: true,
        sortOrder: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error('GET /api/categories error:', error);
    return NextResponse.json(
      { success: false, error: '카테고리를 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}
