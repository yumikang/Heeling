"use client";

import React from 'react';
import { ChevronUp, ChevronDown, X, Music, Plus } from 'lucide-react';
import type { PlaylistTrack } from '../../hooks/usePlaylistsApi';

interface PlaylistTrackListProps {
  playlistId: string;
  tracks: PlaylistTrack[];
  onAddTrack: (playlistId: string) => void;
  onRemoveTrack: (playlistId: string, trackId: string) => void;
  onMoveTrack: (playlistId: string, tracks: PlaylistTrack[], fromIndex: number, direction: 'up' | 'down') => void;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function PlaylistTrackList({
  playlistId,
  tracks,
  onAddTrack,
  onRemoveTrack,
  onMoveTrack,
}: PlaylistTrackListProps) {
  return (
    <div className="border-t border-gray-800">
      <div className="p-4 flex items-center justify-between bg-gray-800/30">
        <h4 className="text-sm font-medium text-gray-400">트랙 목록</h4>
        <button
          onClick={() => onAddTrack(playlistId)}
          className="flex items-center gap-1 px-3 py-1 bg-purple-600/20 text-purple-400 rounded hover:bg-purple-600/30 text-sm"
        >
          <Plus size={14} />
          트랙 추가
        </button>
      </div>

      {tracks.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          아직 트랙이 없습니다. "트랙 추가" 버튼을 클릭하여 추가하세요.
        </div>
      ) : (
        <div className="divide-y divide-gray-800">
          {tracks.map((pt, index) => (
            <div
              key={pt.id}
              className="flex items-center gap-4 px-4 py-3 hover:bg-gray-800/30"
            >
              <div className="flex flex-col gap-0.5">
                <button
                  onClick={() => onMoveTrack(playlistId, tracks, index, 'up')}
                  disabled={index === 0}
                  className="p-0.5 text-gray-500 hover:text-white disabled:opacity-30"
                >
                  <ChevronUp size={14} />
                </button>
                <button
                  onClick={() => onMoveTrack(playlistId, tracks, index, 'down')}
                  disabled={index === tracks.length - 1}
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
                onClick={() => onRemoveTrack(playlistId, pt.trackId)}
                className="p-1.5 text-gray-500 hover:text-red-400"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
