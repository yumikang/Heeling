"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Upload,
  X,
  Save,
  Music,
} from 'lucide-react';

interface Track {
  id: string;
  title: string;
  artist: string | null;
  composer: string | null;
  createdWith: string | null;
  fileUrl: string;
  thumbnailUrl: string | null;
  duration: number;
  fileSize: number | null;
  bpm: number | null;
  category: string | null;
  tags: string[];
  mood: string | null;
  playCount: number;
  likeCount: number;
  isActive: boolean;
  sortOrder: number | null;
  createdAt: string;
}

const CATEGORIES = [
  { value: '', label: '전체 카테고리' },
  { value: 'healing', label: '힐링' },
  { value: 'focus', label: '집중' },
  { value: 'sleep', label: '수면' },
  { value: 'nature', label: '자연' },
  { value: 'cafe', label: '카페' },
  { value: 'meditation', label: '명상' },
];

export default function TracksTab() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [isCreating, setIsCreating] = useState(false);
  const [editingTrack, setEditingTrack] = useState<Track | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // 새 트랙 폼 상태
  const [newTrack, setNewTrack] = useState({
    title: '',
    artist: 'Heeling',
    composer: 'Heeling Studio',
    createdWith: 'Suno AI',
    fileUrl: '',
    thumbnailUrl: '',
    duration: 0,
    category: 'healing',
    tags: '',
    mood: '',
    bpm: 0,
  });

  // 트랙 목록 조회
  const fetchTracks = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });

      if (search) params.append('search', search);
      if (category) params.append('category', category);

      const response = await fetch(`/api/admin/tracks?${params}`);
      const data = await response.json();

      if (data.success) {
        setTracks(data.data);
        setTotalPages(data.meta?.totalPages || 1);
        setTotal(data.meta?.total || data.data?.length || 0);
        setError(null);
      } else {
        setError(data.error || '트랙 목록을 불러오는데 실패했습니다.');
      }
    } catch (err) {
      setError('서버 연결에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [page, search, category]);

  useEffect(() => {
    fetchTracks();
  }, [fetchTracks]);

  // 파일 업로드
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'audio' | 'image') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    try {
      setUploading(true);
      const response = await fetch('/api/admin/tracks/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        if (type === 'audio') {
          setNewTrack(prev => ({ ...prev, fileUrl: data.data.url }));
          // duration은 클라이언트에서 계산해야 함
          const audio = new Audio(data.data.url);
          audio.addEventListener('loadedmetadata', () => {
            setNewTrack(prev => ({ ...prev, duration: Math.round(audio.duration) }));
          });
        } else {
          setNewTrack(prev => ({ ...prev, thumbnailUrl: data.data.url }));
        }
      } else {
        alert(data.error || '업로드에 실패했습니다.');
      }
    } catch (err) {
      alert('업로드 중 오류가 발생했습니다.');
    } finally {
      setUploading(false);
    }
  };

  // 트랙 생성
  const handleCreateTrack = async () => {
    if (!newTrack.title || !newTrack.fileUrl) {
      alert('제목과 오디오 파일은 필수입니다.');
      return;
    }

    try {
      setSaving(true);
      const response = await fetch('/api/admin/tracks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newTrack,
          tags: newTrack.tags ? newTrack.tags.split(',').map(t => t.trim()) : [],
        }),
      });

      const data = await response.json();

      if (data.success) {
        await fetchTracks();
        setIsCreating(false);
        setNewTrack({
          title: '',
          artist: 'Heeling',
          composer: 'Heeling Studio',
          createdWith: 'Suno AI',
          fileUrl: '',
          thumbnailUrl: '',
          duration: 0,
          category: 'healing',
          tags: '',
          mood: '',
          bpm: 0,
        });
      } else {
        alert(data.error || '트랙 생성에 실패했습니다.');
      }
    } catch (err) {
      alert('서버 연결에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // 트랙 삭제
  const handleDeleteTrack = async (id: string) => {
    if (!confirm('이 트랙을 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/admin/tracks/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        await fetchTracks();
      } else {
        alert(data.error || '삭제에 실패했습니다.');
      }
    } catch (err) {
      alert('서버 연결에 실패했습니다.');
    }
  };

  // 트랙 활성화/비활성화 토글
  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/tracks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentActive }),
      });

      const data = await response.json();

      if (data.success) {
        setTracks(prev =>
          prev.map(t => t.id === id ? { ...t, isActive: !currentActive } : t)
        );
      } else {
        alert(data.error || '상태 변경에 실패했습니다.');
      }
    } catch (err) {
      alert('서버 연결에 실패했습니다.');
    }
  };

  // 시간 포맷
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // 날짜 포맷
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-gray-400">총 {total}개의 트랙</p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors"
        >
          <Plus size={20} />
          <span>트랙 추가</span>
        </button>
      </div>

      {/* 검색 및 필터 */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="트랙 검색..."
            className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-500"
          />
        </div>

        <select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPage(1);
          }}
          className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-2 text-white"
        >
          {CATEGORIES.map(cat => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </select>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
          {error}
        </div>
      )}

      {/* 새 트랙 생성 폼 */}
      {isCreating && (
        <div className="p-6 bg-gray-900 rounded-xl border border-gray-800">
          <h3 className="text-xl font-bold text-white mb-4">새 트랙 추가</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">제목 *</label>
              <input
                type="text"
                value={newTrack.title}
                onChange={(e) => setNewTrack(prev => ({ ...prev, title: e.target.value }))}
                placeholder="트랙 제목"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">아티스트</label>
              <input
                type="text"
                value={newTrack.artist}
                onChange={(e) => setNewTrack(prev => ({ ...prev, artist: e.target.value }))}
                placeholder="아티스트"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">오디오 파일 *</label>
              <div className="flex items-center gap-2">
                {newTrack.fileUrl ? (
                  <span className="flex-1 text-green-400 text-sm truncate">{newTrack.fileUrl}</span>
                ) : (
                  <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-800 border border-dashed border-gray-600 rounded-lg cursor-pointer hover:border-gray-500">
                    <Upload size={16} />
                    <span className="text-gray-400 text-sm">오디오 파일 업로드</span>
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={(e) => handleFileUpload(e, 'audio')}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">썸네일 이미지</label>
              <div className="flex items-center gap-2">
                {newTrack.thumbnailUrl ? (
                  <span className="flex-1 text-green-400 text-sm truncate">{newTrack.thumbnailUrl}</span>
                ) : (
                  <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-800 border border-dashed border-gray-600 rounded-lg cursor-pointer hover:border-gray-500">
                    <Upload size={16} />
                    <span className="text-gray-400 text-sm">이미지 업로드</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'image')}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">카테고리</label>
              <select
                value={newTrack.category}
                onChange={(e) => setNewTrack(prev => ({ ...prev, category: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
              >
                {CATEGORIES.slice(1).map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">태그 (쉼표로 구분)</label>
              <input
                type="text"
                value={newTrack.tags}
                onChange={(e) => setNewTrack(prev => ({ ...prev, tags: e.target.value }))}
                placeholder="편안한, 자연, 새소리"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">BPM</label>
              <input
                type="number"
                value={newTrack.bpm || ''}
                onChange={(e) => setNewTrack(prev => ({ ...prev, bpm: parseInt(e.target.value) || 0 }))}
                placeholder="60"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">분위기</label>
              <input
                type="text"
                value={newTrack.mood}
                onChange={(e) => setNewTrack(prev => ({ ...prev, mood: e.target.value }))}
                placeholder="차분한, 평화로운"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleCreateTrack}
              disabled={saving || uploading}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white transition-colors disabled:opacity-50"
            >
              <Save size={16} />
              <span>{saving ? '저장 중...' : '저장'}</span>
            </button>
            <button
              onClick={() => setIsCreating(false)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors"
            >
              <X size={16} />
              <span>취소</span>
            </button>
          </div>
        </div>
      )}

      {/* 트랙 목록 */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-400">로딩 중...</div>
        </div>
      ) : (
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-800/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">트랙</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">카테고리</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">길이</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">재생</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">상태</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">등록일</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">액션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {tracks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    등록된 트랙이 없습니다.
                  </td>
                </tr>
              ) : (
                tracks.map((track) => (
                  <tr key={track.id} className={`hover:bg-gray-800/50 ${!track.isActive ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {track.thumbnailUrl ? (
                          <img
                            src={track.thumbnailUrl}
                            alt={track.title}
                            className="w-10 h-10 rounded object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded bg-gray-700 flex items-center justify-center">
                            <Music size={16} className="text-gray-500" />
                          </div>
                        )}
                        <div>
                          <p className="text-white font-medium">{track.title}</p>
                          <p className="text-gray-500 text-sm">{track.artist}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {track.category && (
                        <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">
                          {CATEGORIES.find(c => c.value === track.category)?.label || track.category}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-sm">
                      {formatDuration(track.duration)}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-sm">
                      {track.playCount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleActive(track.id, track.isActive)}
                        className={`px-2 py-1 rounded text-xs ${track.isActive
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-gray-500/20 text-gray-400'
                          }`}
                      >
                        {track.isActive ? '활성' : '비활성'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-sm">
                      {formatDate(track.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditingTrack(track)}
                          className="p-2 hover:bg-gray-800 rounded text-gray-400 hover:text-white"
                          title="편집"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteTrack(track.id)}
                          className="p-2 hover:bg-red-500/20 rounded text-gray-400 hover:text-red-400"
                          title="삭제"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="px-4 py-3 border-t border-gray-800 flex items-center justify-between">
              <p className="text-gray-400 text-sm">
                {total}개 중 {(page - 1) * 20 + 1}-{Math.min(page * 20, total)}개 표시
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 bg-gray-800 rounded text-gray-400 disabled:opacity-50"
                >
                  이전
                </button>
                <span className="px-3 py-1 text-gray-400">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 bg-gray-800 rounded text-gray-400 disabled:opacity-50"
                >
                  다음
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
