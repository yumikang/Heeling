/**
 * History API
 * 재생 기록 관리
 */

import { post } from './client';
import { SaveHistoryRequest, SaveHistoryResponse } from '@/types/api';
import { Platform } from 'react-native';

/**
 * 재생 기록 저장
 *
 * @param params - 재생 기록 정보
 * @param params.userId - 사용자 ID
 * @param params.trackId - 트랙 ID
 * @param params.completionRate - 완료율 (0-100)
 * @param params.listenDuration - 청취 시간 (초)
 * @param params.deviceType - 기기 타입 ('iOS' | 'Android')
 * @param params.wasAdShown - 광고 표시 여부
 * @returns 생성된 재생 기록 정보
 *
 * @example
 * ```ts
 * const result = await savePlayHistory({
 *   userId: 'user-123',
 *   trackId: 'track-456',
 *   completionRate: 95,
 *   listenDuration: 285,
 *   deviceType: 'iOS',
 *   wasAdShown: false,
 * });
 * console.log('History saved:', result.data.id);
 * ```
 */
export const savePlayHistory = async (
  params: SaveHistoryRequest
): Promise<SaveHistoryResponse> => {
  return post<SaveHistoryResponse>('/sync/history', params);
};

/**
 * 재생 기록 저장 (편의 함수 - 자동으로 deviceType 설정)
 *
 * @param userId - 사용자 ID
 * @param trackId - 트랙 ID
 * @param completionRate - 완료율 (0-100)
 * @param listenDuration - 청취 시간 (초)
 * @param wasAdShown - 광고 표시 여부
 * @returns 생성된 재생 기록 정보
 */
export const recordPlayHistory = async (
  userId: string,
  trackId: string,
  completionRate: number,
  listenDuration: number,
  wasAdShown: boolean = false
): Promise<SaveHistoryResponse> => {
  const deviceType = Platform.OS === 'ios' ? 'iOS' : 'Android';

  return savePlayHistory({
    userId,
    trackId,
    completionRate,
    listenDuration,
    deviceType,
    wasAdShown,
  });
};

/**
 * 트랙 재생 완료 시 자동 기록 (편의 함수)
 *
 * @param userId - 사용자 ID
 * @param trackId - 트랙 ID
 * @param duration - 트랙 재생 시간 (초)
 * @param wasAdShown - 광고 표시 여부
 * @returns 생성된 재생 기록 정보
 */
export const recordCompletedPlay = async (
  userId: string,
  trackId: string,
  duration: number,
  wasAdShown: boolean = false
): Promise<SaveHistoryResponse> => {
  return recordPlayHistory(userId, trackId, 100, duration, wasAdShown);
};

/**
 * 트랙 부분 재생 기록 (편의 함수)
 *
 * @param userId - 사용자 ID
 * @param trackId - 트랙 ID
 * @param playedSeconds - 재생한 시간 (초)
 * @param totalSeconds - 전체 시간 (초)
 * @param wasAdShown - 광고 표시 여부
 * @returns 생성된 재생 기록 정보
 */
export const recordPartialPlay = async (
  userId: string,
  trackId: string,
  playedSeconds: number,
  totalSeconds: number,
  wasAdShown: boolean = false
): Promise<SaveHistoryResponse> => {
  const completionRate = Math.min(100, Math.round((playedSeconds / totalSeconds) * 100));

  return recordPlayHistory(userId, trackId, completionRate, playedSeconds, wasAdShown);
};

export default {
  savePlayHistory,
  recordPlayHistory,
  recordCompletedPlay,
  recordPartialPlay,
};
