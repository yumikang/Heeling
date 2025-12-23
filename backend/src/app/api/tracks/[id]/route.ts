import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type Params = Promise<{ id: string }>

// GET /api/tracks/:id - 단일 트랙 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { id } = await params

    const track = await prisma.track.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            favorites: true,
            playHistories: true,
          },
        },
      },
    })

    if (!track) {
      return NextResponse.json(
        { success: false, error: 'Track not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: track,
    })
  } catch (error) {
    console.error('GET /api/tracks/:id error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch track' },
      { status: 500 }
    )
  }
}

// PATCH /api/tracks/:id - 트랙 수정
export async function PATCH(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const track = await prisma.track.update({
      where: { id },
      data: body,
    })

    return NextResponse.json({
      success: true,
      data: track,
    })
  } catch (error) {
    console.error('PATCH /api/tracks/:id error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update track' },
      { status: 500 }
    )
  }
}

// DELETE /api/tracks/:id - 트랙 삭제 (소프트 삭제)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { id } = await params

    await prisma.track.update({
      where: { id },
      data: { isActive: false },
    })

    return NextResponse.json({
      success: true,
      message: 'Track deleted successfully',
    })
  } catch (error) {
    console.error('DELETE /api/tracks/:id error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete track' },
      { status: 500 }
    )
  }
}
