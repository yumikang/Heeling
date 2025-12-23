import { createHash } from 'crypto';

/**
 * 데이터에서 ETag 해시 생성
 * @param data - ETag 생성할 데이터 (문자열 또는 객체)
 * @returns ETag 문자열 (weak ETag 형식: W/"hash")
 */
export function generateETag(data: string | object): string {
  const content = typeof data === 'string' ? data : JSON.stringify(data);
  const hash = createHash('md5').update(content).digest('hex');
  return `W/"${hash}"`;
}

/**
 * 최신 업데이트 시간 기반 ETag 생성
 * @param dates - Date 객체 배열
 * @returns ETag 문자열
 */
export function generateETagFromDates(dates: Date[]): string {
  if (dates.length === 0) {
    return `W/"empty"`;
  }
  const maxTimestamp = Math.max(...dates.map(d => d.getTime()));
  return `W/"${maxTimestamp.toString(36)}"`;
}

/**
 * If-None-Match 헤더와 ETag 비교
 * @param ifNoneMatch - 요청의 If-None-Match 헤더 값
 * @param currentETag - 현재 리소스의 ETag
 * @returns true이면 304 응답, false이면 전체 응답
 */
export function shouldReturn304(ifNoneMatch: string | null, currentETag: string): boolean {
  if (!ifNoneMatch) return false;

  // 여러 ETag가 쉼표로 구분될 수 있음
  const clientETags = ifNoneMatch.split(',').map(tag => tag.trim());

  // * 는 모든 ETag와 일치
  if (clientETags.includes('*')) return true;

  return clientETags.includes(currentETag);
}

/**
 * 캐시 제어 헤더 생성
 * @param maxAge - max-age 초 단위 (기본: 300초 = 5분)
 * @param staleWhileRevalidate - stale-while-revalidate 초 단위 (기본: 60초)
 * @returns Cache-Control 헤더 값
 */
export function getCacheControlHeader(
  maxAge: number = 300,
  staleWhileRevalidate: number = 60
): string {
  return `public, max-age=${maxAge}, stale-while-revalidate=${staleWhileRevalidate}`;
}

/**
 * ETag 응답 헤더 객체 생성
 * @param etag - ETag 값
 * @param maxAge - Cache-Control max-age
 * @returns 헤더 객체
 */
export function getETagHeaders(etag: string, maxAge: number = 300): HeadersInit {
  return {
    'ETag': etag,
    'Cache-Control': getCacheControlHeader(maxAge),
    'Vary': 'Accept-Encoding',
  };
}
