"use client";

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { UploadCloud, Music, Trash2, Edit2, PlayCircle, Video, Loader2, X, Image as ImageIcon, Save } from 'lucide-react';

export default function MediaManager() {
    const [mediaList, setMediaList] = useState<any[]>([]);
    const [stats, setStats] = useState({ totalFiles: 0, totalSize: 0, totalDownloads: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const thumbnailInputRef = React.useRef<HTMLInputElement>(null);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTrack, setEditingTrack] = useState<any>(null);
    const [formData, setFormData] = useState({
        title: '',
        composer: '',
        tags: '',
        mood: '',
        thumbnailUrl: ''
    });

    useEffect(() => {
        fetchTracks();
    }, []);

    const fetchTracks = async () => {
        try {
            const res = await fetch('/api/tracks');
            const data = await res.json();
            if (data.success) {
                setMediaList(data.data);
                if (data.stats) setStats(data.stats);
            }
        } catch (error) {
            console.error('Failed to fetch tracks:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const file = e.dataTransfer.files?.[0];
        if (file) {
            await uploadFile(file);
        }
    };

    const uploadFile = async (file: File) => {
        setIsUploading(true);
        try {
            // 1. Upload File
            const formData = new FormData();
            formData.append('file', file);

            const uploadRes = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });
            const uploadData = await uploadRes.json();

            if (!uploadData.success) throw new Error('Upload failed');

            // 2. Create Track Record
            const trackRes = await fetch('/api/tracks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
                    fileUrl: uploadData.url,
                    fileSize: uploadData.size,
                    duration: 0, // TODO: Extract duration
                    type: file.type.startsWith('audio') ? 'audio' : 'video',
                    tags: ['New'],
                }),
            });

            if (trackRes.ok) {
                const newTrack = await trackRes.json();
                fetchTracks(); // Refresh list
                openEditModal(newTrack.data); // Open modal for metadata
            } else {
                throw new Error('Failed to create track record');
            }

        } catch (error) {
            console.error('Upload error:', error);
            alert('업로드 중 오류가 발생했습니다.');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        await uploadFile(file);
    };

    // Thumbnail Upload
    const handleThumbnailChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            const formData = new FormData();
            formData.append('file', file);

            const uploadRes = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });
            const uploadData = await uploadRes.json();

            if (uploadData.success) {
                setFormData(prev => ({ ...prev, thumbnailUrl: uploadData.url }));
            }
        } catch (error) {
            console.error('Thumbnail upload error:', error);
            alert('썸네일 업로드 실패');
        }
    };

    // Edit Modal Logic
    const openEditModal = (track: any) => {
        setEditingTrack(track);
        setFormData({
            title: track.title,
            composer: track.composer || '',
            tags: Array.isArray(track.tags) ? track.tags.join(', ') : '',
            mood: track.mood || '',
            thumbnailUrl: track.thumbnailUrl || ''
        });
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (!formData.title) return alert('제목을 입력해주세요.');

        try {
            const res = await fetch('/api/tracks', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: editingTrack.id,
                    ...formData,
                    tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean)
                })
            });

            if (res.ok) {
                setIsModalOpen(false);
                fetchTracks();
            } else {
                alert('저장 실패');
            }
        } catch (e) {
            console.error(e);
            alert('저장 중 오류 발생');
        }
    };

    const [playingUrl, setPlayingUrl] = useState<string | null>(null);
    const audioRef = React.useRef<HTMLAudioElement>(null);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const handleLoadStart = () => console.log("Audio: Load start");
        const handleLoadedMetadata = () => console.log("Audio: Metadata loaded", audio.duration);
        const handleWaiting = () => console.log("Audio: Waiting for data...");

        const handleCanPlay = () => {
            console.log("Audio: Ready to play (canplay)");
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.error("Playback failed:", error);
                    if (error.name !== 'AbortError') {
                        alert(`재생 오류: ${error.message}`);
                    }
                    setPlayingUrl(null);
                });
            }
        };

        const handleError = (e: any) => {
            const err = audio.error;
            console.error("Audio error event:", e);
            console.error("Audio error object:", err);
            console.error("Audio network state:", audio.networkState);

            if (playingUrl) {
                let msg = '알 수 없는 오류';
                if (err) {
                    switch (err.code) {
                        case 1: msg = '사용자가 취소함 (MEDIA_ERR_ABORTED)'; break;
                        case 2: msg = '네트워크 오류 (MEDIA_ERR_NETWORK)'; break;
                        case 3: msg = '디코딩 오류 (MEDIA_ERR_DECODE)'; break;
                        case 4: msg = '지원하지 않는 형식 (MEDIA_ERR_SRC_NOT_SUPPORTED)'; break;
                    }
                }
                alert(`오디오 로드 실패: ${msg} (Code: ${err?.code})`);
                setPlayingUrl(null);
            }
        };

        audio.addEventListener('loadstart', handleLoadStart);
        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('waiting', handleWaiting);
        audio.addEventListener('canplay', handleCanPlay);
        audio.addEventListener('error', handleError);

        if (playingUrl) {
            console.log("Setting audio src:", playingUrl);
            audio.src = playingUrl;
            audio.load();
        } else {
            audio.pause();
            audio.currentTime = 0;
            // Do NOT set src = "" as it causes errors in some browsers
            audio.removeAttribute('src');
        }

        return () => {
            audio.removeEventListener('loadstart', handleLoadStart);
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('waiting', handleWaiting);
            audio.removeEventListener('canplay', handleCanPlay);
            audio.removeEventListener('error', handleError);
        };
    }, [playingUrl]);

    const handlePlay = (url: string, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent row click
        if (playingUrl === url) {
            setPlayingUrl(null); // Stop if clicking same
        } else {
            setPlayingUrl(url);
        }
    };

    return (
        <AdminLayout>
            {/* Debug: Show audio player to check volume/mute status */}
            <audio ref={audioRef} onEnded={() => setPlayingUrl(null)} controls className="fixed bottom-4 right-4 z-50 bg-white rounded-full shadow-xl" />

            {/* Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-gray-900 rounded-xl w-full max-w-2xl border border-gray-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center p-6 border-b border-gray-800">
                            <h3 className="text-xl font-bold text-white">미디어 정보 수정</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                            {/* Thumbnail & Basic Info */}
                            <div className="flex flex-col md:flex-row gap-6">
                                <div
                                    className="w-full md:w-48 h-48 bg-gray-800 rounded-xl flex items-center justify-center relative group cursor-pointer overflow-hidden border-2 border-dashed border-gray-700 hover:border-purple-500 transition-colors shrink-0"
                                    onClick={() => thumbnailInputRef.current?.click()}
                                >
                                    {formData.thumbnailUrl ? (
                                        <img src={formData.thumbnailUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="flex flex-col items-center text-gray-500">
                                            <ImageIcon size={32} className="mb-2" />
                                            <span className="text-xs">썸네일 업로드</span>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <p className="text-sm text-white font-medium">변경하기</p>
                                    </div>
                                    <input
                                        type="file"
                                        ref={thumbnailInputRef}
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleThumbnailChange}
                                    />
                                </div>

                                <div className="flex-1 space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-1">제목 <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            value={formData.title}
                                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                                            placeholder="트랙 제목을 입력하세요"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-1">아티스트 (Composer)</label>
                                        <input
                                            type="text"
                                            value={formData.composer}
                                            onChange={e => setFormData({ ...formData, composer: e.target.value })}
                                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                                            placeholder="작곡가 또는 아티스트"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Additional Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">태그 (쉼표로 구분)</label>
                                    <input
                                        type="text"
                                        value={formData.tags}
                                        onChange={e => setFormData({ ...formData, tags: e.target.value })}
                                        placeholder="예: 집중, 수면, 카페"
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">분위기 (Mood)</label>
                                    <select
                                        value={formData.mood}
                                        onChange={e => setFormData({ ...formData, mood: e.target.value })}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors appearance-none"
                                    >
                                        <option value="">선택안함</option>
                                        <option value="calm">Calm (차분함)</option>
                                        <option value="energetic">Energetic (활기참)</option>
                                        <option value="dreamy">Dreamy (몽환적)</option>
                                        <option value="focus">Focus (집중)</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-800 flex justify-end gap-3 bg-gray-900/50">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2 text-gray-400 hover:text-white transition-colors font-medium"
                            >
                                취소
                            </button>
                            <button
                                onClick={handleSave}
                                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-lg shadow-purple-900/20"
                            >
                                <Save size={18} />
                                저장하기
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-white">미디어 관리</h2>
                    <p className="text-gray-400 mt-2 text-sm md:text-base">앱에서 사용되는 음악 및 비디오 파일을 관리합니다.</p>
                </div>
                <button
                    onClick={handleUploadClick}
                    disabled={isUploading}
                    className="w-full md:w-auto bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg flex items-center justify-center gap-2 font-medium transition-colors disabled:opacity-50 shadow-lg shadow-purple-900/20"
                >
                    {isUploading ? <Loader2 className="animate-spin" size={20} /> : <UploadCloud size={20} />}
                    {isUploading ? '업로드 중...' : '미디어 업로드'}
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 flex items-center gap-4">
                    <div className="p-3 bg-blue-900/30 rounded-lg text-blue-400">
                        <Music size={24} />
                    </div>
                    <div>
                        <p className="text-gray-400 text-sm">총 파일 수</p>
                        <h3 className="text-2xl font-bold text-white">{stats.totalFiles.toLocaleString()}</h3>
                    </div>
                </div>
                <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 flex items-center gap-4">
                    <div className="p-3 bg-purple-900/30 rounded-lg text-purple-400">
                        <Video size={24} />
                    </div>
                    <div>
                        <p className="text-gray-400 text-sm">사용 중인 용량</p>
                        <h3 className="text-2xl font-bold text-white">{formatSize(stats.totalSize)}</h3>
                    </div>
                </div>
                <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 flex items-center gap-4">
                    <div className="p-3 bg-green-900/30 rounded-lg text-green-400">
                        <UploadCloud size={24} />
                    </div>
                    <div>
                        <p className="text-gray-400 text-sm">이번 달 다운로드</p>
                        <h3 className="text-2xl font-bold text-white">{stats.totalDownloads.toLocaleString()}</h3>
                    </div>
                </div>
            </div>

            {/* Upload Area */}
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={!isUploading ? handleUploadClick : undefined}
                className={`border-2 border-dashed rounded-xl p-8 md:p-12 mb-8 flex flex-col items-center justify-center text-gray-400 transition-all ${isDragging
                    ? 'border-purple-500 bg-purple-900/20 scale-[1.02]'
                    : 'border-gray-700 hover:border-purple-500 hover:bg-gray-900/50'
                    } ${!isUploading ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="audio/*,video/*"
                    onChange={handleFileChange}
                    disabled={isUploading}
                />
                <UploadCloud size={48} className={`mb-4 ${isDragging ? 'text-purple-400' : 'text-gray-500'}`} />
                <p className="text-lg font-medium text-gray-300 text-center">
                    {isDragging ? '파일을 여기에 놓으세요' : '파일을 드래그하여 업로드하거나 클릭하세요'}
                </p>
                <p className="text-sm mt-2 text-center">지원 형식: MP3, MP4, WAV (최대 500MB)</p>
            </div>

            {/* Media List Table */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[800px]">
                        <thead className="bg-gray-800 text-gray-400 uppercase text-xs">
                            <tr>
                                <th className="px-6 py-4 font-medium">파일명</th>
                                <th className="px-6 py-4 font-medium">타입</th>
                                <th className="px-6 py-4 font-medium">크기</th>
                                <th className="px-6 py-4 font-medium">업로드 일자</th>
                                <th className="px-6 py-4 font-medium text-right">관리</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                        <Loader2 className="animate-spin mx-auto mb-2" />
                                        로딩 중...
                                    </td>
                                </tr>
                            ) : mediaList.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                        업로드된 미디어가 없습니다.
                                    </td>
                                </tr>
                            ) : (
                                mediaList.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-800/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="relative w-12 h-12 shrink-0">
                                                    {item.thumbnailUrl ? (
                                                        <img src={item.thumbnailUrl} alt="Cover" className="w-full h-full rounded-lg object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full bg-purple-900/30 rounded-lg flex items-center justify-center text-purple-400">
                                                            <Music size={20} />
                                                        </div>
                                                    )}
                                                    <button
                                                        onClick={(e) => handlePlay(item.fileUrl, e)}
                                                        className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg text-white hover:bg-black/60"
                                                    >
                                                        {playingUrl === item.fileUrl ? <div className="w-3 h-3 bg-white rounded-sm animate-pulse" /> : <PlayCircle size={24} />}
                                                    </button>
                                                </div>
                                                <div>
                                                    <p className="text-white font-medium">{item.title}</p>
                                                    <p className="text-sm text-gray-500">{item.composer}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-900/30 text-blue-400">
                                                Audio
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-400">
                                            {item.fileSize ? `${(item.fileSize / 1024 / 1024).toFixed(1)} MB` : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-gray-400">
                                            {new Date(item.createdAt || Date.now()).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => openEditModal(item)}
                                                    className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-blue-400 transition-colors"
                                                    title="Edit Metadata"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-red-400 transition-colors" title="Delete">
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
            </div>
        </AdminLayout>
    );
}
