/**
 * useOfflineMode - 오프라인 모드 상태 관리 훅
 *
 * 오프라인 모드 ON 시:
 * - 다운로드되지 않은 트랙에 다운로드 버튼 표시
 * - 다운로드된 트랙만 재생 가능
 */

import { useState, useEffect, useCallback } from 'react';
import { NetworkService } from '../services';
import { NetworkMode } from '../types';

interface OfflineModeState {
  isOfflineMode: boolean;
  networkMode: NetworkMode;
  setOfflineMode: (enabled: boolean) => Promise<void>;
  toggleOfflineMode: () => Promise<void>;
}

export const useOfflineMode = (): OfflineModeState => {
  const [networkMode, setNetworkMode] = useState<NetworkMode>('streaming');
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  // 초기 설정 로드
  useEffect(() => {
    const loadSettings = async () => {
      const settings = await NetworkService.loadSettings();
      setNetworkMode(settings.networkMode);
      setIsOfflineMode(settings.networkMode === 'offline');
    };
    loadSettings();
  }, []);

  // 오프라인 모드 설정
  const setOfflineMode = useCallback(async (enabled: boolean) => {
    const newMode: NetworkMode = enabled ? 'offline' : 'streaming';
    await NetworkService.saveSettings({ networkMode: newMode });
    setNetworkMode(newMode);
    setIsOfflineMode(enabled);
  }, []);

  // 오프라인 모드 토글
  const toggleOfflineMode = useCallback(async () => {
    await setOfflineMode(!isOfflineMode);
  }, [isOfflineMode, setOfflineMode]);

  return {
    isOfflineMode,
    networkMode,
    setOfflineMode,
    toggleOfflineMode,
  };
};

export default useOfflineMode;
