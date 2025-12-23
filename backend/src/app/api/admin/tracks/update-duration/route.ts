import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth-edge';
import * as mm from 'music-metadata';
import * as fs from 'fs';
import * as path from 'path';

// POST: Update duration for all tracks from actual audio files
export async function POST(request: NextRequest) {
  const authResult = await verifyAuth(request);
  if (!authResult.success) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get all tracks
    const tracks = await prisma.track.findMany({
      select: {
        id: true,
        title: true,
        fileUrl: true,
        duration: true,
      },
    });

    const results: { id: string; title: string; oldDuration: number; newDuration: number; error?: string }[] = [];
    const publicDir = path.join(process.cwd(), 'public');

    for (const track of tracks) {
      try {
        // Skip if already has valid duration (> 60 seconds)
        if (track.duration > 60) {
          results.push({
            id: track.id,
            title: track.title,
            oldDuration: track.duration,
            newDuration: track.duration,
          });
          continue;
        }

        // Get file path
        let filePath = track.fileUrl;
        if (filePath.startsWith('/')) {
          filePath = path.join(publicDir, filePath);
        }

        // Check if file exists
        if (!fs.existsSync(filePath)) {
          results.push({
            id: track.id,
            title: track.title,
            oldDuration: track.duration,
            newDuration: track.duration,
            error: 'File not found',
          });
          continue;
        }

        // Read metadata
        const metadata = await mm.parseFile(filePath);
        const newDuration = Math.round(metadata.format.duration || 0);

        if (newDuration > 0 && newDuration !== track.duration) {
          // Update in database
          await prisma.track.update({
            where: { id: track.id },
            data: { duration: newDuration },
          });

          results.push({
            id: track.id,
            title: track.title,
            oldDuration: track.duration,
            newDuration,
          });
        } else {
          results.push({
            id: track.id,
            title: track.title,
            oldDuration: track.duration,
            newDuration: track.duration,
            error: newDuration === 0 ? 'Could not read duration' : 'No change needed',
          });
        }
      } catch (trackError) {
        console.error(`Error processing track ${track.id}:`, trackError);
        results.push({
          id: track.id,
          title: track.title,
          oldDuration: track.duration,
          newDuration: track.duration,
          error: trackError instanceof Error ? trackError.message : 'Unknown error',
        });
      }
    }

    const updatedCount = results.filter(r => r.oldDuration !== r.newDuration && !r.error).length;

    return NextResponse.json({
      success: true,
      data: {
        total: tracks.length,
        updated: updatedCount,
        results,
      },
      message: `${updatedCount}개 트랙의 duration이 업데이트되었습니다.`,
    });
  } catch (error) {
    console.error('Update duration error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to update durations' },
      { status: 500 }
    );
  }
}
