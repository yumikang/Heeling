import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth-edge';

// GET: 배포된 트랙 목록 조회 (Track 테이블에서)
export async function GET(request: NextRequest) {
  const authResult = await verifyAuth(request);
  if (!authResult.success) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const tracks = await prisma.track.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        artist: true,
        fileUrl: true,
        thumbnailUrl: true,
        duration: true,
        category: true,
        mood: true,
        tags: true,
        playCount: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: tracks.map(track => ({
        ...track,
        createdAt: track.createdAt.toISOString(),
        updatedAt: track.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('[Deployed API] GET Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to get deployed tracks' },
      { status: 500 }
    );
  }
}

// PATCH: 배포된 트랙 수정
export async function PATCH(request: NextRequest) {
  const authResult = await verifyAuth(request);
  if (!authResult.success) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, bulkUpdate, ...updateData } = body;

    // 단일 트랙 수정
    if (id && !bulkUpdate) {
      const updatedTrack = await prisma.track.update({
        where: { id },
        data: {
          ...(updateData.title && { title: updateData.title }),
          ...(updateData.thumbnailUrl !== undefined && { thumbnailUrl: updateData.thumbnailUrl || null }),
          ...(updateData.isActive !== undefined && { isActive: updateData.isActive }),
          updatedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        data: updatedTrack,
      });
    }

    // 일괄 수정
    if (bulkUpdate && Array.isArray(bulkUpdate)) {
      const results = await Promise.all(
        bulkUpdate.map(async (item: { id: string; isActive?: boolean; title?: string; thumbnailUrl?: string }) => {
          try {
            const updated = await prisma.track.update({
              where: { id: item.id },
              data: {
                ...(item.title && { title: item.title }),
                ...(item.thumbnailUrl !== undefined && { thumbnailUrl: item.thumbnailUrl || null }),
                ...(item.isActive !== undefined && { isActive: item.isActive }),
                updatedAt: new Date(),
              },
            });
            return { success: true, id: item.id };
          } catch (err) {
            return { success: false, id: item.id, error: err instanceof Error ? err.message : 'Unknown error' };
          }
        })
      );

      const successCount = results.filter(r => r.success).length;
      return NextResponse.json({
        success: true,
        data: { results, successCount, totalCount: bulkUpdate.length },
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid request: id or bulkUpdate required' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[Deployed API] PATCH Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to update track' },
      { status: 500 }
    );
  }
}

// DELETE: 배포된 트랙 삭제
export async function DELETE(request: NextRequest) {
  const authResult = await verifyAuth(request);
  if (!authResult.success) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'ids array is required' },
        { status: 400 }
      );
    }

    // 트랙 삭제 (파일은 유지, DB에서만 삭제)
    const deleteResult = await prisma.track.deleteMany({
      where: {
        id: { in: ids },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        deletedCount: deleteResult.count,
      },
    });
  } catch (error) {
    console.error('[Deployed API] DELETE Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to delete tracks' },
      { status: 500 }
    );
  }
}
