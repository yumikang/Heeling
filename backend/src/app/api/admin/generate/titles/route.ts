import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-edge';
import { prisma } from '@/lib/prisma';
import { readFile, writeFile, mkdir } from 'fs/promises';
import path from 'path';

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

// Cache file path - 통합 캐시 (style/mood 무관하게 하나의 제목 풀 사용)
const CACHE_DIR = path.join(process.cwd(), 'data', 'title-cache');

function getCacheFilePath(category: string): string {
  // category별로 하나의 통합 캐시 파일 사용 (예: healing_titles.json)
  return path.join(CACHE_DIR, `${category}_titles.json`);
}

// Decrypt API key
function decryptKey(encrypted: string): string {
  if (!encrypted) return '';
  const buffer = Buffer.from(encrypted, 'base64');
  return buffer.toString('utf8');
}

// Get API key from settings
async function getTextApiKey(): Promise<{ provider: string; apiKey: string } | null> {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'ai_text' },
    });

    if (!setting || !(setting.value as any).enabled) {
      return null;
    }

    const value = setting.value as any;
    return {
      provider: value.provider || 'openai',
      apiKey: decryptKey(value.apiKey),
    };
  } catch {
    return null;
  }
}

// Generate batch titles prompt (한 번에 많이 생성하여 토큰 효율화)
function generateBatchTitlesPrompt(category: string, mood: string, style: string, count: number): string {
  const categoryThemes: Record<string, string> = {
    healing: '치유, 마음의 평화, 자연, 명상, 휴식, 위로, 따뜻함, 포용, 안식, 평온',
    focus: '집중, 생산성, 몰입, 창의성, 에너지, 각성, 명료함, 깨어남, 선명함',
    sleep: '수면, 꿈, 밤, 별, 달, 고요함, 안식, 휴식, 자장가, 포근함',
    nature: '숲, 바다, 하늘, 비, 바람, 새소리, 물소리, 자연, 계곡, 들판',
    cafe: '커피, 아늑함, 대화, 책, 창문, 오후, 따뜻한 차, 재즈, 비 오는 날',
    meditation: '명상, 호흡, 마음챙김, 깨달음, 평온, 내면, 조화, 고요, 집중',
  };

  const moodDescriptions: Record<string, string> = {
    calm: '평온하고 고요한',
    energetic: '활기차고 생동감 있는',
    dreamy: '몽환적이고 신비로운',
    focus: '집중력을 높여주는 명료한',
    melancholy: '서정적이고 감성적인',
    uplifting: '희망차고 긍정적인',
  };

  const styleDescriptions: Record<string, string> = {
    piano: '피아노 선율',
    nature: '자연의 소리',
    meditation: '명상 음악',
    sleep: '수면 음악',
    focus: '집중 음악',
    cafe: '카페 뮤직',
    classical: '클래식',
    lofi: '로파이',
  };

  return `당신은 세계적인 힐링 음악 앨범 타이틀을 만드는 전문가입니다.
Spotify, Apple Music, Melon 등에서 볼 수 있는 수준의 고급스럽고 감성적인 음악 제목을 대량 생성해주세요.

카테고리: ${category}
관련 테마: ${categoryThemes[category] || categoryThemes.healing}
분위기: ${moodDescriptions[mood] || mood}
스타일: ${styleDescriptions[style] || style}

정확히 ${count}개의 제목을 생성해주세요. 각 제목은 반드시 다음 형식을 지켜주세요:

형식: 한국어 제목 | English Title | 키워드1, 키워드2, 키워드3

요구사항:
- 시적이고 아름다운 제목 (예: "새벽을 여는 멜로디 | Whispers of Dawn | 새벽, 멜로디, 평화")
- 숫자나 "힐링 음악", "Healing Music" 같은 직접적인 표현 절대 금지
- 자연, 감정, 시간, 공간을 활용한 은유적 표현
- 한국어 2-5단어, 영어 2-5단어
- 키워드는 제목과 관련된 2-4개의 감성적 단어
- 각 제목은 고유하고 서로 중복되지 않아야 함

좋은 예시:
달빛이 머무는 곳 | Where Moonlight Rests | 달빛, 고요함, 평화
안개 속 피아노 | Piano in the Mist | 안개, 피아노, 신비
새벽의 첫 호흡 | First Breath of Dawn | 새벽, 호흡, 시작
마음의 정원 | Garden of the Soul | 마음, 정원, 치유
비 내리는 창가에서 | By the Rainy Window | 비, 창가, 사색
별이 내리는 밤 | When Stars Fall | 별, 밤, 꿈
파도의 자장가 | Lullaby of Waves | 파도, 자장가, 바다
숲속의 작은 오두막 | Little Cabin in the Woods | 숲, 오두막, 안식
구름 위를 걷다 | Walking on Clouds | 구름, 하늘, 자유
차 한 잔의 여유 | A Cup of Serenity | 차, 여유, 평온

나쁜 예시 (절대 피해야 할 것):
힐링 음악 1 | Healing Music 1 | 힐링, 음악
편안한 피아노 | Relaxing Piano | 편안함
수면 음악 | Sleep Music | 수면

${count}개의 창의적인 제목을 줄바꿈으로 구분하여 생성해주세요:`;
}

