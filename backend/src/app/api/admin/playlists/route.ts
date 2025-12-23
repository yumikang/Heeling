import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PlaylistType, TimeSlot, UserType } from '@prisma/client';

// ============================================
// GET /api/admin/playlists - 플레이리스트 목록 조회
// ============================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const theme = searchParams.get('theme');
    const search = searchParams.get('search');
    const isFeatured = searchParams.get('isFeatured');
    const isPublic = searchParams.get('isPublic');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = {};

    if (type && Object.values(PlaylistType).includes(type as PlaylistType)) {
      where.type = type;
    }

    if (theme) {
      where.theme = theme;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isFeatured !== null && isFeatured !== undefined) {
      where.isFeatured = isFeatured === 'true';
    }

    if (isPublic !== null && isPublic !== undefined) {
      where.isPublic = isPublic === 'true';
    }

    const [playlists, total] = await Promise.all([
      prisma.playlist.findMany({
        where,
        include: {
          tracks: {
            include: {
              track: {
                select: {
                  id: true,
                  title: true,
                  artist: true,
                  thumbnailUrl: true,
                  duration: true,
                  category: true,
                },
              },
            },
            orderBy: { position: 'asc' },
          },
          _count: {
            select: { tracks: true },
          },
        },
        orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.playlist.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: playlists,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('GET /api/admin/playlists error:', error);
    return NextResponse.json(
      { success: false, error: '플레이리스트 목록 조회에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/admin/playlists - 플레이리스트 생성
// ============================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 필수 필드 검증
    if (!body.name) {
      return NextResponse.json(
        { success: false, error: '플레이리스트 이름은 필수입니다.' },
        { status: 400 }
      );
    }

    // 타입 검증
    if (body.type) {
      const validTypes = Object.values(PlaylistType);
      if (!validTypes.includes(body.type)) {
        return NextResponse.json(
          { success: false, error: `유효하지 않은 플레이리스트 타입입니다. 허용: ${validTypes.join(', ')}` },
          { status: 400 }
        );
      }
    }

    // TimeSlot 검증
    if (body.timeSlot) {
      const validTimeSlots = Object.values(TimeSlot);
      if (!validTimeSlots.includes(body.timeSlot)) {
        return NextResponse.json(
          { success: false, error: `유효하지 않은 시간대입니다. 허용: ${validTimeSlots.join(', ')}` },
          { status: 400 }
        );
      }
    }

    // UserType 검증
    if (body.targetUserType) {
      const validUserTypes = Object.values(UserType);
      if (!validUserTypes.includes(body.targetUserType)) {
        return NextResponse.json(
          { success: false, error: `유효하지 않은 사용자 타입입니다. 허용: ${validUserTypes.join(', ')}` },
          { status: 400 }
        );
      }
    }

    const playlist = await prisma.playlist.create({
      data: {
        name: body.name,
        description: body.description,
        coverImage: body.coverImage,
        type: body.type as PlaylistType || 'MANUAL',
        theme: body.theme,
        timeSlot: body.timeSlot as TimeSlot || null,
        targetUserType: body.targetUserType as UserType || null,
        targetOccupation: body.targetOccupation,
        targetBusiness: body.targetBusiness,
        isPublic: body.isPublic ?? true,
        isFeatured: body.isFeatured ?? false,
      },
      include: {
        tracks: {
          include: {
            track: true,
          },
          orderBy: { position: 'asc' },
        },
        _count: {
          select: { tracks: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: playlist,
      message: '플레이리스트가 생성되었습니다.',
    });
  } catch (error) {
    console.error('POST /api/admin/playlists error:', error);
    return NextResponse.json(
      { success: false, error: '플레이리스트 생성에 실패했습니다.' },
      { status: 500 }
    );
  }
}
