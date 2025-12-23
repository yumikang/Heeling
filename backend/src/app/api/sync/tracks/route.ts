import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateETagFromDates, shouldReturn304, getETagHeaders } from '@/lib/etag';

// ============================================
// GET /api/sync/tracks - 트랙 전체 동기화 (ETag 지원)
// ============================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const since = searchParams.get('since'); // ISO date string for incremental sync

    // 필터 조건 설정
    const where: any = { isActive: true };

    if (category) {
      where.category = category;
    }

    if (since) {
      const sinceDate = new Date(since);
      if (!isNaN(sinceDate.getTime())) {
        where.updatedAt = { gt: sinceDate };
      }
    }

    // 전체 트랙 조회 (동기화용 필드만)
    const tracks = await prisma.track.findMany({
      where,
      select: {
        id: true,
        title: true,
        artist: true,
        composer: true,
        createdWith: true,
        fileUrl: true,
        thumbnailUrl: true,
        duration: true,
        fileSize: true,
        bpm: true,
        category: true,
        tags: true,
        mood: true,
        occupationTags: true,
        businessTags: true,
        timeSlotTags: true,
        playCount: true,
        likeCount: true,
        sortOrder: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [
        { sortOrder: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    // 삭제된 트랙 ID 조회 (Tombstone)
    const tombstones = await prisma.tombstone.findMany({
      where: {
        entityType: 'track',
        ...(since ? { deletedAt: { gt: new Date(since) } } : {}),
      },
      select: {
        entityId: true,
        deletedAt: true,
      },
    });

    // ETag 생성 (최신 업데이트 시간 기반)
    const allDates = [
      ...tracks.map(t => t.updatedAt),
      ...tombstones.map(t => t.deletedAt),
    ];
    const etag = generateETagFromDates(allDates);

    // 304 응답 체크
    const ifNoneMatch = request.headers.get('If-None-Match');
    if (shouldReturn304(ifNoneMatch, etag)) {
      return new NextResponse(null, {
        status: 304,
        headers: getETagHeaders(etag, 300), // 5분 캐시
      });
    }

    // 응답 데이터 구성
    const responseData = {
      success: true,
      data: {
        tracks,
        deleted: tombstones.map(t => t.entityId),
        totalCount: tracks.length,
        deletedCount: tombstones.length,
      },
      meta: {
        syncedAt: new Date().toISOString(),
        etag,
      },
    };

    return NextResponse.json(responseData, {
      headers: getETagHeaders(etag, 300),
    });
  } catch (error) {
    console.error('GET /api/sync/tracks error:', error);
    return NextResponse.json(
      { success: false, error: '트랙 동기화에 실패했습니다.' },
      { status: 500 }
    );
  }
}
