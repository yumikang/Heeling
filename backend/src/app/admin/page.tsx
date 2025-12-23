"use client";

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { Users, Play, TrendingUp, Crown, Loader2, Calendar, Music, Heart } from 'lucide-react';

interface DailyStats {
  period: { days: number; startDate: string; endDate: string };
  daily: Array<{ date: string; playCount: number; uniqueUsers: number; signups: number }>;
  summary: { totalPlays: number; totalSignups: number; avgDailyPlays: number; avgDailyUsers: number };
}

interface PopularStats {
  period: { days: number; startDate: string; endDate: string };
  topTracks: Array<{
    rank: number;
    trackId: string;
    title: string;
    artist: string;
    thumbnailUrl?: string;
    periodPlayCount: number;
    periodUniqueUsers: number;
    category?: string;
  }>;
  categoryBreakdown: Array<{ category: string; playCount: number }>;
}

interface UserStats {
  overview: {
    totalUsers: number;
    dauToday: number;
    dauYesterday: number;
    dauChange: string;
    wau: number;
    mau: number;
    stickiness: string;
    conversionRate: string;
  };
  breakdown: {
    byType: Array<{ type: string; count: number }>;
    byTier: Array<{ tier: string; count: number }>;
  };
  trend: Array<{ date: string; signups: number; dau: number }>;
}

const COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899'];

const StatCard = ({ title, value, subValue, icon: Icon, color, loading }: {
  title: string;
  value: string | number;
  subValue?: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  color: string;
  loading?: boolean;
}) => (
  <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-gray-400 text-sm">{title}</p>
        {loading ? (
          <Loader2 className="w-6 h-6 animate-spin text-gray-400 mt-2" />
        ) : (
          <>
            <h3 className="text-3xl font-bold text-white mt-2">{value.toLocaleString()}</h3>
            {subValue && <p className="text-gray-500 text-sm mt-1">{subValue}</p>}
          </>
        )}
      </div>
      <div className={`p-3 rounded-lg ${color} bg-opacity-20`}>
        <Icon className={color.replace('bg-', 'text-')} size={24} />
      </div>
    </div>
  </div>
);

