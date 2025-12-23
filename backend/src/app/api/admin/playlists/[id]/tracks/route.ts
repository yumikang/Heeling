import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type Params = Promise<{ id: string }>;

// ============================================
// GET /api/admin/playlists/:id/tracks - 플레이리스트 트랙 목록 조회
// ============================================
export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { id } = await params;

    // 플레이리스트 존재 확인
    const playlist = await prisma.playlist.findUnique({
      where: { id },
    });

    if (!playlist) {
      return NextResponse.json(
        { success: false, error: '플레이리스트를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const tracks = await prisma.playlistTrack.findMany({
      where: { playlistId: id },
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
            playCount: true,
            isActive: true,
          },
        },
      },
      orderBy: { position: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: tracks,
    });
  } catch (error) {
    console.error('GET /api/admin/playlists/:id/tracks error:', error);
    return NextResponse.json(
      { success: false, error: '트랙 목록 조회에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/admin/playlists/:id/tracks - 트랙 추가
// ============================================
export async function POST(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // 플레이리스트 존재 확인
    const playlist = await prisma.playlist.findUnique({
      where: { id },
    });

    if (!playlist) {
      return NextResponse.json(
        { success: false, error: '플레이리스트를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // trackId 또는 trackIds 지원
    const trackIds = body.trackIds || (body.trackId ? [body.trackId] : []);

    if (trackIds.length === 0) {
      return NextResponse.json(
        { success: false, error: '추가할 트랙을 선택해주세요.' },
        { status: 400 }
      );
    }

    // 트랙 존재 확인
    const existingTracks = await prisma.track.findMany({
      where: { id: { in: trackIds } },
      select: { id: true },
    });

    if (existingTracks.length !== trackIds.length) {
      return NextResponse.json(
        { success: false, error: '일부 트랙을 찾을 수 없습니다.' },
        { status: 400 }
      );
    }

    // 이미 추가된 트랙 확인
    const alreadyAdded = await prisma.playlistTrack.findMany({
      where: {
        playlistId: id,
        trackId: { in: trackIds },
      },
      select: { trackId: true },
    });

    const alreadyAddedIds = new Set(alreadyAdded.map(t => t.trackId));
    const newTrackIds = trackIds.filter((tid: string) => !alreadyAddedIds.has(tid));

    if (newTrackIds.length === 0) {
      return NextResponse.json(
        { success: false, error: '선택한 모든 트랙이 이미 플레이리스트에 있습니다.' },
        { status: 400 }
      );
    }

    // 현재 최대 position 조회
    const maxPosition = await prisma.playlistTrack.findFirst({
      where: { playlistId: id },
      orderBy: { position: 'desc' },
      select: { position: true },
    });

    let nextPosition = (maxPosition?.position ?? -1) + 1;

    // 새 트랙들 추가
    await prisma.playlistTrack.createMany({
      data: newTrackIds.map((trackId: string) => ({
        playlistId: id,
        trackId,
        position: nextPosition++,
      })),
    });

    // 업데이트된 트랙 목록 반환
    const updatedTracks = await prisma.playlistTrack.findMany({
      where: { playlistId: id },
      include: {
        track: {
          select: {
            id: true,
            title: true,
            artist: true,
            thumbnailUrl: true,
            duration: true,
          },
        },
      },
      orderBy: { position: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: updatedTracks,
      message: `${newTrackIds.length}개의 트랙이 추가되었습니다.`,
    });
  } catch (error) {
    console.error('POST /api/admin/playlists/:id/tracks error:', error);
    return NextResponse.json(
      { success: false, error: '트랙 추가에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// ============================================
// PUT /api/admin/playlists/:id/tracks - 트랙 순서 변경 (전체 재정렬)
// ============================================
export async function PUT(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // 플레이리스트 존재 확인
    const playlist = await prisma.playlist.findUnique({
      where: { id },
    });

    if (!playlist) {
      return NextResponse.json(
        { success: false, error: '플레이리스트를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // trackIds 배열로 순서 재정렬
    const { trackIds } = body;

    if (!Array.isArray(trackIds)) {
      return NextResponse.json(
        { success: false, error: 'trackIds 배열이 필요합니다.' },
        { status: 400 }
      );
    }

    // 트랜잭션으로 순서 업데이트
    await prisma.$transaction(
      trackIds.map((trackId: string, index: number) =>
        prisma.playlistTrack.updateMany({
          where: {
            playlistId: id,
            trackId,
          },
          data: { position: index },
        })
      )
    );

    // 업데이트된 트랙 목록 반환
    const updatedTracks = await prisma.playlistTrack.findMany({
      where: { playlistId: id },
      include: {
        track: {
          select: {
            id: true,
            title: true,
            artist: true,
            thumbnailUrl: true,
            duration: true,
          },
        },
      },
      orderBy: { position: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: updatedTracks,
      message: '트랙 순서가 변경되었습니다.',
    });
  } catch (error) {
    console.error('PUT /api/admin/playlists/:id/tracks error:', error);
    return NextResponse.json(
      { success: false, error: '트랙 순서 변경에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE /api/admin/playlists/:id/tracks - 트랙 제거
// ============================================
export async function DELETE(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const trackId = searchParams.get('trackId');

    if (!trackId) {
      return NextResponse.json(
        { success: false, error: 'trackId가 필요합니다.' },
        { status: 400 }
      );
    }

    // 플레이리스트 트랙 삭제
    const deleted = await prisma.playlistTrack.deleteMany({
      where: {
        playlistId: id,
        trackId,
      },
    });

    if (deleted.count === 0) {
      return NextResponse.json(
        { success: false, error: '해당 트랙을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // position 재정렬
    const remainingTracks = await prisma.playlistTrack.findMany({
      where: { playlistId: id },
      orderBy: { position: 'asc' },
    });

    if (remainingTracks.length > 0) {
      await prisma.$transaction(
        remainingTracks.map((track, index) =>
          prisma.playlistTrack.update({
            where: { id: track.id },
            data: { position: index },
          })
        )
      );
    }

    // 업데이트된 트랙 목록 반환
    const updatedTracks = await prisma.playlistTrack.findMany({
      where: { playlistId: id },
      include: {
        track: {
          select: {
            id: true,
            title: true,
            artist: true,
            thumbnailUrl: true,
            duration: true,
          },
        },
      },
      orderBy: { position: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: updatedTracks,
      message: '트랙이 제거되었습니다.',
    });
  } catch (error) {
    console.error('DELETE /api/admin/playlists/:id/tracks error:', error);
    return NextResponse.json(
      { success: false, error: '트랙 제거에 실패했습니다.' },
      { status: 500 }
    );
  }
}
