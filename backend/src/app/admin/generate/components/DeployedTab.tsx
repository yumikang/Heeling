"use client";

import React, { useState, useRef } from 'react';
import {
  Music,
  Play,
  Pause,
  Loader2,
  CheckSquare,
  Square,
  List,
  LayoutGrid,
  Trash2,
  Pencil,
  X,
  Image,
  ImagePlus,
  Sparkles,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
  Eye,
  EyeOff,
} from 'lucide-react';
import { STYLES, MOODS } from '../constants';
import { DeployedTrack, TabType } from '../types';

interface DeployedTabProps {
  deployedTracks: DeployedTrack[];
  loading: boolean;
  onRefresh: () => void;
  setActiveTab: (tab: TabType) => void;
  setError: (error: string | null) => void;
}

export default function DeployedTab({
  deployedTracks,
  loading,
  onRefresh,
  setActiveTab,
  setError,
}: DeployedTabProps) {
  const [selectedTrackIds, setSelectedTrackIds] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null);

  // 편집 모달 상태
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTrack, setEditingTrack] = useState<DeployedTrack | null>(null);
  const [editForm, setEditForm] = useState({ title: '', thumbnailUrl: '', isActive: true });
  const [savingEdit, setSavingEdit] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 트랙 선택
  const toggleTrackSelection = (trackId: string) => {
    setSelectedTrackIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(trackId)) {
        newSet.delete(trackId);
      } else {
        newSet.add(trackId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedTrackIds.size === deployedTracks.length) {
      setSelectedTrackIds(new Set());
    } else {
      setSelectedTrackIds(new Set(deployedTracks.map(t => t.id)));
    }
  };

  // 오디오 재생
  const togglePlay = (track: DeployedTrack) => {
    if (playingId === track.id) {
      audioRef?.pause();
      setPlayingId(null);
    } else {
      if (audioRef) audioRef.pause();
      const audio = new Audio(track.fileUrl);
      audio.play().catch(err => console.error('[Audio] Play failed:', err));
      audio.onended = () => setPlayingId(null);
      setAudioRef(audio);
      setPlayingId(track.id);
    }
  };

  // 편집 모달 열기
  const openEditModal = (track: DeployedTrack) => {
    setEditingTrack(track);
    setEditForm({
      title: track.title,
      thumbnailUrl: track.thumbnailUrl || '',
      isActive: track.isActive,
    });
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingTrack(null);
    setEditForm({ title: '', thumbnailUrl: '', isActive: true });
  };

  // 이미지 업로드
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드할 수 있습니다.');
      return;
    }

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await response.json();
      if (data.success && data.url) {
        setEditForm(prev => ({ ...prev, thumbnailUrl: data.url }));
      } else {
        alert('이미지 업로드에 실패했습니다.');
      }
    } catch (error) {
      console.error('Image upload error:', error);
      alert('이미지 업로드 중 오류가 발생했습니다.');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // AI 이미지 생성
  const handleGenerateImage = async () => {
    if (!editForm.title) {
      alert('제목을 입력해주세요.');
      return;
    }

    setGeneratingImage(true);
    try {
      const response = await fetch('/api/admin/generate/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: editForm.title,
          category: editingTrack?.category || 'healing',
          mood: editingTrack?.mood || 'calm',
          save: true,
        }),
      });
      const data = await response.json();
      if (data.success && data.data?.url) {
        setEditForm(prev => ({ ...prev, thumbnailUrl: data.data.url }));
      } else {
        alert(data.error || 'AI 이미지 생성에 실패했습니다.');
      }
    } catch (error) {
      console.error('AI image generation error:', error);
      alert('AI 이미지 생성 중 오류가 발생했습니다.');
    } finally {
      setGeneratingImage(false);
    }
  };

  // 트랙 수정 저장
  const saveTrackEdit = async () => {
    if (!editingTrack) return;
    if (!editForm.title.trim()) {
      setError('제목을 입력해주세요.');
      return;
    }

    setSavingEdit(true);
    try {
      const response = await fetch('/api/admin/generate/deployed', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingTrack.id,
          title: editForm.title.trim(),
          thumbnailUrl: editForm.thumbnailUrl.trim() || undefined,
          isActive: editForm.isActive,
        }),
      });

      const data = await response.json();
      if (data.success) {
        closeEditModal();
        onRefresh(); // 목록 새로고침
      } else {
        setError(data.error || '수정 실패');
      }
    } catch (err) {
      setError('트랙 수정 중 오류 발생');
    } finally {
      setSavingEdit(false);
    }
  };

  // 선택한 트랙 비활성화
  const deactivateSelectedTracks = async () => {
    if (!confirm(`선택한 ${selectedTrackIds.size}개 트랙을 비활성화하시겠습니까?`)) return;

    try {
      const response = await fetch('/api/admin/generate/deployed', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bulkUpdate: Array.from(selectedTrackIds).map(id => ({
            id,
            isActive: false,
          })),
        }),
      });

      const data = await response.json();
      if (data.success) {
        setSelectedTrackIds(new Set());
        onRefresh();
      } else {
        setError(data.error || '비활성화 실패');
      }
    } catch (err) {
      setError('트랙 비활성화 중 오류 발생');
    }
  };

  // 선택한 트랙 삭제
  const deleteSelectedTracks = async () => {
    if (!confirm(`선택한 ${selectedTrackIds.size}개 트랙을 완전히 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) return;

    try {
      const response = await fetch('/api/admin/generate/deployed', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedTrackIds) }),
      });

      const data = await response.json();
      if (data.success) {
        setSelectedTrackIds(new Set());
        onRefresh();
      } else {
        setError(data.error || '삭제 실패');
      }
    } catch (err) {
      setError('트랙 삭제 중 오류 발생');
    }
  };

  return (
    <div className="space-y-4">
      {/* 액션 바 */}
      <div className="bg-gray-800 rounded-lg p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            새로고침
          </button>
          {deployedTracks.length > 0 && (
            <>
              <button
                onClick={toggleSelectAll}
                className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg"
              >
                {selectedTrackIds.size === deployedTracks.length ? (
                  <><CheckSquare className="w-4 h-4" /> 전체해제</>
                ) : (
                  <><Square className="w-4 h-4" /> 전체선택</>
                )}
              </button>
              <span className="text-gray-400">
                {selectedTrackIds.size > 0 && `${selectedTrackIds.size}개 선택됨`}
              </span>
            </>
          )}
          {/* 뷰 모드 토글 */}
          <div className="flex items-center bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-gray-600 text-white' : 'text-gray-400 hover:text-white'}`}
              title="그리드 뷰"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-gray-600 text-white' : 'text-gray-400 hover:text-white'}`}
              title="리스트 뷰"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {selectedTrackIds.size > 0 && (
          <div className="flex gap-2">
            <button
              onClick={deactivateSelectedTracks}
              className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg flex items-center gap-2"
            >
              <EyeOff className="w-4 h-4" /> 비활성화
            </button>
            <button
              onClick={deleteSelectedTracks}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" /> 삭제
            </button>
          </div>
        )}
      </div>

      {/* 로딩 상태 */}
      {loading ? (
        <div className="bg-gray-800 rounded-lg p-12 text-center">
          <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-purple-400" />
          <p className="text-gray-400">배포된 트랙을 불러오는 중...</p>
        </div>
      ) : deployedTracks.length === 0 ? (
        <div className="bg-gray-800 rounded-lg p-12 text-center text-gray-500">
          <Music className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg">배포된 음악이 없습니다</p>
          <p className="text-sm mt-1">생성 목록에서 트랙을 배포해보세요</p>
          <button
            onClick={() => setActiveTab('tracks')}
            className="mt-4 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
          >
            생성 목록 보기
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* ========== 그리드 뷰 ========== */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {deployedTracks.map((track) => (
            <div
              key={track.id}
              className={`bg-gray-800 rounded-lg overflow-hidden transition-all ${
                selectedTrackIds.has(track.id) ? 'ring-2 ring-purple-500' : ''
              } ${!track.isActive ? 'opacity-60' : ''}`}
            >
              {/* 썸네일 */}
              <div className="relative aspect-video bg-gray-700">
                {track.thumbnailUrl ? (
                  <img src={track.thumbnailUrl} alt={track.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Music className="w-12 h-12 text-gray-600" />
                  </div>
                )}
                {/* 재생 버튼 */}
                <button
                  onClick={() => togglePlay(track)}
                  className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity"
                >
                  <div className="w-14 h-14 rounded-full bg-purple-600 flex items-center justify-center">
                    {playingId === track.id ? (
                      <Pause className="w-6 h-6 text-white" />
                    ) : (
                      <Play className="w-6 h-6 text-white ml-1" />
                    )}
                  </div>
                </button>
                {/* 체크박스 */}
                <button
                  onClick={() => toggleTrackSelection(track.id)}
                  className="absolute top-2 left-2 p-1 bg-black/50 rounded"
                >
                  {selectedTrackIds.has(track.id) ? (
                    <CheckSquare className="w-5 h-5 text-purple-400" />
                  ) : (
                    <Square className="w-5 h-5 text-white/70" />
                  )}
                </button>
                {/* 상태 뱃지 */}
                <div className={`absolute top-2 right-2 px-2 py-1 rounded text-xs ${
                  track.isActive ? 'bg-green-600/80 text-white' : 'bg-gray-600/80 text-gray-300'
                }`}>
                  {track.isActive ? '활성' : '비활성'}
                </div>
                {/* 재생 중 표시 */}
                {playingId === track.id && (
                  <div className="absolute bottom-2 right-2 px-2 py-1 bg-purple-600 rounded text-xs text-white flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" /> 재생 중
                  </div>
                )}
              </div>
              {/* 정보 */}
              <div className="p-4">
                <h4 className="text-white font-medium truncate">{track.title}</h4>
                <p className="text-xs text-gray-400 truncate">{track.artist}</p>
                <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                  <span>{Math.floor(track.duration / 60)}:{String(Math.floor(track.duration % 60)).padStart(2, '0')}</span>
                  <span>•</span>
                  <span>{STYLES.find(s => s.value === track.category)?.label || track.category}</span>
                  <span>•</span>
                  <span>재생 {track.playCount}회</span>
                </div>
                {/* 액션 */}
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => openEditModal(track)}
                    className="flex-1 py-2 bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 rounded text-sm flex items-center justify-center gap-1"
                  >
                    <Pencil className="w-4 h-4" /> 편집
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* ========== 리스트 뷰 ========== */
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-gray-700/50 text-xs text-gray-400 uppercase font-medium">
            <div className="col-span-1"></div>
            <div className="col-span-1">커버</div>
            <div className="col-span-3">제목</div>
            <div className="col-span-1">시간</div>
            <div className="col-span-2">카테고리</div>
            <div className="col-span-1">재생수</div>
            <div className="col-span-1">상태</div>
            <div className="col-span-2">액션</div>
          </div>
          {deployedTracks.map((track) => (
            <div
              key={track.id}
              className={`grid grid-cols-12 gap-2 px-4 py-3 items-center border-t border-gray-700 hover:bg-gray-700/30 transition-colors ${
                selectedTrackIds.has(track.id) ? 'bg-purple-900/20' : ''
              } ${!track.isActive ? 'opacity-60' : ''}`}
            >
              <div className="col-span-1">
                <button onClick={() => toggleTrackSelection(track.id)}>
                  {selectedTrackIds.has(track.id) ? (
                    <CheckSquare className="w-5 h-5 text-purple-400" />
                  ) : (
                    <Square className="w-5 h-5 text-gray-500 hover:text-gray-300" />
                  )}
                </button>
              </div>
              <div className="col-span-1">
                <button
                  onClick={() => togglePlay(track)}
                  className="relative w-12 h-12 rounded overflow-hidden bg-gray-700 group"
                >
                  {track.thumbnailUrl ? (
                    <img src={track.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Music className="w-5 h-5 text-gray-500" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    {playingId === track.id ? <Pause className="w-5 h-5 text-white" /> : <Play className="w-5 h-5 text-white" />}
                  </div>
                </button>
              </div>
              <div className="col-span-3 min-w-0">
                <p className="text-white font-medium truncate">{track.title}</p>
                <p className="text-xs text-gray-500 truncate">{track.artist}</p>
              </div>
              <div className="col-span-1 text-sm text-gray-400">
                {Math.floor(track.duration / 60)}:{String(Math.floor(track.duration % 60)).padStart(2, '0')}
              </div>
              <div className="col-span-2">
                <span className="px-2 py-1 bg-gray-700 rounded text-xs text-gray-300">
                  {STYLES.find(s => s.value === track.category)?.label || track.category}
                </span>
              </div>
              <div className="col-span-1 text-sm text-gray-400">
                {track.playCount}회
              </div>
              <div className="col-span-1">
                <span className={`px-2 py-1 rounded text-xs ${
                  track.isActive ? 'bg-green-600/20 text-green-400' : 'bg-gray-600/20 text-gray-400'
                }`}>
                  {track.isActive ? '활성' : '비활성'}
                </span>
              </div>
              <div className="col-span-2 flex gap-2">
                <button
                  onClick={() => openEditModal(track)}
                  className="p-2 bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 rounded"
                  title="편집"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========== 편집 모달 ========== */}
      {showEditModal && editingTrack && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-lg mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Pencil className="w-5 h-5 text-purple-400" />
                배포된 트랙 수정
              </h3>
              <button onClick={closeEditModal} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* 제목 */}
              <div>
                <label className="block text-sm text-gray-400 mb-1">제목 *</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="노래 제목을 입력하세요"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* 활성화 상태 */}
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-400">앱에서 노출</label>
                <button
                  onClick={() => setEditForm(prev => ({ ...prev, isActive: !prev.isActive }))}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                    editForm.isActive ? 'bg-green-600/20 text-green-400' : 'bg-gray-700 text-gray-400'
                  }`}
                >
                  {editForm.isActive ? (
                    <><ToggleRight className="w-5 h-5" /> 활성</>
                  ) : (
                    <><ToggleLeft className="w-5 h-5" /> 비활성</>
                  )}
                </button>
              </div>

              {/* 이미지 첨부 */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">커버 이미지</label>
                <div className="relative w-full h-40 bg-gray-700 rounded-lg overflow-hidden mb-3 group">
                  {editForm.thumbnailUrl ? (
                    <>
                      <img src={editForm.thumbnailUrl} alt="커버 이미지" className="w-full h-full object-cover" />
                      <button
                        onClick={() => setEditForm(prev => ({ ...prev, thumbnailUrl: '' }))}
                        className="absolute top-2 right-2 p-1.5 bg-red-600 hover:bg-red-700 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-500">
                      <Image className="w-12 h-12 mb-2" />
                      <span className="text-sm">이미지를 업로드하거나 AI로 생성하세요</span>
                    </div>
                  )}
                  {(uploadingImage || generatingImage) && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <div className="text-center text-white">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                        <span className="text-sm">{uploadingImage ? '업로드 중...' : 'AI 생성 중...'}</span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage || generatingImage}
                    className="flex-1 py-2 px-3 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 text-gray-300 rounded-lg flex items-center justify-center gap-2 text-sm"
                  >
                    <ImagePlus className="w-4 h-4" /> 파일 업로드
                  </button>
                  <button
                    onClick={handleGenerateImage}
                    disabled={uploadingImage || generatingImage || !editForm.title.trim()}
                    className="flex-1 py-2 px-3 bg-purple-600/30 hover:bg-purple-600/50 disabled:bg-gray-800 text-purple-300 rounded-lg flex items-center justify-center gap-2 text-sm"
                  >
                    <Sparkles className="w-4 h-4" /> AI 생성
                  </button>
                </div>
              </div>

              {/* 버튼들 */}
              <div className="flex gap-2 pt-2">
                <button onClick={closeEditModal} className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg">
                  취소
                </button>
                <button
                  onClick={saveTrackEdit}
                  disabled={savingEdit || !editForm.title.trim()}
                  className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded-lg flex items-center justify-center gap-2"
                >
                  {savingEdit ? <><Loader2 className="w-4 h-4 animate-spin" /> 저장 중...</> : '저장'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
