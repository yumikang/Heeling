"use client";

import React, { useState, useRef } from 'react';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  onError?: (message: string) => void;
  placeholder?: string;
  previewSize?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
}

const PREVIEW_SIZES = {
  sm: 'w-16 h-16',
  md: 'w-24 h-24',
  lg: 'w-32 h-32',
};

export default function ImageUpload({
  value,
  onChange,
  onError,
  placeholder = '이미지 업로드',
  previewSize = 'md',
  className = '',
  disabled = false,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    if (!file) return;

    // 파일 타입 검증
    if (!file.type.startsWith('image/')) {
      onError?.('이미지 파일만 업로드 가능합니다.');
      return;
    }

    // 파일 크기 검증 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      onError?.('파일 크기는 5MB 이하여야 합니다.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'image');

    try {
      setUploading(true);
      const response = await fetch('/api/admin/tracks/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        onChange(data.data.url);
      } else {
        onError?.(data.error || '업로드에 실패했습니다.');
      }
    } catch (err) {
      onError?.('업로드 중 오류가 발생했습니다.');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);

    if (disabled || uploading) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled && !uploading) {
      setDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleClear = () => {
    onChange('');
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div className={className}>
      {value ? (
        // 이미지 미리보기
        <div className="flex items-center gap-3">
          <div className={`${PREVIEW_SIZES[previewSize]} relative rounded-lg overflow-hidden bg-gray-800 flex-shrink-0`}>
            <img
              src={value}
              alt="Preview"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-green-400 text-sm truncate">{value}</p>
            <button
              type="button"
              onClick={handleClear}
              disabled={disabled}
              className="mt-1 flex items-center gap-1 text-gray-400 hover:text-red-400 text-sm transition-colors disabled:opacity-50"
            >
              <X size={14} />
              삭제
            </button>
          </div>
        </div>
      ) : (
        // 업로드 영역
        <div
          onClick={() => !disabled && !uploading && inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`
            flex items-center justify-center gap-2 px-4 py-3
            bg-gray-800 border border-dashed rounded-lg
            transition-colors cursor-pointer
            ${dragOver ? 'border-purple-500 bg-purple-500/10' : 'border-gray-600 hover:border-gray-500'}
            ${disabled || uploading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          {uploading ? (
            <>
              <Loader2 size={18} className="animate-spin text-purple-400" />
              <span className="text-gray-400 text-sm">업로드 중...</span>
            </>
          ) : (
            <>
              <Upload size={18} className="text-gray-400" />
              <span className="text-gray-400 text-sm">{placeholder}</span>
            </>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled || uploading}
      />
    </div>
  );
}

// 간단한 이미지 프리뷰 컴포넌트
export function ImagePreview({
  src,
  alt,
  size = 'md',
  fallbackIcon = true,
  className = '',
}: {
  src: string | null | undefined;
  alt?: string;
  size?: 'sm' | 'md' | 'lg';
  fallbackIcon?: boolean;
  className?: string;
}) {
  return (
    <div className={`${PREVIEW_SIZES[size]} bg-gray-800 rounded-lg overflow-hidden flex items-center justify-center ${className}`}>
      {src ? (
        <img
          src={src}
          alt={alt || ''}
          className="w-full h-full object-cover"
        />
      ) : fallbackIcon ? (
        <ImageIcon className="text-gray-600" size={size === 'sm' ? 20 : size === 'md' ? 28 : 36} />
      ) : null}
    </div>
  );
}
