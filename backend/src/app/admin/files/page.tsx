"use client";

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { FolderOpen, File, Download, Trash2, Search, Filter, Music, Image as ImageIcon, Loader2, RefreshCw } from 'lucide-react';

interface FileInfo {
  id: string;
  name: string;
  type: string;
  size: number;
  path: string;
  url: string;
  createdAt: string;
}

interface Stats {
  totalFiles: number;
  totalSize: number;
  audioCount: number;
  imageCount: number;
}

export default function FileManager() {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [stats, setStats] = useState<Stats>({ totalFiles: 0, totalSize: 0, audioCount: 0, imageCount: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'audio' | 'image'>('all');
  const [deleteTarget, setDeleteTarget] = useState<FileInfo | null>(null);

  useEffect(() => {
    fetchFiles();
  }, [filterType]);

  const fetchFiles = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/files?type=${filterType}`);
      const data = await res.json();
      if (data.success) {
        setFiles(data.data.files);
        setStats(data.data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch files:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (file: FileInfo) => {
    if (!confirm(`"${file.name}" 파일을 삭제하시겠습니까?`)) return;

    try {
      const res = await fetch('/api/admin/files', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath: file.path }),
      });

      const data = await res.json();
      if (data.success) {
        fetchFiles();
      } else {
        alert(data.error || '삭제에 실패했습니다.');
      }
    } catch (error) {
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white">파일 보관함</h2>
          <p className="text-gray-400 mt-2">업로드된 모든 파일을 관리합니다.</p>
        </div>

        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={20} />
            <input
              type="text"
              placeholder="파일 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-gray-900 border border-gray-700 text-white pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:border-purple-500 w-64"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as 'all' | 'audio' | 'image')}
            className="bg-gray-800 border border-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-purple-500"
          >
            <option value="all">전체</option>
            <option value="audio">오디오</option>
            <option value="image">이미지</option>
          </select>
          <button
            onClick={fetchFiles}
            className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 border border-gray-700 transition-colors"
          >
            <RefreshCw size={20} />
            새로고침
          </button>
        </div>
      </div>

      {/* Storage Usage Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 flex items-center gap-4">
          <div className="p-3 bg-blue-900/30 rounded-lg text-blue-400">
            <FolderOpen size={24} />
          </div>
          <div>
            <p className="text-gray-400 text-sm">총 파일 수</p>
            <h3 className="text-2xl font-bold text-white">{stats.totalFiles.toLocaleString()}</h3>
          </div>
        </div>
        <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 flex items-center gap-4">
          <div className="p-3 bg-purple-900/30 rounded-lg text-purple-400">
            <File size={24} />
          </div>
          <div>
            <p className="text-gray-400 text-sm">사용 중인 용량</p>
            <h3 className="text-2xl font-bold text-white">{formatSize(stats.totalSize)}</h3>
          </div>
        </div>
        <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 flex items-center gap-4">
          <div className="p-3 bg-green-900/30 rounded-lg text-green-400">
            <Music size={24} />
          </div>
          <div>
            <p className="text-gray-400 text-sm">오디오 파일</p>
            <h3 className="text-2xl font-bold text-white">{stats.audioCount}</h3>
          </div>
        </div>
        <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 flex items-center gap-4">
          <div className="p-3 bg-pink-900/30 rounded-lg text-pink-400">
            <ImageIcon size={24} />
          </div>
          <div>
            <p className="text-gray-400 text-sm">이미지 파일</p>
            <h3 className="text-2xl font-bold text-white">{stats.imageCount}</h3>
          </div>
        </div>
      </div>

      {/* File List */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-800 text-gray-400 uppercase text-xs">
            <tr>
              <th className="px-6 py-4 font-medium">파일명</th>
              <th className="px-6 py-4 font-medium">유형</th>
              <th className="px-6 py-4 font-medium">크기</th>
              <th className="px-6 py-4 font-medium">업로드 일자</th>
              <th className="px-6 py-4 font-medium text-right">작업</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  <Loader2 className="animate-spin mx-auto mb-2" size={24} />
                  로딩 중...
                </td>
              </tr>
            ) : filteredFiles.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  {searchTerm ? '검색 결과가 없습니다.' : '업로드된 파일이 없습니다.'}
                </td>
              </tr>
            ) : (
              filteredFiles.map((file) => (
                <tr key={file.id} className="hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {file.type === 'audio' ? (
                        <Music className="text-green-400" size={20} />
                      ) : file.type === 'image' ? (
                        <ImageIcon className="text-pink-400" size={20} />
                      ) : (
                        <File className="text-gray-500" size={20} />
                      )}
                      <div>
                        <span className="text-white font-medium">{file.name}</span>
                        <p className="text-xs text-gray-500">{file.path}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      file.type === 'audio'
                        ? 'bg-green-900/30 text-green-400'
                        : file.type === 'image'
                        ? 'bg-pink-900/30 text-pink-400'
                        : 'bg-gray-800 text-gray-400'
                    }`}>
                      {file.type === 'audio' ? '오디오' : file.type === 'image' ? '이미지' : '기타'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-400">{formatSize(file.size)}</td>
                  <td className="px-6 py-4 text-gray-400">
                    {new Date(file.createdAt).toLocaleDateString('ko-KR')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <a
                        href={file.url}
                        download
                        className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-blue-400 transition-colors"
                        title="다운로드"
                      >
                        <Download size={18} />
                      </a>
                      <button
                        onClick={() => handleDelete(file)}
                        className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-red-400 transition-colors"
                        title="삭제"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
