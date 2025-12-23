import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { Track } from '../types';
import { DownloadService, DownloadStatus, DownloadItem } from '../services';

interface DownloadState {
  [trackId: string]: {
    status: DownloadStatus;
    progress: number;
  };
}

interface UseDownloadReturn {
  downloadStates: DownloadState;
  downloadTrack: (track: Track) => Promise<void>;
  cancelDownload: (trackId: string) => Promise<void>;
  deleteDownload: (trackId: string) => Promise<void>;
  isDownloaded: (trackId: string) => boolean;
  getDownloadStatus: (trackId: string) => DownloadStatus | null;
  getDownloadProgress: (trackId: string) => number;
  downloadedCount: number;
  totalDownloadSize: string;
  refreshDownloads: () => Promise<void>;
}

export const useDownload = (): UseDownloadReturn => {
  const [downloadStates, setDownloadStates] = useState<DownloadState>({});
  const [downloadedCount, setDownloadedCount] = useState(0);
  const [totalDownloadSize, setTotalDownloadSize] = useState('0 B');

  // Load initial download states
  const refreshDownloads = useCallback(async () => {
    try {
      const downloads = await DownloadService.getDownloadedTracks();
      const states: DownloadState = {};

      downloads.forEach((item: DownloadItem) => {
        states[item.trackId] = {
          status: item.status,
          progress: item.progress,
        };
      });

      setDownloadStates(states);

      // Update stats
      const count = await DownloadService.getDownloadCount();
      const size = await DownloadService.getTotalDownloadSize();
      setDownloadedCount(count);
      setTotalDownloadSize(DownloadService.formatFileSize(size));
    } catch (error) {
      console.error('[useDownload] Failed to refresh downloads:', error);
    }
  }, []);

  // Subscribe to progress updates
  useEffect(() => {
    const unsubscribe = DownloadService.addProgressListener(
      (trackId: string, progress: number, status: DownloadStatus) => {
        setDownloadStates(prev => ({
          ...prev,
          [trackId]: { status, progress },
        }));

        // Refresh stats when download completes
        if (status === 'completed') {
          refreshDownloads();
        }
      }
    );

    // Initial load
    refreshDownloads();

    return unsubscribe;
  }, [refreshDownloads]);

  // Download a track
  const downloadTrack = useCallback(async (track: Track) => {
    try {
      await DownloadService.downloadTrack(track);
    } catch (error: any) {
      Alert.alert('다운로드 실패', error.message || '다운로드 중 오류가 발생했습니다.');
    }
  }, []);

  // Cancel download
  const cancelDownload = useCallback(async (trackId: string) => {
    try {
      await DownloadService.cancelDownload(trackId);
      setDownloadStates(prev => {
        const newStates = { ...prev };
        delete newStates[trackId];
        return newStates;
      });
    } catch (error) {
      console.error('[useDownload] Failed to cancel:', error);
    }
  }, []);

  // Delete download
  const deleteDownload = useCallback(async (trackId: string) => {
    Alert.alert(
      '다운로드 삭제',
      '이 트랙의 오프라인 저장본을 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              await DownloadService.deleteDownload(trackId);
              setDownloadStates(prev => {
                const newStates = { ...prev };
                delete newStates[trackId];
                return newStates;
              });
              await refreshDownloads();
            } catch (error) {
              console.error('[useDownload] Failed to delete:', error);
            }
          },
        },
      ]
    );
  }, [refreshDownloads]);

  // Check if track is downloaded
  const isDownloaded = useCallback((trackId: string): boolean => {
    return downloadStates[trackId]?.status === 'completed';
  }, [downloadStates]);

  // Get download status
  const getDownloadStatus = useCallback((trackId: string): DownloadStatus | null => {
    return downloadStates[trackId]?.status || null;
  }, [downloadStates]);

  // Get download progress
  const getDownloadProgress = useCallback((trackId: string): number => {
    return downloadStates[trackId]?.progress || 0;
  }, [downloadStates]);

  return {
    downloadStates,
    downloadTrack,
    cancelDownload,
    deleteDownload,
    isDownloaded,
    getDownloadStatus,
    getDownloadProgress,
    downloadedCount,
    totalDownloadSize,
    refreshDownloads,
  };
};

export default useDownload;
