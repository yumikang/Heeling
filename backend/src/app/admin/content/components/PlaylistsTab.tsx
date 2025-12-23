"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Trash2,
  Save,
  X,
  Eye,
  EyeOff,
  Star,
  StarOff,
  Search,
  Music,
  ChevronUp,
  ChevronDown,
  Upload,
  Check,
  ListMusic
} from 'lucide-react';

// 플레이리스트 타입 정의
const PLAYLIST_TYPES = {
  MANUAL: { label: '수동 생성', color: 'bg-blue-500' },
  AUTO_GENERATED: { label: '자동 생성', color: 'bg-green-500' },
  BUSINESS_TEMPLATE: { label: '비즈니스 템플릿', color: 'bg-purple-500' },
  THEME: { label: '테마', color: 'bg-orange-500' },
};

const TIME_SLOTS = {
  MORNING: '아침',
  AFTERNOON: '오후',
  EVENING: '저녁',
  NIGHT: '밤',
};

interface Track {
  id: string;
  title: string;
  artist: string | null;
  thumbnailUrl: string | null;
  duration: number;
  category: string | null;
}

interface PlaylistTrack {
  id: string;
  trackId: string;
  position: number;
  track: Track;
}

interface Playlist {
  id: string;
  name: string;
  description: string | null;
  coverImage: string | null;
  type: keyof typeof PLAYLIST_TYPES;
  theme: string | null;
  timeSlot: keyof typeof TIME_SLOTS | null;
  playCount: number;
  isPublic: boolean;
  isFeatured: boolean;
  createdAt: string;
  tracks: PlaylistTrack[];
  _count: { tracks: number };
}

