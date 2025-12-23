import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth-edge';

interface PlaylistTrack {
  id: string;
  title: string;        // Primary title (Korean)
  titleEn?: string;     // English title for localization
  audioUrl: string;
  duration: number;
  style?: string;
  mood?: string;
  localPath?: string;
}

interface Playlist {
  id: string;
  name: string;         // Primary name (Korean)
  nameEn?: string;      // English name for localization
  tracks: PlaylistTrack[];
  createdAt: string;
  updatedAt: string;
}

// GET: Get all playlists
export async function GET(request: NextRequest) {
  const authResult = await verifyAuth(request);
  if (!authResult.success) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'generated_playlists' },
    });

    const playlists: Playlist[] = (setting?.value as unknown as Playlist[]) || [];

    return NextResponse.json({
      success: true,
      data: playlists,
    });
  } catch (error) {
    console.error('Load playlists error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load playlists' },
      { status: 500 }
    );
  }
}

// POST: Create new playlist
export async function POST(request: NextRequest) {
  const authResult = await verifyAuth(request);
  if (!authResult.success) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, tracks } = body;

    if (!name || !tracks || tracks.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Name and tracks are required' },
        { status: 400 }
      );
    }

    // Get existing playlists
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'generated_playlists' },
    });

    const playlists: Playlist[] = (setting?.value as unknown as Playlist[]) || [];

    // Create new playlist
    const newPlaylist: Playlist = {
      id: `playlist_${Date.now()}`,
      name,
      tracks,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    playlists.push(newPlaylist);

    // Save playlists
    await prisma.systemSetting.upsert({
      where: { key: 'generated_playlists' },
      update: { value: playlists as any },
      create: { key: 'generated_playlists', value: playlists as any },
    });

    return NextResponse.json({
      success: true,
      data: newPlaylist,
    });
  } catch (error) {
    console.error('Create playlist error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to create playlist' },
      { status: 500 }
    );
  }
}

// PUT: Update playlist (add/remove tracks)
export async function PUT(request: NextRequest) {
  const authResult = await verifyAuth(request);
  if (!authResult.success) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, name, tracks, action, track } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Playlist ID is required' },
        { status: 400 }
      );
    }

    // Get existing playlists
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'generated_playlists' },
    });

    const playlists: Playlist[] = (setting?.value as unknown as Playlist[]) || [];
    const playlistIndex = playlists.findIndex(p => p.id === id);

    if (playlistIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Playlist not found' },
        { status: 404 }
      );
    }

    // Handle different actions
    if (action === 'add' && track) {
      playlists[playlistIndex].tracks.push(track);
    } else if (action === 'remove' && track) {
      playlists[playlistIndex].tracks = playlists[playlistIndex].tracks.filter(
        t => t.id !== track.id
      );
    } else {
      // Full update
      playlists[playlistIndex] = {
        ...playlists[playlistIndex],
        ...(name && { name }),
        ...(tracks && { tracks }),
        updatedAt: new Date().toISOString(),
      };
    }

    // Save playlists
    await prisma.systemSetting.upsert({
      where: { key: 'generated_playlists' },
      update: { value: playlists as any },
      create: { key: 'generated_playlists', value: playlists as any },
    });

    return NextResponse.json({
      success: true,
      data: playlists[playlistIndex],
    });
  } catch (error) {
    console.error('Update playlist error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to update playlist' },
      { status: 500 }
    );
  }
}

// DELETE: Delete playlist
export async function DELETE(request: NextRequest) {
  const authResult = await verifyAuth(request);
  if (!authResult.success) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Playlist ID is required' },
        { status: 400 }
      );
    }

    // Get existing playlists
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'generated_playlists' },
    });

    const playlists: Playlist[] = (setting?.value as unknown as Playlist[]) || [];
    const filteredPlaylists = playlists.filter(p => p.id !== id);

    if (filteredPlaylists.length === playlists.length) {
      return NextResponse.json(
        { success: false, error: 'Playlist not found' },
        { status: 404 }
      );
    }

    // Save playlists
    await prisma.systemSetting.upsert({
      where: { key: 'generated_playlists' },
      update: { value: filteredPlaylists as any },
      create: { key: 'generated_playlists', value: filteredPlaylists as any },
    });

    return NextResponse.json({
      success: true,
      message: 'Playlist deleted successfully',
    });
  } catch (error) {
    console.error('Delete playlist error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to delete playlist' },
      { status: 500 }
    );
  }
}
