"use client";

import { useState, useCallback } from 'react';

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

export interface Track {
  id: string;
  title: string;
  artist: string | null;
  thumbnailUrl: string | null;
  duration: number;
  category: string | null;
}

export interface PlaylistTrack {
  id: string;
  trackId: string;
  position: number;
  track: Track;
}

export interface Playlist {
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

export interface NewPlaylistData {
  name: string;
  description: string;
  coverImage: string;
  type: keyof typeof PLAYLIST_TYPES;
  theme: string;
  timeSlot: keyof typeof TIME_SLOTS | '';
  isPublic: boolean;
  isFeatured: boolean;
}

const initialNewPlaylist: NewPlaylistData = {
  name: '',
  description: '',
  coverImage: '',
  type: 'MANUAL',
  theme: '',
  timeSlot: '',
  isPublic: true,
  isFeatured: false,
};

export function usePlaylistsApi(filterType: string, searchQuery: string) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [availableTracks, setAvailableTracks] = useState<Track[]>([]);
  const [tracksLoading, setTracksLoading] = useState(false);

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

  const uploadImage = async (file: File): Promise<string | null> => {
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
        return data.data.url;
      } else {
        alert(data.error || '업로드에 실패했습니다.');
        return null;
      }
    } catch (err) {
      alert('업로드 중 오류가 발생했습니다.');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const createPlaylist = async (newPlaylist: NewPlaylistData): Promise<boolean> => {
    if (!newPlaylist.name) {
      alert('플레이리스트 이름은 필수입니다.');
      return false;
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
        return true;
      } else {
        alert(data.error || '플레이리스트 생성에 실패했습니다.');
        return false;
      }
    } catch (err) {
      alert('서버 연결에 실패했습니다.');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const savePlaylist = async (playlist: Playlist): Promise<boolean> => {
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

      if (!data.success) {
        alert(data.error || '저장에 실패했습니다.');
        return false;
      }
      return true;
    } catch (err) {
      alert('서버 연결에 실패했습니다.');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const deletePlaylist = async (id: string): Promise<boolean> => {
    if (!confirm('이 플레이리스트를 삭제하시겠습니까?')) return false;

    try {
      const response = await fetch(`/api/admin/playlists/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        await fetchPlaylists();
        return true;
      } else {
        alert(data.error || '삭제에 실패했습니다.');
        return false;
      }
    } catch (err) {
      alert('서버 연결에 실패했습니다.');
      return false;
    }
  };

  const togglePublic = async (id: string, currentPublic: boolean): Promise<boolean> => {
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
        return true;
      } else {
        alert(data.error || '상태 변경에 실패했습니다.');
        return false;
      }
    } catch (err) {
      alert('서버 연결에 실패했습니다.');
      return false;
    }
  };

  const toggleFeatured = async (id: string, currentFeatured: boolean): Promise<boolean> => {
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
        return true;
      } else {
        alert(data.error || '상태 변경에 실패했습니다.');
        return false;
      }
    } catch (err) {
      alert('서버 연결에 실패했습니다.');
      return false;
    }
  };

  const addTracks = async (playlistId: string, trackIds: string[]): Promise<boolean> => {
    if (trackIds.length === 0) return false;

    try {
      setSaving(true);
      const response = await fetch(`/api/admin/playlists/${playlistId}/tracks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackIds }),
      });

      const data = await response.json();

      if (data.success) {
        await fetchPlaylists();
        return true;
      } else {
        alert(data.error || '트랙 추가에 실패했습니다.');
        return false;
      }
    } catch (err) {
      alert('서버 연결에 실패했습니다.');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const removeTrack = async (playlistId: string, trackId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/admin/playlists/${playlistId}/tracks?trackId=${trackId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        await fetchPlaylists();
        return true;
      } else {
        alert(data.error || '트랙 제거에 실패했습니다.');
        return false;
      }
    } catch (err) {
      alert('서버 연결에 실패했습니다.');
      return false;
    }
  };

  const moveTrack = async (
    playlistId: string,
    tracks: PlaylistTrack[],
    fromIndex: number,
    direction: 'up' | 'down'
  ): Promise<void> => {
    if (
      (direction === 'up' && fromIndex === 0) ||
      (direction === 'down' && fromIndex === tracks.length - 1)
    ) {
      return;
    }

    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
    const newTracks = [...tracks];
    [newTracks[fromIndex], newTracks[toIndex]] = [newTracks[toIndex], newTracks[fromIndex]];

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

  const updatePlaylistField = (id: string, field: keyof Playlist, value: any) => {
    setPlaylists(prev =>
      prev.map(p => p.id === id ? { ...p, [field]: value } : p)
    );
  };

  return {
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
    initialNewPlaylist,
    PLAYLIST_TYPES,
    TIME_SLOTS,
  };
}
