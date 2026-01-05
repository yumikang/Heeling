"use client";

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import {
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Users,
  Building2,
  Crown,
  Calendar,
  Target,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Edit,
  X,
  Save,
} from 'lucide-react';

// 타입 정의
const POPUP_TYPES = {
  modal: { label: '모달 팝업', color: 'bg-blue-500', icon: '📱' },
  fullscreen: { label: '전체화면', color: 'bg-purple-500', icon: '🖼️' },
};

const USER_TYPES = {
  personal: { label: '개인 사용자', icon: Users, color: 'text-blue-400' },
  business: { label: '비즈니스', icon: Building2, color: 'text-orange-400' },
};

interface PopupData {
  id: string;
  type: string;
  title: string;
  message: string;
  imageUrl?: string;
  buttons?: Array<{
    id: string;
    label: string;
    action: string;
    value?: string;
    style?: string;
  }>;
  excludePremium?: boolean;
  requiresPremium?: boolean;
  targetUserTypes?: string[];
  priority: number;
  showOnce?: boolean;
  showDontShowAgain?: boolean;
  dismissible?: boolean;
  startDate?: string;
  endDate?: string;
}

export default function PopupsPage() {
  const [popups, setPopups] = useState<PopupData[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [editingPopup, setEditingPopup] = useState<PopupData | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadPopups();
  }, []);

  const loadPopups = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/popups');
      const result = await response.json();

      if (result.success) {
        setPopups(result.data);
      } else {
        console.error('Failed to load popups:', result.error);
        alert('팝업 목록 로드에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to load popups:', error);
      alert('팝업 목록 로드 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const toggleCard = (id: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedCards(newExpanded);
  };

  const getPopupCategory = (popup: PopupData): string => {
    if (popup.excludePremium) return 'free-only';
    if (popup.requiresPremium) return 'premium-only';
    if (popup.targetUserTypes?.includes('business')) return 'business';
    if (popup.targetUserTypes?.includes('personal')) return 'personal';
    return 'general';
  };

  const isActive = (popup: PopupData): boolean => {
    const now = new Date();
    const start = popup.startDate ? new Date(popup.startDate) : null;
    const end = popup.endDate ? new Date(popup.endDate) : null;

    if (start && start > now) return false;
    if (end && end < now) return false;
    return true;
  };

  const handleEdit = (popup: PopupData) => {
    setEditingPopup({ ...popup });
    setIsEditModalOpen(true);
  };

  const handleCreate = () => {
    const newPopup: PopupData = {
      id: '',
      type: 'modal',
      title: '',
      message: '',
      priority: 10,
      showOnce: false,
      showDontShowAgain: true,
      dismissible: true,
    };
    setEditingPopup(newPopup);
    setIsEditModalOpen(true);
  };

  const handleSave = async () => {
    if (!editingPopup) return;

    setIsSaving(true);
    try {
      const isNew = !editingPopup.id;
      const url = isNew ? '/api/admin/popups' : `/api/admin/popups/${editingPopup.id}`;
      const method = isNew ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingPopup),
      });

      const result = await response.json();

      if (result.success) {
        if (isNew) {
          setPopups([...popups, result.data]);
          alert('팝업이 생성되었습니다.');
        } else {
          setPopups(popups.map(p => p.id === editingPopup.id ? result.data : p));
          alert('팝업이 수정되었습니다.');
        }
        setIsEditModalOpen(false);
        setEditingPopup(null);
      } else {
        alert(result.error || '팝업 저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to save popup:', error);
      alert('팝업 저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말 이 팝업을 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/admin/popups/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        setPopups(popups.filter(p => p.id !== id));
        alert('팝업이 삭제되었습니다.');
      } else {
        alert(result.error || '팝업 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to delete popup:', error);
      alert('팝업 삭제 중 오류가 발생했습니다.');
    }
  };

  // 카테고리별로 팝업 그룹화
  const categorizedPopups = {
    general: popups.filter(p => getPopupCategory(p) === 'general'),
    freeOnly: popups.filter(p => getPopupCategory(p) === 'free-only'),
    premiumOnly: popups.filter(p => getPopupCategory(p) === 'premium-only'),
    business: popups.filter(p => getPopupCategory(p) === 'business'),
    personal: popups.filter(p => getPopupCategory(p) === 'personal'),
  };

  const PopupCard = ({ popup }: { popup: PopupData }) => {
    const isExpanded = expandedCards.has(popup.id);
    const active = isActive(popup);
    const typeInfo = POPUP_TYPES[popup.type as keyof typeof POPUP_TYPES] || {
      label: '알 수 없음',
      color: 'bg-gray-500',
      icon: '❓'
    };

    return (
      <div
        className={`bg-gray-900 rounded-lg border p-4 transition-all ${
          active ? 'border-green-500/30' : 'border-gray-800'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* 상태 태그 */}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className={`px-2 py-0.5 ${typeInfo.color} text-white text-xs rounded font-medium`}>
                {typeInfo.icon} {typeInfo.label}
              </span>
              {active && (
                <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                  활성
                </span>
              )}
              <span className="px-2 py-0.5 bg-gray-700 text-gray-300 text-xs rounded">
                우선순위: {popup.priority}
              </span>
            </div>

            {/* 제목 */}
            <h4 className="text-white font-medium mb-1">{popup.title}</h4>

            {/* 메시지 미리보기 */}
            <p className="text-gray-400 text-sm line-clamp-2">{popup.message}</p>

            {/* 상세 정보 (확장 시) */}
            {isExpanded && (
              <div className="mt-4 pt-4 border-t border-gray-800 space-y-3">
                {popup.imageUrl && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">이미지</p>
                    <img
                      src={popup.imageUrl}
                      alt={popup.title}
                      className="w-full max-w-sm h-32 object-cover rounded"
                    />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">표시 기간</p>
                    <p className="text-gray-300 text-xs">
                      {popup.startDate} ~ {popup.endDate}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">옵션</p>
                    <div className="space-y-1">
                      {popup.showOnce && (
                        <p className="text-gray-300 text-xs">• 1회만 표시</p>
                      )}
                      {popup.showDontShowAgain && (
                        <p className="text-gray-300 text-xs">• 다시 보지 않기 옵션</p>
                      )}
                      {popup.dismissible && (
                        <p className="text-gray-300 text-xs">• 닫기 가능</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 액션 버튼 */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleCard(popup.id)}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors"
              title={isExpanded ? '접기' : '펼치기'}
            >
              {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
            <button
              onClick={() => handleEdit(popup)}
              className="p-2 text-gray-400 hover:text-blue-400 hover:bg-gray-800 rounded transition-colors"
              title="편집"
            >
              <Edit size={18} />
            </button>
            <button
              className="p-2 text-gray-400 hover:text-green-400 hover:bg-gray-800 rounded transition-colors"
              title="미리보기"
            >
              <Eye size={18} />
            </button>
            <button
              onClick={() => handleDelete(popup.id)}
              className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded transition-colors"
              title="삭제"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const Section = ({
    title,
    icon: Icon,
    count,
    popups,
    iconColor
  }: {
    title: string;
    icon: any;
    count: number;
    popups: PopupData[];
    iconColor: string;
  }) => (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-800">
        <div className={`p-2 bg-gray-800 rounded-lg ${iconColor}`}>
          <Icon size={20} />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <p className="text-sm text-gray-400">{count}개의 팝업</p>
        </div>
      </div>

      <div className="space-y-3">
        {popups.length === 0 ? (
          <div className="text-center py-12 bg-gray-900 rounded-lg border border-gray-800">
            <p className="text-gray-400">등록된 팝업이 없습니다</p>
          </div>
        ) : (
          popups.map(popup => <PopupCard key={popup.id} popup={popup} />)
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-gray-400">로딩 중...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {/* 헤더 */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white">팝업 관리</h2>
          <p className="text-gray-400 mt-2">모바일 앱 팝업을 용도별로 관리합니다</p>
        </div>
        <button
          onClick={handleCreate}
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 font-medium transition-colors"
        >
          <Plus size={20} />
          새 팝업 추가
        </button>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-900 p-4 rounded-lg border border-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-500/20 rounded-lg">
              <Target className="text-purple-400" size={24} />
            </div>
            <div>
              <p className="text-gray-400 text-sm">전체 팝업</p>
              <p className="text-2xl font-bold text-white">{popups.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-900 p-4 rounded-lg border border-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-500/20 rounded-lg">
              <CheckCircle className="text-green-400" size={24} />
            </div>
            <div>
              <p className="text-gray-400 text-sm">활성 팝업</p>
              <p className="text-2xl font-bold text-white">
                {popups.filter(p => isActive(p)).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-gray-900 p-4 rounded-lg border border-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <Users className="text-blue-400" size={24} />
            </div>
            <div>
              <p className="text-gray-400 text-sm">일반 사용자</p>
              <p className="text-2xl font-bold text-white">
                {categorizedPopups.general.length + categorizedPopups.personal.length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-gray-900 p-4 rounded-lg border border-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-500/20 rounded-lg">
              <Building2 className="text-orange-400" size={24} />
            </div>
            <div>
              <p className="text-gray-400 text-sm">비즈니스</p>
              <p className="text-2xl font-bold text-white">
                {categorizedPopups.business.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 섹션별 팝업 목록 */}
      <div className="space-y-8">
        {/* 모든 사용자 대상 */}
        <Section
          title="모든 사용자 대상"
          icon={Users}
          count={categorizedPopups.general.length}
          popups={categorizedPopups.general}
          iconColor="text-gray-400"
        />

        {/* 무료 사용자 전용 */}
        {categorizedPopups.freeOnly.length > 0 && (
          <Section
            title="무료 사용자 전용"
            icon={Users}
            count={categorizedPopups.freeOnly.length}
            popups={categorizedPopups.freeOnly}
            iconColor="text-blue-400"
          />
        )}

        {/* 프리미엄 사용자 전용 */}
        {categorizedPopups.premiumOnly.length > 0 && (
          <Section
            title="프리미엄 사용자 전용"
            icon={Crown}
            count={categorizedPopups.premiumOnly.length}
            popups={categorizedPopups.premiumOnly}
            iconColor="text-yellow-400"
          />
        )}

        {/* 비즈니스 사용자 */}
        {categorizedPopups.business.length > 0 && (
          <Section
            title="비즈니스 사용자"
            icon={Building2}
            count={categorizedPopups.business.length}
            popups={categorizedPopups.business}
            iconColor="text-orange-400"
          />
        )}

        {/* 개인 사용자 */}
        {categorizedPopups.personal.length > 0 && (
          <Section
            title="개인 사용자"
            icon={Users}
            count={categorizedPopups.personal.length}
            popups={categorizedPopups.personal}
            iconColor="text-purple-400"
          />
        )}
      </div>

      {/* 편집 모달 */}
      {isEditModalOpen && editingPopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* 모달 헤더 */}
            <div className="flex items-center justify-between p-6 border-b border-gray-800">
              <h3 className="text-xl font-semibold text-white">
                {editingPopup.id ? '팝업 편집' : '새 팝업 추가'}
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* 모달 내용 */}
            <div className="p-6 space-y-4">
              {/* 제목 */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">제목</label>
                <input
                  type="text"
                  value={editingPopup.title}
                  onChange={(e) => setEditingPopup({ ...editingPopup, title: e.target.value })}
                  className="w-full bg-gray-800 text-white rounded-lg px-4 py-2 border border-gray-700 focus:border-purple-500 focus:outline-none"
                  placeholder="팝업 제목"
                />
              </div>

              {/* 메시지 */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">메시지</label>
                <textarea
                  value={editingPopup.message}
                  onChange={(e) => setEditingPopup({ ...editingPopup, message: e.target.value })}
                  className="w-full bg-gray-800 text-white rounded-lg px-4 py-2 border border-gray-700 focus:border-purple-500 focus:outline-none"
                  rows={4}
                  placeholder="팝업 메시지"
                />
              </div>

              {/* 이미지 URL */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">이미지 URL (선택)</label>
                <input
                  type="text"
                  value={editingPopup.imageUrl || ''}
                  onChange={(e) => setEditingPopup({ ...editingPopup, imageUrl: e.target.value })}
                  className="w-full bg-gray-800 text-white rounded-lg px-4 py-2 border border-gray-700 focus:border-purple-500 focus:outline-none"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              {/* 우선순위 */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">우선순위</label>
                <input
                  type="number"
                  value={editingPopup.priority}
                  onChange={(e) => setEditingPopup({ ...editingPopup, priority: parseInt(e.target.value) })}
                  className="w-full bg-gray-800 text-white rounded-lg px-4 py-2 border border-gray-700 focus:border-purple-500 focus:outline-none"
                  min="0"
                  max="100"
                />
              </div>

              {/* 날짜 범위 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">시작 날짜</label>
                  <input
                    type="date"
                    value={editingPopup.startDate || ''}
                    onChange={(e) => setEditingPopup({ ...editingPopup, startDate: e.target.value })}
                    className="w-full bg-gray-800 text-white rounded-lg px-4 py-2 border border-gray-700 focus:border-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">종료 날짜</label>
                  <input
                    type="date"
                    value={editingPopup.endDate || ''}
                    onChange={(e) => setEditingPopup({ ...editingPopup, endDate: e.target.value })}
                    className="w-full bg-gray-800 text-white rounded-lg px-4 py-2 border border-gray-700 focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* 옵션 체크박스 */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-gray-300">
                  <input
                    type="checkbox"
                    checked={editingPopup.excludePremium || false}
                    onChange={(e) => setEditingPopup({ ...editingPopup, excludePremium: e.target.checked })}
                    className="rounded bg-gray-800 border-gray-700 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm">프리미엄 사용자 제외</span>
                </label>
                <label className="flex items-center gap-2 text-gray-300">
                  <input
                    type="checkbox"
                    checked={editingPopup.requiresPremium || false}
                    onChange={(e) => setEditingPopup({ ...editingPopup, requiresPremium: e.target.checked })}
                    className="rounded bg-gray-800 border-gray-700 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm">프리미엄 사용자만</span>
                </label>
                <label className="flex items-center gap-2 text-gray-300">
                  <input
                    type="checkbox"
                    checked={editingPopup.dismissible !== false}
                    onChange={(e) => setEditingPopup({ ...editingPopup, dismissible: e.target.checked })}
                    className="rounded bg-gray-800 border-gray-700 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm">닫기 가능</span>
                </label>
                <label className="flex items-center gap-2 text-gray-300">
                  <input
                    type="checkbox"
                    checked={editingPopup.showOnce || false}
                    onChange={(e) => setEditingPopup({ ...editingPopup, showOnce: e.target.checked })}
                    className="rounded bg-gray-800 border-gray-700 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm">1회만 표시</span>
                </label>
                <label className="flex items-center gap-2 text-gray-300">
                  <input
                    type="checkbox"
                    checked={editingPopup.showDontShowAgain || false}
                    onChange={(e) => setEditingPopup({ ...editingPopup, showDontShowAgain: e.target.checked })}
                    className="rounded bg-gray-800 border-gray-700 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm">다시 보지 않기 옵션 표시</span>
                </label>
              </div>
            </div>

            {/* 모달 푸터 */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-800">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                disabled={isSaving}
              >
                취소
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    저장 중...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    저장
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
