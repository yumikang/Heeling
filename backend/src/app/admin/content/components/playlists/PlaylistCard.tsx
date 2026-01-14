"use client";

import React from 'react';
import { Trash2, Save, X, Eye, EyeOff, Star, StarOff, ListMusic } from 'lucide-react';
import type { Playlist, PlaylistTrack } from '../../hooks/usePlaylistsApi';
import PlaylistTrackList from './PlaylistTrackList';

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

interface PlaylistCardProps {
  playlist: Playlist;
  isEditing: boolean;
  saving: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSave: () => void;
  onDelete: () => void;
  onTogglePublic: () => void;
  onToggleFeatured: () => void;
  onFieldChange: (field: keyof Playlist, value: any) => void;
  onAddTrack: (playlistId: string) => void;
  onRemoveTrack: (playlistId: string, trackId: string) => void;
  onMoveTrack: (playlistId: string, tracks: PlaylistTrack[], fromIndex: number, direction: 'up' | 'down') => void;
}

export default function PlaylistCard({
  playlist,
  isEditing,
  saving,
  onEdit,
  onCancelEdit,
  onSave,
  onDelete,
  onTogglePublic,
  onToggleFeatured,
  onFieldChange,
  onAddTrack,
  onRemoveTrack,
  onMoveTrack,
}: PlaylistCardProps) {
  const typeInfo = PLAYLIST_TYPES[playlist.type] || PLAYLIST_TYPES.MANUAL;

  return (
    <div
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
                  onChange={(e) => onFieldChange('name', e.target.value)}
                  className="text-xl font-bold bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white"
                />
              ) : (
                <h3 className="text-xl font-bold text-white">{playlist.name}</h3>
              )}

              {isEditing ? (
                <input
                  type="text"
                  value={playlist.description || ''}
                  onChange={(e) => onFieldChange('description', e.target.value)}
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
                onClick={onTogglePublic}
                className="p-2 text-gray-400 hover:text-white transition-colors"
                title={playlist.isPublic ? '비공개로 전환' : '공개로 전환'}
              >
                {playlist.isPublic ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
              <button
                onClick={onToggleFeatured}
                className={`p-2 transition-colors ${playlist.isFeatured ? 'text-yellow-400' : 'text-gray-400 hover:text-yellow-400'}`}
                title={playlist.isFeatured ? '추천 해제' : '추천 설정'}
              >
                {playlist.isFeatured ? <Star size={18} fill="currentColor" /> : <StarOff size={18} />}
              </button>
              {isEditing ? (
                <>
                  <button
                    onClick={onSave}
                    disabled={saving}
                    className="p-2 text-green-400 hover:text-green-300"
                  >
                    <Save size={18} />
                  </button>
                  <button
                    onClick={onCancelEdit}
                    className="p-2 text-gray-400 hover:text-white"
                  >
                    <X size={18} />
                  </button>
                </>
              ) : (
                <button
                  onClick={onEdit}
                  className="px-3 py-1 text-purple-400 hover:text-purple-300 text-sm"
                >
                  편집
                </button>
              )}
              <button
                onClick={onDelete}
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
      <PlaylistTrackList
        playlistId={playlist.id}
        tracks={playlist.tracks}
        onAddTrack={onAddTrack}
        onRemoveTrack={onRemoveTrack}
        onMoveTrack={onMoveTrack}
      />
    </div>
  );
}
