import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth-edge';
import { writeFile, mkdir, readFile } from 'fs/promises';
import path from 'path';
import { parseBuffer } from 'music-metadata';
import { addTrackToMatchingPlaylists } from '@/lib/playlist-mapper';

interface DeployTrack {
  id: string;
  title: string;
  titleEn?: string;
  audioUrl: string;
  imageUrl?: string;
  duration: number;
  style?: string;
  mood?: string;
}

// Get audio duration from file
async function getAudioDuration(filePath: string): Promise<number> {
  try {
    const absolutePath = path.join(process.cwd(), 'public', filePath);
    const buffer = await readFile(absolutePath);
    const metadata = await parseBuffer(buffer, { mimeType: 'audio/mpeg' });

    // 1. 메타데이터에서 직접 duration 가져오기
    if (metadata.format.duration) {
      return Math.round(metadata.format.duration);
    }

    // 2. CBR MP3의 경우 bitrate와 filesize로 계산
    if (metadata.format.bitrate && buffer.length > 0) {
      const durationSec = (buffer.length * 8) / metadata.format.bitrate;
      console.log(`[Deploy] Calculated duration: ${Math.round(durationSec)}s (${buffer.length} bytes / ${metadata.format.bitrate} bps)`);
      return Math.round(durationSec);
    }

    return 0;
  } catch (err) {
    console.warn('[Deploy] Failed to get audio duration:', err);
    return 0;
  }
}

// Extract audio filename from URL or path
function extractAudioFilename(audioUrl: string): string {
  // URL에서 파일명만 추출 (Suno URL의 경우 ID 추출)
  if (audioUrl.includes('suno.com') || audioUrl.includes('cdn')) {
    // Suno URL: https://cdn1.suno.ai/abc123.mp3 → abc123.mp3
    const match = audioUrl.match(/([a-f0-9-]+\.mp3)/i);
    if (match) return match[1];
  }
  // 로컬 경로: /media/tracks/123_abc.mp3 → 123_abc.mp3
  const parts = audioUrl.split('/');
  return parts[parts.length - 1];
}

