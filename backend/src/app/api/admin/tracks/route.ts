import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// ============================================
// GET /api/admin/tracks - 트랙 목록 조회 (어드민용)
// ============================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // 쿼리 파라미터
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const category = searchParams.get('category');
    const mood = searchParams.get('mood');
    const search = searchParams.get('q');
    const isActive = searchParams.get('isActive');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // 필터 조건 (어드민은 비활성 트랙도 볼 수 있음)
    const where: any = {};

    if (isActive !== null && isActive !== '') {
      where.isActive = isActive === 'true';
    }

    if (category) {
      where.category = category;
    }

    if (mood) {
      where.mood = mood;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { artist: { contains: search, mode: 'insensitive' } },
        { composer: { contains: search, mode: 'insensitive' } },
        { tags: { has: search } },
      ];
    }

    // 정렬 조건
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    // 트랙 조회
    const [tracks, total] = await Promise.all([
      prisma.track.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy,
        select: {
          id: true,
          title: true,
          artist: true,
          composer: true,
          fileUrl: true,
          thumbnailUrl: true,
          duration: true,
          fileSize: true,
          bpm: true,
          category: true,
          tags: true,
          mood: true,
          playCount: true,
          likeCount: true,
          isActive: true,
          sortOrder: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.track.count({ where }),
    ]);

    // 통계
    const stats = await prisma.track.aggregate({
      _sum: { fileSize: true },
      _count: { id: true },
      where: { isActive: true },
    });

    return NextResponse.json({
      success: true,
      data: tracks,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
      stats: {
        totalTracks: stats._count.id,
        totalSize: stats._sum.fileSize || 0,
      },
    });
  } catch (error) {
    console.error('GET /api/admin/tracks error:', error);
    return NextResponse.json(
      { success: false, error: '트랙 목록을 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/admin/tracks - 트랙 생성
// ============================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 필수 필드 검증
    if (!body.title) {
      return NextResponse.json(
        { success: false, error: '트랙 제목은 필수입니다.' },
        { status: 400 }
      );
    }

    if (!body.fileUrl) {
      return NextResponse.json(
        { success: false, error: '오디오 파일 URL은 필수입니다.' },
        { status: 400 }
      );
    }

    if (!body.duration || body.duration <= 0) {
      return NextResponse.json(
        { success: false, error: '재생 시간은 필수입니다.' },
        { status: 400 }
      );
    }

    // 트랙 생성
    const track = await prisma.track.create({
      data: {
        title: body.title,
        artist: body.artist || 'Heeling',
        composer: body.composer || 'Heeling Studio',
        createdWith: body.createdWith || 'Suno AI',
        fileUrl: body.fileUrl,
        thumbnailUrl: body.thumbnailUrl,
        duration: body.duration,
        fileSize: body.fileSize,
        bpm: body.bpm,
        category: body.category,
        tags: body.tags || [],
        mood: body.mood,
        occupationTags: body.occupationTags || [],
        businessTags: body.businessTags || [],
        timeSlotTags: body.timeSlotTags || [],
        sortOrder: body.sortOrder,
        isActive: body.isActive ?? true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: track,
        message: '트랙이 생성되었습니다.',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/admin/tracks error:', error);
    return NextResponse.json(
      { success: false, error: '트랙 생성에 실패했습니다.' },
      { status: 500 }
    );
  }
}
