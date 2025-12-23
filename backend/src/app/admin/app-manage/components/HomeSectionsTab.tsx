"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  GripVertical,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Save,
  X,
  ChevronDown,
  ChevronUp,
  Image,
  Music,
  Grid3X3,
  LayoutTemplate,
  ListMusic,
  Star,
  Clock,
  Minus
} from 'lucide-react';

// 섹션 타입 정의
const SECTION_TYPES = {
  HERO_BANNER: { label: '히어로 배너', icon: Image, color: 'bg-purple-500' },
  TRACK_CAROUSEL: { label: '트랙 캐러셀', icon: Music, color: 'bg-blue-500' },
  ICON_MENU: { label: '아이콘 메뉴', icon: Grid3X3, color: 'bg-green-500' },
  BANNER: { label: '중간 배너', icon: LayoutTemplate, color: 'bg-orange-500' },
  TRACK_LIST: { label: '트랙 리스트', icon: ListMusic, color: 'bg-cyan-500' },
  FEATURED_TRACK: { label: '피처드 트랙', icon: Star, color: 'bg-yellow-500' },
  RECENTLY_PLAYED: { label: '최근 재생', icon: Clock, color: 'bg-pink-500' },
  SPACER: { label: '여백', icon: Minus, color: 'bg-gray-500' },
};

interface HomeSection {
  id: string;
  type: keyof typeof SECTION_TYPES;
  title: string | null;
  subtitle: string | null;
  sortOrder: number;
  isVisible: boolean;
  showMoreButton: boolean;
  moreButtonTarget: string | null;
  config: any;
  items?: HomeSectionItem[];
}

interface HomeSectionItem {
  id: string;
  sectionId: string;
  itemType: string;
  itemId: string | null;
  sortOrder: number;
  config: any;
}

