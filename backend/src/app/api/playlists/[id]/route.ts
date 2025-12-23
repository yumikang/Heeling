import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type Params = Promise<{ id: string }>

// GET /api/playlists/:id - 단일 플레이리스트 (트랙 포함)
export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { id } = await params

    const playlist = await prisma.playlist.findUnique({
      where: { id },
      include: {
        tracks: {
          orderBy: { position: 'asc' },
          include: {
            track: {
              select: {
                id: true,
                title: true,
                composer: true,
                thumbnailUrl: true,
                duration: true,
                bpm: true,
                tags: true,
                mood: true,
                fileUrl: true,
              },
            },
          },
        },
      },
    })

    if (!playlist) {
      return NextResponse.json(
        { success: false, error: 'Playlist not found' },
        { status: 404 }
      )
    }

    // 트랙 목록 평탄화
    const formattedPlaylist = {
      ...playlist,
      tracks: playlist.tracks.map((pt) => ({
        ...pt.track,
        position: pt.position,
      })),
    }

    return NextResponse.json({
      success: true,
      data: formattedPlaylist,
    })
  } catch (error) {
    console.error('GET /api/playlists/:id error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch playlist' },
      { status: 500 }
    )
  }
}

// POST /api/playlists/:id/tracks - 플레이리스트에 트랙 추가
export async function POST(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // 현재 최대 position 조회
    const lastTrack = await prisma.playlistTrack.findFirst({
      where: { playlistId: id },
      orderBy: { position: 'desc' },
    })

    const position = (lastTrack?.position ?? -1) + 1

    const playlistTrack = await prisma.playlistTrack.create({
      data: {
        playlistId: id,
        trackId: body.trackId,
        position,
      },
    })

    return NextResponse.json({
      success: true,
      data: playlistTrack,
    }, { status: 201 })
  } catch (error) {
    console.error('POST /api/playlists/:id/tracks error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to add track to playlist' },
      { status: 500 }
    )
  }
}
