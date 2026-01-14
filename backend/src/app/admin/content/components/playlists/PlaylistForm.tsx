"use client";

import React from 'react';
import { Save, X, Upload } from 'lucide-react';
import type { NewPlaylistData } from '../../hooks/usePlaylistsApi';

interface PlaylistFormProps {
  newPlaylist: NewPlaylistData;
  saving: boolean;
  uploading: boolean;
  playlistTypes: Record<string, { label: string; color: string }>;
  timeSlots: Record<string, string>;
  onFieldChange: (field: keyof NewPlaylistData, value: any) => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCreate: () => void;
  onCancel: () => void;
}

export default function PlaylistForm({
  newPlaylist,
  saving,
  uploading,
  playlistTypes,
  timeSlots,
  onFieldChange,
  onImageUpload,
  onCreate,
  onCancel,
}: PlaylistFormProps) {
  return (
    <div className="p-6 bg-gray-900 rounded-xl border border-gray-800">
      <h3 className="text-xl font-bold text-white mb-4">새 플레이리스트 추가</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-sm text-gray-400 mb-2">플레이리스트 이름*</label>
          <input
            type="text"
            value={newPlaylist.name}
            onChange={(e) => onFieldChange('name', e.target.value)}
            placeholder="플레이리스트 이름"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">타입</label>
          <select
            value={newPlaylist.type}
            onChange={(e) => onFieldChange('type', e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
          >
            {Object.entries(playlistTypes).map(([key, value]) => (
              <option key={key} value={key}>{value.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">테마</label>
          <input
            type="text"
            value={newPlaylist.theme}
            onChange={(e) => onFieldChange('theme', e.target.value)}
            placeholder="예: healing, focus, sleep"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">시간대</label>
          <select
            value={newPlaylist.timeSlot}
            onChange={(e) => onFieldChange('timeSlot', e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
          >
            <option value="">선택 안함</option>
            {Object.entries(timeSlots).map(([key, value]) => (
              <option key={key} value={key}>{value}</option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm text-gray-400 mb-2">설명</label>
          <input
            type="text"
            value={newPlaylist.description}
            onChange={(e) => onFieldChange('description', e.target.value)}
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
                  onChange={onImageUpload}
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
              onChange={(e) => onFieldChange('isPublic', e.target.checked)}
              className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-purple-600"
            />
            <span className="text-gray-300">공개</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={newPlaylist.isFeatured}
              onChange={(e) => onFieldChange('isFeatured', e.target.checked)}
              className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-purple-600"
            />
            <span className="text-gray-300">추천</span>
          </label>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onCreate}
          disabled={saving || uploading}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white transition-colors disabled:opacity-50"
        >
          <Save size={16} />
          <span>{saving ? '저장 중...' : '저장'}</span>
        </button>
        <button
          onClick={onCancel}
          className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors"
        >
          <X size={16} />
          <span>취소</span>
        </button>
      </div>
    </div>
  );
}
