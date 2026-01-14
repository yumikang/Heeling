/**
 * useOfflineMode - 오프라인 모드 상태 관리 훅
 *
 * 오프라인 모드 ON 시:
 * - 다운로드되지 않은 트랙에 다운로드 버튼 표시
 * - 다운로드된 트랙만 재생 가능
 *
 * 개선사항:
 * - isLoading 상태로 초기 설정 로드 완료 여부 추적
 * - 설정 로드 전 잘못된 초기값 사용 방지
 */

import { useState, useEffect, useCallback } from 'react';
import { NetworkService } from '../services';
import { NetworkMode } from '../types';

interface OfflineModeState {
  isOfflineMode: boolean;
  networkMode: NetworkMode;
  isLoading: boolean; // 설정 로드 완료 여부
  setOfflineMode: (enabled: boolean) => Promise<void>;
  toggleOfflineMode: () => Promise<void>;
}

export const useOfflineMode = (): OfflineModeState => {
  const [networkMode, setNetworkMode] = useState<NetworkMode>('streaming');
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // 초기 로딩 상태

  // 초기 설정 로드
  useEffect(() => {
    let isMounted = true;

    const loadSettings = async () => {
      try {
        const settings = await NetworkService.loadSettings();
        if (isMounted) {
          setNetworkMode(settings.networkMode);
          setIsOfflineMode(settings.networkMode === 'offline');
        }
      } catch (error) {
        console.error('[useOfflineMode] Failed to load settings:', error);
        // 에러 시 기본값 유지 (streaming)
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadSettings();

    return () => {
      isMounted = false;
    };
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
    isLoading,
    setOfflineMode,
    toggleOfflineMode,
  };
};

export default useOfflineMode;
