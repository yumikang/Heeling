import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth-edge';
import { SunoClient, generateSunoPrompt } from '@/lib/suno-client';
import { ImagenClient, generateArtworkPrompt } from '@/lib/imagen-client';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';

interface Schedule {
  id: string;
  name: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'once';
  intervalDays?: number;
  runTime?: string;
  count: number;
  style?: string;
  mood?: string;
  templateId: string;
  autoDeploy?: boolean;
  nextRun: string;
  lastRun?: string;
  isActive: boolean;
  createdAt: string;
}

interface Template {
  id: string;
  name: string;
  type: 'title' | 'lyrics' | 'image' | 'suno';
  content: string;
  createdAt: string;
}

// Calculate next run date based on frequency and runTime
function calculateNextRun(frequency: string, runTime?: string, intervalDays?: number): string {
  const now = new Date();
  const nextRun = new Date(now);

  // Parse runTime (HH:MM format) or default to 09:00
  const [hours, minutes] = (runTime || '09:00').split(':').map(Number);

  switch (frequency) {
    case 'daily':
      // intervalDays: 1 = 매일, 2 = 2일마다, 3 = 3일마다, 7 = 매주(7일마다)
      const days = intervalDays || 1;
      nextRun.setDate(nextRun.getDate() + days);
      break;
    case 'weekly':
      nextRun.setDate(nextRun.getDate() + 7);
      break;
    case 'monthly':
      nextRun.setMonth(nextRun.getMonth() + 1);
      break;
    case 'once':
      // One-time schedules don't get rescheduled
      return '';
  }

  // 설정된 시간 적용
  nextRun.setHours(hours, minutes, 0, 0);

  return nextRun.toISOString();
}

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

// Get Imagen API key from settings
async function getImagenApiKey(): Promise<string | null> {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'ai_image' },
    });

    if (!setting || !(setting.value as any).enabled) {
      return null;
    }

    return decryptKey((setting.value as any).apiKey);
  } catch {
    return null;
  }
}

// Title cache interface
interface TitleEntry {
  ko: string;
  en: string;
  keywords: string;
  used: boolean;
  usedAt?: string;
}

interface TitleCache {
  category: string;
  generatedAt: string;
  titles: TitleEntry[];
}

// Load titles from file cache (not API)
async function getTitlesFromCache(category: string, count: number): Promise<TitleEntry[]> {
  const CACHE_DIR = path.join(process.cwd(), 'data', 'title-cache');
  const filePath = path.join(CACHE_DIR, `${category}_titles.json`);

  try {
    const content = await readFile(filePath, 'utf-8');
    const cache: TitleCache = JSON.parse(content);

    // Get unused titles
    const unusedTitles = cache.titles.filter(t => !t.used);
    return unusedTitles.slice(0, count);
  } catch (err) {
    console.log(`[Schedule Run] No title cache found for ${category}`);
    return [];
  }
}

// Mark titles as used in file cache
async function markTitlesAsUsed(category: string, titleIds: string[]): Promise<void> {
  const CACHE_DIR = path.join(process.cwd(), 'data', 'title-cache');
  const filePath = path.join(CACHE_DIR, `${category}_titles.json`);

  try {
    const content = await readFile(filePath, 'utf-8');
    const cache: TitleCache = JSON.parse(content);

    for (const title of cache.titles) {
      if (titleIds.includes(title.ko) || titleIds.includes(title.en)) {
        title.used = true;
        title.usedAt = new Date().toISOString();
      }
    }

    await writeFile(filePath, JSON.stringify(cache, null, 2));
    console.log(`[Schedule Run] Marked ${titleIds.length} titles as used`);
  } catch (err) {
    console.error('[Schedule Run] Failed to mark titles as used:', err);
  }
}

// Generate cover image using Gemini Imagen
async function generateCoverImage(
  title: string,
  keywords: string,
  mood: string,
  imagenApiKey: string
): Promise<string | null> {
  try {
    const imagenClient = new ImagenClient(imagenApiKey);

    // Generate prompt
    const prompt = generateArtworkPrompt({
      title,
      category: 'healing',
      mood,
      keywords,
    });

    console.log(`[Schedule Run] Generating cover for: ${title}`);

    // Generate image
    const images = await imagenClient.generateImage({
      prompt,
      numberOfImages: 1,
      aspectRatio: '9:16',
    });

    if (images.length === 0 || !images[0].bytesBase64Encoded) {
      console.warn(`[Schedule Run] No image generated for: ${title}`);
      return null;
    }

    // Save to covers directory
    const { mkdir } = await import('fs/promises');
    const coversDir = path.join(process.cwd(), 'public', 'media', 'covers');
    await mkdir(coversDir, { recursive: true });

    const buffer = Buffer.from(images[0].bytesBase64Encoded, 'base64');
    const safeTitle = title
      .replace(/[^a-zA-Z0-9\s-]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 30) || 'cover';
    const filename = `${safeTitle}_${Date.now()}.png`;
    const fullPath = path.join(coversDir, filename);

    await writeFile(fullPath, buffer);
    console.log(`[Schedule Run] Cover saved: ${filename}`);

    return `/media/covers/${filename}`;
  } catch (err) {
    console.error(`[Schedule Run] Cover generation failed for ${title}:`, err);
    return null;
  }
}

