"use client";

import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/AdminLayout';
import {
  User,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  Music,
  Heart,
  Clock,
  Calendar,
  Building2,
  Crown,
  Play,
  Users,
  TrendingUp,
} from 'lucide-react';

// 유저 타입 정의
const USER_TYPES = {
  PERSONAL: { label: '개인', color: 'bg-blue-500/20 text-blue-400' },
  BUSINESS: { label: '비즈니스', color: 'bg-purple-500/20 text-purple-400' },
  GUEST: { label: '게스트', color: 'bg-gray-500/20 text-gray-400' },
};

// 구독 타입 정의
const SUBSCRIPTION_TIERS = {
  FREE: { label: '무료', color: 'bg-gray-500/20 text-gray-400' },
  PREMIUM: { label: '프리미엄', color: 'bg-yellow-500/20 text-yellow-400' },
  BUSINESS: { label: '비즈니스', color: 'bg-purple-500/20 text-purple-400' },
};

interface User {
  id: string;
  email: string | null;
  name: string | null;
  userType: keyof typeof USER_TYPES;
  occupation: string | null;
  businessType: string | null;
  subscriptionTier: keyof typeof SUBSCRIPTION_TIERS;
  subscriptionEndDate: string | null;
  onboardingCompleted: boolean;
  createdAt: string;
  _count: {
    playHistories: number;
    favorites: number;
  };
}

interface UserDetail extends User {
  preferredThemes: string[];
  adFreeUntil: string | null;
  playHistories: Array<{
    id: string;
    playedAt: string;
    completionRate: number;
    listenDuration: number | null;
    track: {
      id: string;
      title: string;
      artist: string | null;
      thumbnailUrl: string | null;
      duration: number;
    };
  }>;
  favorites: Array<{
    id: string;
    createdAt: string;
    track: {
      id: string;
      title: string;
      artist: string | null;
      thumbnailUrl: string | null;
    };
  }>;
  subscriptions: Array<{
    id: string;
    planType: string;
    status: string;
    startedAt: string;
    expiresAt: string;
    amount: number;
    currency: string;
  }>;
  stats: {
    totalPlayCount: number;
    totalFavorites: number;
    totalListenTime: number;
    uniqueTracksPlayed: number;
  };
}

interface Stats {
  totalUsers: number;
  personalUsers: number;
  businessUsers: number;
  premiumUsers: number;
}