export default function HomeSectionsTab() {
  const [sections, setSections] = useState<HomeSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [saving, setSaving] = useState(false);

  // 새 섹션 폼 상태
  const [newSection, setNewSection] = useState({
    type: 'TRACK_CAROUSEL' as keyof typeof SECTION_TYPES,
    title: '',
    subtitle: '',
    showMoreButton: false,
    moreButtonTarget: '',
  });

  // 섹션 목록 조회
  const fetchSections = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/home-sections?includeItems=true');
      const data = await response.json();

      if (data.success) {
        setSections(data.data);
      } else {
        setError(data.error || '섹션 목록을 불러오는데 실패했습니다.');
      }
    } catch (err) {
      setError('서버 연결에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSections();
  }, [fetchSections]);

  // 섹션 생성
  const handleCreateSection = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/admin/home-sections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: newSection.type,
          title: newSection.title || null,
          subtitle: newSection.subtitle || null,
          showMoreButton: newSection.showMoreButton,
          moreButtonTarget: newSection.moreButtonTarget || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        await fetchSections();
        setIsCreating(false);
        setNewSection({
          type: 'TRACK_CAROUSEL',
          title: '',
          subtitle: '',
          showMoreButton: false,
          moreButtonTarget: '',
        });
      } else {
        alert(data.error || '섹션 생성에 실패했습니다.');
      }
    } catch (err) {
      alert('서버 연결에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // 섹션 삭제
  const handleDeleteSection = async (id: string) => {
    if (!confirm('이 섹션을 삭제하시겠습니까? 연결된 모든 아이템도 함께 삭제됩니다.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/home-sections/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        await fetchSections();
      } else {
        alert(data.error || '섹션 삭제에 실패했습니다.');
      }
    } catch (err) {
      alert('서버 연결에 실패했습니다.');
    }
  };

  // 섹션 표시/숨김 토글
  const handleToggleVisibility = async (id: string, currentVisible: boolean) => {
    try {
      const response = await fetch(`/api/admin/home-sections/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVisible: !currentVisible }),
      });

      const data = await response.json();

      if (data.success) {
        setSections(prev =>
          prev.map(s => s.id === id ? { ...s, isVisible: !currentVisible } : s)
        );
      } else {
        alert(data.error || '상태 변경에 실패했습니다.');
      }
    } catch (err) {
      alert('서버 연결에 실패했습니다.');
    }
  };

  // 섹션 순서 변경
  const handleMoveSection = async (id: string, direction: 'up' | 'down') => {
    const currentIndex = sections.findIndex(s => s.id === id);
    if (
      (direction === 'up' && currentIndex === 0) ||
      (direction === 'down' && currentIndex === sections.length - 1)
    ) {
      return;
    }

    const newSections = [...sections];
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    [newSections[currentIndex], newSections[targetIndex]] =
      [newSections[targetIndex], newSections[currentIndex]];

    const updatedSections = newSections.map((s, idx) => ({
      ...s,
      sortOrder: idx,
    }));

    setSections(updatedSections);

    try {
      await fetch('/api/admin/home-sections', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sections: updatedSections.map(s => ({ id: s.id, sortOrder: s.sortOrder })),
        }),
      });
    } catch (err) {
      console.error('순서 저장 실패:', err);
      fetchSections();
    }
  };

  // 섹션 수정 저장
  const handleSaveSection = async (section: HomeSection) => {
    try {
      setSaving(true);
      const response = await fetch(`/api/admin/home-sections/${section.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: section.title,
          subtitle: section.subtitle,
          showMoreButton: section.showMoreButton,
          moreButtonTarget: section.moreButtonTarget,
          config: section.config,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setEditingSection(null);
        await fetchSections();
      } else {
        alert(data.error || '저장에 실패했습니다.');
      }
    } catch (err) {
      alert('서버 연결에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // 섹션 편집 폼 업데이트
  const handleEditFieldChange = (id: string, field: keyof HomeSection, value: any) => {
    setSections(prev =>
      prev.map(s => s.id === id ? { ...s, [field]: value } : s)
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-gray-400">앱 홈 화면의 섹션을 구성하고 관리합니다.</p>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors"
        >
          <Plus size={20} />
          <span>섹션 추가</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
          {error}
        </div>
      )}

      {/* 새 섹션 생성 폼 */}
      {isCreating && (
        <div className="p-6 bg-gray-900 rounded-xl border border-gray-800">
          <h3 className="text-xl font-bold text-white mb-4">새 섹션 추가</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">섹션 타입</label>
              <select
                value={newSection.type}
                onChange={(e) => setNewSection(prev => ({ ...prev, type: e.target.value as keyof typeof SECTION_TYPES }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
              >
                {Object.entries(SECTION_TYPES).map(([key, value]) => (
                  <option key={key} value={key}>{value.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">제목</label>
              <input
                type="text"
                value={newSection.title}
                onChange={(e) => setNewSection(prev => ({ ...prev, title: e.target.value }))}
                placeholder="섹션 제목"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">부제목</label>
              <input
                type="text"
                value={newSection.subtitle}
                onChange={(e) => setNewSection(prev => ({ ...prev, subtitle: e.target.value }))}
                placeholder="섹션 부제목 (선택)"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500"
              />
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newSection.showMoreButton}
                  onChange={(e) => setNewSection(prev => ({ ...prev, showMoreButton: e.target.checked }))}
                  className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-600"
                />
                <span className="text-sm text-gray-400">더보기 버튼</span>
              </label>

              {newSection.showMoreButton && (
                <input
                  type="text"
                  value={newSection.moreButtonTarget}
                  onChange={(e) => setNewSection(prev => ({ ...prev, moreButtonTarget: e.target.value }))}
                  placeholder="이동 대상 (예: /tracks?category=healing)"
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 text-sm"
                />
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleCreateSection}
              disabled={saving}
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

      {/* 섹션 목록 */}
      <div className="space-y-4">
        {sections.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            등록된 섹션이 없습니다. "섹션 추가" 버튼을 클릭하여 새 섹션을 만들어 보세요.
          </div>
        ) : (
          sections.map((section, index) => {
            const typeInfo = SECTION_TYPES[section.type] || SECTION_TYPES.TRACK_CAROUSEL;
            const TypeIcon = typeInfo.icon;
            const isEditing = editingSection === section.id;
            const isExpanded = expandedSection === section.id;

            return (
              <div
                key={section.id}
                className={`bg-gray-900 rounded-xl border ${section.isVisible ? 'border-gray-800' : 'border-gray-800/50 opacity-60'}`}
              >
                {/* 섹션 헤더 */}
                <div className="p-4 flex items-center gap-4">
                  {/* 드래그 핸들 & 순서 */}
                  <div className="flex flex-col items-center gap-1">
                    <button
                      onClick={() => handleMoveSection(section.id, 'up')}
                      disabled={index === 0}
                      className="p-1 hover:bg-gray-800 rounded disabled:opacity-30"
                    >
                      <ChevronUp size={16} className="text-gray-500" />
                    </button>
                    <GripVertical size={20} className="text-gray-600" />
                    <button
                      onClick={() => handleMoveSection(section.id, 'down')}
                      disabled={index === sections.length - 1}
                      className="p-1 hover:bg-gray-800 rounded disabled:opacity-30"
                    >
                      <ChevronDown size={16} className="text-gray-500" />
                    </button>
                  </div>

                  {/* 타입 아이콘 */}
                  <div className={`p-2 rounded-lg ${typeInfo.color} bg-opacity-20`}>
                    <TypeIcon className={typeInfo.color.replace('bg-', 'text-')} size={20} />
                  </div>

                  {/* 섹션 정보 */}
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={section.title || ''}
                          onChange={(e) => handleEditFieldChange(section.id, 'title', e.target.value)}
                          placeholder="섹션 제목"
                          className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-1 text-white text-sm"
                        />
                        <input
                          type="text"
                          value={section.subtitle || ''}
                          onChange={(e) => handleEditFieldChange(section.id, 'subtitle', e.target.value)}
                          placeholder="부제목"
                          className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-1 text-white text-sm"
                        />
                      </div>
                    ) : (
                      <>
                        <h4 className="text-white font-medium truncate">
                          {section.title || `${typeInfo.label} 섹션`}
                        </h4>
                        <p className="text-gray-500 text-sm truncate">
                          {section.subtitle || typeInfo.label} • {section.items?.length || 0}개 아이템
                        </p>
                      </>
                    )}
                  </div>

                  {/* 액션 버튼 */}
                  <div className="flex items-center gap-2">
                    {isEditing ? (
                      <>
                        <button
                          onClick={() => handleSaveSection(section)}
                          disabled={saving}
                          className="p-2 hover:bg-green-500/20 rounded-lg text-green-400 transition-colors"
                        >
                          <Save size={18} />
                        </button>
                        <button
                          onClick={() => {
                            setEditingSection(null);
                            fetchSections();
                          }}
                          className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 transition-colors"
                        >
                          <X size={18} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleToggleVisibility(section.id, section.isVisible)}
                          className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 transition-colors"
                          title={section.isVisible ? '숨기기' : '표시하기'}
                        >
                          {section.isVisible ? <Eye size={18} /> : <EyeOff size={18} />}
                        </button>
                        <button
                          onClick={() => setEditingSection(section.id)}
                          className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 transition-colors"
                          title="편집"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => setExpandedSection(isExpanded ? null : section.id)}
                          className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 transition-colors"
                          title="아이템 관리"
                        >
                          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </button>
                        <button
                          onClick={() => handleDeleteSection(section.id)}
                          className="p-2 hover:bg-red-500/20 rounded-lg text-red-400 transition-colors"
                          title="삭제"
                        >
                          <Trash2 size={18} />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* 확장된 아이템 목록 */}
                {isExpanded && (
                  <div className="border-t border-gray-800 p-4 bg-gray-950/50">
                    <div className="flex justify-between items-center mb-3">
                      <h5 className="text-sm font-medium text-gray-400">섹션 아이템</h5>
                      <button className="text-xs text-blue-400 hover:text-blue-300">
                        + 아이템 추가
                      </button>
                    </div>

                    {section.items && section.items.length > 0 ? (
                      <div className="space-y-2">
                        {section.items.map((item, itemIndex) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-3 p-2 bg-gray-800/50 rounded-lg"
                          >
                            <span className="text-gray-500 text-sm w-6">{itemIndex + 1}.</span>
                            <span className="text-white text-sm">{item.itemType}</span>
                            {item.itemId && (
                              <span className="text-gray-500 text-xs">ID: {item.itemId}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">등록된 아이템이 없습니다.</p>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* 도움말 */}
      <div className="p-4 bg-gray-900/50 rounded-xl border border-gray-800">
        <h4 className="text-white font-medium mb-2">섹션 타입 설명</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          {Object.entries(SECTION_TYPES).map(([key, value]) => {
            const Icon = value.icon;
            return (
              <div key={key} className="flex items-center gap-2 text-gray-400">
                <Icon size={14} className={value.color.replace('bg-', 'text-')} />
                <span>{value.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
