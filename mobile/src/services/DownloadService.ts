import RNFS from 'react-native-fs';
import { Track } from '../types';
import { runSql, getFirstRow, getAllRows } from '../database';
import { NetworkService } from './NetworkService';

// Download status types
export type DownloadStatus = 'pending' | 'downloading' | 'completed' | 'failed' | 'paused';

// Download item interface
export interface DownloadItem {
  trackId: string;
  status: DownloadStatus;
  progress: number; // 0-100
  localPath: string | null;
  fileSize: number;
  downloadedSize: number;
  createdAt: string;
  completedAt: string | null;
  error: string | null;
}

// Progress callback type
export type ProgressCallback = (trackId: string, progress: number, status: DownloadStatus) => void;

// Download directory path
const DOWNLOAD_DIR = `${RNFS.DocumentDirectoryPath}/tracks`;

/**
 * DownloadService - Manages offline track downloads
 *
 * Features:
 * - Download audio files to local storage
 * - Track download progress
 * - Resume interrupted downloads
 * - Manage downloaded files (list, delete)
 * - Provide local file paths for playback
 */
export const DownloadService = {
  // Active downloads map
  _activeDownloads: new Map<string, { jobId: number; cancel: () => void }>(),
  _progressListeners: new Set<ProgressCallback>(),

  /**
   * Initialize download directory
   */
  async initialize(): Promise<void> {
    try {
      const exists = await RNFS.exists(DOWNLOAD_DIR);
      if (!exists) {
        await RNFS.mkdir(DOWNLOAD_DIR);
        console.log('[DownloadService] Created download directory:', DOWNLOAD_DIR);
      }
    } catch (error) {
      console.error('[DownloadService] Failed to initialize:', error);
    }
  },

  /**
   * Get local file path for a track
   */
  getLocalPath(trackId: string): string {
    return `${DOWNLOAD_DIR}/${trackId}.mp3`;
  },

  /**
   * Check if a track is downloaded
   */
  async isDownloaded(trackId: string): Promise<boolean> {
    const localPath = this.getLocalPath(trackId);
    return await RNFS.exists(localPath);
  },

  /**
   * Get playable URL - returns local path if downloaded, otherwise remote URL
   */
  async getPlayableUrl(track: Track): Promise<string> {
    const localPath = this.getLocalPath(track.id);
    const exists = await RNFS.exists(localPath);

    if (exists) {
      return `file://${localPath}`;
    }
    return track.audioFile;
  },

  /**
   * Download a track
   */
  async downloadTrack(track: Track): Promise<void> {
    const trackId = track.id;
    const localPath = this.getLocalPath(trackId);

    // Check network permission
    const networkCheck = NetworkService.canDownload();
    if (!networkCheck.allowed) {
      throw new Error(NetworkService.getRestrictionMessage(networkCheck.reason));
    }

    // Check if already downloading
    if (this._activeDownloads.has(trackId)) {
      console.log('[DownloadService] Already downloading:', trackId);
      return;
    }

    // Check if already downloaded
    if (await this.isDownloaded(trackId)) {
      console.log('[DownloadService] Already downloaded:', trackId);
      return;
    }

    // Save initial download record
    await this._saveDownloadRecord(trackId, 'downloading', 0, null, 0, 0, null);
    this._notifyProgress(trackId, 0, 'downloading');

    try {
      // Start download
      const downloadResult = RNFS.downloadFile({
        fromUrl: track.audioFile,
        toFile: localPath,
        background: true,
        discretionary: true,
        cacheable: false,
        progressInterval: 500,
        progressDivider: 1,
        begin: (res) => {
          console.log('[DownloadService] Download started:', trackId, 'Size:', res.contentLength);
          this._updateDownloadRecord(trackId, { fileSize: res.contentLength });
        },
        progress: (res) => {
          const progress = Math.round((res.bytesWritten / res.contentLength) * 100);
          this._notifyProgress(trackId, progress, 'downloading');
          this._updateDownloadRecord(trackId, {
            progress,
            downloadedSize: res.bytesWritten,
          });
        },
      });

      // Store active download for cancellation
      this._activeDownloads.set(trackId, {
        jobId: downloadResult.jobId,
        cancel: () => RNFS.stopDownload(downloadResult.jobId),
      });

      // Wait for download to complete
      const result = await downloadResult.promise;

      if (result.statusCode === 200) {
        // Get file size
        const fileInfo = await RNFS.stat(localPath);

        // Update record as completed
        await this._saveDownloadRecord(
          trackId,
          'completed',
          100,
          localPath,
          Number(fileInfo.size),
          Number(fileInfo.size),
          null
        );
        this._notifyProgress(trackId, 100, 'completed');
        console.log('[DownloadService] Download completed:', trackId);
      } else {
        throw new Error(`Download failed with status: ${result.statusCode}`);
      }
    } catch (error: any) {
      console.error('[DownloadService] Download failed:', trackId, error);

      // Clean up partial file
      if (await RNFS.exists(localPath)) {
        await RNFS.unlink(localPath);
      }

      // Update record as failed
      await this._saveDownloadRecord(
        trackId,
        'failed',
        0,
        null,
        0,
        0,
        error.message || 'Unknown error'
      );
      this._notifyProgress(trackId, 0, 'failed');

      throw error;
    } finally {
      this._activeDownloads.delete(trackId);
    }
  },

  /**
   * Cancel an active download
   */
  async cancelDownload(trackId: string): Promise<void> {
    const activeDownload = this._activeDownloads.get(trackId);
    if (activeDownload) {
      activeDownload.cancel();
      this._activeDownloads.delete(trackId);
    }

    // Clean up partial file
    const localPath = this.getLocalPath(trackId);
    if (await RNFS.exists(localPath)) {
      await RNFS.unlink(localPath);
    }

    // Remove download record
    await this._deleteDownloadRecord(trackId);
    this._notifyProgress(trackId, 0, 'pending');
  },

  /**
   * Delete a downloaded track
   */
  async deleteDownload(trackId: string): Promise<void> {
    const localPath = this.getLocalPath(trackId);

    if (await RNFS.exists(localPath)) {
      await RNFS.unlink(localPath);
      console.log('[DownloadService] Deleted:', trackId);
    }

    await this._deleteDownloadRecord(trackId);
  },

  /**
   * Get all downloaded tracks
   */
  async getDownloadedTracks(): Promise<DownloadItem[]> {
    try {
      const rows = await getAllRows(
        'SELECT * FROM downloads WHERE status = ? ORDER BY completed_at DESC',
        ['completed']
      );

      return rows.map(this._rowToDownloadItem);
    } catch (error) {
      console.error('[DownloadService] Failed to get downloads:', error);
      return [];
    }
  },

  /**
   * Get download status for a track
   */
  async getDownloadStatus(trackId: string): Promise<DownloadItem | null> {
    try {
      const row = await getFirstRow(
        'SELECT * FROM downloads WHERE track_id = ?',
        [trackId]
      );

      if (!row) return null;
      return this._rowToDownloadItem(row);
    } catch (error) {
      console.error('[DownloadService] Failed to get status:', error);
      return null;
    }
  },

  /**
   * Get total download size
   */
  async getTotalDownloadSize(): Promise<number> {
    try {
      const row = await getFirstRow<{ total: number | null }>(
        'SELECT SUM(file_size) as total FROM downloads WHERE status = ?',
        ['completed']
      );
      return row?.total || 0;
    } catch (error) {
      console.error('[DownloadService] Failed to get total size:', error);
      return 0;
    }
  },

  /**
   * Get download count
   */
  async getDownloadCount(): Promise<number> {
    try {
      const row = await getFirstRow<{ count: number }>(
        'SELECT COUNT(*) as count FROM downloads WHERE status = ?',
        ['completed']
      );
      return row?.count || 0;
    } catch (error) {
      console.error('[DownloadService] Failed to get count:', error);
      return 0;
    }
  },

  /**
   * Delete all downloads
   */
  async deleteAllDownloads(): Promise<void> {
    try {
      // Cancel all active downloads
      for (const [trackId, download] of this._activeDownloads) {
        download.cancel();
        this._activeDownloads.delete(trackId);
      }

      // Delete all files
      const files = await RNFS.readDir(DOWNLOAD_DIR);
      for (const file of files) {
        await RNFS.unlink(file.path);
      }

      // Clear database
      await runSql('DELETE FROM downloads', []);
      console.log('[DownloadService] All downloads deleted');
    } catch (error) {
      console.error('[DownloadService] Failed to delete all:', error);
    }
  },

  /**
   * Add progress listener
   */
  addProgressListener(callback: ProgressCallback): () => void {
    this._progressListeners.add(callback);
    return () => {
      this._progressListeners.delete(callback);
    };
  },

  /**
   * Notify all progress listeners
   */
  _notifyProgress(trackId: string, progress: number, status: DownloadStatus): void {
    this._progressListeners.forEach((callback) => {
      try {
        callback(trackId, progress, status);
      } catch (error) {
        console.error('[DownloadService] Progress listener error:', error);
      }
    });
  },

  /**
   * Save download record to database
   */
  async _saveDownloadRecord(
    trackId: string,
    status: DownloadStatus,
    progress: number,
    localPath: string | null,
    fileSize: number,
    downloadedSize: number,
    error: string | null
  ): Promise<void> {
    const now = new Date().toISOString();
    const completedAt = status === 'completed' ? now : null;

    await runSql(
      `INSERT OR REPLACE INTO downloads
       (track_id, status, progress, local_path, file_size, downloaded_size, created_at, completed_at, error)
       VALUES (?, ?, ?, ?, ?, ?, COALESCE((SELECT created_at FROM downloads WHERE track_id = ?), ?), ?, ?)`,
      [trackId, status, progress, localPath, fileSize, downloadedSize, trackId, now, completedAt, error]
    );
  },

  /**
   * Update download record
   */
  async _updateDownloadRecord(
    trackId: string,
    updates: Partial<{ progress: number; fileSize: number; downloadedSize: number }>
  ): Promise<void> {
    const setParts: string[] = [];
    const values: any[] = [];

    if (updates.progress !== undefined) {
      setParts.push('progress = ?');
      values.push(updates.progress);
    }
    if (updates.fileSize !== undefined) {
      setParts.push('file_size = ?');
      values.push(updates.fileSize);
    }
    if (updates.downloadedSize !== undefined) {
      setParts.push('downloaded_size = ?');
      values.push(updates.downloadedSize);
    }

    if (setParts.length > 0) {
      values.push(trackId);
      await runSql(
        `UPDATE downloads SET ${setParts.join(', ')} WHERE track_id = ?`,
        values
      );
    }
  },

  /**
   * Delete download record
   */
  async _deleteDownloadRecord(trackId: string): Promise<void> {
    await runSql('DELETE FROM downloads WHERE track_id = ?', [trackId]);
  },

  /**
   * Convert database row to DownloadItem
   */
  _rowToDownloadItem(row: any): DownloadItem {
    return {
      trackId: row.track_id,
      status: row.status as DownloadStatus,
      progress: row.progress,
      localPath: row.local_path,
      fileSize: row.file_size,
      downloadedSize: row.downloaded_size,
      createdAt: row.created_at,
      completedAt: row.completed_at,
      error: row.error,
    };
  },

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  },
};

export default DownloadService;
