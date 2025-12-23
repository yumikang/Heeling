"use client";

import React, { useState, useEffect } from 'react';
import { Save, RefreshCw, AlertCircle, Check } from 'lucide-react';

interface AppConfig {
  key: string;
  value: string;
  category: string;
  updatedAt: string;
}

interface ConfigGroup {
  [key: string]: AppConfig[];
}

export default function AppConfigTab() {
  const [configs, setConfigs] = useState<AppConfig[]>([]);
  const [editedConfigs, setEditedConfigs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchConfigs = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/config');
      const data = await response.json();
      if (data.success) {
        setConfigs(data.data || []);
        // Initialize edited configs
        const edited: Record<string, string> = {};
        (data.data || []).forEach((config: AppConfig) => {
          edited[config.key] = config.value;
        });
        setEditedConfigs(edited);
      } else {
        setError('설정을 불러오는데 실패했습니다.');
      }
    } catch (err) {
      setError('서버 연결에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  const handleValueChange = (key: string, value: string) => {
    setEditedConfigs(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Find changed configs
      const changedConfigs = configs
        .filter(config => editedConfigs[config.key] !== config.value)
        .map(config => ({
          key: config.key,
          value: editedConfigs[config.key],
          category: config.category,
        }));

      if (changedConfigs.length === 0) {
        setSuccess('변경된 내용이 없습니다.');
        setSaving(false);
        return;
      }

      const response = await fetch('/api/admin/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ configs: changedConfigs }),
      });

      const data = await response.json();
      if (data.success) {
        setSuccess(`${changedConfigs.length}개의 설정이 저장되었습니다.`);
        fetchConfigs(); // Reload
      } else {
        setError('저장에 실패했습니다.');
      }
    } catch (err) {
      setError('서버 연결에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // Group configs by category
  const groupedConfigs: ConfigGroup = configs.reduce((acc, config) => {
    const category = config.category || 'general';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(config);
    return acc;
  }, {} as ConfigGroup);

  const categoryLabels: Record<string, string> = {
    app: '앱 버전',
    features: '기능 설정',
    monetization: '수익화 (광고/구독)',
    player: '플레이어',
    support: '고객 지원',
    system: '시스템',
    general: '일반',
    premium: '프리미엄',
  };

  const formatValue = (value: string): string => {
    try {
      const parsed = JSON.parse(value);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return value;
    }
  };

  const isJsonValue = (value: string): boolean => {
    try {
      JSON.parse(value);
      return true;
    } catch {
      return false;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="animate-spin text-purple-500" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">앱 설정</h2>
          <p className="text-sm text-gray-400">앱의 기본 설정값을 관리합니다. JSON 형식의 값은 편집 시 주의해주세요.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchConfigs}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors"
          >
            <RefreshCw size={16} />
            새로고침
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white transition-colors disabled:opacity-50"
          >
            {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
            저장
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-900/30 border border-red-700 rounded-lg text-red-400">
          <AlertCircle size={16} />
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 p-4 bg-green-900/30 border border-green-700 rounded-lg text-green-400">
          <Check size={16} />
          {success}
        </div>
      )}

      {/* Config Groups */}
      {Object.entries(groupedConfigs).map(([category, categoryConfigs]) => (
        <div key={category} className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          <div className="px-6 py-4 bg-gray-800/50 border-b border-gray-800">
            <h3 className="text-lg font-medium text-white">
              {categoryLabels[category] || category}
            </h3>
          </div>
          <div className="divide-y divide-gray-800">
            {categoryConfigs.map((config) => (
              <div key={config.key} className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {config.key}
                    </label>
                    {isJsonValue(config.value) ? (
                      <textarea
                        value={formatValue(editedConfigs[config.key] || config.value)}
                        onChange={(e) => {
                          try {
                            // Validate JSON before saving
                            const trimmed = e.target.value.trim();
                            if (trimmed) JSON.parse(trimmed);
                            handleValueChange(config.key, trimmed);
                          } catch {
                            // Allow invalid JSON while editing
                            handleValueChange(config.key, e.target.value);
                          }
                        }}
                        rows={Math.min(15, formatValue(config.value).split('\n').length + 1)}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white font-mono text-sm focus:border-purple-500 focus:outline-none resize-y"
                      />
                    ) : (
                      <input
                        type="text"
                        value={editedConfigs[config.key] || config.value}
                        onChange={(e) => handleValueChange(config.key, e.target.value)}
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                      />
                    )}
                    <p className="mt-2 text-xs text-gray-500">
                      마지막 수정: {new Date(config.updatedAt).toLocaleString('ko-KR')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {configs.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          설정이 없습니다. 데이터베이스를 시딩해주세요.
        </div>
      )}
    </div>
  );
}
