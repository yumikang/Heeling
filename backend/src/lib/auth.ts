import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { prisma } from './prisma';

// ============================================
// Constants
// ============================================

const JWT_SECRET = process.env.JWT_SECRET || 'heeling-admin-jwt-secret-change-in-production';
const TOKEN_EXPIRY = '24h';
const COOKIE_NAME = 'admin_token';

// ============================================
// Types
// ============================================

export interface AdminPayload {
  id: string;
  email: string;
  role: string;
}

export interface SessionData {
  admin: AdminPayload | null;
  isAuthenticated: boolean;
}

// ============================================
// Password Utilities
// ============================================

/**
 * 비밀번호를 해시합니다
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

/**
 * 비밀번호를 검증합니다
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ============================================
// JWT Utilities
// ============================================

/**
 * JWT 토큰을 생성합니다
 */
export function generateToken(payload: AdminPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

/**
 * JWT 토큰을 검증하고 페이로드를 반환합니다
 */
export function verifyToken(token: string): AdminPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AdminPayload;
    return decoded;
  } catch (error) {
    console.error('[verifyToken] Error:', error);
    return null;
  }
}

// ============================================
// Cookie Utilities
// ============================================

/**
 * 인증 쿠키를 설정합니다
 */
export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  });
}

/**
 * 인증 쿠키를 삭제합니다
 */
export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

/**
 * 인증 쿠키에서 토큰을 가져옵니다
 */
export async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(COOKIE_NAME);
  return cookie?.value || null;
}

// ============================================
// Session Utilities
// ============================================

/**
 * 현재 세션 정보를 가져옵니다
 */
export async function getSession(): Promise<SessionData> {
  const token = await getAuthToken();

  if (!token) {
    return { admin: null, isAuthenticated: false };
  }

  const payload = verifyToken(token);

  if (!payload) {
    return { admin: null, isAuthenticated: false };
  }

  // DB에서 어드민 존재 및 활성 상태 확인
  const admin = await prisma.admin.findUnique({
    where: { id: payload.id },
    select: { id: true, email: true, role: true, isActive: true },
  });

  if (!admin || !admin.isActive) {
    return { admin: null, isAuthenticated: false };
  }

  return {
    admin: {
      id: admin.id,
      email: admin.email,
      role: admin.role,
    },
    isAuthenticated: true,
  };
}

/**
 * Request 헤더에서 토큰을 추출합니다 (Middleware용)
 */
export function getTokenFromRequest(request: Request): string | null {
  // Cookie 헤더에서 직접 파싱
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>);

  return cookies[COOKIE_NAME] || null;
}

// ============================================
// Admin Management
// ============================================

/**
 * 초기 어드민 계정을 생성합니다 (seed용)
 */
export async function createInitialAdmin(
  email: string,
  password: string,
  name?: string
): Promise<void> {
  const existingAdmin = await prisma.admin.findUnique({
    where: { email },
  });

  if (existingAdmin) {
    console.log(`Admin with email ${email} already exists`);
    return;
  }

  const passwordHash = await hashPassword(password);

  await prisma.admin.create({
    data: {
      email,
      passwordHash,
      name,
      role: 'SUPER_ADMIN',
    },
  });

  console.log(`Admin account created: ${email}`);
}
