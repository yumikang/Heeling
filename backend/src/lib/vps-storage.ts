/**
 * VPS File Storage Utility
 *
 * 모든 파일 데이터를 VPS에 직접 저장하는 유틸리티
 * - 로컬 환경: ssh/scp로 VPS에 업로드
 * - VPS 환경: 직접 파일시스템에 저장
 */

import { existsSync, writeFileSync, mkdirSync, unlinkSync } from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// VPS 설정
const VPS_HOST = process.env.VPS_HOST || '141.164.60.51';
const VPS_USER = process.env.VPS_USER || 'root';
const VPS_BASE_PATH = process.env.VPS_BASE_PATH || '/root/heeling';

// 현재 환경이 VPS인지 확인
export function isVPSEnvironment(): boolean {
  return process.env.IS_VPS === 'true' || process.env.NODE_ENV === 'production';
}

/**
 * 파일을 VPS에 저장
 * @param buffer 파일 데이터
 * @param relativePath public 폴더 기준 상대 경로 (예: 'media/covers/image.png')
 * @returns 저장된 파일의 URL 경로
 */
export async function saveToVPS(
  buffer: Buffer,
  relativePath: string
): Promise<{ success: boolean; url: string; error?: string }> {
  try {
    const isVPS = isVPSEnvironment();

    if (isVPS) {
      // VPS 환경: 직접 파일시스템에 저장
      return await saveDirectly(buffer, relativePath);
    } else {
      // 로컬 환경: SSH를 통해 VPS에 업로드
      return await uploadViaSSH(buffer, relativePath);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[VPS Storage] Failed to save file:', errorMessage);
    return {
      success: false,
      url: '',
      error: errorMessage,
    };
  }
}

/**
 * VPS 파일시스템에 직접 저장 (VPS 환경)
 */
async function saveDirectly(
  buffer: Buffer,
  relativePath: string
): Promise<{ success: boolean; url: string }> {
  // VPS의 public 폴더 경로
  const publicDir = path.join(VPS_BASE_PATH, 'backend', 'public');
  const fullPath = path.join(publicDir, relativePath);
  const dir = path.dirname(fullPath);

  // 디렉토리 생성 (동기 방식 - standalone 환경에서 더 안정적)
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  // 파일 저장 (동기 방식)
  writeFileSync(fullPath, buffer);

  console.log('[VPS Storage] Saved directly:', fullPath);

  return {
    success: true,
    url: `/${relativePath}`, // 웹 경로
  };
}

/**
 * SSH를 통해 VPS에 업로드 (로컬 환경)
 */
async function uploadViaSSH(
  buffer: Buffer,
  relativePath: string
): Promise<{ success: boolean; url: string }> {
  // 1. 임시 로컬 파일 생성 (동기 방식)
  const tempDir = '/tmp/heeling-upload';
  const tempFile = path.join(tempDir, path.basename(relativePath));

  if (!existsSync(tempDir)) {
    mkdirSync(tempDir, { recursive: true });
  }

  writeFileSync(tempFile, buffer);

  // 2. VPS 대상 경로
  const vpsPublicDir = `${VPS_BASE_PATH}/backend/public`;
  const vpsPath = `${vpsPublicDir}/${relativePath}`;
  const vpsDir = path.dirname(vpsPath);

  try {
    // 3. VPS에 디렉토리 생성
    await execAsync(
      `ssh -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_HOST} "mkdir -p ${vpsDir}"`
    );

    // 4. SCP로 파일 업로드
    await execAsync(
      `scp -o StrictHostKeyChecking=no "${tempFile}" ${VPS_USER}@${VPS_HOST}:"${vpsPath}"`
    );

    console.log('[VPS Storage] Uploaded via SSH:', vpsPath);

    return {
      success: true,
      url: `/${relativePath}`,
    };
  } catch (error) {
    console.error('[VPS Storage] SSH upload failed:', error);
    throw error;
  }
}

/**
 * VPS에서 파일 삭제
 */
export async function deleteFromVPS(
  relativePath: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const isVPS = isVPSEnvironment();
    const vpsPath = isVPS
      ? path.join(VPS_BASE_PATH, 'backend', 'public', relativePath)
      : `${VPS_BASE_PATH}/backend/public/${relativePath}`;

    if (isVPS) {
      // VPS 환경: 직접 삭제 (동기 방식)
      if (existsSync(vpsPath)) {
        unlinkSync(vpsPath);
      }
    } else {
      // 로컬 환경: SSH로 삭제
      await execAsync(
        `ssh -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_HOST} "rm -f ${vpsPath}"`
      );
    }

    console.log('[VPS Storage] Deleted:', vpsPath);
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[VPS Storage] Failed to delete file:', errorMessage);
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * 안전한 파일명 생성
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_+/g, '_')
    .substring(0, 100);
}

/**
 * 파일 경로 생성 헬퍼
 */
export function generateFilePath(
  type: 'audio' | 'image' | 'cover',
  filename: string
): string {
  const subDir = type === 'audio' ? 'media/generated' : type === 'cover' ? 'media/covers' : 'media/images';
  return `${subDir}/${filename}`;
}