// Call OpenAI API
async function callOpenAI(apiKey: string, prompt: string): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a creative assistant specializing in Korean healing music content. Always follow the exact format requested.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.9,
      max_tokens: 4000,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'OpenAI API error');
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || '';
}

// Call Gemini API (using Gemini 2.0 Flash - stable GA model)
async function callGemini(apiKey: string, prompt: string): Promise<string> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.9,
          maxOutputTokens: 4000,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Gemini API error');
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

// Parse generated titles
function parseTitles(text: string): TitleEntry[] {
  const lines = text.trim().split('\n').filter(line => line.includes('|'));
  const titles: TitleEntry[] = [];

  for (const line of lines) {
    const parts = line.split('|').map(s => s.trim());
    if (parts.length >= 2) {
      // 숫자로 시작하는 줄 처리 (예: "1. 제목 | Title | keywords")
      let ko = parts[0].replace(/^\d+\.\s*/, '');
      const en = parts[1];
      const keywords = parts[2] || ko;

      // 나쁜 제목 필터링
      if (
        ko.includes('힐링 음악') ||
        ko.includes('수면 음악') ||
        en.toLowerCase().includes('healing music') ||
        en.toLowerCase().includes('sleep music') ||
        /\d/.test(ko) // 숫자 포함된 제목
      ) {
        continue;
      }

      titles.push({
        ko,
        en,
        keywords,
        used: false,
      });
    }
  }

  return titles;
}

