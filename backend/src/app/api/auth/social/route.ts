import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { AuthProvider } from '@prisma/client';

// ============================================
// Types
// ============================================

interface SocialLoginRequest {
  provider: 'apple' | 'google';
  providerId: string;
  email?: string;
  name?: string;
  identityToken?: string; // Apple
  idToken?: string; // Google
}

interface UserPayload {
  id: string;
  email: string | null;
  provider: AuthProvider;
}

// ============================================
// Constants
// ============================================

const JWT_SECRET = process.env.JWT_SECRET || 'heeling-user-jwt-secret-change-in-production';
const USER_TOKEN_EXPIRY = '30d'; // 모바일 앱용 장기 토큰

// ============================================
// Helper Functions
// ============================================

function generateUserToken(payload: UserPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: USER_TOKEN_EXPIRY });
}

function verifyUserToken(token: string): UserPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as UserPayload;
  } catch {
    return null;
  }
}

// ============================================
// POST /api/auth/social - 소셜 로그인
// ============================================
export async function POST(request: NextRequest) {
  try {
    const body: SocialLoginRequest = await request.json();
    const { provider, providerId, email, name } = body;

    // 입력 검증
    if (!provider || !providerId) {
      return NextResponse.json(
        { success: false, error: 'provider와 providerId가 필요합니다.' },
        { status: 400 }
      );
    }

    // provider 검증
    const authProvider = provider.toUpperCase() as AuthProvider;
    if (!['APPLE', 'GOOGLE'].includes(authProvider)) {
      return NextResponse.json(
        { success: false, error: '지원하지 않는 provider입니다.' },
        { status: 400 }
      );
    }

    // 기존 사용자 조회 (provider + providerId로)
    let user = await prisma.user.findFirst({
      where: {
        provider: authProvider,
        providerId: providerId,
      },
    });

    const isNewUser = !user;

    if (!user) {
      // 이메일로 기존 사용자 확인 (다른 provider로 가입했을 수 있음)
      if (email) {
        const existingUserByEmail = await prisma.user.findUnique({
          where: { email },
        });

        if (existingUserByEmail) {
          // 기존 계정에 소셜 provider 연결
          user = await prisma.user.update({
            where: { id: existingUserByEmail.id },
            data: {
              provider: authProvider,
              providerId: providerId,
              name: name || existingUserByEmail.name,
              updatedAt: new Date(),
            },
          });
        }
      }

      // 새 사용자 생성
      if (!user) {
        user = await prisma.user.create({
          data: {
            email: email || null,
            name: name || null,
            provider: authProvider,
            providerId: providerId,
            userType: 'PERSONAL',
            subscriptionTier: 'FREE',
          },
        });
      }
    } else {
      // 기존 사용자 - 마지막 로그인 업데이트
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          updatedAt: new Date(),
          // 이름이 없고 새로 제공되면 업데이트
          ...(name && !user.name ? { name } : {}),
        },
      });
    }

    // JWT 토큰 생성
    const token = generateUserToken({
      id: user.id,
      email: user.email,
      provider: user.provider,
    });

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          provider: user.provider,
          userType: user.userType,
          subscriptionTier: user.subscriptionTier,
          subscriptionEndDate: user.subscriptionEndDate,
          onboardingCompleted: user.onboardingCompleted,
          createdAt: user.createdAt,
        },
        token,
        isNewUser,
      },
    });
  } catch (error) {
    console.error('POST /api/auth/social error:', error);
    return NextResponse.json(
      {
        success: false,
        error: '소셜 로그인 처리 중 오류가 발생했습니다.',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}

// ============================================
// GET /api/auth/social - 토큰 검증 및 사용자 정보 조회
// ============================================
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: '인증 토큰이 필요합니다.' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyUserToken(token);

    if (!payload) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 토큰입니다.' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: {
        id: true,
        email: true,
        name: true,
        provider: true,
        userType: true,
        subscriptionTier: true,
        subscriptionEndDate: true,
        onboardingCompleted: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    console.error('GET /api/auth/social error:', error);
    return NextResponse.json(
      { success: false, error: '사용자 정보 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
