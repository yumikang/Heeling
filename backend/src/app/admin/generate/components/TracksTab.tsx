"use client";

import React, { useRef, useState } from 'react';
import {
  Music,
  Play,
  Pause,
  Download,
  Loader2,
  CheckSquare,
  Square,
  ListMusic,
  FolderDown,
  FileJson,
  List,
  LayoutGrid,
  Trash2,
  Pencil,
  X,
  Image,
  Upload,
  ImagePlus,
  Sparkles,
} from 'lucide-react';
import { STYLES, MOODS } from '../constants';
import { GeneratedTrack, TabType } from '../types';

interface TracksTabProps {
  generatedTracks: GeneratedTrack[];
  selectedTrackIds: Set<string>;
  trackViewMode: 'grid' | 'list';
  setTrackViewMode: (mode: 'grid' | 'list') => void;
  playingId: string | null;
  downloadingTracks: Set<string>;
  // 핸들러
  toggleSelectAll: () => void;
  toggleTrackSelection: (id: string) => void;
  togglePlay: (track: GeneratedTrack) => void;
  downloadTrack: (track: GeneratedTrack) => void;
  downloadSelectedTracks: () => void;
  exportTracksAsJson: () => void;
  deleteSelectedTracks: () => void;
  setShowPlaylistModal: (show: boolean) => void;
  setPlaylistName: (name: string) => void;
  setActiveTab: (tab: TabType) => void;
  // 편집 관련
  showEditModal: boolean;
  editingTrack: GeneratedTrack | null;
  editForm: { title: string; titleEn: string; imageUrl: string };
  savingEdit: boolean;
  openEditModal: (track: GeneratedTrack) => void;
  closeEditModal: () => void;
  updateEditForm: (field: 'title' | 'titleEn' | 'imageUrl', value: string) => void;
  saveTrackEdit: () => void;
  // 배포 관련
  deploying: boolean;
  deploySelectedTracks: () => void;
}

