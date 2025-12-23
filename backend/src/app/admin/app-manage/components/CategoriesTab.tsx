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
  ChevronUp,
  ChevronDown,
  Heart,
  Brain,
  Moon,
  TreePine,
  Coffee,
  Sparkles,
  Music,
  Headphones,
  Wind,
  CloudRain,
  Sun,
  Flame,
  Leaf,
  Star,
  Zap,
  Smile
} from 'lucide-react';

// Ionicons 아이콘 매핑 (lucide-react 대체)
const ICON_OPTIONS = [
  { name: 'heart', icon: Heart, label: '하트' },
  { name: 'brain', icon: Brain, label: '두뇌' },
  { name: 'moon', icon: Moon, label: '달' },
  { name: 'tree', icon: TreePine, label: '나무' },
  { name: 'coffee', icon: Coffee, label: '커피' },
  { name: 'spa', icon: Sparkles, label: '스파' },
  { name: 'musical-notes', icon: Music, label: '음악' },
  { name: 'headset', icon: Headphones, label: '헤드폰' },
  { name: 'wind', icon: Wind, label: '바람' },
  { name: 'rainy', icon: CloudRain, label: '비' },
  { name: 'sunny', icon: Sun, label: '해' },
  { name: 'flame', icon: Flame, label: '불꽃' },
  { name: 'leaf', icon: Leaf, label: '나뭇잎' },
  { name: 'star', icon: Star, label: '별' },
  { name: 'flash', icon: Zap, label: '번개' },
  { name: 'happy', icon: Smile, label: '스마일' },
];

// 프리셋 색상
const COLOR_PRESETS = [
  '#EC4899', // pink
  '#8B5CF6', // purple
  '#3B82F6', // blue
  '#10B981', // emerald
  '#F59E0B', // amber
  '#6366F1', // indigo
  '#EF4444', // red
  '#14B8A6', // teal
  '#F97316', // orange
  '#84CC16', // lime
];

interface Category {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
}

