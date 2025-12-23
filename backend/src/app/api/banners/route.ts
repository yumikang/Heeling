import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { BannerType } from '@prisma/client';

// GET /api/banners - 공개 배너 목록 조회 (앱용)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as BannerType | null;

    const now = new Date();

    const where: any = {
      isActive: true,
      OR: [
        { startDate: null, endDate: null },
        { startDate: { lte: now }, endDate: null },
        { startDate: null, endDate: { gte: now } },
        { startDate: { lte: now }, endDate: { gte: now } },
      ],
    };

    if (type) {
      where.type = type;
    }

    const banners = await prisma.banner.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        type: true,
        title: true,
        subtitle: true,
        imageUrl: true,
        linkType: true,
        linkTarget: true,
        backgroundColor: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: banners,
    });
  } catch (error) {
    console.error('GET /api/banners error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch banners' },
      { status: 500 }
    );
  }
}