export default function TracksTab({
  generatedTracks,
  selectedTrackIds,
  trackViewMode,
  setTrackViewMode,
  playingId,
  downloadingTracks,
  toggleSelectAll,
  toggleTrackSelection,
  togglePlay,
  downloadTrack,
  downloadSelectedTracks,
  exportTracksAsJson,
  deleteSelectedTracks,
  setShowPlaylistModal,
  setPlaylistName,
  setActiveTab,
  // 편집 관련
  showEditModal,
  editingTrack,
  editForm,
  savingEdit,
  openEditModal,
  closeEditModal,
  updateEditForm,
  saveTrackEdit,
  // 배포 관련
  deploying,
  deploySelectedTracks,
}: TracksTabProps) {
  // 이미지 업로드 상태
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);

  // 이미지 파일 업로드 핸들러
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 이미지 파일 체크
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드할 수 있습니다.');
      return;
    }

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (data.success && data.url) {
        updateEditForm('imageUrl', data.url);
      } else {
        alert('이미지 업로드에 실패했습니다.');
      }
    } catch (error) {
      console.error('Image upload error:', error);
      alert('이미지 업로드 중 오류가 발생했습니다.');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // AI 이미지 생성 핸들러
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
          category: editingTrack?.style || 'healing',
          mood: editingTrack?.mood || 'calm',
          save: true,
        }),
      });

      const data = await response.json();
      if (data.success && data.data?.url) {
        updateEditForm('imageUrl', data.data.url);
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
  return (
    <div className="space-y-4">
      {/* 액션 바 */}
      {generatedTracks.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg"
            >
              {selectedTrackIds.size === generatedTracks.length ? (
                <><CheckSquare className="w-4 h-4" /> 전체해제</>
              ) : (
                <><Square className="w-4 h-4" /> 전체선택</>
              )}
            </button>
            <span className="text-gray-400">
              {selectedTrackIds.size > 0 && `${selectedTrackIds.size}개 선택됨`}
            </span>
            {/* 뷰 모드 토글 */}
            <div className="flex items-center bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setTrackViewMode('grid')}
                className={`p-2 rounded ${trackViewMode === 'grid' ? 'bg-gray-600 text-white' : 'text-gray-400 hover:text-white'}`}
                title="그리드 뷰"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setTrackViewMode('list')}
                className={`p-2 rounded ${trackViewMode === 'list' ? 'bg-gray-600 text-white' : 'text-gray-400 hover:text-white'}`}
                title="리스트 뷰"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {selectedTrackIds.size > 0 && (
            <div className="flex gap-2">
              <button
                onClick={deploySelectedTracks}
                disabled={deploying}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded-lg flex items-center gap-2"
                title="선택한 트랙을 앱에 배포합니다"
              >
                {deploying ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                앱에 배포
              </button>
              <button
                onClick={downloadSelectedTracks}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
              >
                <FolderDown className="w-4 h-4" /> 다운로드
              </button>
              <button
                onClick={() => { setShowPlaylistModal(true); setPlaylistName(''); }}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2"
              >
                <ListMusic className="w-4 h-4" /> 플레이리스트
              </button>
              <button
                onClick={exportTracksAsJson}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg flex items-center gap-2"
              >
                <FileJson className="w-4 h-4" /> JSON
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
      )}

      {/* 트랙 목록 */}
      {generatedTracks.length === 0 ? (
        <div className="bg-gray-800 rounded-lg p-12 text-center text-gray-500">
          <Music className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg">아직 생성된 음악이 없습니다</p>
          <p className="text-sm mt-1">음악 생성 탭에서 새로운 음악을 만들어보세요</p>
          <button
            onClick={() => setActiveTab('generate')}
            className="mt-4 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
          >
            음악 생성하기
          </button>
        </div>
      ) : trackViewMode === 'grid' ? (
        /* ========== 그리드 뷰 ========== */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {generatedTracks.map((track) => (
            <div
              key={track.id}
              className={`bg-gray-800 rounded-lg overflow-hidden transition-all ${
                selectedTrackIds.has(track.id) ? 'ring-2 ring-purple-500' : ''
              }`}
            >
              {/* 썸네일 */}
              <div className="relative aspect-video bg-gray-700">
                {track.imageUrl ? (
                  <img src={track.imageUrl} alt={track.title} className="w-full h-full object-cover" />
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
                {track.titleEn && (
                  <p className="text-xs text-gray-400 truncate">{track.titleEn}</p>
                )}
                <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                  <span>{Math.floor(track.duration / 60)}:{String(Math.floor(track.duration % 60)).padStart(2, '0')}</span>
                  <span>•</span>
                  <span>{STYLES.find(s => s.value === track.style)?.label || track.style}</span>
                  <span>•</span>
                  <span>{MOODS.find(m => m.value === track.mood)?.label || track.mood}</span>
                </div>
                {/* 액션 */}
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => openEditModal(track)}
                    className="flex-1 py-2 bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 rounded text-sm flex items-center justify-center gap-1"
                    title="편집"
                  >
                    <Pencil className="w-4 h-4" /> 편집
                  </button>
                  <button
                    onClick={() => downloadTrack(track)}
                    disabled={downloadingTracks.has(track.id)}
                    className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-sm flex items-center justify-center gap-1"
                  >
                    {downloadingTracks.has(track.id) ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <><FolderDown className="w-4 h-4" /> 저장</>
                    )}
                  </button>
                  <a
                    href={track.audioUrl}
                    download
                    className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-sm flex items-center justify-center gap-1"
                  >
                    <Download className="w-4 h-4" /> 다운로드
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* ========== 리스트 뷰 ========== */
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          {/* 테이블 헤더 */}
          <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-gray-700/50 text-xs text-gray-400 uppercase font-medium">
            <div className="col-span-1"></div>
            <div className="col-span-1">커버</div>
            <div className="col-span-4">제목</div>
            <div className="col-span-1">시간</div>
            <div className="col-span-2">스타일</div>
            <div className="col-span-1">분위기</div>
            <div className="col-span-2">액션</div>
          </div>
          {/* 트랙 목록 */}
          {generatedTracks.map((track) => (
            <div
              key={track.id}
              className={`grid grid-cols-12 gap-2 px-4 py-3 items-center border-t border-gray-700 hover:bg-gray-700/30 transition-colors ${
                selectedTrackIds.has(track.id) ? 'bg-purple-900/20' : ''
              } ${playingId === track.id ? 'bg-purple-900/30' : ''}`}
            >
              {/* 체크박스 */}
              <div className="col-span-1">
                <button onClick={() => toggleTrackSelection(track.id)}>
                  {selectedTrackIds.has(track.id) ? (
                    <CheckSquare className="w-5 h-5 text-purple-400" />
                  ) : (
                    <Square className="w-5 h-5 text-gray-500 hover:text-gray-300" />
                  )}
                </button>
              </div>
              {/* 커버 이미지 + 재생 버튼 */}
              <div className="col-span-1">
                <button
                  onClick={() => togglePlay(track)}
                  className="relative w-12 h-12 rounded overflow-hidden bg-gray-700 group"
                >
                  {track.imageUrl ? (
                    <img src={track.imageUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Music className="w-5 h-5 text-gray-500" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    {playingId === track.id ? (
                      <Pause className="w-5 h-5 text-white" />
                    ) : (
                      <Play className="w-5 h-5 text-white" />
                    )}
                  </div>
                  {playingId === track.id && (
                    <div className="absolute inset-0 border-2 border-purple-500 rounded"></div>
                  )}
                </button>
              </div>
              {/* 제목 */}
              <div className="col-span-4 min-w-0">
                <p className="text-white font-medium truncate">{track.title}</p>
                {track.titleEn && (
                  <p className="text-xs text-gray-500 truncate">{track.titleEn}</p>
                )}
              </div>
              {/* 시간 */}
              <div className="col-span-1 text-sm text-gray-400">
                {Math.floor(track.duration / 60)}:{String(Math.floor(track.duration % 60)).padStart(2, '0')}
              </div>
              {/* 스타일 */}
              <div className="col-span-2">
                <span className="px-2 py-1 bg-gray-700 rounded text-xs text-gray-300">
                  {STYLES.find(s => s.value === track.style)?.label || track.style}
                </span>
              </div>
              {/* 분위기 */}
              <div className="col-span-1">
                <span className="px-2 py-1 bg-gray-700 rounded text-xs text-gray-300">
                  {MOODS.find(m => m.value === track.mood)?.label || track.mood}
                </span>
              </div>
              {/* 액션 */}
              <div className="col-span-2 flex gap-2">
                <button
                  onClick={() => openEditModal(track)}
                  className="p-2 bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 rounded"
                  title="편집"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => downloadTrack(track)}
                  disabled={downloadingTracks.has(track.id)}
                  className="p-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded"
                  title="저장"
                >
                  {downloadingTracks.has(track.id) ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <FolderDown className="w-4 h-4" />
                  )}
                </button>
                <a
                  href={track.audioUrl}
                  download
                  className="p-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded"
                  title="다운로드"
                >
                  <Download className="w-4 h-4" />
                </a>
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
                트랙 정보 수정
              </h3>
              <button onClick={closeEditModal} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* 제목 (한글) */}
              <div>
                <label className="block text-sm text-gray-400 mb-1">제목 (한글) *</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => updateEditForm('title', e.target.value)}
                  placeholder="노래 제목을 입력하세요"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* 제목 (영문) */}
              <div>
                <label className="block text-sm text-gray-400 mb-1">제목 (영문)</label>
                <input
                  type="text"
                  value={editForm.titleEn}
                  onChange={(e) => updateEditForm('titleEn', e.target.value)}
                  placeholder="English title (optional)"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* 이미지 첨부 */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">커버 이미지</label>

                {/* 이미지 미리보기 */}
                <div className="relative w-full h-40 bg-gray-700 rounded-lg overflow-hidden mb-3 group">
                  {editForm.imageUrl ? (
                    <>
                      <img
                        src={editForm.imageUrl}
                        alt="커버 이미지"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      {/* 삭제 버튼 */}
                      <button
                        onClick={() => updateEditForm('imageUrl', '')}
                        className="absolute top-2 right-2 p-1.5 bg-red-600 hover:bg-red-700 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        title="이미지 삭제"
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

                  {/* 업로드/생성 중 로딩 오버레이 */}
                  {(uploadingImage || generatingImage) && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <div className="text-center text-white">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                        <span className="text-sm">{uploadingImage ? '업로드 중...' : 'AI 생성 중...'}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* 이미지 업로드 버튼들 */}
                <div className="flex gap-2">
                  {/* 파일 업로드 */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage || generatingImage}
                    className="flex-1 py-2 px-3 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-gray-300 rounded-lg flex items-center justify-center gap-2 text-sm"
                  >
                    <ImagePlus className="w-4 h-4" />
                    파일 업로드
                  </button>

                  {/* AI 이미지 생성 */}
                  <button
                    onClick={handleGenerateImage}
                    disabled={uploadingImage || generatingImage || !editForm.title.trim()}
                    className="flex-1 py-2 px-3 bg-purple-600/30 hover:bg-purple-600/50 disabled:bg-gray-800 disabled:cursor-not-allowed text-purple-300 rounded-lg flex items-center justify-center gap-2 text-sm"
                    title="제목을 기반으로 AI가 커버 이미지를 생성합니다"
                  >
                    <Sparkles className="w-4 h-4" />
                    AI 생성
                  </button>
                </div>

                {/* URL 직접 입력 (토글) */}
                <details className="mt-2">
                  <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-400">
                    URL 직접 입력
                  </summary>
                  <input
                    type="text"
                    value={editForm.imageUrl}
                    onChange={(e) => updateEditForm('imageUrl', e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="w-full mt-2 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
                  />
                </details>
              </div>

              {/* 버튼들 */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={closeEditModal}
                  className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
                >
                  취소
                </button>
                <button
                  onClick={saveTrackEdit}
                  disabled={savingEdit || !editForm.title.trim()}
                  className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg flex items-center justify-center gap-2"
                >
                  {savingEdit ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      저장 중...
                    </>
                  ) : (
                    '저장'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