export default function PlaylistsTab() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  // 트랙 선택 모달 상태
  const [trackModalOpen, setTrackModalOpen] = useState(false);
  const [trackModalPlaylistId, setTrackModalPlaylistId] = useState<string | null>(null);
  const [availableTracks, setAvailableTracks] = useState<Track[]>([]);
  const [trackSearchQuery, setTrackSearchQuery] = useState('');
  const [selectedTrackIds, setSelectedTrackIds] = useState<string[]>([]);
  const [tracksLoading, setTracksLoading] = useState(false);

  // 새 플레이리스트 폼 상태
  const [newPlaylist, setNewPlaylist] = useState({
    name: '',
    description: '',
    coverImage: '',
    type: 'MANUAL' as keyof typeof PLAYLIST_TYPES,
    theme: '',
    timeSlot: '' as keyof typeof TIME_SLOTS | '',
    isPublic: true,
    isFeatured: false,
  });

  // 플레이리스트 목록 조회
  const fetchPlaylists = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterType) params.append('type', filterType);
      if (searchQuery) params.append('search', searchQuery);

      const response = await fetch(`/api/admin/playlists?${params}`);
      const data = await response.json();

      if (data.success) {
        setPlaylists(data.data);
      } else {
        setError(data.error || '플레이리스트 목록을 불러오는데 실패했습니다.');
      }
    } catch (err) {
      setError('서버 연결에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [filterType, searchQuery]);

  useEffect(() => {
    fetchPlaylists();
  }, [fetchPlaylists]);

  // 트랙 목록 조회
  const fetchTracks = async (search: string = '') => {
    try {
      setTracksLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      params.append('limit', '50');

      const response = await fetch(`/api/admin/tracks?${params}`);
      const data = await response.json();

      if (data.success) {
        setAvailableTracks(data.data);
      }
    } catch (err) {
      console.error('트랙 목록 조회 실패:', err);
    } finally {
      setTracksLoading(false);
    }
  };

  // 이미지 업로드
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'new' | string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'image');

    try {
      setUploading(true);
      const response = await fetch('/api/admin/tracks/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        if (target === 'new') {
          setNewPlaylist(prev => ({ ...prev, coverImage: data.data.url }));
        } else {
          setPlaylists(prev =>
            prev.map(p => p.id === target ? { ...p, coverImage: data.data.url } : p)
          );
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

  // 플레이리스트 생성
  const handleCreatePlaylist = async () => {
    if (!newPlaylist.name) {
      alert('플레이리스트 이름은 필수입니다.');
      return;
    }

    try {
      setSaving(true);
      const response = await fetch('/api/admin/playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newPlaylist,
          description: newPlaylist.description || null,
          coverImage: newPlaylist.coverImage || null,
          theme: newPlaylist.theme || null,
          timeSlot: newPlaylist.timeSlot || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        await fetchPlaylists();
        setIsCreating(false);
        setNewPlaylist({
          name: '',
          description: '',
          coverImage: '',
          type: 'MANUAL',
          theme: '',
          timeSlot: '',
          isPublic: true,
          isFeatured: false,
        });
      } else {
        alert(data.error || '플레이리스트 생성에 실패했습니다.');
      }
    } catch (err) {
      alert('서버 연결에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // 플레이리스트 수정 저장
  const handleSavePlaylist = async (playlist: Playlist) => {
    try {
      setSaving(true);
      const response = await fetch(`/api/admin/playlists/${playlist.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: playlist.name,
          description: playlist.description,
          coverImage: playlist.coverImage,
          theme: playlist.theme,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setEditingId(null);
      } else {
        alert(data.error || '저장에 실패했습니다.');
      }
    } catch (err) {
      alert('서버 연결에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // 플레이리스트 삭제
  const handleDeletePlaylist = async (id: string) => {
    if (!confirm('이 플레이리스트를 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/admin/playlists/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        await fetchPlaylists();
      } else {
        alert(data.error || '삭제에 실패했습니다.');
      }
    } catch (err) {
      alert('서버 연결에 실패했습니다.');
    }
  };

  // 공개/비공개 토글
  const handleTogglePublic = async (id: string, currentPublic: boolean) => {
    try {
      const response = await fetch(`/api/admin/playlists/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublic: !currentPublic }),
      });

      const data = await response.json();

      if (data.success) {
        setPlaylists(prev =>
          prev.map(p => p.id === id ? { ...p, isPublic: !currentPublic } : p)
        );
      } else {
        alert(data.error || '상태 변경에 실패했습니다.');
      }
    } catch (err) {
      alert('서버 연결에 실패했습니다.');
    }
  };

  // 추천 토글
  const handleToggleFeatured = async (id: string, currentFeatured: boolean) => {
    try {
      const response = await fetch(`/api/admin/playlists/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFeatured: !currentFeatured }),
      });

      const data = await response.json();

      if (data.success) {
        setPlaylists(prev =>
          prev.map(p => p.id === id ? { ...p, isFeatured: !currentFeatured } : p)
        );
      } else {
        alert(data.error || '상태 변경에 실패했습니다.');
      }
    } catch (err) {
      alert('서버 연결에 실패했습니다.');
    }
  };

  // 트랙 추가 모달 열기
  const openTrackModal = (playlistId: string) => {
    setTrackModalPlaylistId(playlistId);
    setTrackModalOpen(true);
    setSelectedTrackIds([]);
    fetchTracks();
  };

  // 트랙 추가 실행
  const handleAddTracks = async () => {
    if (!trackModalPlaylistId || selectedTrackIds.length === 0) return;

    try {
      setSaving(true);
      const response = await fetch(`/api/admin/playlists/${trackModalPlaylistId}/tracks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackIds: selectedTrackIds }),
      });

      const data = await response.json();

      if (data.success) {
        setTrackModalOpen(false);
        setSelectedTrackIds([]);
        await fetchPlaylists();
      } else {
        alert(data.error || '트랙 추가에 실패했습니다.');
      }
    } catch (err) {
      alert('서버 연결에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // 트랙 제거
  const handleRemoveTrack = async (playlistId: string, trackId: string) => {
    try {
      const response = await fetch(`/api/admin/playlists/${playlistId}/tracks?trackId=${trackId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        await fetchPlaylists();
      } else {
        alert(data.error || '트랙 제거에 실패했습니다.');
      }
    } catch (err) {
      alert('서버 연결에 실패했습니다.');
    }
  };

  // 트랙 순서 변경
  const handleMoveTrack = async (playlistId: string, tracks: PlaylistTrack[], fromIndex: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && fromIndex === 0) ||
      (direction === 'down' && fromIndex === tracks.length - 1)
    ) {
      return;
    }

    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
    const newTracks = [...tracks];
    [newTracks[fromIndex], newTracks[toIndex]] = [newTracks[toIndex], newTracks[fromIndex]];

    // UI 즉시 업데이트
    setPlaylists(prev =>
      prev.map(p => {
        if (p.id === playlistId) {
          return {
            ...p,
            tracks: newTracks.map((t, idx) => ({ ...t, position: idx })),
          };
        }
        return p;
      })
    );

    // API 호출
    try {
      await fetch(`/api/admin/playlists/${playlistId}/tracks`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trackIds: newTracks.map(t => t.trackId),
        }),
      });
    } catch (err) {
      console.error('순서 저장 실패:', err);
      fetchPlaylists();
    }
  };

  // 필드 업데이트
  const handleFieldChange = (id: string, field: keyof Playlist, value: any) => {
    setPlaylists(prev =>
      prev.map(p => p.id === id ? { ...p, [field]: value } : p)
    );
  };

  // 시간 포맷
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-gray-400">음악 플레이리스트를 관리하고 트랙을 구성합니다.</p>
        <button
          onClick={() => setIsCreating(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 font-medium transition-colors"
        >
          <Plus size={20} />
          새 플레이리스트
        </button>
      </div>

      {/* 필터 및 검색 */}
      <div className="flex flex-wrap gap-4">
        <div className="flex gap-2">
          <button
            onClick={() => setFilterType('')}
            className={`px-4 py-2 rounded-lg transition-colors ${filterType === '' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
          >
            전체
          </button>
          {Object.entries(PLAYLIST_TYPES).map(([key, value]) => (
            <button
              key={key}
              onClick={() => setFilterType(key)}
              className={`px-4 py-2 rounded-lg transition-colors ${filterType === key ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
            >
              {value.label}
            </button>
          ))}
        </div>

        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="플레이리스트 검색..."
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
          {error}
        </div>
      )}

      {/* 새 플레이리스트 생성 폼 */}
      {isCreating && (
        <div className="p-6 bg-gray-900 rounded-xl border border-gray-800">
          <h3 className="text-xl font-bold text-white mb-4">새 플레이리스트 추가</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">플레이리스트 이름*</label>
              <input
                type="text"
                value={newPlaylist.name}
                onChange={(e) => setNewPlaylist(prev => ({ ...prev, name: e.target.value }))}
                placeholder="플레이리스트 이름"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">타입</label>
              <select
                value={newPlaylist.type}
                onChange={(e) => setNewPlaylist(prev => ({ ...prev, type: e.target.value as keyof typeof PLAYLIST_TYPES }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
              >
                {Object.entries(PLAYLIST_TYPES).map(([key, value]) => (
                  <option key={key} value={key}>{value.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">테마</label>
              <input
                type="text"
                value={newPlaylist.theme}
                onChange={(e) => setNewPlaylist(prev => ({ ...prev, theme: e.target.value }))}
                placeholder="예: healing, focus, sleep"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">시간대</label>
              <select
                value={newPlaylist.timeSlot}
                onChange={(e) => setNewPlaylist(prev => ({ ...prev, timeSlot: e.target.value as keyof typeof TIME_SLOTS | '' }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
              >
                <option value="">선택 안함</option>
                {Object.entries(TIME_SLOTS).map(([key, value]) => (
                  <option key={key} value={key}>{value}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm text-gray-400 mb-2">설명</label>
              <input
                type="text"
                value={newPlaylist.description}
                onChange={(e) => setNewPlaylist(prev => ({ ...prev, description: e.target.value }))}
                placeholder="플레이리스트 설명"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">커버 이미지</label>
              <div className="flex items-center gap-2">
                {newPlaylist.coverImage ? (
                  <span className="flex-1 text-green-400 text-sm truncate">{newPlaylist.coverImage}</span>
                ) : (
                  <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-800 border border-dashed border-gray-600 rounded-lg cursor-pointer hover:border-gray-500">
                    <Upload size={16} />
                    <span className="text-gray-400 text-sm">이미지 업로드</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 'new')}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                )}
              </div>
            </div>

            <div className="flex items-center gap-6 pt-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newPlaylist.isPublic}
                  onChange={(e) => setNewPlaylist(prev => ({ ...prev, isPublic: e.target.checked }))}
                  className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-purple-600"
                />
                <span className="text-gray-300">공개</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newPlaylist.isFeatured}
                  onChange={(e) => setNewPlaylist(prev => ({ ...prev, isFeatured: e.target.checked }))}
                  className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-purple-600"
                />
                <span className="text-gray-300">추천</span>
              </label>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleCreatePlaylist}
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

      {/* 플레이리스트 목록 */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-400">로딩 중...</div>
        </div>
      ) : (
        <div className="space-y-6">
          {playlists.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              등록된 플레이리스트가 없습니다. "새 플레이리스트" 버튼을 클릭하여 추가하세요.
            </div>
          ) : (
            playlists.map((playlist) => {
              const typeInfo = PLAYLIST_TYPES[playlist.type] || PLAYLIST_TYPES.MANUAL;
              const isEditing = editingId === playlist.id;

              return (
                <div
                  key={playlist.id}
                  className={`bg-gray-900 rounded-xl border overflow-hidden ${playlist.isPublic ? 'border-gray-800' : 'border-gray-800/50 opacity-70'}`}
                >
                  {/* 플레이리스트 헤더 */}
                  <div className="p-6 flex gap-6">
                    {/* 커버 이미지 */}
                    <div className="w-32 h-32 bg-gray-800 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
                      {playlist.coverImage ? (
                        <img
                          src={playlist.coverImage}
                          alt={playlist.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ListMusic className="text-gray-600" size={48} />
                      )}
                    </div>

                    {/* 플레이리스트 정보 */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2 py-0.5 ${typeInfo.color} text-white text-xs rounded`}>
                              {typeInfo.label}
                            </span>
                            {playlist.isFeatured && (
                              <span className="px-2 py-0.5 bg-yellow-500 text-black text-xs rounded flex items-center gap-1">
                                <Star size={10} fill="currentColor" />
                                추천
                              </span>
                            )}
                            {playlist.timeSlot && (
                              <span className="px-2 py-0.5 bg-gray-700 text-gray-300 text-xs rounded">
                                {TIME_SLOTS[playlist.timeSlot]}
                              </span>
                            )}
                          </div>

                          {isEditing ? (
                            <input
                              type="text"
                              value={playlist.name}
                              onChange={(e) => handleFieldChange(playlist.id, 'name', e.target.value)}
                              className="text-xl font-bold bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white"
                            />
                          ) : (
                            <h3 className="text-xl font-bold text-white">{playlist.name}</h3>
                          )}

                          {isEditing ? (
                            <input
                              type="text"
                              value={playlist.description || ''}
                              onChange={(e) => handleFieldChange(playlist.id, 'description', e.target.value)}
                              placeholder="설명 추가"
                              className="mt-1 w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-gray-400 text-sm"
                            />
                          ) : (
                            <p className="text-gray-400 text-sm mt-1">{playlist.description || '설명 없음'}</p>
                          )}
                        </div>

                        {/* 액션 버튼 */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleTogglePublic(playlist.id, playlist.isPublic)}
                            className="p-2 text-gray-400 hover:text-white transition-colors"
                            title={playlist.isPublic ? '비공개로 전환' : '공개로 전환'}
                          >
                            {playlist.isPublic ? <Eye size={18} /> : <EyeOff size={18} />}
                          </button>
                          <button
                            onClick={() => handleToggleFeatured(playlist.id, playlist.isFeatured)}
                            className={`p-2 transition-colors ${playlist.isFeatured ? 'text-yellow-400' : 'text-gray-400 hover:text-yellow-400'}`}
                            title={playlist.isFeatured ? '추천 해제' : '추천 설정'}
                          >
                            {playlist.isFeatured ? <Star size={18} fill="currentColor" /> : <StarOff size={18} />}
                          </button>
                          {isEditing ? (
                            <>
                              <button
                                onClick={() => handleSavePlaylist(playlist)}
                                disabled={saving}
                                className="p-2 text-green-400 hover:text-green-300"
                              >
                                <Save size={18} />
                              </button>
                              <button
                                onClick={() => { setEditingId(null); fetchPlaylists(); }}
                                className="p-2 text-gray-400 hover:text-white"
                              >
                                <X size={18} />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => setEditingId(playlist.id)}
                              className="px-3 py-1 text-purple-400 hover:text-purple-300 text-sm"
                            >
                              편집
                            </button>
                          )}
                          <button
                            onClick={() => handleDeletePlaylist(playlist.id)}
                            className="p-2 text-red-400 hover:text-red-300"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
                        <span>{playlist._count.tracks}곡</span>
                        <span>재생 {playlist.playCount.toLocaleString()}회</span>
                        {playlist.theme && <span>테마: {playlist.theme}</span>}
                      </div>
                    </div>
                  </div>

                  {/* 트랙 목록 */}
                  <div className="border-t border-gray-800">
                    <div className="p-4 flex items-center justify-between bg-gray-800/30">
                      <h4 className="text-sm font-medium text-gray-400">트랙 목록</h4>
                      <button
                        onClick={() => openTrackModal(playlist.id)}
                        className="flex items-center gap-1 px-3 py-1 bg-purple-600/20 text-purple-400 rounded hover:bg-purple-600/30 text-sm"
                      >
                        <Plus size={14} />
                        트랙 추가
                      </button>
                    </div>

                    {playlist.tracks.length === 0 ? (
                      <div className="p-8 text-center text-gray-500">
                        아직 트랙이 없습니다. "트랙 추가" 버튼을 클릭하여 추가하세요.
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-800">
                        {playlist.tracks.map((pt, index) => (
                          <div
                            key={pt.id}
                            className="flex items-center gap-4 px-4 py-3 hover:bg-gray-800/30"
                          >
                            <div className="flex flex-col gap-0.5">
                              <button
                                onClick={() => handleMoveTrack(playlist.id, playlist.tracks, index, 'up')}
                                disabled={index === 0}
                                className="p-0.5 text-gray-500 hover:text-white disabled:opacity-30"
                              >
                                <ChevronUp size={14} />
                              </button>
                              <button
                                onClick={() => handleMoveTrack(playlist.id, playlist.tracks, index, 'down')}
                                disabled={index === playlist.tracks.length - 1}
                                className="p-0.5 text-gray-500 hover:text-white disabled:opacity-30"
                              >
                                <ChevronDown size={14} />
                              </button>
                            </div>

                            <span className="w-6 text-center text-gray-500 text-sm">{index + 1}</span>

                            <div className="w-10 h-10 bg-gray-700 rounded overflow-hidden flex-shrink-0">
                              {pt.track.thumbnailUrl ? (
                                <img
                                  src={pt.track.thumbnailUrl}
                                  alt={pt.track.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Music size={16} className="text-gray-500" />
                                </div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <p className="text-white text-sm truncate">{pt.track.title}</p>
                              <p className="text-gray-500 text-xs truncate">{pt.track.artist || 'Heeling'}</p>
                            </div>

                            <span className="text-gray-500 text-sm">
                              {formatDuration(pt.track.duration)}
                            </span>

                            <button
                              onClick={() => handleRemoveTrack(playlist.id, pt.trackId)}
                              className="p-1.5 text-gray-500 hover:text-red-400"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 트랙 선택 모달 */}
      {trackModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">트랙 추가</h3>
              <button
                onClick={() => setTrackModalOpen(false)}
                className="p-1 text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 border-b border-gray-800">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={trackSearchQuery}
                  onChange={(e) => {
                    setTrackSearchQuery(e.target.value);
                    fetchTracks(e.target.value);
                  }}
                  placeholder="트랙 검색..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500"
                />
              </div>
            </div>

            <div className="overflow-y-auto max-h-[400px]">
              {tracksLoading ? (
                <div className="p-8 text-center text-gray-400">로딩 중...</div>
              ) : availableTracks.length === 0 ? (
                <div className="p-8 text-center text-gray-400">트랙을 찾을 수 없습니다.</div>
              ) : (
                <div className="divide-y divide-gray-800">
                  {availableTracks.map((track) => {
                    const isSelected = selectedTrackIds.includes(track.id);
                    return (
                      <div
                        key={track.id}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedTrackIds(prev => prev.filter(id => id !== track.id));
                          } else {
                            setSelectedTrackIds(prev => [...prev, track.id]);
                          }
                        }}
                        className={`flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-gray-800/50 ${isSelected ? 'bg-purple-600/20' : ''}`}
                      >
                        <div className={`w-5 h-5 rounded border flex items-center justify-center ${isSelected ? 'bg-purple-600 border-purple-600' : 'border-gray-600'}`}>
                          {isSelected && <Check size={14} className="text-white" />}
                        </div>

                        <div className="w-10 h-10 bg-gray-700 rounded overflow-hidden flex-shrink-0">
                          {track.thumbnailUrl ? (
                            <img
                              src={track.thumbnailUrl}
                              alt={track.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Music size={16} className="text-gray-500" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm truncate">{track.title}</p>
                          <p className="text-gray-500 text-xs truncate">{track.artist || 'Heeling'}</p>
                        </div>

                        {track.category && (
                          <span className="px-2 py-0.5 bg-gray-700 text-gray-300 text-xs rounded">
                            {track.category}
                          </span>
                        )}

                        <span className="text-gray-500 text-sm">
                          {formatDuration(track.duration)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-800 flex items-center justify-between">
              <span className="text-gray-400 text-sm">
                {selectedTrackIds.length}곡 선택됨
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setTrackModalOpen(false)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleAddTracks}
                  disabled={selectedTrackIds.length === 0 || saving}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white transition-colors disabled:opacity-50"
                >
                  {saving ? '추가 중...' : '추가'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
