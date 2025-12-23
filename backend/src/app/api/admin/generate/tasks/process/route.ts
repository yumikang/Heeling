import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth-edge';
import { SunoClient, SunoTrack } from '@/lib/suno-client';
import { writeFile, mkdir, readFile } from 'fs/promises';
import path from 'path';
import { parseBuffer } from 'music-metadata';
import https from 'https';
import http from 'http';
import { addTrackToMatchingPlaylists } from '@/lib/playlist-mapper';

// Decrypt API key
function decryptKey(encrypted: string): string {
  if (!encrypted) return '';
  const buffer = Buffer.from(encrypted, 'base64');
  return buffer.toString('utf8');
}

// Get Suno API key from settings
async function getSunoApiKey(): Promise<string | null> {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'ai_music' },
    });

    if (!setting || !(setting.value as any).enabled) {
      return null;
    }

    return decryptKey((setting.value as any).apiKey);
  } catch {
    return null;
  }
}

interface GeneratedTrack {
  id: string;
  title: string;
  titleEn?: string;
  audioUrl: string;
  duration: number;
  imageUrl?: string;
  style?: string;
  mood?: string;
  generatedAt?: string;
  batchId?: string;
  deployed?: boolean;
  deployedAt?: string;
  dbTrackId?: string;
}

// Save tracks to generated_tracks cache
async function saveToTracksCache(tracks: GeneratedTrack[]): Promise<void> {
  const setting = await prisma.systemSetting.findUnique({
    where: { key: 'generated_tracks' },
  });

  const existingTracks: GeneratedTrack[] = (setting?.value as unknown as GeneratedTrack[]) || [];
  const updatedTracks = [...tracks, ...existingTracks];

  await prisma.systemSetting.upsert({
    where: { key: 'generated_tracks' },
    update: { value: updatedTracks as any },
    create: { key: 'generated_tracks', value: updatedTracks as any },
  });
}

