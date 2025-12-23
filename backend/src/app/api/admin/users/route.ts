import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { UserType, SubscriptionTier } from '@prisma/client';

// ============================================
// GET /api/admin/users - 회원 목록 조회
// ============================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const userType = searchParams.get('userType');
    const subscriptionTier = searchParams.get('subscriptionTier');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = {};

    // 검색 (이메일, 이름)
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    // 유저 타입 필터
    if (userType && Object.values(UserType).includes(userType as UserType)) {
      where.userType = userType;
    }

    // 구독 상태 필터
    if (subscriptionTier && Object.values(SubscriptionTier).includes(subscriptionTier as SubscriptionTier)) {
      where.subscriptionTier = subscriptionTier;
    }

    // 정렬 옵션
    const orderBy: any = {};
    const validSortFields = ['createdAt', 'name', 'email', 'subscriptionTier'];
    if (validSortFields.includes(sortBy)) {
      orderBy[sortBy] = sortOrder === 'asc' ? 'asc' : 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          userType: true,
          occupation: true,
          businessType: true,
          subscriptionTier: true,
          subscriptionEndDate: true,
          onboardingCompleted: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              playHistories: true,
              favorites: true,
            },
          },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    // 통계 정보
    const [totalUsers, personalUsers, businessUsers, premiumUsers] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { userType: 'PERSONAL' } }),
      prisma.user.count({ where: { userType: 'BUSINESS' } }),
      prisma.user.count({ where: { subscriptionTier: { not: 'FREE' } } }),
    ]);

    return NextResponse.json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        totalUsers,
        personalUsers,
        businessUsers,
        premiumUsers,
      },
    });
  } catch (error) {
    console.error('GET /api/admin/users error:', error);
    return NextResponse.json(
      { success: false, error: '회원 목록 조회에 실패했습니다.' },
      { status: 500 }
    );
  }
}
