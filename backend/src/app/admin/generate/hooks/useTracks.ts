"use client";

import { useState } from 'react';
import { GeneratedTrack } from '../types';

export function useTracks(
  setError: (error: string | null) => void,
  generatedTracks: GeneratedTrack[] = [],
  setGeneratedTracks?: React.Dispatch<React.SetStateAction<GeneratedTrack[]>>
) {
  const [selectedTrackIds, setSelectedTrackIds] = useState<Set<string>>(new Set());
  const [trackViewMode, setTrackViewMode] = useState<'grid' | 'list'>('grid');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null);
  const [downloadingTracks, setDownloadingTracks] = useState<Set<string>>(new Set());

  // 플레이리스트 모달
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [playlistName, setPlaylistName] = useState('');
  const [generatingPlaylistName, setGeneratingPlaylistName] = useState(false);

  // 트랙 수정 모달
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTrack, setEditingTrack] = useState<GeneratedTrack | null>(null);
  const [editForm, setEditForm] = useState({ title: '', titleEn: '', imageUrl: '' });
  const [savingEdit, setSavingEdit] = useState(false);

  // 앱 배포
  const [deploying, setDeploying] = useState(false);

  // ==================== 트랙 선택 ====================
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
    if (selectedTrackIds.size === generatedTracks.length) {
      setSelectedTrackIds(new Set());
    } else {
      setSelectedTrackIds(new Set(generatedTracks.map(t => t.id)));
    }
  };

  // ==================== 오디오 재생 ====================
  const togglePlay = (track: GeneratedTrack) => {
    if (playingId === track.id) {
      audioRef?.pause();
      setPlayingId(null);
    } else {
      if (audioRef) audioRef.pause();
      let audioUrl = track.audioUrl;
      if (audioUrl.startsWith('/media/') || audioUrl.startsWith('/uploads/')) {
        audioUrl = encodeURI(decodeURI(audioUrl));
      }
      const audio = new Audio(audioUrl);
      audio.play().catch(err => {
        console.error('[Audio] Play failed:', err, audioUrl);
      });
      audio.onended = () => setPlayingId(null);
      setAudioRef(audio);
      setPlayingId(track.id);
    }
  };

  // ==================== 트랙 다운로드 ====================
  const downloadTrack = async (track: GeneratedTrack) => {
    setDownloadingTracks(prev => new Set(prev).add(track.id));
    try {
      const response = await fetch('/api/admin/generate/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioUrl: track.audioUrl,
          title: track.title,
          titleEn: track.titleEn,
          style: track.style,
          mood: track.mood,
        }),
      });
      const data = await response.json();
      if (data.success) {
        alert(`저장 완료: ${data.data.filePath}`);
      } else {
        setError(data.error || '다운로드 실패');
      }
    } catch (err) {
      setError('다운로드 중 오류 발생');
    } finally {
      setDownloadingTracks(prev => {
        const newSet = new Set(prev);
        newSet.delete(track.id);
        return newSet;
      });
    }
  };

  const downloadSelectedTracks = async () => {
    const selectedTracks = generatedTracks.filter(t => selectedTrackIds.has(t.id));
    for (const track of selectedTracks) {
      await downloadTrack(track);
    }
  };

  // ==================== 플레이리스트 ====================
  const generatePlaylistName = async () => {
    setGeneratingPlaylistName(true);
    try {
      const selectedTracks = generatedTracks.filter(t => selectedTrackIds.has(t.id));
      const keywords = selectedTracks.map(t => t.title).join(', ');

      const response = await fetch('/api/admin/generate/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'playlist_name',
          keywords,
          mood: selectedTracks[0]?.mood || 'calm',
          style: selectedTracks[0]?.style || 'piano',
        }),
      });
      const data = await response.json();
      if (data.success && data.data?.text) {
        setPlaylistName(data.data.text.split('\n')[0].replace(/["|']/g, '').trim());
      }
    } catch (err) {
      console.error('Failed to generate playlist name');
    } finally {
      setGeneratingPlaylistName(false);
    }
  };

  const createPlaylist = async () => {
    if (!playlistName.trim()) {
      setError('플레이리스트 이름을 입력해주세요.');
      return;
    }
    const selectedTracks = generatedTracks.filter(t => selectedTrackIds.has(t.id));
    if (selectedTracks.length === 0) {
      setError('트랙을 선택해주세요.');
      return;
    }
    try {
      const response = await fetch('/api/admin/generate/playlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: playlistName,
          tracks: selectedTracks.map(t => ({
            id: t.id,
            title: t.title,
            titleEn: t.titleEn,
            audioUrl: t.audioUrl,
            duration: t.duration,
            style: t.style,
            mood: t.mood,
          })),
        }),
      });
      const data = await response.json();
      if (data.success) {
        alert(`플레이리스트 "${playlistName}" 생성 완료!`);
        setShowPlaylistModal(false);
        setPlaylistName('');
        setSelectedTrackIds(new Set());
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('플레이리스트 생성 실패');
    }
  };

  // ==================== JSON 내보내기 ====================
  const exportTracksAsJson = () => {
    const selectedTracks = generatedTracks.filter(t => selectedTrackIds.has(t.id));
    const exportData = selectedTracks.length > 0 ? selectedTracks : generatedTracks;

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tracks-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // ==================== 트랙 삭제 ====================
  const deleteSelectedTracks = async () => {
    if (!confirm(`선택한 ${selectedTrackIds.size}개 트랙을 삭제하시겠습니까?`)) return;

    if (setGeneratedTracks) {
      setGeneratedTracks(prev => prev.filter(t => !selectedTrackIds.has(t.id)));
    }
    setSelectedTrackIds(new Set());

    await fetch('/api/admin/generate/tracks', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: Array.from(selectedTrackIds) }),
    });
  };

  // ==================== 트랙 수정 ====================
  const openEditModal = (track: GeneratedTrack) => {
    setEditingTrack(track);
    setEditForm({
      title: track.title || '',
      titleEn: track.titleEn || '',
      imageUrl: track.imageUrl || '',
    });
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingTrack(null);
    setEditForm({ title: '', titleEn: '', imageUrl: '' });
  };

  const updateEditForm = (field: 'title' | 'titleEn' | 'imageUrl', value: string) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const saveTrackEdit = async () => {
    if (!editingTrack) return;
    if (!editForm.title.trim()) {
      setError('제목을 입력해주세요.');
      return;
    }

    setSavingEdit(true);
    try {
      const response = await fetch('/api/admin/generate/tracks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingTrack.id,
          title: editForm.title.trim(),
          titleEn: editForm.titleEn.trim() || undefined,
          imageUrl: editForm.imageUrl.trim() || undefined,
        }),
      });

      const data = await response.json();
      if (data.success) {
        // 로컬 상태 업데이트
        if (setGeneratedTracks) {
          setGeneratedTracks(prev =>
            prev.map(t =>
              t.id === editingTrack.id
                ? {
                    ...t,
                    title: editForm.title.trim(),
                    titleEn: editForm.titleEn.trim() || undefined,
                    imageUrl: editForm.imageUrl.trim() || undefined,
                  }
                : t
            )
          );
        }
        closeEditModal();
      } else {
        setError(data.error || '수정 실패');
      }
    } catch (err) {
      setError('트랙 수정 중 오류 발생');
    } finally {
      setSavingEdit(false);
    }
  };

  // ==================== 앱 배포 ====================
  const deploySelectedTracks = async () => {
    // 미배포된 트랙만 필터
    const selectedTracks = generatedTracks.filter(t => selectedTrackIds.has(t.id) && !t.deployed);
    if (selectedTracks.length === 0) {
      setError('배포할 트랙을 선택해주세요. (이미 배포된 트랙은 제외됩니다)');
      return;
    }

    if (!confirm(`선택한 ${selectedTracks.length}개 트랙을 앱에 배포하시겠습니까?\n\n배포된 트랙은 앱에서 개별 트랙으로 노출됩니다.`)) {
      return;
    }

    setDeploying(true);
    try {
      const response = await fetch('/api/admin/generate/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tracks: selectedTracks.map(t => ({
            id: t.id,
            title: t.title,
            titleEn: t.titleEn,
            audioUrl: t.audioUrl,
            imageUrl: t.imageUrl,
            duration: t.duration,
            style: t.style,
            mood: t.mood,
          })),
        }),
      });

      const data = await response.json();
      if (data.success) {
        const { summary, results } = data.data;
        alert(data.message || `${summary.created}개 신규 배포, ${summary.updated}개 업데이트`);

        // 배포 성공한 트랙들을 deployed: true로 마킹
        if (setGeneratedTracks) {
          const deployedMap = new Map<string, string>();
          results
            .filter((r: { success: boolean; trackId?: string; generatedTrackId: string }) => r.success && r.trackId)
            .forEach((r: { trackId?: string; generatedTrackId: string }) => {
              // generatedTrackId로 직접 매칭 (title이 같은 경우에도 정확히 매칭)
              if (r.generatedTrackId && r.trackId) {
                deployedMap.set(r.generatedTrackId, r.trackId);
              }
            });

          setGeneratedTracks(prev =>
            prev.map(t => {
              if (deployedMap.has(t.id)) {
                return {
                  ...t,
                  deployed: true,
                  deployedAt: new Date().toISOString(),
                  dbTrackId: deployedMap.get(t.id),
                };
              }
              return t;
            })
          );

          // 배포된 트랙 정보를 서버에도 저장
          await fetch('/api/admin/generate/tracks', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              bulkUpdate: Array.from(deployedMap.entries()).map(([id, dbTrackId]) => ({
                id,
                deployed: true,
                deployedAt: new Date().toISOString(),
                dbTrackId,
              })),
            }),
          });
        }
        setSelectedTrackIds(new Set());
      } else {
        setError(data.error || '배포 실패');
      }
    } catch (err) {
      setError('트랙 배포 중 오류 발생');
    } finally {
      setDeploying(false);
    }
  };

  return {
    // State
    selectedTrackIds,
    trackViewMode,
    setTrackViewMode,
    playingId,
    downloadingTracks,
    showPlaylistModal,
    setShowPlaylistModal,
    playlistName,
    setPlaylistName,
    generatingPlaylistName,
    // Edit Modal State
    showEditModal,
    editingTrack,
    editForm,
    savingEdit,
    // Actions
    toggleTrackSelection,
    toggleSelectAll,
    togglePlay,
    downloadTrack,
    downloadSelectedTracks,
    generatePlaylistName,
    createPlaylist,
    exportTracksAsJson,
    deleteSelectedTracks,
    // Edit Actions
    openEditModal,
    closeEditModal,
    updateEditForm,
    saveTrackEdit,
    // Deploy Actions
    deploying,
    deploySelectedTracks,
  };
}
