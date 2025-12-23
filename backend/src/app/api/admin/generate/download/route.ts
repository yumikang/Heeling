import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-edge';
import { parseBuffer } from 'music-metadata';
import { saveToVPS, sanitizeFilename, generateFilePath } from '@/lib/vps-storage';

// Get audio duration from buffer
async function getAudioDuration(buffer: Buffer): Promise<number> {
  try {
    const metadata = await parseBuffer(buffer, { mimeType: 'audio/mpeg' });

    // 1. 메타데이터에서 직접 duration 가져오기
    if (metadata.format.duration) {
      return Math.round(metadata.format.duration);
    }

    // 2. CBR MP3의 경우 bitrate와 filesize로 계산
    if (metadata.format.bitrate && buffer.length > 0) {
      const durationSec = (buffer.length * 8) / metadata.format.bitrate;
      return Math.round(durationSec);
    }

    return 0;
  } catch (err) {
    console.warn('[Download API] Failed to get audio duration:', err);
    return 0;
  }
}

// POST: Download and save track/image to local storage
export async function POST(request: NextRequest) {
  const authResult = await verifyAuth(request);
  if (!authResult.success) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { audioUrl, imageUrl, title, style, mood, type = 'audio' } = body;

    const url = type === 'image' ? imageUrl : audioUrl;

    if (!url) {
      return NextResponse.json(
        { success: false, error: `${type === 'image' ? 'Image' : 'Audio'} URL is required` },
        { status: 400 }
      );
    }

    // Create safe filename (영문/숫자만 사용하여 URL 인코딩 문제 방지)
    const sanitizedTitle = sanitizeFilename((title || 'untitled')
      .replace(/\s+/g, '_')
      .substring(0, 50) || 'track');

    const timestamp = Date.now();
    const ext = type === 'image' ? 'jpg' : 'mp3';
    const filename = `${sanitizedTitle}_${style || 'music'}_${mood || 'calm'}_${timestamp}.${ext}`;

    // Download the file
    console.log(`[Download API] Downloading ${type}:`, url.substring(0, 60) + '...');
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract duration for audio files
    let duration = 0;
    if (type === 'audio') {
      duration = await getAudioDuration(buffer);
      console.log(`[Download API] Extracted duration: ${duration}s`);
    }

    // Save to VPS
    const fileType = type === 'image' ? 'cover' : 'audio';
    const relativePath = generateFilePath(fileType, filename);
    const saveResult = await saveToVPS(buffer, relativePath);

    if (!saveResult.success) {
      throw new Error(`Failed to save to VPS: ${saveResult.error}`);
    }

    console.log(`[Download API] Saved ${type} to VPS:`, saveResult.url, `(${(buffer.length / 1024).toFixed(2)} KB)`);

    return NextResponse.json({
      success: true,
      data: {
        filePath: saveResult.url,
        filename,
        size: buffer.length,
        type,
        duration,  // 오디오 파일의 경우 duration 포함
        vpsStorage: true,
        savedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[Download API] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to download' },
      { status: 500 }
    );
  }
}
