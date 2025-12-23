import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/recommend - 맞춤 추천
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const userType = searchParams.get('user_type') || 'personal'
    const occupation = searchParams.get('occupation')
    const businessType = searchParams.get('business_type')
    const timeSlot = searchParams.get('time_slot')
    const mood = searchParams.get('mood')
    const limit = parseInt(searchParams.get('limit') || '10')

    // 현재 시간대 자동 감지
    const hour = new Date().getHours()
    const autoTimeSlot =
      hour >= 6 && hour < 12 ? 'morning' :
      hour >= 12 && hour < 18 ? 'afternoon' :
      hour >= 18 && hour < 22 ? 'evening' : 'night'

    const currentTimeSlot = timeSlot || autoTimeSlot

    // 추천 쿼리 조건
    const where: any = {
      isActive: true,
    }

    // 시간대 태그 필터
    where.timeSlotTags = { has: currentTimeSlot }

    // 사용자 타입별 추가 필터
    if (userType === 'personal' && occupation) {
      where.occupationTags = { has: occupation }
    } else if (userType === 'business' && businessType) {
      where.businessTags = { has: businessType }
    }

    // 분위기 필터
    if (mood) {
      where.mood = mood
    }

    // 추천 트랙 조회 (인기순 + 랜덤)
    const tracks = await prisma.track.findMany({
      where,
      take: limit * 2, // 더 많이 가져와서 섞기
      orderBy: [
        { playCount: 'desc' },
        { createdAt: 'desc' },
      ],
      select: {
        id: true,
        title: true,
        composer: true,
        thumbnailUrl: true,
        duration: true,
        bpm: true,
        tags: true,
        mood: true,
        playCount: true,
        fileUrl: true,
      },
    })

    // 랜덤하게 섞어서 반환
    const shuffled = tracks.sort(() => Math.random() - 0.5).slice(0, limit)

    return NextResponse.json({
      success: true,
      data: shuffled,
      meta: {
        timeSlot: currentTimeSlot,
        userType,
        occupation,
        businessType,
        count: shuffled.length,
      },
    })
  } catch (error) {
    console.error('GET /api/recommend error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get recommendations' },
      { status: 500 }
    )
  }
}