// Load cache from file (통합 캐시)
async function loadCache(category: string): Promise<TitleCache | null> {
  try {
    const filePath = getCacheFilePath(category);
    const content = await readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

// Save cache to file (통합 캐시)
async function saveCache(cache: TitleCache): Promise<void> {
  await mkdir(CACHE_DIR, { recursive: true });
  const filePath = getCacheFilePath(cache.category);
  await writeFile(filePath, JSON.stringify(cache, null, 2));
}

// GET: Get available (unused) titles from cache (통합 캐시 - style/mood 무관)
export async function GET(request: NextRequest) {
  const authResult = await verifyAuth(request);
  if (!authResult.success) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') || 'healing';
  // mood, style은 무시 - 통합 캐시에서 가져옴
  const count = parseInt(searchParams.get('count') || '1');

  try {
    const cache = await loadCache(category);

    if (!cache) {
      return NextResponse.json({
        success: true,
        data: {
          available: 0,
          total: 0,
          titles: [],
          needsGeneration: true,
        },
      });
    }

    // Filter unused titles
    const unusedTitles = cache.titles.filter(t => !t.used);
    const titlesToReturn = unusedTitles.slice(0, count);

    return NextResponse.json({
      success: true,
      data: {
        available: unusedTitles.length,
        total: cache.titles.length,
        titles: titlesToReturn,
        needsGeneration: unusedTitles.length < 10,
        generatedAt: cache.generatedAt,
      },
    });
  } catch (error) {
    console.error('[Titles API] Error loading cache:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load title cache' },
      { status: 500 }
    );
  }
}

// POST: Generate and cache new titles, or mark titles as used (통합 캐시)
export async function POST(request: NextRequest) {
  const authResult = await verifyAuth(request);
  if (!authResult.success) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action, category = 'healing', mood = 'calm', style = 'piano', count = 50, titleIds } = body;

    // Mark titles as used (통합 캐시)
    if (action === 'markUsed' && titleIds && Array.isArray(titleIds)) {
      const cache = await loadCache(category);
      if (cache) {
        for (const title of cache.titles) {
          if (titleIds.includes(title.ko) || titleIds.includes(title.en)) {
            title.used = true;
            title.usedAt = new Date().toISOString();
          }
        }
        await saveCache(cache);
      }
      return NextResponse.json({ success: true });
    }

    // Generate new titles
    const apiConfig = await getTextApiKey();
    if (!apiConfig || !apiConfig.apiKey) {
      return NextResponse.json(
        { success: false, error: 'Text API not configured' },
        { status: 400 }
      );
    }

    console.log(`[Titles API] Generating ${count} titles for ${category} (unified cache)`);

    // 프롬프트에 style/mood 전달 (제목 생성에는 힌트로 사용)
    const prompt = generateBatchTitlesPrompt(category, mood, style, count);

    let generatedText: string;
    if (apiConfig.provider === 'gemini') {
      generatedText = await callGemini(apiConfig.apiKey, prompt);
    } else {
      generatedText = await callOpenAI(apiConfig.apiKey, prompt);
    }

    const newTitles = parseTitles(generatedText);
    console.log(`[Titles API] Parsed ${newTitles.length} valid titles`);

    // Load existing cache and merge (통합 캐시)
    let cache = await loadCache(category);
    if (cache) {
      // Add new titles, avoiding duplicates
      const existingKo = new Set(cache.titles.map(t => t.ko));
      const uniqueNewTitles = newTitles.filter(t => !existingKo.has(t.ko));
      cache.titles.push(...uniqueNewTitles);
      cache.generatedAt = new Date().toISOString();
    } else {
      cache = {
        category,
        generatedAt: new Date().toISOString(),
        titles: newTitles,
      };
    }

    await saveCache(cache);

    const unusedCount = cache.titles.filter(t => !t.used).length;

    return NextResponse.json({
      success: true,
      data: {
        generated: newTitles.length,
        totalAvailable: unusedCount,
        totalCached: cache.titles.length,
        provider: apiConfig.provider,
      },
    });
  } catch (error) {
    console.error('[Titles API] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to generate titles' },
      { status: 500 }
    );
  }
}

// DELETE: Clear cache for specific category (통합 캐시)
export async function DELETE(request: NextRequest) {
  const authResult = await verifyAuth(request);
  if (!authResult.success) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') || 'healing';
  const resetUsed = searchParams.get('resetUsed') === 'true';

  try {
    if (resetUsed) {
      // Reset used flags instead of deleting
      const cache = await loadCache(category);
      if (cache) {
        cache.titles.forEach(t => {
          t.used = false;
          delete t.usedAt;
        });
        await saveCache(cache);
        return NextResponse.json({
          success: true,
          message: `Reset ${cache.titles.length} titles to unused`,
        });
      }
    }

    if (category) {
      const filePath = getCacheFilePath(category);
      const { unlink } = await import('fs/promises');
      await unlink(filePath);
      return NextResponse.json({
        success: true,
        message: `Deleted cache for ${category}`,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Specify category to delete' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[Titles API] Delete error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete cache' },
      { status: 500 }
    );
  }
}
