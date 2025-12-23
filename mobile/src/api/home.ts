/**
 * Home API
 * 홈 화면 섹션 조회 (ETag 캐싱 지원)
 */

import { get } from './client';
import { HomeSectionsResponse, HomeSection } from '@/types/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ETAG_STORAGE_KEY = '@heeling:home_etag';

/**
 * 홈 섹션 설정 조회 (ETag 캐싱 지원)
 *
 * ETag를 사용하여 서버 데이터가 변경되지 않았으면 304 Not Modified를 받음
 *
 * @param forceRefresh - true면 캐시 무시하고 강제 새로고침
 * @returns 홈 섹션 데이터 또는 캐시 유효 표시
 *
 * @example
 * ```ts
 * // 일반 조회 (ETag 캐싱 사용)
 * const home = await getHomeSections();
 * if (home.cached) {
 *   // 캐시 유효, 로컬 데이터 사용
 * } else {
 *   // 새 데이터
 *   console.log(home.data.sections);
 * }
 *
 * // 강제 새로고침
 * const fresh = await getHomeSections(true);
 * ```
 */
export const getHomeSections = async (
  forceRefresh: boolean = false
): Promise<HomeSectionsResponse | { cached: true }> => {
  try {
    // 이전 ETag 조회
    const previousEtag = forceRefresh
      ? null
      : await AsyncStorage.getItem(ETAG_STORAGE_KEY);

    // API 요청 (ETag 포함)
    const response = await get<HomeSectionsResponse>(
      '/sync/home',
      undefined,
      previousEtag ? { etag: previousEtag } : undefined
    );

    // 304 Not Modified 응답 처리
    if ('cached' in response && response.cached) {
      return { cached: true };
    }

    // 새 데이터인 경우 ETag 저장
    if ('meta' in response && response.meta.etag) {
      await AsyncStorage.setItem(ETAG_STORAGE_KEY, response.meta.etag);
    }

    return response as HomeSectionsResponse;
  } catch (error) {
    console.error('[Home API] getHomeSections error:', error);
    throw error;
  }
};

/**
 * 홈 섹션 데이터를 배열로 반환 (편의 함수)
 *
 * @param forceRefresh - 강제 새로고침 여부
 * @returns 홈 섹션 배열, 캐시 유효 시 null
 */
export const getHomeSectionsList = async (
  forceRefresh: boolean = false
): Promise<HomeSection[] | null> => {
  const response = await getHomeSections(forceRefresh);

  if ('cached' in response && response.cached) {
    return null; // 캐시 유효, 로컬 데이터 사용
  }

  return (response as HomeSectionsResponse).data.sections;
};

/**
 * 홈 ETag 캐시 초기화
 */
export const clearHomeCache = async (): Promise<void> => {
  await AsyncStorage.removeItem(ETAG_STORAGE_KEY);
};

export default {
  getHomeSections,
  getHomeSectionsList,
  clearHomeCache,
};
