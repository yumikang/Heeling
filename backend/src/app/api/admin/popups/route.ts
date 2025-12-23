import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PopupType, UserType } from '@prisma/client';

// ============================================
// GET /api/admin/popups - 팝업 목록 조회
// ============================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const activeOnly = searchParams.get('activeOnly') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = {};

    if (type && Object.values(PopupType).includes(type as PopupType)) {
      where.type = type;
    }

    if (activeOnly) {
      const now = new Date();
      where.isActive = true;
      where.OR = [
        { startDate: null },
        { startDate: { lte: now } },
      ];
      where.AND = [
        {
          OR: [
            { endDate: null },
            { endDate: { gte: now } },
          ],
        },
      ];
    }

    const [popups, total] = await Promise.all([
      prisma.popup.findMany({
        where,
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.popup.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: popups,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('GET /api/admin/popups error:', error);
    return NextResponse.json(
      { success: false, error: '팝업 목록 조회에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/admin/popups - 팝업 생성
// ============================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 필수 필드 검증
    if (!body.title) {
      return NextResponse.json(
        { success: false, error: '제목은 필수입니다.' },
        { status: 400 }
      );
    }

    // 타입 검증
    if (body.type) {
      const validTypes = Object.values(PopupType);
      if (!validTypes.includes(body.type)) {
        return NextResponse.json(
          { success: false, error: `유효하지 않은 타입입니다. 허용: ${validTypes.join(', ')}` },
          { status: 400 }
        );
      }
    }

    // targetUserType 검증
    if (body.targetUserType) {
      const validUserTypes = Object.values(UserType);
      if (!validUserTypes.includes(body.targetUserType)) {
        return NextResponse.json(
          { success: false, error: `유효하지 않은 사용자 타입입니다.` },
          { status: 400 }
        );
      }
    }

    const popup = await prisma.popup.create({
      data: {
        type: body.type as PopupType || 'POPUP',
        title: body.title,
        content: body.content || null,
        imageUrl: body.imageUrl || null,
        linkType: body.linkType || null,
        linkTarget: body.linkTarget || null,
        targetUserType: body.targetUserType as UserType || null,
        priority: body.priority ?? 0,
        showOnce: body.showOnce ?? false,
        isActive: body.isActive ?? true,
        startDate: body.startDate ? new Date(body.startDate) : null,
        endDate: body.endDate ? new Date(body.endDate) : null,
      },
    });

    return NextResponse.json({
      success: true,
      data: popup,
      message: '팝업이 생성되었습니다.',
    });
  } catch (error) {
    console.error('POST /api/admin/popups error:', error);
    return NextResponse.json(
      { success: false, error: '팝업 생성에 실패했습니다.' },
      { status: 500 }
    );
  }
}