// POST: Deploy generated tracks to app (create or update in Track table)
export async function POST(request: NextRequest) {
  const authResult = await verifyAuth(request);
  if (!authResult.success) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { tracks, category } = body as { tracks: DeployTrack[]; category?: string };

    if (!tracks || !Array.isArray(tracks) || tracks.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Tracks array is required' },
        { status: 400 }
      );
    }

    const results: { success: boolean; trackId?: string; generatedTrackId: string; title: string; action?: 'created' | 'updated' | 'skipped'; error?: string }[] = [];
    const audioDir = path.join(process.cwd(), 'public', 'media', 'tracks');
    const coverDir = path.join(process.cwd(), 'public', 'media', 'covers');

    // Create directories if they don't exist
    await mkdir(audioDir, { recursive: true });
    await mkdir(coverDir, { recursive: true });

    for (const track of tracks) {
      try {
        // 1. Download audio file
        let audioPath = track.audioUrl;
        let audioFilename = extractAudioFilename(track.audioUrl);

        if (track.audioUrl.startsWith('http')) {
          const audioResponse = await fetch(track.audioUrl);
          if (!audioResponse.ok) {
            throw new Error(`Failed to download audio: ${audioResponse.status}`);
          }
          const audioBuffer = Buffer.from(await audioResponse.arrayBuffer());
          audioFilename = `${Date.now()}_${track.id}.mp3`;
          const audioFilePath = path.join(audioDir, audioFilename);
          await writeFile(audioFilePath, audioBuffer);
          audioPath = `/media/tracks/${audioFilename}`;
        }

        // 2. Download cover image if exists
        let coverPath = track.imageUrl || undefined;
        if (track.imageUrl && track.imageUrl.startsWith('http')) {
          try {
            const imageResponse = await fetch(track.imageUrl);
            if (imageResponse.ok) {
              const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
              const imageFilename = `${Date.now()}_${track.id}.jpg`;
              const imageFilePath = path.join(coverDir, imageFilename);
              await writeFile(imageFilePath, imageBuffer);
              coverPath = `/media/covers/${imageFilename}`;
            }
          } catch (imgErr) {
            console.warn(`[Deploy] Failed to download cover image for ${track.title}:`, imgErr);
            // Continue without cover image
          }
        }

        // 3. Check for existing track with same audio file
        // audioFilename 또는 원본 Suno ID로 기존 트랙 검색
        const sunoId = extractAudioFilename(track.audioUrl).replace('.mp3', '');
        const existingTrack = await prisma.track.findFirst({
          where: {
            OR: [
              { fileUrl: { contains: sunoId } },
              { fileUrl: audioPath },
            ],
          },
        });

        if (existingTrack) {
          // 4a. Update existing track (same audio file, but maybe different title/image/tags)
          const updatedTrack = await prisma.track.update({
            where: { id: existingTrack.id },
            data: {
              title: track.title,
              thumbnailUrl: coverPath || existingTrack.thumbnailUrl,
              category: category || track.style || existingTrack.category,
              mood: track.mood || existingTrack.mood,
              tags: [track.style, track.mood, 'ai-generated'].filter(Boolean) as string[],
              updatedAt: new Date(),
            },
          });

          results.push({
            success: true,
            trackId: updatedTrack.id,
            generatedTrackId: track.id,
            title: track.title,
            action: 'updated',
          });

          console.log(`[Deploy] Updated track: ${updatedTrack.id} - ${track.title}`);
        } else {
          // 4b. Create new track
          // duration: API 값이 없거나 0이면 파일에서 직접 추출
          let duration = track.duration ? Math.round(track.duration) : 0;
          if (!duration && audioPath.startsWith('/media/')) {
            duration = await getAudioDuration(audioPath);
            console.log(`[Deploy] Extracted duration from file: ${duration}s`);
          }

          const newTrack = await prisma.track.create({
            data: {
              title: track.title,
              artist: 'Heeling',
              composer: 'Heeling Studio',
              createdWith: 'Suno AI',
              fileUrl: audioPath,
              thumbnailUrl: coverPath,
              duration,
              category: category || track.style || 'piano',
              mood: track.mood || 'calm',
              tags: [track.style, track.mood, 'ai-generated'].filter(Boolean) as string[],
              isActive: true,
            },
          });

          // Auto-add to matching playlists based on style and mood
          const playlistResult = await addTrackToMatchingPlaylists(
            newTrack.id,
            track.style,
            track.mood
          );

          if (playlistResult.playlistsAdded > 0) {
            console.log(`[Deploy] Added to playlists: ${playlistResult.playlistNames.join(', ')}`);
          }

          results.push({
            success: true,
            trackId: newTrack.id,
            generatedTrackId: track.id,
            title: track.title,
            action: 'created',
          });

          console.log(`[Deploy] Created track: ${newTrack.id} - ${track.title}`);
        }
      } catch (trackError) {
        console.error(`[Deploy] Failed to deploy track ${track.title}:`, trackError);
        results.push({
          success: false,
          generatedTrackId: track.id,
          title: track.title,
          error: trackError instanceof Error ? trackError.message : 'Unknown error',
        });
      }
    }

    const createdCount = results.filter(r => r.action === 'created').length;
    const updatedCount = results.filter(r => r.action === 'updated').length;
    const failCount = results.filter(r => !r.success).length;

    return NextResponse.json({
      success: true,
      data: {
        results,
        summary: {
          total: tracks.length,
          created: createdCount,
          updated: updatedCount,
          failed: failCount,
        },
      },
      message: `${createdCount}개 신규 배포, ${updatedCount}개 업데이트${failCount > 0 ? `, ${failCount}개 실패` : ''}`,
    });
  } catch (error) {
    console.error('[Deploy API] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to deploy tracks' },
      { status: 500 }
    );
  }
}
