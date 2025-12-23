import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/tracks - 트랙 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // 쿼리 파라미터
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '100')
    const theme = searchParams.get('theme')
    const category = searchParams.get('category')
    const mood = searchParams.get('mood')
    const search = searchParams.get('q')

    // 필터 조건
    const where: any = {
      isActive: true,
    }

    // category 또는 theme 파라미터 지원
    if (category || theme) {
      where.category = category || theme
    }

    if (mood) {
      where.mood = mood
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { tags: { has: search } },
      ]
    }

    // 트랙 조회 (정렬: sortOrder -> 재생횟수 -> 최신순)
    const [tracks, total, totalSizeAgg] = await Promise.all([
      prisma.track.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [
          { sortOrder: 'asc' },
          { playCount: 'desc' },
          { createdAt: 'desc' },
        ],
        select: {
          id: true,
          title: true,
          artist: true,
          composer: true,
          createdWith: true,
          fileUrl: true,
          thumbnailUrl: true,
          duration: true,
          category: true,
          bpm: true,
          tags: true,
          mood: true,
          playCount: true,
          likeCount: true,
          fileSize: true,
          sortOrder: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.track.count({ where }),
      prisma.track.aggregate({
        _sum: { fileSize: true },
        where: { isActive: true }
      }),
    ])

    // localhost URL을 상대 경로로 변환 (모바일 앱에서 처리)
    const transformedTracks = tracks.map(track => ({
      ...track,
      fileUrl: track.fileUrl?.replace(/^http:\/\/(localhost|127\.0\.0\.1):\d+/, '') || track.fileUrl,
      thumbnailUrl: track.thumbnailUrl?.replace(/^http:\/\/(localhost|127\.0\.0\.1):\d+/, '') || track.thumbnailUrl,
    }))

    return NextResponse.json({
      success: true,
      data: transformedTracks,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
      },
      stats: {
        totalFiles: total,
        totalSize: totalSizeAgg._sum.fileSize || 0,
        totalDownloads: 0, // TODO: Implement download tracking
      }
    })
  } catch (error) {
    console.error('GET /api/tracks error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tracks' },
      { status: 500 }
    )
  }
}

// POST /api/tracks - 트랙 생성 (관리자용)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const track = await prisma.track.create({
      data: {
        title: body.title,
        composer: body.composer || 'Heeling Studio',
        createdWith: body.createdWith || 'Suno AI',
        fileUrl: body.fileUrl,
        thumbnailUrl: body.thumbnailUrl,
        duration: body.duration,
        fileSize: body.fileSize,
        bpm: body.bpm,
        tags: body.tags || [],
        mood: body.mood,
        occupationTags: body.occupationTags || [],
        businessTags: body.businessTags || [],
        timeSlotTags: body.timeSlotTags || [],
      },
    })

    return NextResponse.json({
      success: true,
      data: track,
    }, { status: 201 })
  } catch (error) {
    console.error('POST /api/tracks error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create track' },
      { status: 500 }
    )
  }
}

// PUT /api/tracks - 트랙 수정 (관리자용)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...data } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Track ID is required' },
        { status: 400 }
      )
    }

    const track = await prisma.track.update({
      where: { id },
      data: {
        title: data.title,
        composer: data.composer,
        thumbnailUrl: data.thumbnailUrl,
        tags: data.tags,
        mood: data.mood,
        occupationTags: data.occupationTags,
        businessTags: data.businessTags,
        timeSlotTags: data.timeSlotTags,
      },
    })

    return NextResponse.json({
      success: true,
      data: track,
    })
  } catch (error) {
    console.error('PUT /api/tracks error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update track' },
      { status: 500 }
    )
  }
}

// DELETE /api/tracks - 트랙 삭제 (관리자용)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Track ID is required' },
        { status: 400 }
      )
    }

    await prisma.track.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error('DELETE /api/tracks error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete track' },
      { status: 500 }
    )
  }
}
