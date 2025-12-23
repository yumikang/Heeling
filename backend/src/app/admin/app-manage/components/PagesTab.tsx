"use client";

import React, { useState, useEffect } from 'react';
import { FileText, Plus, Edit, Trash2, Loader2, X, Save } from 'lucide-react';

interface Page {
  id: string;
  slug: string;
  title: string;
  content: string;
  type: string;
  status: string;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

const PAGE_TYPES = [
  { value: 'NOTICE', label: '공지사항' },
  { value: 'EVENT', label: '이벤트' },
  { value: 'POLICY', label: '정책' },
  { value: 'FAQ', label: 'FAQ' },
  { value: 'GUIDE', label: '가이드' },
];

const PAGE_STATUS = [
  { value: 'DRAFT', label: '작성 중', color: 'yellow' },
  { value: 'PUBLISHED', label: '발행됨', color: 'green' },
  { value: 'ARCHIVED', label: '보관됨', color: 'gray' },
];

export default function PagesTab() {
  const [pages, setPages] = useState<Page[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingPage, setEditingPage] = useState<Page | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    type: 'NOTICE',
    status: 'DRAFT',
  });

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/pages');
      const data = await res.json();
      if (data.success) {
        setPages(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch pages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openModal = (page?: Page) => {
    if (page) {
      setEditingPage(page);
      setFormData({
        title: page.title,
        slug: page.slug,
        content: page.content,
        type: page.type,
        status: page.status,
      });
    } else {
      setEditingPage(null);
      setFormData({
        title: '',
        slug: '',
        content: '',
        type: 'NOTICE',
        status: 'DRAFT',
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPage(null);
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9가-힣\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);
  };

  const handleTitleChange = (title: string) => {
    setFormData(prev => ({
      ...prev,
      title,
      slug: editingPage ? prev.slug : generateSlug(title),
    }));
  };

  const handleSave = async () => {
    if (!formData.title || !formData.slug) {
      alert('제목과 슬러그는 필수입니다.');
      return;
    }

    setIsSaving(true);
    try {
      const url = editingPage
        ? `/api/admin/pages/${editingPage.id}`
        : '/api/admin/pages';

      const res = await fetch(url, {
        method: editingPage ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        fetchPages();
        closeModal();
      } else {
        alert(data.error || '저장에 실패했습니다.');
      }
    } catch (error) {
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (page: Page) => {
    if (!confirm(`"${page.title}" 페이지를 삭제하시겠습니까?`)) return;

    try {
      const res = await fetch(`/api/admin/pages/${page.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (data.success) {
        fetchPages();
      } else {
        alert(data.error || '삭제에 실패했습니다.');
      }
    } catch (error) {
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  const getTypeLabel = (type: string) => PAGE_TYPES.find(t => t.value === type)?.label || type;
  const getStatusInfo = (status: string) => PAGE_STATUS.find(s => s.value === status) || PAGE_STATUS[0];

  return (
    <div className="space-y-6">
      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-xl w-full max-w-4xl border border-gray-800 shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-gray-800">
              <h3 className="text-xl font-bold text-white">
                {editingPage ? '페이지 수정' : '새 페이지 작성'}
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">제목 *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="페이지 제목"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">슬러그 *</label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="url-slug"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">유형</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                  >
                    {PAGE_TYPES.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">상태</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                  >
                    {PAGE_STATUS.map(status => (
                      <option key={status.value} value={status.value}>{status.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">내용 (HTML 지원)</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="페이지 내용을 입력하세요..."
                  rows={12}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 font-mono text-sm"
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-800 flex justify-end gap-3 bg-gray-900/50">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors font-medium"
              >
                취소
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                저장
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <p className="text-gray-400">공지사항, 이벤트, 약관 페이지를 관리합니다.</p>
        <button
          onClick={() => openModal()}
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 font-medium transition-colors"
        >
          <Plus size={20} />
          새 페이지 작성
        </button>
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-800 text-gray-400 uppercase text-xs">
            <tr>
              <th className="px-6 py-4 font-medium">제목</th>
              <th className="px-6 py-4 font-medium">유형</th>
              <th className="px-6 py-4 font-medium">상태</th>
              <th className="px-6 py-4 font-medium">최종 수정</th>
              <th className="px-6 py-4 font-medium text-right">관리</th>
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
            ) : pages.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  등록된 페이지가 없습니다.
                </td>
              </tr>
            ) : (
              pages.map((page) => {
                const statusInfo = getStatusInfo(page.status);
                return (
                  <tr key={page.id} className="hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <FileText className="text-gray-500" size={20} />
                        <div>
                          <span className="text-white font-medium">{page.title}</span>
                          <p className="text-xs text-gray-500">/{page.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        page.type === 'NOTICE' ? 'bg-blue-900/30 text-blue-400' :
                        page.type === 'EVENT' ? 'bg-purple-900/30 text-purple-400' :
                        page.type === 'POLICY' ? 'bg-orange-900/30 text-orange-400' :
                        page.type === 'FAQ' ? 'bg-cyan-900/30 text-cyan-400' :
                        'bg-gray-800 text-gray-400'
                      }`}>
                        {getTypeLabel(page.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`flex items-center gap-2 text-sm ${
                        statusInfo.color === 'green' ? 'text-green-400' :
                        statusInfo.color === 'yellow' ? 'text-yellow-400' :
                        'text-gray-400'
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${
                          statusInfo.color === 'green' ? 'bg-green-400' :
                          statusInfo.color === 'yellow' ? 'bg-yellow-400' :
                          'bg-gray-400'
                        }`} />
                        {statusInfo.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-400">
                      {new Date(page.updatedAt).toLocaleDateString('ko-KR')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openModal(page)}
                          className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-blue-400 transition-colors"
                          title="수정"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(page)}
                          className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-red-400 transition-colors"
                          title="삭제"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
