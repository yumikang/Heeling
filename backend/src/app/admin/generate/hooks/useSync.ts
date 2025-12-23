"use client";

import { useState } from 'react';
import { GeneratedTrack } from '../types';

interface SyncProgress {
  current: number;
  total: number;
  status: string;
}

export function useSync(
  setError: (error: string | null) => void,
  setGeneratedTracks: React.Dispatch<React.SetStateAction<GeneratedTrack[]>>,
  fetchSunoCredits: () => Promise<void>,
  saveSunoCache: (taskId: string, title: string, style: string, mood: string, status: string, tracks: any[]) => Promise<void>
) {
  const [syncingRecords, setSyncingRecords] = useState(false);
  const [syncProgress, setSyncProgress] = useState<SyncProgress | null>(null);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [syncTaskIds, setSyncTaskIds] = useState('');

  const syncSunoRecords = async (taskIdList?: string[]) => {
    const taskIds = taskIdList || syncTaskIds
      .split(/[\n,\s]+/)
      .map(id => id.trim())
      .filter(id => id.length > 0);

    if (taskIds.length === 0) {
      setError('Task ID를 입력해주세요.');
      return;
    }

    setShowSyncModal(false);
    setSyncingRecords(true);
    setSyncProgress({ current: 0, total: taskIds.length, status: 'Task ID 조회 중...' });

    try {
      const cacheResponse = await fetch('/api/admin/generate/cache?action=list');
      const cacheData = await cacheResponse.json();
      const existingTaskIds = new Set(
        (cacheData.data?.suno?.items || []).map((c: any) => c.taskId || '')
      );

      const newTaskIds = taskIds.filter(id => !existingTaskIds.has(id));

      if (newTaskIds.length === 0) {
        setSyncProgress({ current: 0, total: 0, status: '모든 Task ID가 이미 동기화되어 있습니다.' });
        setTimeout(() => setSyncingRecords(false), 2000);
        return;
      }

      let processed = 0;
      const allNewTracks: GeneratedTrack[] = [];

      for (const taskId of newTaskIds) {
        processed++;
        setSyncProgress({
          current: processed,
          total: newTaskIds.length,
          status: `조회 중: ${taskId.substring(0, 16)}...`,
        });

        try {
          const statusRes = await fetch(`/api/admin/generate/music?taskId=${taskId}`);
          const statusData = await statusRes.json();

          if (!statusData.success || statusData.data?.status !== 'SUCCESS') {
            continue;
          }

          const tracks = statusData.data.tracks || [];

          for (const track of tracks) {
            let localAudioUrl = track.audioUrl;
            if (track.audioUrl && track.audioUrl.startsWith('http')) {
              try {
                setSyncProgress(prev => prev ? { ...prev, status: `오디오 다운로드: ${track.title}` } : null);
                const downloadRes = await fetch('/api/admin/generate/download', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    audioUrl: track.audioUrl,
                    title: track.title,
                    style: 'synced',
                    mood: 'imported',
                    type: 'audio',
                  }),
                });
                const downloadData = await downloadRes.json();
                if (downloadData.success && downloadData.data?.filePath) {
                  localAudioUrl = downloadData.data.filePath;
                }
              } catch (err) {
                console.error('[Sync] Audio download failed:', err);
              }
            }

            let localImageUrl = track.imageUrl;
            if (track.imageUrl && track.imageUrl.startsWith('http')) {
              try {
                setSyncProgress(prev => prev ? { ...prev, status: `이미지 다운로드: ${track.title}` } : null);
                const imgRes = await fetch('/api/admin/generate/download', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    imageUrl: track.imageUrl,
                    title: track.title,
                    style: 'synced',
                    mood: 'imported',
                    type: 'image',
                  }),
                });
                const imgData = await imgRes.json();
                if (imgData.success && imgData.data?.filePath) {
                  localImageUrl = imgData.data.filePath;
                }
              } catch (err) {
                console.error('[Sync] Image download failed:', err);
              }
            } else if (!track.imageUrl) {
              try {
                setSyncProgress(prev => prev ? { ...prev, status: `이미지 생성: ${track.title}` } : null);
                const imgGenRes = await fetch('/api/admin/generate/image', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    title: track.title,
                    category: 'healing',
                    mood: 'calm',
                    style: 'artistic',
                    save: true,
                  }),
                });
                const imgGenData = await imgGenRes.json();
                if (imgGenData.success && imgGenData.data?.url) {
                  localImageUrl = imgGenData.data.url;
                }
              } catch (err) {
                console.error('[Sync] Image generation failed:', err);
              }
            }

            allNewTracks.push({
              id: track.id,
              title: track.title,
              audioUrl: localAudioUrl,
              duration: track.duration || 0,
              style: 'synced',
              mood: 'imported',
              createdAt: new Date().toISOString(),
              imageUrl: localImageUrl,
              taskId: taskId,
            });
          }

          await saveSunoCache(
            taskId,
            tracks[0]?.title || 'Untitled',
            'synced',
            'imported',
            'SUCCESS',
            tracks
          );
        } catch (err) {
          console.error('[Sync] Error fetching taskId:', taskId, err);
        }
      }

      if (allNewTracks.length > 0) {
        setGeneratedTracks(prev => [...allNewTracks, ...prev]);
      }

      setSyncProgress({
        current: newTaskIds.length,
        total: newTaskIds.length,
        status: `${allNewTracks.length}개 트랙 동기화 완료!`
      });

      fetchSunoCredits();
      setSyncTaskIds('');

      setTimeout(() => setSyncingRecords(false), 3000);
    } catch (err) {
      console.error('[Sync] Error:', err);
      setSyncProgress({ current: 0, total: 0, status: `오류: ${err instanceof Error ? err.message : '알 수 없는 오류'}` });
      setTimeout(() => setSyncingRecords(false), 3000);
    }
  };

  return {
    // State
    syncingRecords,
    syncProgress,
    showSyncModal,
    setShowSyncModal,
    syncTaskIds,
    setSyncTaskIds,
    // Actions
    syncSunoRecords,
  };
}
