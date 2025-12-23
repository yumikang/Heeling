import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// ============================================
// GET /api/admin/stats/users - 사용자 통계 (DAU/MAU 등)
// ============================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');

    // 최대 90일까지 허용
    const limitDays = Math.min(days, 90);

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // 총 사용자 수
    const totalUsers = await prisma.user.count();

    // 유형별 사용자 수
    const usersByType = await prisma.user.groupBy({
      by: ['userType'],
      _count: { id: true },
    });

    // 구독 티어별 사용자 수
    const usersByTier = await prisma.user.groupBy({
      by: ['subscriptionTier'],
      _count: { id: true },
    });

    // DAU (Daily Active Users) - 오늘 재생 기록이 있는 사용자
    const dauToday = await prisma.playHistory.groupBy({
      by: ['userId'],
      where: {
        playedAt: { gte: today },
      },
    }).then(r => r.length);

    // DAU (어제)
    const dauYesterday = await prisma.playHistory.groupBy({
      by: ['userId'],
      where: {
        playedAt: {
          gte: yesterday,
          lt: today,
        },
      },
    }).then(r => r.length);

    // WAU (Weekly Active Users) - 최근 7일
    const wau = await prisma.playHistory.groupBy({
      by: ['userId'],
      where: {
        playedAt: { gte: sevenDaysAgo },
      },
    }).then(r => r.length);

    // MAU (Monthly Active Users) - 최근 30일
    const mau = await prisma.playHistory.groupBy({
      by: ['userId'],
      where: {
        playedAt: { gte: thirtyDaysAgo },
      },
    }).then(r => r.length);

    // 일별 신규 가입자 추이
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - limitDays);

    const signupTrend = await prisma.$queryRaw<Array<{ date: Date; count: bigint }>>`
      SELECT
        DATE("createdAt") as date,
        COUNT(*) as count
      FROM "User"
      WHERE "createdAt" >= ${startDate}
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `;

    // 일별 DAU 추이
    const dauTrend = await prisma.$queryRaw<Array<{ date: Date; dau: bigint }>>`
      SELECT
        DATE("playedAt") as date,
        COUNT(DISTINCT "userId") as dau
      FROM "PlayHistory"
      WHERE "playedAt" >= ${startDate}
      GROUP BY DATE("playedAt")
      ORDER BY date ASC
    `;

    // 데이터 정규화
    const dateMap = new Map<string, { date: string; signups: number; dau: number }>();

    for (let i = 0; i < limitDays; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - (limitDays - 1 - i));
      const dateStr = d.toISOString().split('T')[0];
      dateMap.set(dateStr, { date: dateStr, signups: 0, dau: 0 });
    }

    for (const s of signupTrend) {
      const dateStr = new Date(s.date).toISOString().split('T')[0];
      const existing = dateMap.get(dateStr);
      if (existing) existing.signups = Number(s.count);
    }

    for (const d of dauTrend) {
      const dateStr = new Date(d.date).toISOString().split('T')[0];
      const existing = dateMap.get(dateStr);
      if (existing) existing.dau = Number(d.dau);
    }

    const trend = Array.from(dateMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    // 프리미엄 전환율 계산
    const premiumUsers = usersByTier.find(t => t.subscriptionTier === 'PREMIUM')?._count.id || 0;
    const businessUsers = usersByTier.find(t => t.subscriptionTier === 'BUSINESS')?._count.id || 0;
    const paidUsers = premiumUsers + businessUsers;
    const conversionRate = totalUsers > 0 ? ((paidUsers / totalUsers) * 100).toFixed(2) : '0.00';

    // Stickiness (DAU/MAU 비율)
    const stickiness = mau > 0 ? ((dauToday / mau) * 100).toFixed(2) : '0.00';

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          dauToday,
          dauYesterday,
          dauChange: dauYesterday > 0
            ? (((dauToday - dauYesterday) / dauYesterday) * 100).toFixed(2)
            : '0.00',
          wau,
          mau,
          stickiness: `${stickiness}%`,
          conversionRate: `${conversionRate}%`,
        },
        breakdown: {
          byType: usersByType.map(t => ({
            type: t.userType,
            count: t._count.id,
          })),
          byTier: usersByTier.map(t => ({
            tier: t.subscriptionTier,
            count: t._count.id,
          })),
        },
        trend,
        period: {
          days: limitDays,
          startDate: startDate.toISOString(),
          endDate: now.toISOString(),
        },
      },
    });
  } catch (error) {
    console.error('GET /api/admin/stats/users error:', error);
    return NextResponse.json(
      { success: false, error: '사용자 통계 조회에 실패했습니다.' },
      { status: 500 }
    );
  }
}
