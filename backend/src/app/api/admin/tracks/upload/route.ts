import { NextRequest, NextResponse } from 'next/server';
import { saveToVPS, sanitizeFilename, generateFilePath } from '@/lib/vps-storage';

// 허용된 파일 타입
const ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/x-m4a'];
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

// 파일 크기 제한 (MB)
const MAX_AUDIO_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;  // 5MB

// ============================================
// POST /api/admin/tracks/upload - 파일 업로드
// ============================================
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const type = formData.get('type') as string || 'audio'; // 'audio' or 'image'

    if (!file) {
      return NextResponse.json(
        { success: false, error: '파일이 없습니다.' },
        { status: 400 }
      );
    }

    // 파일 타입 검증
    const isAudio = type === 'audio';
    const allowedTypes = isAudio ? ALLOWED_AUDIO_TYPES : ALLOWED_IMAGE_TYPES;
    const maxSize = isAudio ? MAX_AUDIO_SIZE : MAX_IMAGE_SIZE;

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: `허용되지 않는 파일 형식입니다. 허용: ${allowedTypes.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // 파일 크기 검증
    if (file.size > maxSize) {
      const maxSizeMB = maxSize / (1024 * 1024);
      return NextResponse.json(
        { success: false, error: `파일 크기는 ${maxSizeMB}MB 이하여야 합니다.` },
        { status: 400 }
      );
    }

    // 파일명 생성 (timestamp + 원본 이름)
    const timestamp = Date.now();
    const originalName = sanitizeFilename(file.name);
    const fileName = `${timestamp}_${originalName}`;

    // 파일 타입에 맞는 경로 생성
    const fileType = isAudio ? 'audio' : 'image';
    const relativePath = generateFilePath(fileType, fileName);

    // 파일 읽기
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // VPS에 저장
    const saveResult = await saveToVPS(buffer, relativePath);

    if (!saveResult.success) {
      return NextResponse.json(
        { success: false, error: `VPS 저장 실패: ${saveResult.error}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        url: saveResult.url,
        fileName,
        originalName: file.name,
        size: file.size,
        type: file.type,
        vpsStorage: true,
      },
      message: '파일이 VPS에 업로드되었습니다.',
    });
  } catch (error) {
    console.error('POST /api/admin/tracks/upload error:', error);
    return NextResponse.json(
      { success: false, error: '파일 업로드에 실패했습니다.' },
      { status: 500 }
    );
  }
}
