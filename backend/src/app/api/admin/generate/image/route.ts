import { NextRequest, NextResponse } from 'next/server';
import { ImagenClient, generateArtworkPrompt, ART_STYLES, CATEGORY_SCENES } from '@/lib/imagen-client';
import { verifyAuth } from '@/lib/auth-edge';
import { prisma } from '@/lib/prisma';
import { saveToVPS, sanitizeFilename, generateFilePath } from '@/lib/vps-storage';

// Decrypt API key
function decryptKey(encrypted: string): string {
  if (!encrypted) return '';
  const buffer = Buffer.from(encrypted, 'base64');
  return buffer.toString('utf8');
}

// Get Gemini API key from settings or env
async function getImagenClient(): Promise<ImagenClient> {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'ai_image' },
    });

    if (setting && (setting.value as any).enabled && (setting.value as any).apiKey) {
      const apiKey = decryptKey((setting.value as any).apiKey);
      console.log('[Image API] Using API key from database settings');
      return new ImagenClient(apiKey);
    }
  } catch (error) {
    console.error('[Image API] Failed to get Gemini API key from settings:', error);
  }

  // Fallback to env variable
  console.log('[Image API] Using API key from environment variable');
  return new ImagenClient(process.env.GEMINI_API_KEY || '');
}

// POST: Generate album artwork
export async function POST(request: NextRequest) {
  const authResult = await verifyAuth(request);
  if (!authResult.success) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      title,
      category,
      mood,
      style,
      artStyle,  // 새로운 아트 스타일 옵션
      keywords,
      customPrompt,
      save = false,
      variation = 0,  // 동일 배치 내 트랙별 변형 인덱스
    } = body;

    if (!title && !customPrompt) {
      return NextResponse.json(
        { success: false, error: 'Title or customPrompt is required' },
        { status: 400 }
      );
    }

    // 변형을 위한 추가 키워드 (같은 제목이라도 다른 이미지 생성)
    const variationKeywords = variation > 0 ? [
      'different composition',
      'alternative perspective',
      'unique lighting',
      'varied color palette',
      'distinct atmosphere',
    ][variation % 5] : '';

    // Generate prompt with new diverse styles
    const basePrompt = customPrompt || generateArtworkPrompt({
      title,
      category: category || 'healing',
      mood,
      style: artStyle,  // 새로운 ART_STYLES 키 사용
      keywords: variationKeywords ? `${keywords || ''}, ${variationKeywords}` : keywords,
    });

    const prompt = basePrompt;

    console.log('[Image API] Generating image with prompt:', prompt.substring(0, 150) + '...');
    console.log('[Image API] Art style:', artStyle || 'random', '| Category:', category, '| Mood:', mood);

    // Get Imagen client with API key from settings
    const imagenClient = await getImagenClient();

    // Generate image (9:16 for mobile fullscreen player)
    const images = await imagenClient.generateImage({
      prompt,
      numberOfImages: 1,
      aspectRatio: '9:16',
    });

    console.log('[Image API] Generated', images.length, 'image(s)');

    // Record successful API usage
    try {
      await fetch(new URL('/api/admin/generate/cache', request.url).toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: request.headers.get('cookie') || '' },
        body: JSON.stringify({ type: 'usage', data: { apiType: 'imagen', success: true, count: 1 } }),
      });
    } catch (e) {
      console.error('[Image API] Failed to record usage:', e);
    }

    if (images.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No image generated' },
        { status: 500 }
      );
    }

    // If save requested, save to VPS
    if (save && images[0].bytesBase64Encoded) {
      const buffer = Buffer.from(images[0].bytesBase64Encoded, 'base64');

      // 안전한 파일명 생성 (영문/숫자만)
      const safeTitle = sanitizeFilename((title || 'cover')
        .replace(/\s+/g, '_')
        .substring(0, 30) || 'cover');
      const filename = `${safeTitle}_${artStyle || 'art'}_${Date.now()}.png`;
      const relativePath = generateFilePath('cover', filename);

      // VPS에 저장
      const result = await saveToVPS(buffer, relativePath);

      if (!result.success) {
        return NextResponse.json({
          success: false,
          error: `Failed to save to VPS: ${result.error}`,
        }, { status: 500 });
      }

      console.log('[Image API] Saved to VPS:', result.url, '(' + (buffer.length / 1024).toFixed(2) + ' KB)');

      return NextResponse.json({
        success: true,
        data: {
          url: result.url,
          filename,
          saved: true,
          vpsStorage: true,
          prompt: prompt.substring(0, 200),
        },
      });
    }

    // Return base64 image
    console.log('[Image API] Returning base64 image (not saved)');
    return NextResponse.json({
      success: true,
      data: {
        base64: images[0].bytesBase64Encoded,
        mimeType: images[0].mimeType,
        dataUrl: `data:${images[0].mimeType};base64,${images[0].bytesBase64Encoded}`,
        saved: false,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Image API] Generation error:', errorMessage);
    console.error('[Image API] Full error:', error);

    // Record failed API usage
    try {
      await fetch(new URL('/api/admin/generate/cache', request.url).toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: request.headers.get('cookie') || '' },
        body: JSON.stringify({ type: 'usage', data: { apiType: 'imagen', success: false, count: 1 } }),
      });
    } catch (e) {
      console.error('[Image API] Failed to record usage:', e);
    }

    return NextResponse.json(
      { success: false, error: `Failed to generate image: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// GET: Get available presets and styles
export async function GET(request: NextRequest) {
  const authResult = await verifyAuth(request);
  if (!authResult.success) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  // 스타일을 그룹별로 정리
  const styleGroups = {
    painting: ['watercolor', 'oilPainting', 'impressionist', 'japanese', 'chinese', 'korean'],
    digital: ['digital3d', 'gradient', 'glassmorphism', 'geometric', 'lowPoly'],
    photography: ['cinematic', 'ethereal', 'macro', 'aerial'],
    illustration: ['anime', 'lofi', 'vintage', 'botanical'],
    abstract: ['abstract', 'surreal', 'minimal'],
  };

  return NextResponse.json({
    success: true,
    data: {
      categories: Object.keys(CATEGORY_SCENES),
      artStyles: Object.keys(ART_STYLES),
      styleGroups,
      styleDescriptions: {
        watercolor: '수채화',
        oilPainting: '유화',
        impressionist: '인상파',
        japanese: '일본화 (우키요에)',
        chinese: '중국 수묵화',
        korean: '민화',
        digital3d: '3D 렌더링',
        gradient: '그라데이션',
        glassmorphism: '글래스모피즘',
        geometric: '기하학적',
        lowPoly: '로우폴리',
        cinematic: '시네마틱',
        ethereal: '몽환적',
        macro: '매크로',
        aerial: '항공뷰',
        anime: '애니메이션',
        lofi: '로파이',
        vintage: '빈티지',
        botanical: '보태니컬',
        abstract: '추상화',
        surreal: '초현실주의',
        minimal: '미니멀',
      },
    },
  });
}
