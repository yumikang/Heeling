import { NextRequest, NextResponse } from 'next/server';
import { SunoClient, generateSunoPrompt, HEALING_STYLES } from '@/lib/suno-client';
import { verifyAuth } from '@/lib/auth-edge';
import { prisma } from '@/lib/prisma';

// Decrypt API key
function decryptKey(encrypted: string): string {
  if (!encrypted) return '';
  const buffer = Buffer.from(encrypted, 'base64');
  return buffer.toString('utf8');
}

// Get Suno API key from settings or env
async function getSunoClient(): Promise<SunoClient> {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'ai_music' },
    });

    if (setting && (setting.value as any).enabled && (setting.value as any).apiKey) {
      const apiKey = decryptKey((setting.value as any).apiKey);
      return new SunoClient(apiKey);
    }
  } catch (error) {
    console.error('Failed to get Suno API key from settings:', error);
  }

  // Fallback to env variable
  return new SunoClient(process.env.SUNO_API_KEY || '');
}

// POST: Generate new music
export async function POST(request: NextRequest) {
  const authResult = await verifyAuth(request);
  if (!authResult.success) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      title,
      style = 'piano',
      mood = 'calm',
      keywords,           // 키워드/테마 (선택)
      description,        // 레거시 호환
      instrumental,       // undefined면 프리셋 기본값 사용
      model = 'V5',       // V5, V4_5PLUS, V4_5, V4
    } = body;

    if (!title) {
      return NextResponse.json(
        { success: false, error: 'Title is required' },
        { status: 400 }
      );
    }

    // 1. 프리셋에서 stylePrompt 조회
    let stylePrompt: string;
    let useInstrumental: boolean;

    const preset = await prisma.musicPreset.findFirst({
      where: { styleCode: style, moodCode: mood },
    });

    if (preset) {
      // 프리셋 발견: stylePrompt 사용
      stylePrompt = preset.stylePrompt;
      useInstrumental = instrumental !== undefined ? instrumental : preset.instrumentalDefault;
      console.log(`[Music API] Using preset: ${preset.name} (${preset.code})`);
    } else {
      // 프리셋 없음: 폴백으로 기존 generateSunoPrompt 사용
      console.log(`[Music API] No preset found for ${style}/${mood}, using fallback`);
      const promptData = generateSunoPrompt({
        mood,
        style: style as keyof typeof HEALING_STYLES,
        description: keywords || description,
      });
      stylePrompt = promptData.style;
      useInstrumental = instrumental !== undefined ? instrumental : true;
    }

    // 2. 프롬프트 구성 (키워드가 있으면 추가)
    const basePrompt = 'Instrumental healing music perfect for background listening, calm and relaxing';
    const keywordPart = (keywords || description)?.trim()
      ? `Theme: ${(keywords || description).trim()}.`
      : '';
    const mainPrompt = `${keywordPart} ${basePrompt}`.trim();

    // 3. 악기 연주만 옵션 반영 (프롬프트에 이미 없으면 추가)
    let finalStylePrompt = stylePrompt;
    if (useInstrumental && !/no vocals|instrumental/i.test(finalStylePrompt)) {
      finalStylePrompt += ', instrumental, no vocals, no lyrics';
    }

    console.log('[Music API] Final prompt:', mainPrompt);
    console.log('[Music API] Final style:', finalStylePrompt);

    // Get Suno client with API key from settings
    const sunoClient = await getSunoClient();

    // Start music generation
    const result = await sunoClient.generateMusic({
      prompt: mainPrompt,
      style: finalStylePrompt,
      title,
      instrumental: useInstrumental,
      model,
    });

    if (result.code !== 200 || !result.data?.taskId) {
      return NextResponse.json(
        { success: false, error: result.msg || 'Failed to start generation' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        taskId: result.data.taskId,
        status: 'PENDING',
        message: 'Music generation started. Poll for status.',
        presetUsed: preset?.code || null,
      },
    });
  } catch (error) {
    console.error('Music generation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate music';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

// GET: Get generation status, credits, or available options
export async function GET(request: NextRequest) {
  const authResult = await verifyAuth(request);
  if (!authResult.success) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');
    const action = searchParams.get('action');

    // Get Suno client
    const sunoClient = await getSunoClient();

    // Handle credits action
    if (action === 'credits') {
      try {
        const creditsData = await sunoClient.getCredits();
        return NextResponse.json({
          success: true,
          data: {
            credits: creditsData.credits,
            tracksAvailable: Math.floor(creditsData.credits / 12) * 2, // 12 credits per request, 2 tracks per request
            requestsAvailable: Math.floor(creditsData.credits / 12), // 12 credits per request
          },
        });
      } catch (error) {
        console.error('Failed to get credits:', error);
        return NextResponse.json({
          success: false,
          error: 'Failed to fetch credits. Please check your API key.',
        }, { status: 500 });
      }
    }

    // Handle records action - get generation history
    if (action === 'records') {
      try {
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');

        const recordsData = await sunoClient.getRecords(page, limit);
        console.log('[Music API] Records fetched:', recordsData.total, 'total');

        return NextResponse.json({
          success: true,
          data: {
            total: recordsData.total,
            page,
            limit,
            records: recordsData.records.map(record => ({
              taskId: record.taskId,
              status: record.status === 'TEXT_SUCCESS' ? 'SUCCESS' : record.status,
              createdAt: record.createdAt,
              tracks: record.tracks.map(t => ({
                id: t.id,
                title: t.title,
                audioUrl: t.audio_url,
                imageUrl: t.image_url || '',
                duration: t.duration,
                tags: t.tags,
              })),
            })),
          },
        });
      } catch (error) {
        console.error('Failed to get records:', error);
        return NextResponse.json({
          success: false,
          error: 'Failed to fetch generation records.',
        }, { status: 500 });
      }
    }

    if (!taskId) {
      // Return available styles
      return NextResponse.json({
        success: true,
        data: {
          styles: Object.keys(HEALING_STYLES),
          moods: ['calm', 'energetic', 'dreamy', 'focus', 'melancholy'],
          models: ['V5', 'V4_5PLUS', 'V4_5', 'V4'],  // API v1 모델명
        },
      });
    }

    // Get task status
    const result = await sunoClient.getStatus(taskId);

    // Debug logging for API response
    console.log('[Music API] Task status response:', JSON.stringify(result, null, 2));

    if (result.code !== 200) {
      console.log('[Music API] Non-200 response code:', result.code, result.msg);
      return NextResponse.json(
        { success: false, error: result.msg },
        { status: 500 }
      );
    }

    const rawStatus = result.data?.status || 'PENDING';
    // Map TEXT_SUCCESS and SUCCESS both to SUCCESS for frontend
    const status = rawStatus === 'TEXT_SUCCESS' || rawStatus === 'SUCCESS' ? 'SUCCESS' : rawStatus;

    // Try multiple possible response structures:
    // 1. response.sunoData (actual API format)
    // 2. response.data (legacy format)
    // 3. data.data (fallback)
    const tracks = result.data?.response?.sunoData || result.data?.response?.data || result.data?.data || [];

    console.log('[Music API] Raw status:', rawStatus, '-> Mapped status:', status);
    console.log('[Music API] Tracks found:', tracks.length);
    if (tracks.length > 0) {
      console.log('[Music API] First track sample:', JSON.stringify(tracks[0], null, 2));
    }

    return NextResponse.json({
      success: true,
      data: {
        taskId,
        status,
        tracks: tracks.map((track: any) => ({
          id: track.id,
          title: track.title,
          // Use streamAudioUrl as primary (it has actual audio), fallback to audioUrl/audio_url
          audioUrl: track.streamAudioUrl || track.audioUrl || track.audio_url || '',
          duration: track.duration,
          tags: track.tags,
          // Use imageUrl, fallback to image_url
          imageUrl: track.imageUrl || track.image_url || '',
        })),
      },
    });
  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check status' },
      { status: 500 }
    );
  }
}
