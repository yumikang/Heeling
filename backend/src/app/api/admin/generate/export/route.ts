import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth-edge';
import { readdir, stat } from 'fs/promises';
import path from 'path';

interface ExportedTrack {
  id: string;
  filename: string;
  path: string;
  title: string;
  style?: string;
  mood?: string;
  duration?: number;
  size: number;
  createdAt: string;
}

interface ExportData {
  exportedAt: string;
  totalTracks: number;
  totalSize: number;
  tracks: ExportedTrack[];
  playlists: any[];
}

// GET: Export all generated tracks as JSON
export async function GET(request: NextRequest) {
  const authResult = await verifyAuth(request);
  if (!authResult.success) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get locally saved tracks from the generated folder
    const generatedDir = path.join(process.cwd(), 'public', 'media', 'generated');
    let files: string[] = [];

    try {
      files = await readdir(generatedDir);
    } catch {
      // Directory doesn't exist yet
      files = [];
    }

    // Process each file
    const tracks: ExportedTrack[] = [];
    let totalSize = 0;

    for (const file of files) {
      if (!file.endsWith('.mp3')) continue;

      const filePath = path.join(generatedDir, file);
      const stats = await stat(filePath);

      // Parse filename to extract metadata
      // Format: title_style_mood_timestamp.mp3
      const parts = file.replace('.mp3', '').split('_');
      const timestamp = parts.pop() || '';
      const mood = parts.pop() || '';
      const style = parts.pop() || '';
      const title = parts.join('_') || file;

      const track: ExportedTrack = {
        id: `track_${timestamp}`,
        filename: file,
        path: `/media/generated/${file}`,
        title,
        style,
        mood,
        size: stats.size,
        createdAt: stats.birthtime.toISOString(),
      };

      tracks.push(track);
      totalSize += stats.size;
    }

    // Sort by creation date (newest first)
    tracks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Get playlists from database
    const playlistSetting = await prisma.systemSetting.findUnique({
      where: { key: 'generated_playlists' },
    });
    const playlists = (playlistSetting?.value as unknown as any[]) || [];

    // Build export data
    const exportData: ExportData = {
      exportedAt: new Date().toISOString(),
      totalTracks: tracks.length,
      totalSize,
      tracks,
      playlists,
    };

    return NextResponse.json({
      success: true,
      data: exportData,
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to export tracks' },
      { status: 500 }
    );
  }
}

// POST: Import tracks from JSON (for restoring from backup)
export async function POST(request: NextRequest) {
  const authResult = await verifyAuth(request);
  if (!authResult.success) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { playlists } = body;

    // Only import playlists (track files would need to be manually restored)
    if (playlists && Array.isArray(playlists)) {
      await prisma.systemSetting.upsert({
        where: { key: 'generated_playlists' },
        update: { value: playlists as any },
        create: { key: 'generated_playlists', value: playlists as any },
      });

      return NextResponse.json({
        success: true,
        message: `Imported ${playlists.length} playlists`,
      });
    }

    return NextResponse.json({
      success: false,
      error: 'No valid playlists to import',
    }, { status: 400 });
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to import data' },
      { status: 500 }
    );
  }
}
