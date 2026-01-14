"use client";

import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { usePlaylistsApi, type NewPlaylistData, type PlaylistTrack } from '../hooks';
import {
  PlaylistForm,
  PlaylistFilters,
  PlaylistCard,
  TrackSelectModal,
} from './playlists';

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

export default function PlaylistsTab() {
  // Filter and search state
  const [filterType, setFilterType] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  // UI state
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Track modal state
  const [trackModalOpen, setTrackModalOpen] = useState(false);
  const [trackModalPlaylistId, setTrackModalPlaylistId] = useState<string | null>(null);
  const [trackSearchQuery, setTrackSearchQuery] = useState('');
  const [selectedTrackIds, setSelectedTrackIds] = useState<string[]>([]);

  // New playlist form state
  const [newPlaylist, setNewPlaylist] = useState<NewPlaylistData>({
    name: '',
    description: '',
    coverImage: '',
    type: 'MANUAL',
    theme: '',
    timeSlot: '',
    isPublic: true,
    isFeatured: false,
  });

  // API hook
  const {
    playlists,
    loading,
    error,
    saving,
    uploading,
    availableTracks,
    tracksLoading,
    fetchPlaylists,
    fetchTracks,
    uploadImage,
    createPlaylist,
    savePlaylist,
    deletePlaylist,
    togglePublic,
    toggleFeatured,
    addTracks,
    removeTrack,
    moveTrack,
    updatePlaylistField,
  } = usePlaylistsApi(filterType, searchQuery);

  // Fetch tracks when modal opens
  useEffect(() => {
    if (trackModalOpen) {
      fetchTracks(trackSearchQuery);
    }
  }, [trackModalOpen, trackSearchQuery]);

  // Handle new playlist form field changes
  const handleNewPlaylistFieldChange = (field: keyof NewPlaylistData, value: any) => {
    setNewPlaylist(prev => ({ ...prev, [field]: value }));
  };

  // Handle image upload for new playlist
  const handleNewPlaylistImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = await uploadImage(e);
    if (url) {
      setNewPlaylist(prev => ({ ...prev, coverImage: url }));
    }
  };

  // Handle create playlist
  const handleCreatePlaylist = async () => {
    if (!newPlaylist.name) {
      alert('플레이리스트 이름은 필수입니다.');
      return;
    }

    const success = await createPlaylist(newPlaylist);
    if (success) {
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
    }
  };

  // Handle save playlist
  const handleSavePlaylist = async (playlistId: string) => {
    const playlist = playlists.find(p => p.id === playlistId);
    if (!playlist) return;

    const success = await savePlaylist(playlist);
    if (success) {
      setEditingId(null);
    }
  };

  // Handle delete playlist
  const handleDeletePlaylist = async (playlistId: string) => {
    if (!confirm('이 플레이리스트를 삭제하시겠습니까?')) return;
    await deletePlaylist(playlistId);
  };

  // Handle track modal
  const openTrackModal = (playlistId: string) => {
    setTrackModalPlaylistId(playlistId);
    setTrackModalOpen(true);
    setSelectedTrackIds([]);
    setTrackSearchQuery('');
  };

  const handleTrackToggle = (trackId: string) => {
    setSelectedTrackIds(prev =>
      prev.includes(trackId)
        ? prev.filter(id => id !== trackId)
        : [...prev, trackId]
    );
  };

  const handleAddTracks = async () => {
    if (!trackModalPlaylistId || selectedTrackIds.length === 0) return;

    const success = await addTracks(trackModalPlaylistId, selectedTrackIds);
    if (success) {
      setTrackModalOpen(false);
      setSelectedTrackIds([]);
    }
  };

  // Handle track search
  const handleTrackSearchChange = (query: string) => {
    setTrackSearchQuery(query);
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditingId(null);
    fetchPlaylists();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
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

      {/* Filters */}
      <PlaylistFilters
        filterType={filterType}
        searchQuery={searchQuery}
        onFilterChange={setFilterType}
        onSearchChange={setSearchQuery}
        playlistTypes={PLAYLIST_TYPES}
      />

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
          {error}
        </div>
      )}

      {/* New Playlist Form */}
      {isCreating && (
        <PlaylistForm
          newPlaylist={newPlaylist}
          saving={saving}
          uploading={uploading}
          playlistTypes={PLAYLIST_TYPES}
          timeSlots={TIME_SLOTS}
          onFieldChange={handleNewPlaylistFieldChange}
          onImageUpload={handleNewPlaylistImageUpload}
          onCreate={handleCreatePlaylist}
          onCancel={() => setIsCreating(false)}
        />
      )}

      {/* Playlist List */}
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
            playlists.map((playlist) => (
              <PlaylistCard
                key={playlist.id}
                playlist={playlist}
                isEditing={editingId === playlist.id}
                saving={saving}
                onEdit={() => setEditingId(playlist.id)}
                onCancelEdit={handleCancelEdit}
                onSave={() => handleSavePlaylist(playlist.id)}
                onDelete={() => handleDeletePlaylist(playlist.id)}
                onTogglePublic={() => togglePublic(playlist.id, playlist.isPublic)}
                onToggleFeatured={() => toggleFeatured(playlist.id, playlist.isFeatured)}
                onFieldChange={(field, value) => updatePlaylistField(playlist.id, field, value)}
                onAddTrack={openTrackModal}
                onRemoveTrack={removeTrack}
                onMoveTrack={moveTrack}
              />
            ))
          )}
        </div>
      )}

      {/* Track Select Modal */}
      <TrackSelectModal
        isOpen={trackModalOpen}
        tracks={availableTracks}
        selectedTrackIds={selectedTrackIds}
        searchQuery={trackSearchQuery}
        loading={tracksLoading}
        saving={saving}
        onSearchChange={handleTrackSearchChange}
        onTrackToggle={handleTrackToggle}
        onConfirm={handleAddTracks}
        onClose={() => setTrackModalOpen(false)}
      />
    </div>
  );
}
