/**
 * API Client
 * Base HTTP client for VPS backend API communication
 */

import { ApiResponse, ApiErrorResponse } from '@/types/api';
import { API_BASE_URL as BASE_URL } from '@/constants';

// ============================================================================
// Configuration
// ============================================================================

/** API Base URL - constants에서 가져옴 */
const API_BASE_URL = `${BASE_URL}/api`;

/** 기본 타임아웃 (밀리초) - 서버 없을 때 빨리 로컬 DB로 폴백하기 위해 짧게 설정 */
const DEFAULT_TIMEOUT = 5000;

/** 재시도 설정 - 서버 없을 때 빨리 폴백하기 위해 최소화 */
const MAX_RETRIES = 1;
const RETRY_DELAY = 500;

// ============================================================================
// Types
// ============================================================================

interface RequestConfig extends RequestInit {
  timeout?: number;
  skipAuth?: boolean;
  etag?: string;
}

interface RetryConfig {
  maxRetries: number;
  currentRetry: number;
  shouldRetry: (error: Error, response?: Response) => boolean;
}

// ============================================================================
// Error Classes
// ============================================================================

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class TimeoutError extends Error {
  constructor(message: string = 'Request timeout') {
    super(message);
    this.name = 'TimeoutError';
  }
}

// ============================================================================
// Auth Token Management
// ============================================================================

let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

export const getAuthToken = (): string | null => {
  return authToken;
};

export const clearAuthToken = () => {
  authToken = null;
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * 타임아웃을 지원하는 fetch 래퍼
 */
const fetchWithTimeout = async (
  url: string,
  config: RequestConfig
): Promise<Response> => {
  const { timeout = DEFAULT_TIMEOUT, ...fetchConfig } = config;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...fetchConfig,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new TimeoutError();
    }
    throw error;
  }
};

/**
 * 에러 재시도 판단
 */
const shouldRetryRequest = (error: Error, response?: Response): boolean => {
  // 타임아웃은 재시도
  if (error instanceof TimeoutError) {
    return true;
  }

  // 네트워크 에러는 재시도
  if (error instanceof NetworkError) {
    return true;
  }

  // 5xx 서버 에러는 재시도
  if (response && response.status >= 500) {
    return true;
  }

  // 429 Too Many Requests는 재시도
  if (response && response.status === 429) {
    return true;
  }

  return false;
};

/**
 * 지연 함수 (재시도용)
 */
const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * URL에 쿼리 파라미터 추가
 */
const buildUrl = (endpoint: string, params?: Record<string, any>): string => {
  const url = new URL(endpoint, API_BASE_URL);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });
  }

  return url.toString();
};

// ============================================================================
// Core Request Function
// ============================================================================

/**
 * HTTP 요청 실행 (재시도 로직 포함)
 */
const request = async <T = any>(
  endpoint: string,
  config: RequestConfig = {}
): Promise<T> => {
  const { skipAuth = false, etag, ...fetchConfig } = config;

  // 헤더 설정
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((fetchConfig.headers as Record<string, string>) || {}),
  };

  // 인증 토큰 추가
  if (!skipAuth && authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  // ETag 캐싱 지원
  if (etag) {
    headers['If-None-Match'] = etag;
  }

  const url = buildUrl(endpoint, undefined);

  // 재시도 로직
  let lastError: Error | null = null;
  let lastResponse: Response | undefined;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await fetchWithTimeout(url, {
        ...fetchConfig,
        headers,
      });

      lastResponse = response;

      // 304 Not Modified - 캐시 유효
      if (response.status === 304) {
        return { cached: true } as T;
      }

      // 성공 응답 (200-299)
      if (response.ok) {
        const data = await response.json();
        return data as T;
      }

      // 4xx 클라이언트 에러 - 재시도 안함
      if (response.status >= 400 && response.status < 500) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          errorData.error || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorData
        );
      }

      // 5xx 서버 에러 - 재시도 가능
      const errorData = await response.json().catch(() => ({}));
      lastError = new ApiError(
        errorData.error || `Server error: ${response.status}`,
        response.status,
        errorData
      );

      // 재시도 여부 판단
      if (attempt < MAX_RETRIES - 1 && shouldRetryRequest(lastError, response)) {
        await delay(RETRY_DELAY * (attempt + 1)); // 지수 백오프
        continue;
      }

      throw lastError;
    } catch (error) {
      lastError = error as Error;

      // 네트워크 에러 처리
      if (error instanceof TypeError && error.message.includes('fetch')) {
        lastError = new NetworkError('Network request failed. Please check your connection.');
      }

      // 마지막 시도가 아니고 재시도 가능하면 계속
      if (attempt < MAX_RETRIES - 1 && shouldRetryRequest(lastError, lastResponse)) {
        await delay(RETRY_DELAY * (attempt + 1));
        continue;
      }

      throw lastError;
    }
  }

  throw lastError || new Error('Request failed after all retries');
};

// ============================================================================
// Public API Methods
// ============================================================================

/**
 * GET 요청
 */
export const get = <T = any>(
  endpoint: string,
  params?: Record<string, any>,
  config?: RequestConfig
): Promise<T> => {
  const url = params ? buildUrl(endpoint, params) : endpoint;
  return request<T>(url, { ...config, method: 'GET' });
};

/**
 * POST 요청
 */
export const post = <T = any>(
  endpoint: string,
  data?: any,
  config?: RequestConfig
): Promise<T> => {
  return request<T>(endpoint, {
    ...config,
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
};

/**
 * PUT 요청
 */
export const put = <T = any>(
  endpoint: string,
  data?: any,
  config?: RequestConfig
): Promise<T> => {
  return request<T>(endpoint, {
    ...config,
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  });
};

/**
 * PATCH 요청
 */
export const patch = <T = any>(
  endpoint: string,
  data?: any,
  config?: RequestConfig
): Promise<T> => {
  return request<T>(endpoint, {
    ...config,
    method: 'PATCH',
    body: data ? JSON.stringify(data) : undefined,
  });
};

/**
 * DELETE 요청
 */
export const del = <T = any>(
  endpoint: string,
  config?: RequestConfig
): Promise<T> => {
  return request<T>(endpoint, { ...config, method: 'DELETE' });
};

// ============================================================================
// Convenience Methods
// ============================================================================

/**
 * API 응답 타입 가드
 */
export const isApiError = (response: ApiResponse): response is ApiErrorResponse => {
  return response.success === false;
};

/**
 * API 성공 응답 타입 가드
 */
export const isApiSuccess = <T>(response: ApiResponse<T>): response is { success: true; data: T } => {
  return response.success === true;
};

// ============================================================================
// Export
// ============================================================================

export default {
  get,
  post,
  put,
  patch,
  delete: del,
  setAuthToken,
  getAuthToken,
  clearAuthToken,
  isApiError,
  isApiSuccess,
};