export default function UserManager() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterUserType, setFilterUserType] = useState('');
  const [filterSubscription, setFilterSubscription] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState<Stats | null>(null);

  // 상세 모달
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // 회원 목록 조회
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (filterUserType) params.append('userType', filterUserType);
      if (filterSubscription) params.append('subscriptionTier', filterSubscription);
      params.append('page', page.toString());

      const response = await fetch(`/api/admin/users?${params}`);
      const data = await response.json();

      if (data.success) {
        setUsers(data.data);
        setTotalPages(data.pagination.totalPages);
        setStats(data.stats);
      } else {
        setError(data.error || '회원 목록을 불러오는데 실패했습니다.');
      }
    } catch (err) {
      setError('서버 연결에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filterUserType, filterSubscription, page]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchUsers();
    }, 300);

    return () => clearTimeout(debounce);
  }, [fetchUsers]);

  // 회원 상세 조회
  const fetchUserDetail = async (userId: string) => {
    try {
      setDetailLoading(true);
      const response = await fetch(`/api/admin/users/${userId}`);
      const data = await response.json();

      if (data.success) {
        setSelectedUser(data.data);
      } else {
        alert(data.error || '회원 정보를 불러오는데 실패했습니다.');
      }
    } catch (err) {
      alert('서버 연결에 실패했습니다.');
    } finally {
      setDetailLoading(false);
    }
  };

  // 날짜 포맷
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  // 시간 포맷 (초 -> 시:분:초)
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}시간 ${mins}분`;
    }
    return `${mins}분`;
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white">회원 관리</h2>
          <p className="text-gray-400 mt-2">가입된 회원을 조회하고 관리합니다.</p>
        </div>
      </div>

      {/* 통계 카드 */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">전체 회원</p>
                <p className="text-2xl font-bold text-white">{stats.totalUsers.toLocaleString()}</p>
              </div>
              <Users className="text-blue-400" size={24} />
            </div>
          </div>
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">개인 회원</p>
                <p className="text-2xl font-bold text-white">{stats.personalUsers.toLocaleString()}</p>
              </div>
              <User className="text-green-400" size={24} />
            </div>
          </div>
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">비즈니스 회원</p>
                <p className="text-2xl font-bold text-white">{stats.businessUsers.toLocaleString()}</p>
              </div>
              <Building2 className="text-purple-400" size={24} />
            </div>
          </div>
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">유료 회원</p>
                <p className="text-2xl font-bold text-white">{stats.premiumUsers.toLocaleString()}</p>
              </div>
              <Crown className="text-yellow-400" size={24} />
            </div>
          </div>
        </div>
      )}

      {/* 검색 및 필터 */}
      <div className="mb-6 flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            placeholder="이메일 또는 이름으로 검색..."
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500"
          />
        </div>

        <select
          value={filterUserType}
          onChange={(e) => { setFilterUserType(e.target.value); setPage(1); }}
          className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
        >
          <option value="">모든 유형</option>
          {Object.entries(USER_TYPES).map(([key, value]) => (
            <option key={key} value={key}>{value.label}</option>
          ))}
        </select>

        <select
          value={filterSubscription}
          onChange={(e) => { setFilterSubscription(e.target.value); setPage(1); }}
          className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
        >
          <option value="">모든 구독</option>
          {Object.entries(SUBSCRIPTION_TIERS).map(([key, value]) => (
            <option key={key} value={key}>{value.label}</option>
          ))}
        </select>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
          {error}
        </div>
      )}

      {/* 회원 목록 테이블 */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-400">로딩 중...</div>
          </div>
        ) : users.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-gray-400">
            검색 결과가 없습니다.
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-gray-800 text-gray-400 uppercase text-xs">
              <tr>
                <th className="px-6 py-4 font-medium">사용자</th>
                <th className="px-6 py-4 font-medium">유형</th>
                <th className="px-6 py-4 font-medium">구독</th>
                <th className="px-6 py-4 font-medium">활동</th>
                <th className="px-6 py-4 font-medium">가입일</th>
                <th className="px-6 py-4 font-medium text-right">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {users.map((user) => {
                const userTypeInfo = USER_TYPES[user.userType] || USER_TYPES.PERSONAL;
                const subInfo = SUBSCRIPTION_TIERS[user.subscriptionTier] || SUBSCRIPTION_TIERS.FREE;

                return (
                  <tr key={user.id} className="hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-gray-400">
                          <User size={20} />
                        </div>
                        <div>
                          <p className="text-white font-medium">{user.name || '이름 없음'}</p>
                          <p className="text-sm text-gray-500">{user.email || '-'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${userTypeInfo.color}`}>
                        {userTypeInfo.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${subInfo.color}`}>
                        {subInfo.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3 text-sm text-gray-400">
                        <span className="flex items-center gap-1">
                          <Play size={12} />
                          {user._count.playHistories}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart size={12} />
                          {user._count.favorites}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-sm">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => fetchUserDetail(user.id)}
                        className="px-3 py-1 text-purple-400 hover:text-purple-300 text-sm"
                      >
                        상세보기
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 p-4 border-t border-gray-800">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 text-gray-400 hover:text-white disabled:opacity-50"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-gray-400 text-sm">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 text-gray-400 hover:text-white disabled:opacity-50"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>

      {/* 회원 상세 모달 */}
      {(selectedUser || detailLoading) && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">회원 상세 정보</h3>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-1 text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            {detailLoading ? (
              <div className="p-8 text-center text-gray-400">로딩 중...</div>
            ) : selectedUser && (
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-60px)]">
                {/* 기본 정보 */}
                <div className="flex items-start gap-6 mb-6">
                  <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center">
                    <User size={40} className="text-gray-500" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xl font-bold text-white">{selectedUser.name || '이름 없음'}</h4>
                    <p className="text-gray-400">{selectedUser.email || '-'}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`px-2 py-0.5 rounded text-xs ${USER_TYPES[selectedUser.userType]?.color || ''}`}>
                        {USER_TYPES[selectedUser.userType]?.label}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs ${SUBSCRIPTION_TIERS[selectedUser.subscriptionTier]?.color || ''}`}>
                        {SUBSCRIPTION_TIERS[selectedUser.subscriptionTier]?.label}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 통계 카드 */}
                <div className="grid grid-cols-4 gap-3 mb-6">
                  <div className="bg-gray-800 rounded-lg p-3 text-center">
                    <Play size={16} className="mx-auto mb-1 text-blue-400" />
                    <p className="text-lg font-bold text-white">{selectedUser.stats.totalPlayCount}</p>
                    <p className="text-xs text-gray-400">재생 횟수</p>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-3 text-center">
                    <Heart size={16} className="mx-auto mb-1 text-red-400" />
                    <p className="text-lg font-bold text-white">{selectedUser.stats.totalFavorites}</p>
                    <p className="text-xs text-gray-400">즐겨찾기</p>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-3 text-center">
                    <Clock size={16} className="mx-auto mb-1 text-green-400" />
                    <p className="text-lg font-bold text-white">{formatDuration(selectedUser.stats.totalListenTime)}</p>
                    <p className="text-xs text-gray-400">청취 시간</p>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-3 text-center">
                    <Music size={16} className="mx-auto mb-1 text-purple-400" />
                    <p className="text-lg font-bold text-white">{selectedUser.stats.uniqueTracksPlayed}</p>
                    <p className="text-xs text-gray-400">청취 곡 수</p>
                  </div>
                </div>

                {/* 최근 재생 이력 */}
                <div className="mb-6">
                  <h5 className="text-sm font-medium text-gray-400 mb-3">최근 재생 이력</h5>
                  {selectedUser.playHistories.length === 0 ? (
                    <p className="text-gray-500 text-sm">재생 이력이 없습니다.</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedUser.playHistories.slice(0, 5).map((history) => (
                        <div key={history.id} className="flex items-center gap-3 bg-gray-800 rounded-lg p-2">
                          <div className="w-10 h-10 bg-gray-700 rounded overflow-hidden flex-shrink-0">
                            {history.track.thumbnailUrl ? (
                              <img src={history.track.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Music size={16} className="text-gray-500" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm truncate">{history.track.title}</p>
                            <p className="text-gray-500 text-xs">{history.track.artist || 'Heeling'}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-gray-400 text-xs">{Math.round(history.completionRate * 100)}%</p>
                            <p className="text-gray-500 text-xs">{formatDate(history.playedAt)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 즐겨찾기 */}
                <div className="mb-6">
                  <h5 className="text-sm font-medium text-gray-400 mb-3">즐겨찾기</h5>
                  {selectedUser.favorites.length === 0 ? (
                    <p className="text-gray-500 text-sm">즐겨찾기가 없습니다.</p>
                  ) : (
                    <div className="flex gap-2 flex-wrap">
                      {selectedUser.favorites.slice(0, 8).map((fav) => (
                        <div key={fav.id} className="flex items-center gap-2 bg-gray-800 rounded-lg p-2">
                          <div className="w-8 h-8 bg-gray-700 rounded overflow-hidden flex-shrink-0">
                            {fav.track.thumbnailUrl ? (
                              <img src={fav.track.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Music size={12} className="text-gray-500" />
                              </div>
                            )}
                          </div>
                          <span className="text-white text-sm truncate max-w-[100px]">{fav.track.title}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 가입 정보 */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400">가입일</p>
                    <p className="text-white">{formatDate(selectedUser.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">구독 만료일</p>
                    <p className="text-white">{formatDate(selectedUser.subscriptionEndDate)}</p>
                  </div>
                  {selectedUser.occupation && (
                    <div>
                      <p className="text-gray-400">직업</p>
                      <p className="text-white">{selectedUser.occupation}</p>
                    </div>
                  )}
                  {selectedUser.businessType && (
                    <div>
                      <p className="text-gray-400">업종</p>
                      <p className="text-white">{selectedUser.businessType}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
