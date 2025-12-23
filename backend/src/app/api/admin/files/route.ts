import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import fs from 'fs/promises';
import path from 'path';

// 업로드 디렉토리 경로
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

interface FileInfo {
  id: string;
  name: string;
  type: string;
  size: number;
  path: string;
  url: string;
  createdAt: Date;
}

// GET: 업로드된 파일 목록 조회
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session.isAuthenticated) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // audio, image, all

    // 업로드 디렉토리 존재 확인
    try {
      await fs.access(UPLOAD_DIR);
    } catch {
      await fs.mkdir(UPLOAD_DIR, { recursive: true });
      return NextResponse.json({
        success: true,
        data: {
          files: [],
          stats: { totalFiles: 0, totalSize: 0, audioCount: 0, imageCount: 0 },
        },
      });
    }

    // 하위 디렉토리 포함 파일 목록 조회
    const files: FileInfo[] = [];
    const subDirs = ['audio', 'images', 'thumbnails'];

    for (const subDir of subDirs) {
      const dirPath = path.join(UPLOAD_DIR, subDir);
      try {
        await fs.access(dirPath);
        const dirFiles = await fs.readdir(dirPath);

        for (const fileName of dirFiles) {
          const filePath = path.join(dirPath, fileName);
          const stat = await fs.stat(filePath);

          if (stat.isFile()) {
            const ext = path.extname(fileName).toLowerCase();
            const fileType = getFileType(ext, subDir);

            // 타입 필터링
            if (type && type !== 'all') {
              if (type === 'audio' && fileType !== 'audio') continue;
              if (type === 'image' && fileType !== 'image') continue;
            }

            files.push({
              id: `${subDir}-${fileName}`,
              name: fileName,
              type: fileType,
              size: stat.size,
              path: `${subDir}/${fileName}`,
              url: `/uploads/${subDir}/${fileName}`,
              createdAt: stat.birthtime,
            });
          }
        }
      } catch {
        // 디렉토리가 없으면 스킵
        continue;
      }
    }

    // 최신순 정렬
    files.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // 통계 계산
    const stats = {
      totalFiles: files.length,
      totalSize: files.reduce((sum, f) => sum + f.size, 0),
      audioCount: files.filter(f => f.type === 'audio').length,
      imageCount: files.filter(f => f.type === 'image').length,
    };

    return NextResponse.json({
      success: true,
      data: { files, stats },
    });
  } catch (error) {
    console.error('Files GET error:', error);
    return NextResponse.json({ error: '파일 목록 조회에 실패했습니다.' }, { status: 500 });
  }
}

// DELETE: 파일 삭제
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session.isAuthenticated) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const { filePath } = await request.json();

    if (!filePath) {
      return NextResponse.json({ error: '파일 경로가 필요합니다.' }, { status: 400 });
    }

    // 경로 검증 (보안)
    const normalizedPath = path.normalize(filePath);
    if (normalizedPath.includes('..')) {
      return NextResponse.json({ error: '잘못된 파일 경로입니다.' }, { status: 400 });
    }

    const fullPath = path.join(UPLOAD_DIR, normalizedPath);

    // 파일 존재 확인
    try {
      await fs.access(fullPath);
    } catch {
      return NextResponse.json({ error: '파일을 찾을 수 없습니다.' }, { status: 404 });
    }

    // 파일 삭제
    await fs.unlink(fullPath);

    // Track에서 해당 파일을 참조하는 경우 업데이트 (optional)
    const fileUrl = `/uploads/${normalizedPath}`;
    await prisma.track.updateMany({
      where: {
        OR: [
          { fileUrl },
          { thumbnailUrl: fileUrl },
        ],
      },
      data: {
        isActive: false,
      },
    });

    return NextResponse.json({
      success: true,
      message: '파일이 삭제되었습니다.',
    });
  } catch (error) {
    console.error('Files DELETE error:', error);
    return NextResponse.json({ error: '파일 삭제에 실패했습니다.' }, { status: 500 });
  }
}

function getFileType(ext: string, subDir: string): string {
  const audioExts = ['.mp3', '.wav', '.m4a', '.aac', '.flac', '.ogg'];
  const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];

  if (audioExts.includes(ext) || subDir === 'audio') return 'audio';
  if (imageExts.includes(ext) || subDir === 'images' || subDir === 'thumbnails') return 'image';
  return 'other';
}
