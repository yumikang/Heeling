/**
 * Authentication API
 * 관리자 로그인 (모바일 앱에서는 사용하지 않을 수 있음, 백엔드 테스트용)
 */

import { post } from './client';
import { LoginRequest, LoginResponse, ApiErrorResponse } from '@/types/api';

/**
 * 관리자 로그인
 *
 * @param email - 이메일
 * @param password - 비밀번호
 * @returns 로그인 성공 시 관리자 정보, 실패 시 에러
 */
export const login = async (
  email: string,
  password: string
): Promise<LoginResponse | ApiErrorResponse> => {
  return post<LoginResponse>('/auth/login', { email, password });
};

/**
 * 로그아웃
 * (JWT 쿠키 제거, 클라이언트 토큰 클리어)
 */
export const logout = async (): Promise<void> => {
  // 서버 측 로그아웃 엔드포인트가 있다면 호출
  // await post('/auth/logout');

  // 클라이언트 토큰 제거는 authStore에서 처리
};

export default {
  login,
  logout,
};
