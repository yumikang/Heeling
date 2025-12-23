import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-edge';
import { prisma } from '@/lib/prisma';

interface TextGenerationRequest {
  type: 'title' | 'lyrics' | 'keywords' | 'music-prompt';
  keywords?: string;
  mood?: string;
  style?: string;
  category?: string;
  provider?: string;
  title?: string;  // For music-prompt generation
  count?: number;  // Number of items to generate
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

// Generate prompt for creative keywords/themes generation
function generateKeywordsPrompt(category: string, mood: string, style: string, count: number): string {
  const categoryThemes: Record<string, string> = {
    healing: '치유, 마음의 평화, 자연, 명상, 휴식, 위로, 따뜻함, 포용',
    focus: '집중, 생산성, 몰입, 창의성, 에너지, 각성, 명료함',
    sleep: '수면, 꿈, 밤, 별, 달, 고요함, 안식, 휴식',
    nature: '숲, 바다, 하늘, 비, 바람, 새소리, 물소리, 자연',
    cafe: '커피, 아늑함, 대화, 책, 창문, 오후, 따뜻한 차',
    meditation: '명상, 호흡, 마음챙김, 깨달음, 평온, 내면, 조화',
  };

  return `당신은 힐링/명상 음악 앱의 창의적인 테마 기획자입니다.

카테고리: ${category}
분위기: ${mood}
스타일: ${style}
관련 테마: ${categoryThemes[category] || categoryThemes.healing}

${count}개의 독창적이고 시적인 음악 테마/키워드 세트를 생성해주세요.

요구사항:
- 각 테마는 2-4개의 감성적인 키워드로 구성
- 추상적이면서도 음악적 영감을 주는 단어 조합
- 계절, 시간대, 자연현상, 감정 등 다양한 요소 포함
- 한국어로 작성

출력 형식 (줄바꿈으로 구분):
새벽 안개, 고요한 숲
달빛 아래 호수, 잔잔한 물결
봄날의 산책, 벚꽃 흩날림

${count}개의 테마를 생성해주세요:`;
}

// Generate prompt for title generation (bilingual: Korean + English for localization)
function generateTitlePrompt(keywords: string, mood: string, style: string, category: string, count: number): string {
  const moodDescriptions: Record<string, string> = {
    calm: '평온하고 고요한',
    energetic: '활기차고 생동감 있는',
    dreamy: '몽환적이고 신비로운',
    focus: '집중력을 높여주는 명료한',
    melancholy: '서정적이고 감성적인',
    uplifting: '희망차고 긍정적인',
  };

  const styleDescriptions: Record<string, string> = {
    piano: '피아노 선율이 흐르는',
    nature: '자연의 소리가 담긴',
    meditation: '명상을 위한 고요한',
    sleep: '수면을 유도하는 부드러운',
    focus: '집중력을 높여주는',
    cafe: '아늑한 카페 분위기의',
    classical: '클래식 감성의 우아한',
    lofi: '로파이 감성의 따뜻한',
  };

  return `당신은 세계적인 힐링 음악 앨범 타이틀을 만드는 전문가입니다.
Spotify, Apple Music 등에서 볼 수 있는 수준의 고급스럽고 감성적인 음악 제목을 만들어주세요.

테마/키워드: ${keywords}
분위기: ${moodDescriptions[mood] || mood}
스타일: ${styleDescriptions[style] || style}
카테고리: ${category}

${count}개의 제목을 생성해주세요. 각 제목은 한국어와 영어 버전이 모두 필요합니다.

요구사항:
- 시적이고 아름다운 제목 (예: "새벽을 여는 멜로디", "Whispers of Dawn")
- 숫자나 "힐링 음악" 같은 직접적인 표현 금지
- 자연, 감정, 시간, 공간을 활용한 은유적 표현
- 한국어 2-5단어, 영어 2-5단어
- 형식: 한국어 제목 | English Title

좋은 예시:
달빛이 머무는 곳 | Where Moonlight Rests
안개 속 피아노 | Piano in the Mist
새벽의 첫 호흡 | First Breath of Dawn
마음의 정원 | Garden of the Soul
비 내리는 창가에서 | By the Rainy Window

나쁜 예시 (피해야 할 것):
힐링 음악 1 | Healing Music 1
편안한 피아노 | Relaxing Piano
수면 음악 | Sleep Music

${count}개의 창의적인 제목을 생성해주세요:`;
}

// Generate prompt for Suno music generation
function generateMusicPromptText(title: string, keywords: string, mood: string, style: string, category: string): string {
  const moodAdjectives: Record<string, string[]> = {
    calm: ['serene', 'peaceful', 'tranquil', 'gentle', 'soothing'],
    energetic: ['uplifting', 'vibrant', 'dynamic', 'bright', 'refreshing'],
    dreamy: ['ethereal', 'floating', 'mystical', 'otherworldly', 'enchanting'],
    focus: ['clear', 'steady', 'flowing', 'focused', 'ambient'],
    melancholy: ['wistful', 'nostalgic', 'bittersweet', 'tender', 'emotional'],
    uplifting: ['hopeful', 'inspiring', 'warm', 'encouraging', 'positive'],
  };

  const styleElements: Record<string, string> = {
    piano: 'gentle piano melodies with soft sustain, delicate arpeggios',
    nature: 'ambient soundscapes with subtle nature elements, organic textures',
    meditation: 'slow tempo, drone-like backgrounds, tibetan singing bowls, breath-like rhythms',
    sleep: 'extremely soft dynamics, minimal movement, lullaby-like progressions',
    focus: 'steady rhythmic patterns, clean tones, lo-fi beats',
    cafe: 'warm jazz chords, acoustic guitar, soft percussion',
    classical: 'string arrangements, orchestral swells, romantic harmonies',
    lofi: 'vinyl crackle, muted drums, nostalgic samples, warm bass',
  };

  const adjectives = moodAdjectives[mood] || moodAdjectives.calm;
  const elements = styleElements[style] || styleElements.piano;
  const randomAdj = adjectives[Math.floor(Math.random() * adjectives.length)];

  return `Create a ${randomAdj} ${category} music piece inspired by "${title}".

Theme: ${keywords}
Mood: ${mood} - ${adjectives.join(', ')}
Musical elements: ${elements}

The composition should evoke feelings of ${mood === 'melancholy' ? 'gentle melancholy and reflection' : mood === 'calm' ? 'deep peace and tranquility' : mood === 'dreamy' ? 'dreamlike wonder and mystery' : 'emotional warmth and comfort'}.

Build a soundscape that transports the listener to a place of inner peace.`;
}

// Generate prompt for lyrics generation
function generateLyricsPrompt(keywords: string, mood: string, style: string, category: string): string {
  return `You are a lyricist for healing and meditation music.

Write peaceful, healing Korean lyrics based on the following:

Context:
- Theme/Keywords: ${keywords}
- Mood: ${mood}
- Style: ${style}
- Category: ${category}

Requirements:
- Write 2-3 verses (4-6 lines each)
- Optional: Add a chorus
- Use simple, comforting Korean words
- Convey peace, hope, and healing
- Avoid complex metaphors
- Suitable for meditation/relaxation music

Format:
[Verse 1]
(lyrics here)

[Verse 2]
(lyrics here)

[Chorus] (optional)
(lyrics here)

Write the lyrics:`;
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
          content: 'You are a creative assistant specializing in Korean healing music content.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.8,
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'OpenAI API error');
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || '';
}