// POST: Run schedule immediately
export async function POST(request: NextRequest) {
  // 크론 내부 호출 체크 (X-Cron-Secret 헤더)
  const cronSecret = request.headers.get('X-Cron-Secret');
  const isInternalCron = cronSecret === process.env.CRON_SECRET;

  if (!isInternalCron) {
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const body = await request.json();
    const { scheduleId, generateConfig } = body;

    // If scheduleId provided, load schedule and template
    let schedule: Schedule | null = null;
    let sunoTemplate: Template | null = null;

    if (scheduleId) {
      // Get schedules
      const scheduleSetting = await prisma.systemSetting.findUnique({
        where: { key: 'ai_schedules' },
      });

      const schedules: Schedule[] = (scheduleSetting?.value as unknown as Schedule[]) || [];
      schedule = schedules.find(s => s.id === scheduleId) || null;

      if (!schedule) {
        return NextResponse.json(
          { success: false, error: 'Schedule not found' },
          { status: 404 }
        );
      }

      // Get templates to find the associated template
      if (schedule.templateId) {
        const templateSetting = await prisma.systemSetting.findUnique({
          where: { key: 'ai_templates' },
        });

        const templates: Template[] = (templateSetting?.value as unknown as Template[]) || [];
        sunoTemplate = templates.find(t => t.id === schedule!.templateId) || null;
      }
    }

    // Get Suno API key
    const sunoApiKey = await getSunoApiKey();
    if (!sunoApiKey) {
      return NextResponse.json(
        { success: false, error: 'Suno API not configured. Please set up API key in settings.' },
        { status: 400 }
      );
    }

    const sunoClient = new SunoClient(sunoApiKey);

    // Get Imagen API key for cover generation
    const imagenApiKey = await getImagenApiKey();

    // Prepare generation parameters
    // Use schedule's style/mood if available, otherwise use defaults or generateConfig
    const {
      style = schedule?.style || 'piano',
      mood = schedule?.mood || 'calm',
      description = '',
      instrumental = true,
      model = 'V5',
    } = generateConfig || {};

    // Use template content if available (title will be replaced per-track in the loop)
    let basePrompt: string;
    let styleTag: string;

    if (sunoTemplate) {
      // Replace variables in template (except {title} which is replaced per-track)
      let templateContent = sunoTemplate.content;
      templateContent = templateContent.replace(/{mood}/g, mood);
      templateContent = templateContent.replace(/{style}/g, style);
      templateContent = templateContent.replace(/{keywords}/g, description);

      basePrompt = templateContent;
      styleTag = style;
    } else {
      const promptData = generateSunoPrompt({
        mood,
        style,
        description,
      });
      basePrompt = promptData.prompt;
      styleTag = promptData.style;
    }

    // Generate music
    const count = schedule?.count || 1;
    const results = [];
    const autoDeploy = schedule?.autoDeploy ?? false;

    for (let i = 0; i < count; i++) {
      // 제목 캐시에서 2개 제목 가져오기 (Suno는 1회 호출로 2트랙 생성)
      // 파일 기반으로 직접 읽어서 VPS standalone 모드에서도 동작하도록 함
      let trackTitles: TitleEntry[] = [];

      try {
        const cachedTitles = await getTitlesFromCache('healing', 2);

        if (cachedTitles.length >= 2) {
          trackTitles = cachedTitles.slice(0, 2);
          console.log(`[Schedule Run] Using titles from file cache: ${trackTitles[0].en}, ${trackTitles[1].en}`);

          // 사용된 제목 마킹 (파일에 직접)
          await markTitlesAsUsed('healing', trackTitles.map(t => t.en));
        } else {
          console.warn(`[Schedule Run] Not enough titles in file cache (${cachedTitles.length}/2), using fallback`);
          const fallbackName = schedule?.name || 'Healing Music';
          trackTitles = [
            { ko: `${fallbackName} #1`, en: `${fallbackName} #1`, keywords: fallbackName, used: false },
            { ko: `${fallbackName} #2`, en: `${fallbackName} #2`, keywords: fallbackName, used: false },
          ];
        }
      } catch (err) {
        console.error('[Schedule Run] Failed to read titles from file cache:', err);
        // Fallback to generic titles
        const fallbackName = schedule?.name || 'Healing Music';
        trackTitles = [
          { ko: `${fallbackName} #1`, en: `${fallbackName} #1`, keywords: fallbackName, used: false },
          { ko: `${fallbackName} #2`, en: `${fallbackName} #2`, keywords: fallbackName, used: false },
        ];
      }

      // 커버 이미지 생성 (Imagen API 키가 있을 경우)
      let coverImageUrls: (string | null)[] = [null, null];
      if (imagenApiKey) {
        console.log('[Schedule Run] Generating cover images for tracks...');
        // 두 트랙의 커버 이미지를 병렬로 생성
        const coverPromises = trackTitles.map((title, idx) =>
          generateCoverImage(title.en, title.keywords, mood, imagenApiKey)
            .catch(err => {
              console.error(`[Schedule Run] Cover generation failed for track ${idx}:`, err);
              return null;
            })
        );
        coverImageUrls = await Promise.all(coverPromises);
        console.log(`[Schedule Run] Cover images generated: ${coverImageUrls.filter(Boolean).length}/2`);
      } else {
        console.log('[Schedule Run] Skipping cover generation - no Imagen API key');
      }

      // Suno 1회 호출 (첫 번째 제목으로 호출)
      // 템플릿에서 {title} 플레이스홀더를 첫 번째 트랙 제목으로 대체
      const finalPrompt = basePrompt.replace(/{title}/g, trackTitles[0].en);

      const result = await sunoClient.generateMusic({
        prompt: finalPrompt,
        style: styleTag,
        title: trackTitles[0].en,
        instrumental,
        model,
      });

      if (result.code === 200 && result.data?.taskId) {
        results.push({
          taskId: result.data.taskId,
          status: 'PENDING',
          iteration: i + 1,
          titles: trackTitles.map(t => t.en),
        });

        // Save 2 GenerationTasks (각 트랙별로 trackIndex 0, 1)
        if (autoDeploy) {
          try {
            // Track 0 - 첫 번째 제목
            await prisma.generationTask.create({
              data: {
                scheduleId: scheduleId || null,
                taskId: result.data.taskId,
                trackIndex: 0,
                title: trackTitles[0].en,
                style,
                mood,
                status: 'PENDING',
                autoDeploy: true,
                retryCount: 0,
                maxRetries: 3,
                generatedCoverUrl: coverImageUrls[0] || null,
              },
            });

            // Track 1 - 두 번째 제목
            await prisma.generationTask.create({
              data: {
                scheduleId: scheduleId || null,
                taskId: result.data.taskId,
                trackIndex: 1,
                title: trackTitles[1].en,
                style,
                mood,
                status: 'PENDING',
                autoDeploy: true,
                retryCount: 0,
                maxRetries: 3,
                generatedCoverUrl: coverImageUrls[1] || null,
              },
            });

            console.log(`[Schedule Run] Created 2 GenerationTasks for taskId ${result.data.taskId}, covers: ${coverImageUrls.filter(Boolean).length}/2`);
          } catch (taskError) {
            console.error('Failed to create GenerationTasks:', taskError);
            // Don't fail the entire generation if task creation fails
          }
        }
      } else {
        results.push({
          error: result.msg || 'Failed to start generation',
          iteration: i + 1,
        });
      }
    }

    // Update schedule's lastRun and nextRun if schedule was used
    if (schedule) {
      const scheduleSetting = await prisma.systemSetting.findUnique({
        where: { key: 'ai_schedules' },
      });

      const schedules: Schedule[] = (scheduleSetting?.value as unknown as Schedule[]) || [];
      const scheduleIndex = schedules.findIndex(s => s.id === scheduleId);

      if (scheduleIndex !== -1) {
        schedules[scheduleIndex] = {
          ...schedules[scheduleIndex],
          lastRun: new Date().toISOString(),
          nextRun: calculateNextRun(schedule.frequency, schedule.runTime, schedule.intervalDays),
          // Deactivate one-time schedules after running
          isActive: schedule.frequency !== 'once',
        };

        await prisma.systemSetting.update({
          where: { key: 'ai_schedules' },
          data: { value: schedules as any },
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        results,
        totalGenerations: count,
        expectedTracks: count * 2, // Suno generates 2 tracks per request
        message: `Started ${count} generation(s). Expected ${count * 2} tracks.`,
      },
    });
  } catch (error) {
    console.error('Run schedule error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to run schedule' },
      { status: 500 }
    );
  }
}
