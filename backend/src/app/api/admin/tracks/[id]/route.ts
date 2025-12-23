import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type Params = Promise<{ id: string }>;

// ============================================
// GET /api/admin/tracks/:id - 트랙 상세 조회
// ============================================
export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { id } = await params;

    const track = await prisma.track.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            favorites: true,
            playHistories: true,
            playlistTracks: true,
          },
        },
        playlistTracks: {
          include: {
            playlist: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!track) {
      return NextResponse.json(
        { success: false, error: '트랙을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: track,
    });
  } catch (error) {
    console.error('GET /api/admin/tracks/:id error:', error);
    return NextResponse.json(
      { success: false, error: '트랙 조회에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// ============================================
// PUT /api/admin/tracks/:id - 트랙 수정
// ============================================
export async function PUT(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // 트랙 존재 확인
    const existingTrack = await prisma.track.findUnique({
      where: { id },
    });

    if (!existingTrack) {
      return NextResponse.json(
        { success: false, error: '트랙을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 업데이트할 필드만 추출
    const updateData: any = {};

    if (body.title !== undefined) updateData.title = body.title;
    if (body.artist !== undefined) updateData.artist = body.artist;
    if (body.composer !== undefined) updateData.composer = body.composer;
    if (body.createdWith !== undefined) updateData.createdWith = body.createdWith;
    if (body.fileUrl !== undefined) updateData.fileUrl = body.fileUrl;
    if (body.thumbnailUrl !== undefined) updateData.thumbnailUrl = body.thumbnailUrl;
    if (body.duration !== undefined) updateData.duration = body.duration;
    if (body.fileSize !== undefined) updateData.fileSize = body.fileSize;
    if (body.bpm !== undefined) updateData.bpm = body.bpm;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.tags !== undefined) updateData.tags = body.tags;
    if (body.mood !== undefined) updateData.mood = body.mood;
    if (body.occupationTags !== undefined) updateData.occupationTags = body.occupationTags;
    if (body.businessTags !== undefined) updateData.businessTags = body.businessTags;
    if (body.timeSlotTags !== undefined) updateData.timeSlotTags = body.timeSlotTags;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    if (body.sortOrder !== undefined) updateData.sortOrder = body.sortOrder;

    const track = await prisma.track.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: track,
      message: '트랙이 수정되었습니다.',
    });
  } catch (error) {
    console.error('PUT /api/admin/tracks/:id error:', error);
    return NextResponse.json(
      { success: false, error: '트랙 수정에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE /api/admin/tracks/:id - 트랙 삭제 (소프트 삭제)
// ============================================
export async function DELETE(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const hard = searchParams.get('hard') === 'true';

    // 트랙 존재 확인
    const existingTrack = await prisma.track.findUnique({
      where: { id },
    });

    if (!existingTrack) {
      return NextResponse.json(
        { success: false, error: '트랙을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    if (hard) {
      // 하드 삭제 (완전 삭제)
      await prisma.track.delete({
        where: { id },
      });

      // Tombstone 기록 (동기화용)
      await prisma.tombstone.create({
        data: {
          entityType: 'track',
          entityId: id,
        },
      });

      return NextResponse.json({
        success: true,
        message: '트랙이 완전히 삭제되었습니다.',
      });
    } else {
      // 소프트 삭제 (비활성화)
      await prisma.track.update({
        where: { id },
        data: { isActive: false },
      });

      return NextResponse.json({
        success: true,
        message: '트랙이 비활성화되었습니다.',
      });
    }
  } catch (error) {
    console.error('DELETE /api/admin/tracks/:id error:', error);
    return NextResponse.json(
      { success: false, error: '트랙 삭제에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// ============================================
// PATCH /api/admin/tracks/:id - 트랙 부분 수정 (토글 등)
// ============================================
export async function PATCH(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const track = await prisma.track.update({
      where: { id },
      data: body,
    });

    return NextResponse.json({
      success: true,
      data: track,
    });
  } catch (error) {
    console.error('PATCH /api/admin/tracks/:id error:', error);
    return NextResponse.json(
      { success: false, error: '트랙 수정에 실패했습니다.' },
      { status: 500 }
    );
  }
}
