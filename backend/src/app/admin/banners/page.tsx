"use client";

import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/AdminLayout';
import {
  Plus,
  Trash2,
  ExternalLink,
  Save,
  X,
  Eye,
  EyeOff,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Upload,
  Image as ImageIcon,
  Calendar
} from 'lucide-react';

// 배너 타입 정의
const BANNER_TYPES = {
  HERO: { label: '트랙 배너', color: 'bg-purple-500' },
  PROMOTION: { label: '프로모션 배너', color: 'bg-blue-500' },
  EVENT: { label: '이벤트 배너', color: 'bg-green-500' },
  NOTICE: { label: '공지 배너', color: 'bg-orange-500' },
};

interface Banner {
  id: string;
  type: keyof typeof BANNER_TYPES;
  title: string;
  subtitle: string | null;
  imageUrl: string;
  linkType: string | null;
  linkTarget: string | null;
  backgroundColor: string | null;
  sortOrder: number;
  isActive: boolean;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
}

export default function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('');

  // 새 배너 폼 상태
  const [newBanner, setNewBanner] = useState({
    type: 'HERO' as keyof typeof BANNER_TYPES,
    title: '',
    subtitle: '',
    imageUrl: '',
    linkType: 'url',
    linkTarget: '',
    backgroundColor: '',
    startDate: '',
    endDate: '',
  });

  // 배너 목록 조회
  const fetchBanners = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterType) params.append('type', filterType);

      const response = await fetch(`/api/admin/banners?${params}`);
      const data = await response.json();

      if (data.success) {
        setBanners(data.data);
      } else {
        setError(data.error || '배너 목록을 불러오는데 실패했습니다.');
      }
    } catch (err) {
      setError('서버 연결에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [filterType]);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  // 이미지 업로드
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'new' | string) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
        if (target === 'new') {
          setNewBanner(prev => ({ ...prev, imageUrl: data.data.url }));
        } else {
          setBanners(prev =>
            prev.map(b => b.id === target ? { ...b, imageUrl: data.data.url } : b)
          );
        }
      } else {
        alert(data.error || '업로드에 실패했습니다.');
      }
    } catch (err) {
      alert('업로드 중 오류가 발생했습니다.');
    } finally {
      setUploading(false);
    }
  };

  // 배너 생성
  const handleCreateBanner = async () => {
    if (!newBanner.title || !newBanner.imageUrl) {
      alert('제목과 이미지는 필수입니다.');
      return;
    }

    try {
      setSaving(true);
      const response = await fetch('/api/admin/banners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newBanner,
          subtitle: newBanner.subtitle || null,
          linkTarget: newBanner.linkTarget || null,
          backgroundColor: newBanner.backgroundColor || null,
          startDate: newBanner.startDate || null,
          endDate: newBanner.endDate || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        await fetchBanners();
        setIsCreating(false);
        setNewBanner({
          type: 'HERO',
          title: '',
          subtitle: '',
          imageUrl: '',
          linkType: 'url',
          linkTarget: '',
          backgroundColor: '',
          startDate: '',
          endDate: '',
        });
      } else {
        alert(data.error || '배너 생성에 실패했습니다.');
      }
    } catch (err) {
      alert('서버 연결에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // 배너 수정 저장
  const handleSaveBanner = async (banner: Banner) => {
    try {
      setSaving(true);
      const response = await fetch(`/api/admin/banners/${banner.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: banner.title,
          subtitle: banner.subtitle,
          imageUrl: banner.imageUrl,
          linkType: banner.linkType,
          linkTarget: banner.linkTarget,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setEditingId(null);
      } else {
        alert(data.error || '저장에 실패했습니다.');
      }
    } catch (err) {
      alert('서버 연결에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // 배너 삭제
  const handleDeleteBanner = async (id: string) => {
    if (!confirm('이 배너를 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/admin/banners/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        await fetchBanners();
      } else {
        alert(data.error || '배너 삭제에 실패했습니다.');
      }
    } catch (err) {
      alert('서버 연결에 실패했습니다.');
    }
  };

  // 배너 활성화/비활성화 토글
  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/banners/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentActive }),
      });

      const data = await response.json();

      if (data.success) {
        setBanners(prev =>
          prev.map(b => b.id === id ? { ...b, isActive: !currentActive } : b)
        );
      } else {
        alert(data.error || '상태 변경에 실패했습니다.');
      }
    } catch (err) {
      alert('서버 연결에 실패했습니다.');
    }
  };

  // 배너 순서 변경
  const handleMoveBanner = async (id: string, direction: 'up' | 'down') => {
    const currentIndex = banners.findIndex(b => b.id === id);
    if (
      (direction === 'up' && currentIndex === 0) ||
      (direction === 'down' && currentIndex === banners.length - 1)
    ) {
      return;
    }

    const newBanners = [...banners];
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    [newBanners[currentIndex], newBanners[targetIndex]] =
      [newBanners[targetIndex], newBanners[currentIndex]];

    const updatedBanners = newBanners.map((b, idx) => ({
      ...b,
      sortOrder: idx,
    }));

    setBanners(updatedBanners);

    try {
      await fetch('/api/admin/banners', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          banners: updatedBanners.map(b => ({ id: b.id, sortOrder: b.sortOrder })),
        }),
      });
    } catch (err) {
      console.error('순서 저장 실패:', err);
      fetchBanners();
    }
  };

  // 배너 필드 업데이트
  const handleFieldChange = (id: string, field: keyof Banner, value: any) => {
    setBanners(prev =>
      prev.map(b => b.id === id ? { ...b, [field]: value } : b)
    );
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white">배너 관리</h2>
          <p className="text-gray-400 mt-2">앱 홈 화면의 배너를 관리합니다.</p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 font-medium transition-colors"
        >
          <Plus size={20} />
          새 배너 추가
        </button>
      </div>

      {/* 타입 필터 */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setFilterType('')}
          className={`px-4 py-2 rounded-lg transition-colors ${filterType === '' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
        >
          전체
        </button>
        {Object.entries(BANNER_TYPES).map(([key, value]) => (
          <button
            key={key}
            onClick={() => setFilterType(key)}
            className={`px-4 py-2 rounded-lg transition-colors ${filterType === key ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
          >
            {value.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
          {error}
        </div>
      )}

      {/* 새 배너 생성 폼 */}
      {isCreating && (
        <div className="mb-6 p-6 bg-gray-900 rounded-xl border border-gray-800">
          <h3 className="text-xl font-bold text-white mb-4">새 배너 추가</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">배너 타입*</label>
              <select
                value={newBanner.type}
                onChange={(e) => setNewBanner(prev => ({ ...prev, type: e.target.value as keyof typeof BANNER_TYPES }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
              >
                {Object.entries(BANNER_TYPES).map(([key, value]) => (
                  <option key={key} value={key}>{value.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">제목*</label>
              <input
                type="text"
                value={newBanner.title}
                onChange={(e) => setNewBanner(prev => ({ ...prev, title: e.target.value }))}
                placeholder="배너 제목"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">부제목</label>
              <input
                type="text"
                value={newBanner.subtitle}
                onChange={(e) => setNewBanner(prev => ({ ...prev, subtitle: e.target.value }))}
                placeholder="부제목 (선택)"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">이미지*</label>
              <div className="flex items-center gap-2">
                {newBanner.imageUrl ? (
                  <span className="flex-1 text-green-400 text-sm truncate">{newBanner.imageUrl}</span>
                ) : (
                  <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-800 border border-dashed border-gray-600 rounded-lg cursor-pointer hover:border-gray-500">
                    <Upload size={16} />
                    <span className="text-gray-400 text-sm">이미지 업로드</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 'new')}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">링크 대상</label>
              <input
                type="text"
                value={newBanner.linkTarget}
                onChange={(e) => setNewBanner(prev => ({ ...prev, linkTarget: e.target.value }))}
                placeholder="https://example.com 또는 /events/123"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm text-gray-400 mb-2">시작일</label>
                <input
                  type="datetime-local"
                  value={newBanner.startDate}
                  onChange={(e) => setNewBanner(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">종료일</label>
                <input
                  type="datetime-local"
                  value={newBanner.endDate}
                  onChange={(e) => setNewBanner(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleCreateBanner}
              disabled={saving || uploading}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white transition-colors disabled:opacity-50"
            >
              <Save size={16} />
              <span>{saving ? '저장 중...' : '저장'}</span>
            </button>
            <button
              onClick={() => setIsCreating(false)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors"
            >
              <X size={16} />
              <span>취소</span>
            </button>
          </div>
        </div>
      )}

      {/* 배너 목록 */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-400">로딩 중...</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {banners.length === 0 ? (
            <div className="md:col-span-2 text-center py-12 text-gray-400">
              등록된 배너가 없습니다. "새 배너 추가" 버튼을 클릭하여 배너를 등록하세요.
            </div>
          ) : (
            banners.map((banner, index) => {
              const typeInfo = BANNER_TYPES[banner.type] || BANNER_TYPES.HERO;
              const isEditing = editingId === banner.id;

              return (
                <div
                  key={banner.id}
                  className={`bg-gray-900 rounded-xl border overflow-hidden group ${banner.isActive ? 'border-gray-800' : 'border-gray-800/50 opacity-60'
                    }`}
                >
                  {/* Banner Preview Area */}
                  <div className="h-48 bg-gray-800 relative flex items-center justify-center">
                    {banner.imageUrl ? (
                      <img
                        src={banner.imageUrl}
                        alt={banner.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="text-gray-600" size={48} />
                    )}

                    {/* 배너 타입 뱃지 */}
                    <span className={`absolute top-3 left-3 px-2 py-1 ${typeInfo.color} text-white text-xs rounded`}>
                      {typeInfo.label}
                    </span>

                    {/* 순서 변경 버튼 */}
                    <div className="absolute top-3 right-3 flex flex-col gap-1">
                      <button
                        onClick={() => handleMoveBanner(banner.id, 'up')}
                        disabled={index === 0}
                        className="p-1 bg-black/50 rounded hover:bg-black/70 disabled:opacity-30"
                      >
                        <ChevronUp size={16} className="text-white" />
                      </button>
                      <button
                        onClick={() => handleMoveBanner(banner.id, 'down')}
                        disabled={index === banners.length - 1}
                        className="p-1 bg-black/50 rounded hover:bg-black/70 disabled:opacity-30"
                      >
                        <ChevronDown size={16} className="text-white" />
                      </button>
                    </div>

                    {/* 삭제 버튼 */}
                    <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleDeleteBanner(banner.id)}
                        className="p-2 bg-red-600 rounded-lg text-white hover:bg-red-700"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Edit Form */}
                  <div className="p-6 space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">배너 제목</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={banner.title}
                          onChange={(e) => handleFieldChange(banner.id, 'title', e.target.value)}
                          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                        />
                      ) : (
                        <p className="text-white">{banner.title}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">설명 텍스트</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={banner.subtitle || ''}
                          onChange={(e) => handleFieldChange(banner.id, 'subtitle', e.target.value)}
                          placeholder="설명 텍스트 (선택)"
                          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                        />
                      ) : (
                        <p className="text-gray-400 text-sm">{banner.subtitle || '설명 없음'}</p>
                      )}
                    </div>

                    {isEditing && (
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">이미지 변경</label>
                        <label className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-800 border border-dashed border-gray-600 rounded-lg cursor-pointer hover:border-gray-500 transition-colors">
                          <Upload size={16} className="text-gray-400" />
                          <span className="text-gray-400 text-sm">
                            {uploading ? '업로드 중...' : '새 이미지 업로드'}
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e, banner.id)}
                            className="hidden"
                            disabled={uploading}
                          />
                        </label>
                        {banner.imageUrl && (
                          <p className="text-xs text-gray-500 mt-1 truncate">현재: {banner.imageUrl}</p>
                        )}
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">이동 링크</label>
                      {isEditing ? (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={banner.linkTarget || ''}
                            onChange={(e) => handleFieldChange(banner.id, 'linkTarget', e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                          />
                          <button className="p-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-400 hover:text-white">
                            <ExternalLink size={20} />
                          </button>
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">{banner.linkTarget || '링크 없음'}</p>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <button
                        onClick={() => handleToggleActive(banner.id, banner.isActive)}
                        className="flex items-center gap-2 text-sm text-gray-400 hover:text-white"
                      >
                        {banner.isActive ? <Eye size={16} /> : <EyeOff size={16} />}
                        <span>{banner.isActive ? '활성화됨' : '비활성화됨'}</span>
                      </button>

                      {isEditing ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSaveBanner(banner)}
                            disabled={saving}
                            className="flex items-center gap-2 text-green-400 hover:text-green-300 text-sm font-medium"
                          >
                            <Save size={16} />
                            저장
                          </button>
                          <button
                            onClick={() => {
                              setEditingId(null);
                              fetchBanners();
                            }}
                            className="text-gray-400 hover:text-white text-sm"
                          >
                            취소
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setEditingId(banner.id)}
                          className="flex items-center gap-2 text-purple-400 hover:text-purple-300 text-sm font-medium"
                        >
                          편집
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </AdminLayout>
  );
}