const PeriodSelector = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => (
  <div className="flex gap-2">
    {[7, 30, 90].map(d => (
      <button
        key={d}
        onClick={() => onChange(d)}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
          value === d
            ? 'bg-blue-600 text-white'
            : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
        }`}
      >
        {d}일
      </button>
    ))}
  </div>
);

export default function AdminDashboard() {
  const [period, setPeriod] = useState(7);
  const [loading, setLoading] = useState(true);
  const [dailyStats, setDailyStats] = useState<DailyStats | null>(null);
  const [popularStats, setPopularStats] = useState<PopularStats | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);

  useEffect(() => {
    fetchStats();
  }, [period]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [dailyRes, popularRes, userRes] = await Promise.all([
        fetch(`/api/admin/stats/daily?days=${period}`),
        fetch(`/api/admin/stats/popular?days=${period}&limit=10`),
        fetch(`/api/admin/stats/users?days=${period}`),
      ]);

      const [daily, popular, users] = await Promise.all([
        dailyRes.json(),
        popularRes.json(),
        userRes.json(),
      ]);

      if (daily.success) setDailyStats(daily.data);
      if (popular.success) setPopularStats(popular.data);
      if (users.success) setUserStats(users.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // 차트 데이터 가공
  const chartData = dailyStats?.daily.map(d => ({
    name: new Date(d.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
    재생수: d.playCount,
    활성사용자: d.uniqueUsers,
    가입자: d.signups,
  })) || [];

  const userTrendData = userStats?.trend.map(d => ({
    name: new Date(d.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
    DAU: d.dau,
    가입자: d.signups,
  })) || [];

  const categoryData = popularStats?.categoryBreakdown.map(c => ({
    name: c.category === 'uncategorized' ? '미분류' : c.category,
    value: c.playCount,
  })) || [];

  const tierData = userStats?.breakdown.byTier.map(t => ({
    name: t.tier === 'FREE' ? '무료' : t.tier === 'PREMIUM' ? '프리미엄' : '비즈니스',
    value: t.count,
  })) || [];

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white">대시보드</h2>
          <p className="text-gray-400 mt-2">힐링 앱의 주요 지표와 현황을 한눈에 확인하세요.</p>
        </div>
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="총 사용자"
          value={userStats?.overview.totalUsers || 0}
          subValue={`MAU: ${userStats?.overview.mau.toLocaleString() || 0}`}
          icon={Users}
          color="bg-blue-500"
          loading={loading}
        />
        <StatCard
          title="DAU (오늘)"
          value={userStats?.overview.dauToday || 0}
          subValue={`전일 대비: ${userStats?.overview.dauChange || '0'}%`}
          icon={TrendingUp}
          color="bg-green-500"
          loading={loading}
        />
        <StatCard
          title="총 재생 수"
          value={dailyStats?.summary.totalPlays || 0}
          subValue={`일평균: ${dailyStats?.summary.avgDailyPlays.toLocaleString() || 0}`}
          icon={Play}
          color="bg-purple-500"
          loading={loading}
        />
        <StatCard
          title="프리미엄 전환율"
          value={userStats?.overview.conversionRate || '0%'}
          subValue={`Stickiness: ${userStats?.overview.stickiness || '0%'}`}
          icon={Crown}
          color="bg-orange-500"
          loading={loading}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Daily Activity Chart */}
        <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
          <div className="flex items-center gap-2 mb-6">
            <Calendar className="w-5 h-5 text-blue-500" />
            <h3 className="text-xl font-bold text-white">일별 활동 추이</h3>
          </div>
          <div className="h-[300px]">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} />
                  <YAxis stroke="#9CA3AF" fontSize={12} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
                    itemStyle={{ color: '#F3F4F6' }}
                  />
                  <Area type="monotone" dataKey="재생수" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
                  <Area type="monotone" dataKey="활성사용자" stroke="#10B981" fill="#10B981" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* DAU Trend Chart */}
        <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
          <div className="flex items-center gap-2 mb-6">
            <Users className="w-5 h-5 text-green-500" />
            <h3 className="text-xl font-bold text-white">사용자 추이 (DAU/가입자)</h3>
          </div>
          <div className="h-[300px]">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={userTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} />
                  <YAxis stroke="#9CA3AF" fontSize={12} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
                    itemStyle={{ color: '#F3F4F6' }}
                  />
                  <Line type="monotone" dataKey="DAU" stroke="#8B5CF6" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="가입자" stroke="#F59E0B" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Category Breakdown */}
        <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
          <div className="flex items-center gap-2 mb-6">
            <Music className="w-5 h-5 text-purple-500" />
            <h3 className="text-xl font-bold text-white">카테고리별 재생</h3>
          </div>
          <div className="h-[250px]">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              </div>
            ) : categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {categoryData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
                    itemStyle={{ color: '#F3F4F6' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                데이터가 없습니다
              </div>
            )}
          </div>
        </div>

        {/* Subscription Tier Breakdown */}
        <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
          <div className="flex items-center gap-2 mb-6">
            <Crown className="w-5 h-5 text-orange-500" />
            <h3 className="text-xl font-bold text-white">구독 티어 분포</h3>
          </div>
          <div className="h-[250px]">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              </div>
            ) : tierData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tierData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis type="number" stroke="#9CA3AF" fontSize={12} />
                  <YAxis dataKey="name" type="category" stroke="#9CA3AF" fontSize={12} width={80} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
                    itemStyle={{ color: '#F3F4F6' }}
                  />
                  <Bar dataKey="value" fill="#F59E0B" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                데이터가 없습니다
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
          <h3 className="text-xl font-bold text-white mb-6">빠른 통계</h3>
          {loading ? (
            <div className="flex items-center justify-center h-[250px]">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-800 rounded-lg">
                <span className="text-gray-400">WAU (주간 활성)</span>
                <span className="text-white font-bold">{userStats?.overview.wau.toLocaleString() || 0}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-800 rounded-lg">
                <span className="text-gray-400">MAU (월간 활성)</span>
                <span className="text-white font-bold">{userStats?.overview.mau.toLocaleString() || 0}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-800 rounded-lg">
                <span className="text-gray-400">일평균 재생</span>
                <span className="text-white font-bold">{dailyStats?.summary.avgDailyPlays.toLocaleString() || 0}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-800 rounded-lg">
                <span className="text-gray-400">일평균 활성</span>
                <span className="text-white font-bold">{dailyStats?.summary.avgDailyUsers.toLocaleString() || 0}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-800 rounded-lg">
                <span className="text-gray-400">기간 내 가입</span>
                <span className="text-white font-bold">{dailyStats?.summary.totalSignups.toLocaleString() || 0}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Popular Tracks */}
      <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
        <div className="flex items-center gap-2 mb-6">
          <Heart className="w-5 h-5 text-red-500" />
          <h3 className="text-xl font-bold text-white">인기 트랙 TOP 10</h3>
        </div>
        {loading ? (
          <div className="flex items-center justify-center h-[200px]">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : popularStats?.topTracks && popularStats.topTracks.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-400 border-b border-gray-800">
                  <th className="pb-3 pl-3">순위</th>
                  <th className="pb-3">트랙</th>
                  <th className="pb-3">카테고리</th>
                  <th className="pb-3 text-right">재생 수</th>
                  <th className="pb-3 text-right pr-3">사용자 수</th>
                </tr>
              </thead>
              <tbody>
                {popularStats.topTracks.map((track) => (
                  <tr key={track.trackId} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="py-3 pl-3">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                        track.rank === 1 ? 'bg-yellow-500 text-black' :
                        track.rank === 2 ? 'bg-gray-400 text-black' :
                        track.rank === 3 ? 'bg-orange-600 text-white' :
                        'bg-gray-700 text-white'
                      }`}>
                        {track.rank}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        {track.thumbnailUrl ? (
                          <img
                            src={track.thumbnailUrl}
                            alt={track.title}
                            className="w-10 h-10 rounded object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded bg-gray-700 flex items-center justify-center">
                            <Music className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <p className="text-white font-medium">{track.title}</p>
                          <p className="text-gray-500 text-sm">{track.artist}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3">
                      <span className="px-2 py-1 bg-gray-700 rounded text-gray-300 text-sm">
                        {track.category || '미분류'}
                      </span>
                    </td>
                    <td className="py-3 text-right text-white font-medium">
                      {track.periodPlayCount.toLocaleString()}
                    </td>
                    <td className="py-3 text-right pr-3 text-gray-400">
                      {track.periodUniqueUsers.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex items-center justify-center h-[200px] text-gray-500">
            인기 트랙 데이터가 없습니다
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
