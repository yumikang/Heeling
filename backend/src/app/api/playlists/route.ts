import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/playlists - 플레이리스트 목록
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const theme = searchParams.get('theme')
    const type = searchParams.get('type')
    const featured = searchParams.get('featured')

    const where: any = {
      isPublic: true,
    }

    if (theme) {
      where.theme = theme
    }

    if (type) {
      where.type = type
    }

    if (featured === 'true') {
      where.isFeatured = true
    }

    const playlists = await prisma.playlist.findMany({
      where,
      orderBy: [
        { isFeatured: 'desc' },
        { playCount: 'desc' },
      ],
      select: {
        id: true,
        name: true,
        description: true,
        coverImage: true,
        theme: true,
        type: true,
        playCount: true,
        _count: {
          select: { tracks: true },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: playlists,
    })
  } catch (error) {
    console.error('GET /api/playlists error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch playlists' },
      { status: 500 }
    )
  }
}

// POST /api/playlists - 플레이리스트 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const playlist = await prisma.playlist.create({
      data: {
        name: body.name,
        description: body.description,
        coverImage: body.coverImage,
        type: body.type || 'MANUAL',
        theme: body.theme,
        timeSlot: body.timeSlot,
        targetUserType: body.targetUserType,
        targetOccupation: body.targetOccupation,
        targetBusiness: body.targetBusiness,
        isFeatured: body.isFeatured || false,
      },
    })

    return NextResponse.json({
      success: true,
      data: playlist,
    }, { status: 201 })
  } catch (error) {
    console.error('POST /api/playlists error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create playlist' },
      { status: 500 }
    )
  }
}
