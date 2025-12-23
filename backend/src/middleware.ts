import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest, verifyTokenEdge } from '@/lib/auth-edge';

// 인증이 필요 없는 경로들
const PUBLIC_PATHS = [
  '/admin/login',
  '/api/auth/login',
  '/api/auth/logout',
];

// 인증이 필요한 경로 패턴
const PROTECTED_PATHS = [
  '/admin',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public 경로는 통과
  if (PUBLIC_PATHS.some(path => pathname === path || pathname.startsWith(path + '/'))) {
    return NextResponse.next();
  }

  // Protected 경로 체크
  const isProtectedPath = PROTECTED_PATHS.some(path =>
    pathname === path || pathname.startsWith(path + '/')
  );

  if (!isProtectedPath) {
    return NextResponse.next();
  }

  // 토큰 검증
  const token = getTokenFromRequest(request);

  if (!token) {
    console.log('[Middleware] No token found, redirecting to login');
    const loginUrl = new URL('/admin/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const payload = await verifyTokenEdge(token);

  if (!payload) {
    console.log('[Middleware] Invalid token, redirecting to login');
    const loginUrl = new URL('/admin/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete('admin_token');
    return response;
  }

  console.log('[Middleware] Auth success for:', payload.email);

  // 인증 성공 - 요청 헤더에 admin 정보 추가
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-admin-id', payload.id);
  requestHeaders.set('x-admin-email', payload.email);
  requestHeaders.set('x-admin-role', payload.role);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
  ],
};
