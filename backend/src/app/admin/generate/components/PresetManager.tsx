"use client";

import React, { useEffect, useState } from 'react';
import {
  Music,
  Plus,
  Edit3,
  Trash2,
  Loader2,
  RefreshCw,
  Database,
  Check,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { STYLES, MOODS } from '../constants';

interface MusicPreset {
  id: string;
  styleCode: string;
  moodCode: string;
  code: string;
  name: string;
  stylePrompt: string;
  instrumentalDefault: boolean;
  autoEnabled: boolean;
  weight: number;
  createdAt: string;
  updatedAt: string;
}

interface PresetFormData {
  styleCode: string;
  moodCode: string;
  name: string;
  stylePrompt: string;
  instrumentalDefault: boolean;
  autoEnabled: boolean;
  weight: number;
}

export default function PresetManager() {
  const [presets, setPresets] = useState<MusicPreset[]>([]);
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingPreset, setEditingPreset] = useState<MusicPreset | null>(null);
  const [expandedPreset, setExpandedPreset] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<PresetFormData>({
    styleCode: 'piano',
    moodCode: 'calm',
    name: '',
    stylePrompt: '',
    instrumentalDefault: true,
    autoEnabled: true,
    weight: 1,
  });

  // 프리셋 목록 로드
  const fetchPresets = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/generate/presets');
      const data = await res.json();
      if (data.success) {
        setPresets(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch presets:', error);
    } finally {
      setLoading(false);
    }
  };

  // 시드 데이터 생성
  const seedPresets = async (force = false) => {
    if (!force && presets.length > 0) {
      if (!confirm(`기존 ${presets.length}개 프리셋이 있습니다. 모두 삭제하고 기본 프리셋으로 교체하시겠습니까?`)) {
        return;
      }
    }

    setSeeding(true);
    try {
      const res = await fetch(`/api/admin/generate/presets/seed?force=${force || presets.length > 0}`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        alert(`${data.count}개 기본 프리셋이 생성되었습니다.`);
        fetchPresets();
      } else {
        alert(data.error || '시드 생성 실패');
      }
    } catch (error) {
      console.error('Failed to seed presets:', error);
      alert('시드 생성 중 오류 발생');
    } finally {
      setSeeding(false);
    }
  };

  // 프리셋 저장
  const savePreset = async () => {
    setSaving(true);
    try {
      const url = '/api/admin/generate/presets';
      const method = editingPreset ? 'PUT' : 'POST';
      const body = editingPreset
        ? { id: editingPreset.id, ...formData }
        : formData;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (data.success) {
        setShowForm(false);
        setEditingPreset(null);
        resetForm();
        fetchPresets();
      } else {
        alert(data.error || '저장 실패');
      }
    } catch (error) {
      console.error('Failed to save preset:', error);
      alert('저장 중 오류 발생');
    } finally {
      setSaving(false);
    }
  };

  // 프리셋 삭제
  const deletePreset = async (id: string) => {
    if (!confirm('이 프리셋을 삭제하시겠습니까?')) return;

    try {
      const res = await fetch(`/api/admin/generate/presets?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        fetchPresets();
      } else {
        alert(data.error || '삭제 실패');
      }
    } catch (error) {
      console.error('Failed to delete preset:', error);
      alert('삭제 중 오류 발생');
    }
  };

  // 폼 초기화
  const resetForm = () => {
    setFormData({
      styleCode: 'piano',
      moodCode: 'calm',
      name: '',
      stylePrompt: '',
      instrumentalDefault: true,
      autoEnabled: true,
      weight: 1,
    });
  };

  // 편집 모드 시작
  const startEdit = (preset: MusicPreset) => {
    setEditingPreset(preset);
    setFormData({
      styleCode: preset.styleCode,
      moodCode: preset.moodCode,
      name: preset.name,
      stylePrompt: preset.stylePrompt,
      instrumentalDefault: preset.instrumentalDefault,
      autoEnabled: preset.autoEnabled,
      weight: preset.weight,
    });
    setShowForm(true);
  };

  // 새 프리셋 추가 시작
  const startAdd = () => {
    setEditingPreset(null);
    resetForm();
    setShowForm(true);
  };

  useEffect(() => {
    fetchPresets();
  }, []);

  // 스타일/분위기별 그룹화
  const groupedPresets = STYLES.map(style => ({
    style,
    presets: presets.filter(p => p.styleCode === style.value),
  }));

  const getStyleLabel = (code: string) => STYLES.find(s => s.value === code)?.label || code;
  const getMoodLabel = (code: string) => MOODS.find(m => m.value === code)?.label || code;

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Music className="w-5 h-5 text-purple-400" />
          Suno 프리셋 관리
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchPresets}
            disabled={loading}
            className="p-2 bg-gray-700 hover:bg-gray-600 rounded text-gray-300"
            title="새로고침"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => seedPresets(false)}
            disabled={seeding}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded text-white text-sm flex items-center gap-2"
            title="기본 프리셋 시드"
          >
            {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
            기본 프리셋
          </button>
          <button
            onClick={startAdd}
            className="px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded text-white text-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            새 프리셋
          </button>
        </div>
      </div>

      {/* 통계 */}
      <div className="mb-4 p-3 bg-gray-900 rounded-lg flex items-center gap-6 text-sm">
        <div>
          <span className="text-gray-400">총 프리셋:</span>
          <span className="text-white font-bold ml-2">{presets.length}개</span>
        </div>
        <div>
          <span className="text-gray-400">자동 생성 활성:</span>
          <span className="text-green-400 font-bold ml-2">
            {presets.filter(p => p.autoEnabled).length}개
          </span>
        </div>
        <div>
          <span className="text-gray-400">스타일 커버리지:</span>
          <span className="text-blue-400 font-bold ml-2">
            {new Set(presets.map(p => p.styleCode)).size}/{STYLES.length}
          </span>
        </div>
      </div>

      {/* 프리셋 목록 */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
        </div>
      ) : presets.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <Music className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>프리셋이 없습니다.</p>
          <p className="text-sm mt-1">"기본 프리셋" 버튼을 눌러 40개 기본 프리셋을 생성하세요.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {groupedPresets.filter(g => g.presets.length > 0).map(({ style, presets: stylePresets }) => (
            <div key={style.value} className="bg-gray-900 rounded-lg overflow-hidden">
              <button
                onClick={() => setExpandedPreset(expandedPreset === style.value ? null : style.value)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-white font-medium">{style.label}</span>
                  <span className="text-xs text-gray-400 bg-gray-700 px-2 py-0.5 rounded">
                    {stylePresets.length}개
                  </span>
                </div>
                {expandedPreset === style.value ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </button>

              {expandedPreset === style.value && (
                <div className="border-t border-gray-700">
                  {stylePresets.map(preset => (
                    <div
                      key={preset.id}
                      className="px-4 py-3 border-b border-gray-800 last:border-0 hover:bg-gray-800/50"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-white">{preset.name}</span>
                          <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded">
                            {getMoodLabel(preset.moodCode)}
                          </span>
                          {preset.autoEnabled && (
                            <span className="text-xs bg-green-900/50 text-green-400 px-2 py-0.5 rounded">
                              자동생성
                            </span>
                          )}
                          {!preset.instrumentalDefault && (
                            <span className="text-xs bg-yellow-900/50 text-yellow-400 px-2 py-0.5 rounded">
                              보컬
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => startEdit(preset)}
                            className="p-1.5 hover:bg-gray-700 rounded text-gray-400 hover:text-white"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deletePreset(preset.id)}
                            className="p-1.5 hover:bg-gray-700 rounded text-gray-400 hover:text-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-400 font-mono bg-gray-800 p-2 rounded truncate">
                        {preset.stylePrompt}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 프리셋 폼 모달 */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-white mb-4">
              {editingPreset ? '프리셋 수정' : '새 프리셋 추가'}
            </h3>

            <div className="space-y-4">
              {/* 스타일/분위기 선택 (새 프리셋일 때만) */}
              {!editingPreset && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">스타일</label>
                    <select
                      value={formData.styleCode}
                      onChange={(e) => setFormData({ ...formData, styleCode: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                    >
                      {STYLES.map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">분위기</label>
                    <select
                      value={formData.moodCode}
                      onChange={(e) => setFormData({ ...formData, moodCode: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                    >
                      {MOODS.map(m => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* 이름 */}
              <div>
                <label className="block text-sm text-gray-300 mb-2">프리셋 이름</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="예: 피아노 - 평온"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                />
              </div>

              {/* 스타일 프롬프트 */}
              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Suno 스타일 프롬프트 <span className="text-purple-400">(핵심!)</span>
                </label>
                <textarea
                  value={formData.stylePrompt}
                  onChange={(e) => setFormData({ ...formData, stylePrompt: e.target.value })}
                  placeholder="Ambient, relaxing piano, soft reverb, peaceful, instrumental, no vocals"
                  rows={4}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  쉼표로 구분된 키워드들. Suno에 직접 전달됩니다.
                </p>
              </div>

              {/* 옵션들 */}
              <div className="grid grid-cols-3 gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.instrumentalDefault}
                    onChange={(e) => setFormData({ ...formData, instrumentalDefault: e.target.checked })}
                    className="w-4 h-4 rounded bg-gray-700 border-gray-600"
                  />
                  <span className="text-sm text-gray-300">악기만</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.autoEnabled}
                    onChange={(e) => setFormData({ ...formData, autoEnabled: e.target.checked })}
                    className="w-4 h-4 rounded bg-gray-700 border-gray-600"
                  />
                  <span className="text-sm text-gray-300">자동생성</span>
                </label>

                <div>
                  <label className="block text-xs text-gray-400 mb-1">가중치</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: parseInt(e.target.value) || 1 })}
                    className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                  />
                </div>
              </div>

              {/* 버튼 */}
              <div className="flex gap-2 pt-4">
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingPreset(null);
                    resetForm();
                  }}
                  className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded"
                >
                  취소
                </button>
                <button
                  onClick={savePreset}
                  disabled={saving || !formData.name || !formData.stylePrompt}
                  className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  저장
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
