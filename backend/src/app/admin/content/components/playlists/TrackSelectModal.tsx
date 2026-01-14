"use client";

import React from 'react';
import { X, Search, Music, Check } from 'lucide-react';
import type { Track } from '../../hooks/usePlaylistsApi';

interface TrackSelectModalProps {
  isOpen: boolean;
  tracks: Track[];
  selectedTrackIds: string[];
  searchQuery: string;
  loading: boolean;
  saving: boolean;
  onSearchChange: (query: string) => void;
  onTrackToggle: (trackId: string) => void;
  onConfirm: () => void;
  onClose: () => void;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function TrackSelectModal({
  isOpen,
  tracks,
  selectedTrackIds,
  searchQuery,
  loading,
  saving,
  onSearchChange,
  onTrackToggle,
  onConfirm,
  onClose,
}: TrackSelectModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">트랙 추가</h3>
          <button
            onClick={onClose}
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
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="트랙 검색..."
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500"
            />
          </div>
        </div>

        <div className="overflow-y-auto max-h-[400px]">
          {loading ? (
            <div className="p-8 text-center text-gray-400">로딩 중...</div>
          ) : tracks.length === 0 ? (
            <div className="p-8 text-center text-gray-400">트랙을 찾을 수 없습니다.</div>
          ) : (
            <div className="divide-y divide-gray-800">
              {tracks.map((track) => {
                const isSelected = selectedTrackIds.includes(track.id);
                return (
                  <div
                    key={track.id}
                    onClick={() => onTrackToggle(track.id)}
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
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors"
            >
              취소
            </button>
            <button
              onClick={onConfirm}
              disabled={selectedTrackIds.length === 0 || saving}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white transition-colors disabled:opacity-50"
            >
              {saving ? '추가 중...' : '추가'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