export default function CategoriesTab() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // 새 카테고리 폼 상태
  const [newCategory, setNewCategory] = useState({
    slug: '',
    name: '',
    description: '',
    icon: 'heart',
    color: '#EC4899',
  });

  // 카테고리 목록 조회
  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/categories');
      const data = await response.json();

      if (data.success) {
        setCategories(data.data);
      } else {
        setError(data.error || '카테고리 목록을 불러오는데 실패했습니다.');
      }
    } catch (err) {
      setError('서버 연결에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // 카테고리 생성
  const handleCreateCategory = async () => {
    if (!newCategory.slug || !newCategory.name) {
      alert('slug와 이름은 필수입니다.');
      return;
    }

    try {
      setSaving(true);
      const response = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCategory),
      });

      const data = await response.json();

      if (data.success) {
        await fetchCategories();
        setIsCreating(false);
        setNewCategory({
          slug: '',
          name: '',
          description: '',
          icon: 'heart',
          color: '#EC4899',
        });
      } else {
        alert(data.error || '카테고리 생성에 실패했습니다.');
      }
    } catch (err) {
      alert('서버 연결에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // 카테고리 삭제
  const handleDeleteCategory = async (id: string) => {
    if (!confirm('이 카테고리를 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/admin/categories/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        await fetchCategories();
      } else {
        alert(data.error || '카테고리 삭제에 실패했습니다.');
      }
    } catch (err) {
      alert('서버 연결에 실패했습니다.');
    }
  };

  // 카테고리 활성화/비활성화 토글
  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/categories/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentActive }),
      });

      const data = await response.json();

      if (data.success) {
        setCategories(prev =>
          prev.map(c => c.id === id ? { ...c, isActive: !currentActive } : c)
        );
      } else {
        alert(data.error || '상태 변경에 실패했습니다.');
      }
    } catch (err) {
      alert('서버 연결에 실패했습니다.');
    }
  };

  // 카테고리 순서 변경
  const handleMoveCategory = async (id: string, direction: 'up' | 'down') => {
    const currentIndex = categories.findIndex(c => c.id === id);
    if (
      (direction === 'up' && currentIndex === 0) ||
      (direction === 'down' && currentIndex === categories.length - 1)
    ) {
      return;
    }

    const newCategories = [...categories];
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    [newCategories[currentIndex], newCategories[targetIndex]] =
      [newCategories[targetIndex], newCategories[currentIndex]];

    const updatedCategories = newCategories.map((c, idx) => ({
      ...c,
      sortOrder: idx,
    }));

    setCategories(updatedCategories);

    try {
      await fetch('/api/admin/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categories: updatedCategories.map(c => ({ id: c.id, sortOrder: c.sortOrder })),
        }),
      });
    } catch (err) {
      console.error('순서 저장 실패:', err);
      fetchCategories();
    }
  };

  // 카테고리 수정 저장
  const handleSaveCategory = async (category: Category) => {
    try {
      setSaving(true);
      const response = await fetch(`/api/admin/categories/${category.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: category.slug,
          name: category.name,
          description: category.description,
          icon: category.icon,
          color: category.color,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setEditingId(null);
        await fetchCategories();
      } else {
        alert(data.error || '저장에 실패했습니다.');
      }
    } catch (err) {
      alert('서버 연결에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // 카테고리 필드 업데이트
  const handleFieldChange = (id: string, field: keyof Category, value: any) => {
    setCategories(prev =>
      prev.map(c => c.id === id ? { ...c, [field]: value } : c)
    );
  };

  // 아이콘 컴포넌트 가져오기
  const getIconComponent = (iconName: string) => {
    const iconOption = ICON_OPTIONS.find(opt => opt.name === iconName);
    return iconOption?.icon || Heart;
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
        <p className="text-gray-400">앱 아이콘 메뉴에 표시될 카테고리를 관리합니다.</p>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors"
        >
          <Plus size={20} />
          <span>카테고리 추가</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
          {error}
        </div>
      )}

      {/* 새 카테고리 생성 폼 */}
      {isCreating && (
        <div className="p-6 bg-gray-900 rounded-xl border border-gray-800">
          <h3 className="text-xl font-bold text-white mb-4">새 카테고리 추가</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Slug (영문)*</label>
              <input
                type="text"
                value={newCategory.slug}
                onChange={(e) => setNewCategory(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                placeholder="healing"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">이름*</label>
              <input
                type="text"
                value={newCategory.name}
                onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                placeholder="힐링"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm text-gray-400 mb-2">설명</label>
              <input
                type="text"
                value={newCategory.description}
                onChange={(e) => setNewCategory(prev => ({ ...prev, description: e.target.value }))}
                placeholder="마음을 편안하게 해주는 음악"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">아이콘</label>
              <div className="flex flex-wrap gap-2">
                {ICON_OPTIONS.map((opt) => {
                  const IconComp = opt.icon;
                  return (
                    <button
                      key={opt.name}
                      onClick={() => setNewCategory(prev => ({ ...prev, icon: opt.name }))}
                      className={`p-2 rounded-lg transition-colors ${newCategory.icon === opt.name
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                        }`}
                      title={opt.label}
                    >
                      <IconComp size={20} />
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">색상</label>
              <div className="flex items-center gap-2 flex-wrap">
                {COLOR_PRESETS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setNewCategory(prev => ({ ...prev, color }))}
                    className={`w-8 h-8 rounded-full transition-transform ${newCategory.color === color ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-900 scale-110' : ''
                      }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
                <input
                  type="color"
                  value={newCategory.color}
                  onChange={(e) => setNewCategory(prev => ({ ...prev, color: e.target.value }))}
                  className="w-8 h-8 rounded cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* 미리보기 */}
          <div className="mb-4 p-4 bg-gray-800 rounded-lg">
            <p className="text-sm text-gray-400 mb-2">미리보기</p>
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: newCategory.color + '33' }}
              >
                {React.createElement(getIconComponent(newCategory.icon), {
                  size: 24,
                  style: { color: newCategory.color },
                })}
              </div>
              <div>
                <p className="text-white font-medium">{newCategory.name || '카테고리 이름'}</p>
                <p className="text-gray-500 text-sm">{newCategory.slug || 'slug'}</p>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleCreateCategory}
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

      {/* 카테고리 목록 */}
      <div className="space-y-3">
        {categories.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            등록된 카테고리가 없습니다. "카테고리 추가" 버튼을 클릭하여 새 카테고리를 만들어 보세요.
          </div>
        ) : (
          categories.map((category, index) => {
            const IconComp = getIconComponent(category.icon);
            const isEditing = editingId === category.id;

            return (
              <div
                key={category.id}
                className={`bg-gray-900 rounded-xl border ${category.isActive ? 'border-gray-800' : 'border-gray-800/50 opacity-60'}`}
              >
                <div className="p-4 flex items-center gap-4">
                  {/* 순서 변경 */}
                  <div className="flex flex-col items-center gap-1">
                    <button
                      onClick={() => handleMoveCategory(category.id, 'up')}
                      disabled={index === 0}
                      className="p-1 hover:bg-gray-800 rounded disabled:opacity-30"
                    >
                      <ChevronUp size={16} className="text-gray-500" />
                    </button>
                    <GripVertical size={20} className="text-gray-600" />
                    <button
                      onClick={() => handleMoveCategory(category.id, 'down')}
                      disabled={index === categories.length - 1}
                      className="p-1 hover:bg-gray-800 rounded disabled:opacity-30"
                    >
                      <ChevronDown size={16} className="text-gray-500" />
                    </button>
                  </div>

                  {/* 아이콘 */}
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: category.color + '33' }}
                  >
                    <IconComp size={24} style={{ color: category.color }} />
                  </div>

                  {/* 정보 */}
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={category.name}
                          onChange={(e) => handleFieldChange(category.id, 'name', e.target.value)}
                          className="bg-gray-800 border border-gray-700 rounded px-3 py-1 text-white text-sm"
                          placeholder="이름"
                        />
                        <input
                          type="text"
                          value={category.slug}
                          onChange={(e) => handleFieldChange(category.id, 'slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                          className="bg-gray-800 border border-gray-700 rounded px-3 py-1 text-white text-sm"
                          placeholder="slug"
                        />
                      </div>
                    ) : (
                      <>
                        <h4 className="text-white font-medium">{category.name}</h4>
                        <p className="text-gray-500 text-sm">{category.slug} • {category.description || '설명 없음'}</p>
                      </>
                    )}
                  </div>

                  {/* 액션 버튼 */}
                  <div className="flex items-center gap-2">
                    {isEditing ? (
                      <>
                        <button
                          onClick={() => handleSaveCategory(category)}
                          disabled={saving}
                          className="p-2 hover:bg-green-500/20 rounded-lg text-green-400 transition-colors"
                        >
                          <Save size={18} />
                        </button>
                        <button
                          onClick={() => {
                            setEditingId(null);
                            fetchCategories();
                          }}
                          className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 transition-colors"
                        >
                          <X size={18} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleToggleActive(category.id, category.isActive)}
                          className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 transition-colors"
                          title={category.isActive ? '비활성화' : '활성화'}
                        >
                          {category.isActive ? <Eye size={18} /> : <EyeOff size={18} />}
                        </button>
                        <button
                          onClick={() => setEditingId(category.id)}
                          className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 transition-colors"
                          title="편집"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category.id)}
                          className="p-2 hover:bg-red-500/20 rounded-lg text-red-400 transition-colors"
                          title="삭제"
                        >
                          <Trash2 size={18} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
