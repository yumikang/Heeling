"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
  Send,
  Bell,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Users,
  Building2,
  Megaphone,
  Trash2,
  Upload,
} from 'lucide-react';

// 타겟 타입 정의
const TARGET_TYPES = {
  ALL: { label: '전체 사용자', icon: Users, color: 'text-blue-400' },
  PERSONAL: { label: '개인 사용자', icon: Users, color: 'text-green-400' },
  BUSINESS: { label: '비즈니스 사용자', icon: Building2, color: 'text-purple-400' },
  TOPIC: { label: '특정 토픽', icon: Megaphone, color: 'text-orange-400' },
};

// 상태 정의
const STATUS_CONFIG = {
  PENDING: { label: '대기 중', icon: Clock, color: 'text-gray-400', bg: 'bg-gray-500/20' },
  SCHEDULED: { label: '예약됨', icon: Clock, color: 'text-blue-400', bg: 'bg-blue-500/20' },
  SENDING: { label: '발송 중', icon: RefreshCw, color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
  COMPLETED: { label: '완료', icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/20' },
  FAILED: { label: '실패', icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/20' },
};

interface PushHistory {
  id: string;
  title: string;
  body: string;
  targetType: keyof typeof TARGET_TYPES;
  targetValue: string | null;
  imageUrl: string | null;
  linkType: string | null;
  linkTarget: string | null;
  sentCount: number;
  successCount: number;
  failCount: number;
  status: keyof typeof STATUS_CONFIG;
  scheduledAt: string | null;
  sentAt: string | null;
  createdAt: string;
}

export default function PushTab() {
  const [histories, setHistories] = useState<PushHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('');

  // 발송 폼 상태
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    targetType: 'ALL' as keyof typeof TARGET_TYPES,
    targetValue: '',
    imageUrl: '',
    linkType: 'none',
    linkTarget: '',
    scheduledAt: '',
  });

  // 발송 이력 조회
  const fetchHistories = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterStatus) params.append('status', filterStatus);

      const response = await fetch(`/api/admin/push?${params}`);
      const data = await response.json();

      if (data.success) {
        setHistories(data.data);
      } else {
        setError(data.error || '발송 이력을 불러오는데 실패했습니다.');
      }
    } catch (err) {
      setError('서버 연결에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    fetchHistories();
  }, [fetchHistories]);

  // 이미지 업로드
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formDataUpload = new FormData();
    formDataUpload.append('file', file);
    formDataUpload.append('type', 'image');

    try {
      setUploading(true);
      const response = await fetch('/api/admin/tracks/upload', {
        method: 'POST',
        body: formDataUpload,
      });

      const data = await response.json();

      if (data.success) {
        setFormData(prev => ({ ...prev, imageUrl: data.data.url }));
      } else {
        alert(data.error || '업로드에 실패했습니다.');
      }
    } catch (err) {
      alert('업로드 중 오류가 발생했습니다.');
    } finally {
      setUploading(false);
    }
  };

  // 푸시 발송
  const handleSendPush = async () => {
    if (!formData.title || !formData.body) {
      alert('제목과 내용은 필수입니다.');
      return;
    }

    if (formData.targetType === 'TOPIC' && !formData.targetValue) {
      alert('토픽명을 입력해주세요.');
      return;
    }

    try {
      setSaving(true);
      const response = await fetch('/api/admin/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          body: formData.body,
          targetType: formData.targetType,
          targetValue: formData.targetValue || null,
          imageUrl: formData.imageUrl || null,
          linkType: formData.linkType === 'none' ? null : formData.linkType,
          linkTarget: formData.linkTarget || null,
          scheduledAt: formData.scheduledAt || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert(data.message || '푸시 알림이 발송되었습니다.');
        setFormData({
          title: '',
          body: '',
          targetType: 'ALL',
          targetValue: '',
          imageUrl: '',
          linkType: 'none',
          linkTarget: '',
          scheduledAt: '',
        });
        await fetchHistories();
      } else {
        alert(data.error || '푸시 발송에 실패했습니다.');
      }
    } catch (err) {
      alert('서버 연결에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // 예약 취소
  const handleCancelScheduled = async (id: string) => {
    if (!confirm('예약된 알림을 취소하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/admin/push/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        await fetchHistories();
      } else {
        alert(data.error || '취소에 실패했습니다.');
      }
    } catch (err) {
      alert('서버 연결에 실패했습니다.');
    }
  };

  // 날짜 포맷
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      <p className="text-gray-400">앱 사용자에게 푸시 알림을 발송합니다.</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 발송 폼 */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Send size={20} className="text-purple-400" />
            새 알림 발송
          </h3>

          <div className="space-y-4">
            {/* 제목 */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">제목 *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="알림 제목"
                maxLength={50}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500"
              />
              <p className="text-xs text-gray-500 mt-1">{formData.title.length}/50</p>
            </div>

            {/* 내용 */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">내용 *</label>
              <textarea
                value={formData.body}
                onChange={(e) => setFormData(prev => ({ ...prev, body: e.target.value }))}
                placeholder="알림 내용을 입력하세요"
                maxLength={200}
                rows={3}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">{formData.body.length}/200</p>
            </div>

            {/* 대상 선택 */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">발송 대상</label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(TARGET_TYPES).map(([key, value]) => {
                  const Icon = value.icon;
                  const isSelected = formData.targetType === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setFormData(prev => ({ ...prev, targetType: key as keyof typeof TARGET_TYPES }))}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                        isSelected
                          ? 'bg-purple-600/20 border-purple-500 text-white'
                          : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                      }`}
                    >
                      <Icon size={16} className={isSelected ? value.color : ''} />
                      <span className="text-sm">{value.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 토픽명 (TOPIC 선택 시) */}
            {formData.targetType === 'TOPIC' && (
              <div>
                <label className="block text-sm text-gray-400 mb-2">토픽명 *</label>
                <input
                  type="text"
                  value={formData.targetValue}
                  onChange={(e) => setFormData(prev => ({ ...prev, targetValue: e.target.value }))}
                  placeholder="예: new_tracks, events"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500"
                />
              </div>
            )}

            {/* 이미지 */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">이미지 (선택)</label>
              <div className="flex items-center gap-2">
                {formData.imageUrl ? (
                  <div className="flex items-center gap-2 flex-1">
                    <img src={formData.imageUrl} alt="Preview" className="w-10 h-10 object-cover rounded" />
                    <span className="flex-1 text-green-400 text-sm truncate">{formData.imageUrl}</span>
                    <button
                      onClick={() => setFormData(prev => ({ ...prev, imageUrl: '' }))}
                      className="p-1 text-gray-400 hover:text-red-400"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ) : (
                  <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-800 border border-dashed border-gray-600 rounded-lg cursor-pointer hover:border-gray-500">
                    <Upload size={16} />
                    <span className="text-gray-400 text-sm">이미지 업로드</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                )}
              </div>
            </div>

            {/* 링크 설정 */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">클릭 시 이동</label>
              <div className="flex gap-2">
                <select
                  value={formData.linkType}
                  onChange={(e) => setFormData(prev => ({ ...prev, linkType: e.target.value }))}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                >
                  <option value="none">없음</option>
                  <option value="url">외부 URL</option>
                  <option value="screen">앱 화면</option>
                  <option value="deeplink">딥링크</option>
                </select>
                {formData.linkType !== 'none' && (
                  <input
                    type="text"
                    value={formData.linkTarget}
                    onChange={(e) => setFormData(prev => ({ ...prev, linkTarget: e.target.value }))}
                    placeholder={
                      formData.linkType === 'url' ? 'https://example.com' :
                      formData.linkType === 'screen' ? 'PlayerScreen' :
                      'heeling://tracks/123'
                    }
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500"
                  />
                )}
              </div>
            </div>

            {/* 예약 발송 */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">예약 발송 (선택)</label>
              <input
                type="datetime-local"
                value={formData.scheduledAt}
                onChange={(e) => setFormData(prev => ({ ...prev, scheduledAt: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
              />
              <p className="text-xs text-gray-500 mt-1">비워두면 즉시 발송됩니다.</p>
            </div>

            {/* 발송 버튼 */}
            <button
              onClick={handleSendPush}
              disabled={saving || uploading}
              className="w-full mt-4 flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-medium transition-colors disabled:opacity-50"
            >
              {saving ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />
                  발송 중...
                </>
              ) : (
                <>
                  <Send size={18} />
                  {formData.scheduledAt ? '예약 발송' : '즉시 발송'}
                </>
              )}
            </button>
          </div>
        </div>

        {/* 발송 이력 */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Bell size={20} className="text-purple-400" />
              발송 이력
            </h3>
            <button
              onClick={fetchHistories}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <RefreshCw size={18} />
            </button>
          </div>

          {/* 상태 필터 */}
          <div className="mb-4 flex gap-2 flex-wrap">
            <button
              onClick={() => setFilterStatus('')}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                filterStatus === '' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              전체
            </button>
            {Object.entries(STATUS_CONFIG).map(([key, value]) => (
              <button
                key={key}
                onClick={() => setFilterStatus(key)}
                className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                  filterStatus === key ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {value.label}
              </button>
            ))}
          </div>

          {/* 이력 목록 */}
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="text-gray-400">로딩 중...</div>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
              {error}
            </div>
          ) : histories.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-500">
              <Bell size={48} className="mb-4 opacity-30" />
              <p>발송 이력이 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {histories.map((history) => {
                const statusConfig = STATUS_CONFIG[history.status] || STATUS_CONFIG.PENDING;
                const targetConfig = TARGET_TYPES[history.targetType] || TARGET_TYPES.ALL;
                const StatusIcon = statusConfig.icon;
                const TargetIcon = targetConfig.icon;

                return (
                  <div
                    key={history.id}
                    className="p-4 bg-gray-800/50 rounded-lg border border-gray-700"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs ${statusConfig.bg} ${statusConfig.color}`}>
                          <StatusIcon size={12} />
                          {statusConfig.label}
                        </span>
                        <span className={`flex items-center gap-1 text-xs ${targetConfig.color}`}>
                          <TargetIcon size={12} />
                          {targetConfig.label}
                        </span>
                      </div>
                      {(history.status === 'SCHEDULED' || history.status === 'PENDING') && (
                        <button
                          onClick={() => handleCancelScheduled(history.id)}
                          className="text-gray-500 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>

                    <h4 className="text-white font-medium mb-1">{history.title}</h4>
                    <p className="text-gray-400 text-sm mb-2 line-clamp-2">{history.body}</p>

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-3">
                        {history.status === 'COMPLETED' && (
                          <span className="text-green-400">
                            성공: {history.successCount}
                          </span>
                        )}
                        {history.failCount > 0 && (
                          <span className="text-red-400">
                            실패: {history.failCount}
                          </span>
                        )}
                      </div>
                      <span>
                        {history.scheduledAt && history.status === 'SCHEDULED'
                          ? `예약: ${formatDate(history.scheduledAt)}`
                          : formatDate(history.sentAt || history.createdAt)
                        }
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