// Call Claude API
async function callClaude(apiKey: string, prompt: string): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Claude API error');
  }

  const data = await response.json();
  return data.content[0]?.text || '';
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
          temperature: 0.8,
          maxOutputTokens: 1000,
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

// POST: Generate text (title, lyrics, keywords, or music-prompt)
export async function POST(request: NextRequest) {
  const authResult = await verifyAuth(request);
  if (!authResult.success) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body: TextGenerationRequest = await request.json();
    const {
      type,
      keywords = '',
      mood = 'calm',
      style = 'piano',
      category = 'healing',
      title = '',
      count = 5,
    } = body;

    // Get API configuration
    const apiConfig = await getTextApiKey();
    if (!apiConfig || !apiConfig.apiKey) {
      return NextResponse.json(
        { success: false, error: 'Text API not configured. Please set up API key in settings.' },
        { status: 400 }
      );
    }

    // Generate prompt based on type
    let prompt: string;
    switch (type) {
      case 'keywords':
        // AI가 키워드/테마 자동 생성
        prompt = generateKeywordsPrompt(category, mood, style, count);
        break;
      case 'title':
        if (!keywords) {
          return NextResponse.json(
            { success: false, error: 'Keywords are required for title generation' },
            { status: 400 }
          );
        }
        prompt = generateTitlePrompt(keywords, mood, style, category, count);
        break;
      case 'music-prompt':
        // Suno에 전달할 음악 프롬프트 생성
        prompt = `Generate a creative music prompt for Suno AI based on:
Title: ${title}
Keywords: ${keywords}
Mood: ${mood}
Style: ${style}
Category: ${category}

${generateMusicPromptText(title, keywords, mood, style, category)}

Return ONLY the music prompt text, nothing else.`;
        break;
      case 'lyrics':
        if (!keywords) {
          return NextResponse.json(
            { success: false, error: 'Keywords are required for lyrics generation' },
            { status: 400 }
          );
        }
        prompt = generateLyricsPrompt(keywords, mood, style, category);
        break;
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid type' },
          { status: 400 }
        );
    }

    // Call appropriate API
    let generatedText: string;
    const provider = body.provider || apiConfig.provider;

    switch (provider) {
      case 'openai':
        generatedText = await callOpenAI(apiConfig.apiKey, prompt);
        break;
      case 'claude':
        generatedText = await callClaude(apiConfig.apiKey, prompt);
        break;
      case 'gemini':
        generatedText = await callGemini(apiConfig.apiKey, prompt);
        break;
      default:
        generatedText = await callOpenAI(apiConfig.apiKey, prompt);
    }

    // Parse response based on type
    let responseData: any = { text: generatedText.trim(), type, provider };

    if (type === 'keywords') {
      // Parse keywords into array
      const lines = generatedText.trim().split('\n').filter(line => line.trim());
      responseData.keywords = lines.map(line => line.trim());
    } else if (type === 'title') {
      // Parse titles into structured format
      const lines = generatedText.trim().split('\n').filter(line => line.includes('|'));
      responseData.titles = lines.map(line => {
        const [ko, en] = line.split('|').map(s => s.trim());
        return { ko, en };
      });
    }

    return NextResponse.json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error('Text generation error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to generate text' },
      { status: 500 }
    );
  }
}

// GET: Get available providers and status
export async function GET(request: NextRequest) {
  const authResult = await verifyAuth(request);
  if (!authResult.success) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const apiConfig = await getTextApiKey();

  return NextResponse.json({
    success: true,
    data: {
      enabled: !!apiConfig,
      provider: apiConfig?.provider || 'openai',
      types: ['title', 'lyrics', 'keywords', 'music-prompt'],
      moods: ['calm', 'energetic', 'dreamy', 'focus', 'melancholy', 'uplifting'],
      categories: ['healing', 'focus', 'sleep', 'nature', 'cafe', 'meditation'],
    },
  });
}
