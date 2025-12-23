import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PlaylistType, TimeSlot, UserType } from '@prisma/client';

type Params = Promise<{ id: string }>;

// ============================================
// GET /api/admin/playlists/:id - 플레이리스트 상세 조회
// ============================================
export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { id } = await params;

    const playlist = await prisma.playlist.findUnique({
      where: { id },
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
                fileUrl: true,
                category: true,
                tags: true,
              },
            },
          },
          orderBy: { position: 'asc' },
        },
        _count: {
          select: { tracks: true },
        },
      },
    });

    if (!playlist) {
      return NextResponse.json(
        { success: false, error: '플레이리스트를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: playlist,
    });
  } catch (error) {
    console.error('GET /api/admin/playlists/:id error:', error);
    return NextResponse.json(
      { success: false, error: '플레이리스트 조회에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// ============================================
// PUT /api/admin/playlists/:id - 플레이리스트 수정
// ============================================
export async function PUT(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // 플레이리스트 존재 확인
    const existingPlaylist = await prisma.playlist.findUnique({
      where: { id },
    });

    if (!existingPlaylist) {
      return NextResponse.json(
        { success: false, error: '플레이리스트를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 타입 검증
    if (body.type) {
      const validTypes = Object.values(PlaylistType);
      if (!validTypes.includes(body.type)) {
        return NextResponse.json(
          { success: false, error: `유효하지 않은 플레이리스트 타입입니다.` },
          { status: 400 }
        );
      }
    }

    // 업데이트할 필드만 추출
    const updateData: any = {};

    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.coverImage !== undefined) updateData.coverImage = body.coverImage;
    if (body.type !== undefined) updateData.type = body.type as PlaylistType;
    if (body.theme !== undefined) updateData.theme = body.theme;
    if (body.timeSlot !== undefined) updateData.timeSlot = body.timeSlot as TimeSlot || null;
    if (body.targetUserType !== undefined) updateData.targetUserType = body.targetUserType as UserType || null;
    if (body.targetOccupation !== undefined) updateData.targetOccupation = body.targetOccupation;
    if (body.targetBusiness !== undefined) updateData.targetBusiness = body.targetBusiness;
    if (body.isPublic !== undefined) updateData.isPublic = body.isPublic;
    if (body.isFeatured !== undefined) updateData.isFeatured = body.isFeatured;

    const playlist = await prisma.playlist.update({
      where: { id },
      data: updateData,
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
      message: '플레이리스트가 수정되었습니다.',
    });
  } catch (error) {
    console.error('PUT /api/admin/playlists/:id error:', error);
    return NextResponse.json(
      { success: false, error: '플레이리스트 수정에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE /api/admin/playlists/:id - 플레이리스트 삭제
// ============================================
export async function DELETE(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { id } = await params;

    // 플레이리스트 존재 확인
    const existingPlaylist = await prisma.playlist.findUnique({
      where: { id },
    });

    if (!existingPlaylist) {
      return NextResponse.json(
        { success: false, error: '플레이리스트를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // Cascade 삭제 (PlaylistTrack도 함께 삭제됨)
    await prisma.playlist.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: '플레이리스트가 삭제되었습니다.',
    });
  } catch (error) {
    console.error('DELETE /api/admin/playlists/:id error:', error);
    return NextResponse.json(
      { success: false, error: '플레이리스트 삭제에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// ============================================
// PATCH /api/admin/playlists/:id - 부분 수정 (토글 등)
// ============================================
export async function PATCH(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const playlist = await prisma.playlist.update({
      where: { id },
      data: body,
      include: {
        _count: {
          select: { tracks: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: playlist,
    });
  } catch (error) {
    console.error('PATCH /api/admin/playlists/:id error:', error);
    return NextResponse.json(
      { success: false, error: '플레이리스트 수정에 실패했습니다.' },
      { status: 500 }
    );
  }
}