// Download file using native http/https
function downloadFile(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https:') ? https : http;
    client.get(url, (res) => {
      // Handle redirects
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        downloadFile(res.headers.location).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error(`Download failed: ${res.statusCode}`));
        return;
      }
      const chunks: Buffer[] = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

// Get audio duration from file
async function getAudioDuration(filePath: string): Promise<number> {
  try {
    const absolutePath = path.join(process.cwd(), 'public', filePath);
    const buffer = await readFile(absolutePath);
    const metadata = await parseBuffer(buffer, { mimeType: 'audio/mpeg' });
    if (metadata.format.duration) {
      return Math.round(metadata.format.duration);
    }
    if (metadata.format.bitrate && buffer.length > 0) {
      return Math.round((buffer.length * 8) / metadata.format.bitrate);
    }
    return 0;
  } catch {
    return 0;
  }
}

// Deploy track directly to database (no API call needed)
async function deployTrackDirect(track: GeneratedTrack): Promise<{ success: boolean; trackId?: string; error?: string }> {
  try {
    const audioDir = path.join(process.cwd(), 'public', 'media', 'tracks');
    const coverDir = path.join(process.cwd(), 'public', 'media', 'covers');
    await mkdir(audioDir, { recursive: true });
    await mkdir(coverDir, { recursive: true });

    // Download and save audio file
    let audioPath = track.audioUrl;
    if (track.audioUrl.startsWith('http')) {
      console.log(`[Process Tasks] Downloading audio: ${track.audioUrl}`);
      const audioBuffer = await downloadFile(track.audioUrl);
      const audioFilename = `${Date.now()}_${track.id}.mp3`;
      const audioFilePath = path.join(audioDir, audioFilename);
      await writeFile(audioFilePath, audioBuffer);
      audioPath = `/media/tracks/${audioFilename}`;
      console.log(`[Process Tasks] Audio saved: ${audioPath}`);
    }

    // Download and save cover image
    let coverPath: string | undefined;
    if (track.imageUrl && track.imageUrl.startsWith('http')) {
      try {
        console.log(`[Process Tasks] Downloading cover: ${track.imageUrl}`);
        const imageBuffer = await downloadFile(track.imageUrl);
        const imageFilename = `${Date.now()}_${track.id}.jpg`;
        const imageFilePath = path.join(coverDir, imageFilename);
        await writeFile(imageFilePath, imageBuffer);
        coverPath = `/media/covers/${imageFilename}`;
      } catch (imgErr) {
        console.warn(`[Process Tasks] Cover download failed:`, imgErr);
      }
    }

    // Get duration from file if not provided
    let duration = track.duration ? Math.round(track.duration) : 0;
    if (!duration && audioPath.startsWith('/media/')) {
      duration = await getAudioDuration(audioPath);
      console.log(`[Process Tasks] Duration from file: ${duration}s`);
    }

    // Create track in database
    const newTrack = await prisma.track.create({
      data: {
        title: track.title,
        artist: 'Heeling',
        composer: 'Heeling Studio',
        createdWith: 'Suno AI',
        fileUrl: audioPath,
        thumbnailUrl: coverPath,
        duration,
        category: track.style || 'piano',
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
      console.log(`[Process Tasks] Added to playlists: ${playlistResult.playlistNames.join(', ')}`);
    }

    console.log(`[Process Tasks] Track created: ${newTrack.id} - ${track.title}`);
    return { success: true, trackId: newTrack.id };
  } catch (error) {
    console.error('[Process Tasks] Deploy error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Deploy failed' };
  }
}

// POST: Process pending generation tasks
export async function POST(request: NextRequest) {
  // Check for cron secret or auth
  const cronSecret = request.headers.get('X-Cron-Secret');
  const isInternalCron = cronSecret === process.env.CRON_SECRET;

  if (!isInternalCron) {
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    // Get Suno API key
    const sunoApiKey = await getSunoApiKey();
    if (!sunoApiKey) {
      return NextResponse.json({
        success: false,
        error: 'Suno API not configured',
      }, { status: 400 });
    }

    const sunoClient = new SunoClient(sunoApiKey);

    // Find pending tasks
    const pendingTasks = await prisma.generationTask.findMany({
      where: {
        status: {
          in: ['PENDING', 'GENERATING'],
        },
      },
      orderBy: { createdAt: 'asc' },
      take: 10, // Process max 10 tasks at a time
    });

    if (pendingTasks.length === 0) {
      return NextResponse.json({
        success: true,
        data: { message: 'No pending tasks to process', processed: 0 },
      });
    }

    console.log(`[Process Tasks] Found ${pendingTasks.length} pending tasks`);

    const results: { taskId: string; status: string; message: string }[] = [];

    // Group tasks by Suno taskId
    const taskGroups = new Map<string, typeof pendingTasks>();
    for (const task of pendingTasks) {
      const existing = taskGroups.get(task.taskId) || [];
      existing.push(task);
      taskGroups.set(task.taskId, existing);
    }

    for (const [sunoTaskId, tasks] of taskGroups) {
      try {
        // Check Suno API status
        const statusResult = await sunoClient.getStatus(sunoTaskId);
        console.log(`[Process Tasks] Suno status for ${sunoTaskId}:`, statusResult.data?.status);

        const sunoStatus = statusResult.data?.status;
        // TEXT_SUCCESS = Suno V5 model (text-to-music), SUCCESS = older models
        if (sunoStatus === 'SUCCESS' || sunoStatus === 'TEXT_SUCCESS') {
          // Get tracks from response
          const sunoTracks: SunoTrack[] =
            statusResult.data?.response?.sunoData ||
            statusResult.data?.response?.data ||
            statusResult.data?.data ||
            [];

          if (sunoTracks.length === 0) {
            console.warn(`[Process Tasks] No tracks in SUCCESS response for ${sunoTaskId}`);
            continue;
          }

          console.log(`[Process Tasks] Got ${sunoTracks.length} tracks from Suno`);

          // Process each track based on trackIndex
          for (const task of tasks) {
            const trackIndex = task.trackIndex || 0;
            const sunoTrack = sunoTracks[trackIndex];

            if (!sunoTrack) {
              await prisma.generationTask.update({
                where: { id: task.id },
                data: {
                  status: 'FAILED',
                  error: `Track index ${trackIndex} not found in Suno response`,
                  failedAt: new Date(),
                },
              });
              results.push({
                taskId: task.id,
                status: 'FAILED',
                message: `Track index ${trackIndex} not found`,
              });
              continue;
            }

            // Get audio/image URLs (V5 uses camelCase, older models use snake_case)
            // For V5, audioUrl is empty but streamAudioUrl has the URL
            const audioUrl = sunoTrack.audio_url || sunoTrack.audioUrl || sunoTrack.streamAudioUrl || '';
            const imageUrl = sunoTrack.image_url || sunoTrack.imageUrl || '';

            if (!audioUrl) {
              console.warn(`[Process Tasks] No audio URL for track ${sunoTrack.id}`);
              await prisma.generationTask.update({
                where: { id: task.id },
                data: {
                  status: 'FAILED',
                  error: 'No audio URL in Suno response',
                  failedAt: new Date(),
                },
              });
              results.push({
                taskId: task.id,
                status: 'FAILED',
                message: 'No audio URL in response',
              });
              continue;
            }

            // Create generated track object
            const generatedTrack: GeneratedTrack = {
              id: sunoTrack.id,
              title: task.title || sunoTrack.title,
              audioUrl,
              duration: sunoTrack.duration || 0,
              imageUrl,
              style: task.style || sunoTrack.tags?.split(',')[0]?.trim(),
              mood: task.mood || undefined,
              generatedAt: new Date().toISOString(),
              batchId: sunoTaskId,
              deployed: false,
            };

            // Save to tracks cache
            await saveToTracksCache([generatedTrack]);
            console.log(`[Process Tasks] Saved track to cache: ${generatedTrack.title}`);

            // Auto-deploy if enabled
            if (task.autoDeploy) {
              console.log(`[Process Tasks] Auto-deploying track: ${generatedTrack.title}`);

              const deployResult = await deployTrackDirect(generatedTrack);

              if (deployResult.success && deployResult.trackId) {
                // Update cache with deployed status
                const dbTrackId = deployResult.trackId;

                const setting = await prisma.systemSetting.findUnique({
                  where: { key: 'generated_tracks' },
                });
                const cachedTracks: GeneratedTrack[] = (setting?.value as unknown as GeneratedTrack[]) || [];
                const trackIdx = cachedTracks.findIndex(t => t.id === generatedTrack.id);
                if (trackIdx !== -1) {
                  cachedTracks[trackIdx].deployed = true;
                  cachedTracks[trackIdx].deployedAt = new Date().toISOString();
                  cachedTracks[trackIdx].dbTrackId = dbTrackId;
                  await prisma.systemSetting.update({
                    where: { key: 'generated_tracks' },
                    data: { value: cachedTracks as any },
                  });
                }

                await prisma.generationTask.update({
                  where: { id: task.id },
                  data: {
                    status: 'DEPLOYED',
                    sunoAudioUrl: audioUrl,
                    sunoImageUrl: imageUrl,
                  },
                });

                results.push({
                  taskId: task.id,
                  status: 'DEPLOYED',
                  message: `Track deployed: ${generatedTrack.title}`,
                });
              } else {
                // Deploy failed, but track is still saved to cache
                await prisma.generationTask.update({
                  where: { id: task.id },
                  data: {
                    status: 'GENERATED',
                    sunoAudioUrl: audioUrl,
                    sunoImageUrl: imageUrl,
                    error: deployResult.error || 'Auto-deploy failed, track saved to cache',
                  },
                });

                results.push({
                  taskId: task.id,
                  status: 'GENERATED',
                  message: `Track saved but deploy failed: ${generatedTrack.title}`,
                });
              }
            } else {
              // No auto-deploy, just mark as generated
              await prisma.generationTask.update({
                where: { id: task.id },
                data: {
                  status: 'GENERATED',
                  sunoAudioUrl: sunoTrack.audio_url,
                  sunoImageUrl: sunoTrack.image_url,
                },
              });

              results.push({
                taskId: task.id,
                status: 'GENERATED',
                message: `Track saved to cache: ${generatedTrack.title}`,
              });
            }
          }
        } else if (statusResult.data?.status === 'FAILED') {
          // Mark all tasks for this Suno taskId as failed
          for (const task of tasks) {
            const currentRetry = task.retryCount || 0;
            const maxRetries = task.maxRetries || 3;

            if (currentRetry < maxRetries) {
              // Retry later
              await prisma.generationTask.update({
                where: { id: task.id },
                data: {
                  status: 'PENDING',
                  retryCount: currentRetry + 1,
                  lastCheckedAt: new Date(),
                  error: `Suno generation failed, retry ${currentRetry + 1}/${maxRetries}`,
                },
              });

              results.push({
                taskId: task.id,
                status: 'RETRY',
                message: `Will retry (${currentRetry + 1}/${maxRetries})`,
              });
            } else {
              await prisma.generationTask.update({
                where: { id: task.id },
                data: {
                  status: 'FAILED',
                  failedAt: new Date(),
                  error: 'Suno generation failed after max retries',
                },
              });

              results.push({
                taskId: task.id,
                status: 'FAILED',
                message: 'Max retries exceeded',
              });
            }
          }
        } else if (statusResult.data?.status === 'PENDING' || statusResult.data?.status === 'RUNNING') {
          // Still processing, update lastCheckedAt
          for (const task of tasks) {
            await prisma.generationTask.update({
              where: { id: task.id },
              data: {
                status: 'GENERATING',
                lastCheckedAt: new Date(),
              },
            });

            results.push({
              taskId: task.id,
              status: 'GENERATING',
              message: 'Still processing at Suno',
            });
          }
        }
      } catch (taskError) {
        console.error(`[Process Tasks] Error processing ${sunoTaskId}:`, taskError);

        for (const task of tasks) {
          results.push({
            taskId: task.id,
            status: 'ERROR',
            message: taskError instanceof Error ? taskError.message : 'Unknown error',
          });
        }
      }
    }

    const summary = {
      total: results.length,
      deployed: results.filter(r => r.status === 'DEPLOYED').length,
      generated: results.filter(r => r.status === 'GENERATED').length,
      generating: results.filter(r => r.status === 'GENERATING').length,
      retry: results.filter(r => r.status === 'RETRY').length,
      failed: results.filter(r => r.status === 'FAILED').length,
      error: results.filter(r => r.status === 'ERROR').length,
    };

    console.log(`[Process Tasks] Summary:`, summary);

    return NextResponse.json({
      success: true,
      data: {
        results,
        summary,
      },
    });
  } catch (error) {
    console.error('[Process Tasks] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to process tasks' },
      { status: 500 }
    );
  }
}
