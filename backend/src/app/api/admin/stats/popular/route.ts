import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// ============================================
// GET /api/admin/stats/popular - 인기 트랙 TOP 10
// ============================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7');
    const limit = parseInt(searchParams.get('limit') || '10');

    // 최대 90일, 최대 50개까지 허용
    const limitDays = Math.min(days, 90);
    const limitCount = Math.min(limit, 50);

    // 시작 날짜 계산
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - limitDays);

    // 인기 트랙 조회 (재생 횟수 기준)
    const popularTracks = await prisma.$queryRaw<Array<{
      trackId: string;
      play_count: bigint;
      unique_users: bigint;
      total_duration: bigint;
    }>>`
      SELECT
        "trackId",
        COUNT(*) as play_count,
        COUNT(DISTINCT "userId") as unique_users,
        COALESCE(SUM("listenDuration"), 0) as total_duration
      FROM "PlayHistory"
      WHERE "playedAt" >= ${startDate}
      GROUP BY "trackId"
      ORDER BY play_count DESC
      LIMIT ${limitCount}
    `;

    // 트랙 상세 정보 조회
    const trackIds = popularTracks.map(t => t.trackId);
    const tracks = await prisma.track.findMany({
      where: { id: { in: trackIds } },
      select: {
        id: true,
        title: true,
        artist: true,
        thumbnailUrl: true,
        duration: true,
        category: true,
        playCount: true,
        likeCount: true,
      },
    });

    const trackMap = new Map(tracks.map(t => [t.id, t]));

    // 결과 조합
    const result = popularTracks.map((stat, index) => {
      const track = trackMap.get(stat.trackId);
      return {
        rank: index + 1,
        trackId: stat.trackId,
        title: track?.title || 'Unknown',
        artist: track?.artist || 'Unknown',
        thumbnailUrl: track?.thumbnailUrl,
        duration: track?.duration || 0,
        category: track?.category,
        periodPlayCount: Number(stat.play_count),
        periodUniqueUsers: Number(stat.unique_users),
        periodTotalDuration: Number(stat.total_duration),
        allTimePlayCount: track?.playCount || 0,
        allTimeLikeCount: track?.likeCount || 0,
      };
    });

    // 카테고리별 인기도
    const categoryStats = await prisma.$queryRaw<Array<{
      category: string | null;
      play_count: bigint;
    }>>`
      SELECT
        t.category,
        COUNT(*) as play_count
      FROM "PlayHistory" ph
      JOIN "Track" t ON ph."trackId" = t.id
      WHERE ph."playedAt" >= ${startDate}
      GROUP BY t.category
      ORDER BY play_count DESC
    `;

    const categoryBreakdown = categoryStats.map(c => ({
      category: c.category || 'uncategorized',
      playCount: Number(c.play_count),
    }));

    return NextResponse.json({
      success: true,
      data: {
        period: {
          days: limitDays,
          startDate: startDate.toISOString(),
          endDate: new Date().toISOString(),
        },
        topTracks: result,
        categoryBreakdown,
      },
    });
  } catch (error) {
    console.error('GET /api/admin/stats/popular error:', error);
    return NextResponse.json(
      { success: false, error: '인기 트랙 통계 조회에 실패했습니다.' },
      { status: 500 }
    );
  }
}
