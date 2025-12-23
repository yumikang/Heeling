import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// ============================================
// GET /api/admin/categories - 카테고리 목록 조회
// ============================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('activeOnly') === 'true';

    const where: any = {};
    if (activeOnly) {
      where.isActive = true;
    }

    const categories = await prisma.category.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error('GET /api/admin/categories error:', error);
    return NextResponse.json(
      { success: false, error: '카테고리 목록을 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/admin/categories - 카테고리 생성
// ============================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 필수 필드 검증
    if (!body.slug || !body.name || !body.icon || !body.color) {
      return NextResponse.json(
        { success: false, error: 'slug, name, icon, color는 필수입니다.' },
        { status: 400 }
      );
    }

    // slug 중복 검사
    const existingCategory = await prisma.category.findUnique({
      where: { slug: body.slug },
    });

    if (existingCategory) {
      return NextResponse.json(
        { success: false, error: '이미 존재하는 slug입니다.' },
        { status: 400 }
      );
    }

    // 마지막 sortOrder 가져오기
    const lastCategory = await prisma.category.findFirst({
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });
    const newSortOrder = (lastCategory?.sortOrder ?? -1) + 1;

    // 카테고리 생성
    const category = await prisma.category.create({
      data: {
        slug: body.slug,
        name: body.name,
        description: body.description,
        icon: body.icon,
        color: body.color,
        sortOrder: body.sortOrder ?? newSortOrder,
        isActive: body.isActive ?? true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: category,
        message: '카테고리가 생성되었습니다.',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/admin/categories error:', error);
    return NextResponse.json(
      { success: false, error: '카테고리 생성에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// ============================================
// PUT /api/admin/categories - 순서 일괄 변경
// ============================================
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    // body.categories: [{ id: string, sortOrder: number }]
    if (!body.categories || !Array.isArray(body.categories)) {
      return NextResponse.json(
        { success: false, error: 'categories 배열이 필요합니다.' },
        { status: 400 }
      );
    }

    // 트랜잭션으로 순서 업데이트
    await prisma.$transaction(
      body.categories.map((item: { id: string; sortOrder: number }) =>
        prisma.category.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder },
        })
      )
    );

    // 업데이트된 목록 반환
    const categories = await prisma.category.findMany({
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: categories,
      message: '순서가 변경되었습니다.',
    });
  } catch (error) {
    console.error('PUT /api/admin/categories error:', error);
    return NextResponse.json(
      { success: false, error: '순서 변경에 실패했습니다.' },
      { status: 500 }
    );
  }
}
