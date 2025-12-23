import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// ============================================
// GET /api/admin/stats/daily - 일별 재생/방문 통계
// ============================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7');

    // 최대 90일까지 허용
    const limitDays = Math.min(days, 90);

    // 시작 날짜 계산
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - limitDays);
    startDate.setHours(0, 0, 0, 0);

    // 일별 재생 통계 조회
    const playStats = await prisma.$queryRaw<Array<{ date: Date; play_count: bigint; unique_users: bigint }>>`
      SELECT
        DATE("playedAt") as date,
        COUNT(*) as play_count,
        COUNT(DISTINCT "userId") as unique_users
      FROM "PlayHistory"
      WHERE "playedAt" >= ${startDate}
      GROUP BY DATE("playedAt")
      ORDER BY date ASC
    `;

    // 일별 가입자 통계
    const signupStats = await prisma.$queryRaw<Array<{ date: Date; signup_count: bigint }>>`
      SELECT
        DATE("createdAt") as date,
        COUNT(*) as signup_count
      FROM "User"
      WHERE "createdAt" >= ${startDate}
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `;

    // 데이터를 날짜별로 병합
    const dateMap = new Map<string, {
      date: string;
      playCount: number;
      uniqueUsers: number;
      signups: number;
    }>();

    // 모든 날짜에 대해 기본값 설정
    for (let i = 0; i < limitDays; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (limitDays - 1 - i));
      const dateStr = d.toISOString().split('T')[0];
      dateMap.set(dateStr, {
        date: dateStr,
        playCount: 0,
        uniqueUsers: 0,
        signups: 0,
      });
    }

    // 재생 통계 병합
    for (const stat of playStats) {
      const dateStr = new Date(stat.date).toISOString().split('T')[0];
      const existing = dateMap.get(dateStr);
      if (existing) {
        existing.playCount = Number(stat.play_count);
        existing.uniqueUsers = Number(stat.unique_users);
      }
    }

    // 가입자 통계 병합
    for (const stat of signupStats) {
      const dateStr = new Date(stat.date).toISOString().split('T')[0];
      const existing = dateMap.get(dateStr);
      if (existing) {
        existing.signups = Number(stat.signup_count);
      }
    }

    // 날짜순 정렬하여 배열로 변환
    const dailyStats = Array.from(dateMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    // 요약 통계
    const totalPlays = dailyStats.reduce((sum, d) => sum + d.playCount, 0);
    const totalSignups = dailyStats.reduce((sum, d) => sum + d.signups, 0);
    const avgDailyPlays = Math.round(totalPlays / limitDays);
    const avgDailyUsers = Math.round(
      dailyStats.reduce((sum, d) => sum + d.uniqueUsers, 0) / limitDays
    );

    return NextResponse.json({
      success: true,
      data: {
        period: {
          days: limitDays,
          startDate: startDate.toISOString(),
          endDate: new Date().toISOString(),
        },
        daily: dailyStats,
        summary: {
          totalPlays,
          totalSignups,
          avgDailyPlays,
          avgDailyUsers,
        },
      },
    });
  } catch (error) {
    console.error('GET /api/admin/stats/daily error:', error);
    return NextResponse.json(
      { success: false, error: '일별 통계 조회에 실패했습니다.' },
      { status: 500 }
    );
  }
}
