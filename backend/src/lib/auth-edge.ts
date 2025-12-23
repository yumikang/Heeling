/**
 * Edge Runtime 호환 인증 유틸리티
 * 미들웨어에서 사용 (jsonwebtoken은 Edge에서 작동하지 않음)
 */
import * as jose from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'heeling-admin-jwt-secret-change-in-production';
const COOKIE_NAME = 'admin_token';

export interface AdminPayload {
  id: string;
  email: string;
  role: string;
}

/**
 * JWT 토큰을 검증합니다 (Edge Runtime 호환)
 */
export async function verifyTokenEdge(token: string): Promise<AdminPayload | null> {
  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jose.jwtVerify(token, secret);
    return {
      id: payload.id as string,
      email: payload.email as string,
      role: payload.role as string,
    };
  } catch (error) {
    console.error('[verifyTokenEdge] Error:', error);
    return null;
  }
}

/**
 * Request 헤더에서 토큰을 추출합니다
 */
export function getTokenFromRequest(request: Request): string | null {
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>);

  return cookies[COOKIE_NAME] || null;
}

/**
 * Request에서 인증을 검증합니다 (API Route용)
 */
export async function verifyAuth(request: Request): Promise<{ success: boolean; admin?: AdminPayload; error?: string }> {
  const token = getTokenFromRequest(request);

  if (!token) {
    return { success: false, error: 'No token provided' };
  }

  const admin = await verifyTokenEdge(token);

  if (!admin) {
    return { success: false, error: 'Invalid token' };
  }

  return { success: true, admin };
}
