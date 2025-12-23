"use client";

import React, { useEffect, useState } from 'react';
import {
  Music,
  Image,
  Type,
  Eye,
  EyeOff,
  Save,
  Loader2,
  BarChart3,
  RefreshCw,
  Trash,
  Zap,
  DollarSign,
} from 'lucide-react';
import PresetManager from './PresetManager';

// API 비용 상수 (USD)
const API_COSTS = {
  gemini: 0.00015, // Gemini 1.5 Flash per 1K input tokens (약 1 요청당)
  imagen: 0.02,    // Imagen per image
};
import { APIConfig } from '../types';

interface APIUsageStats {
  today: {
    date: string;
    suno: { calls: number; success: number; failed: number; tracks: number };
    gemini: { calls: number; success: number; failed: number; titles: number };
    imagen: { calls: number; success: number; failed: number; images: number };
  };
  totals: {
    suno: { calls: number; success: number; failed: number; tracks: number };
    gemini: { calls: number; success: number; failed: number; titles: number };
    imagen: { calls: number; success: number; failed: number; images: number };
  };
}

interface CacheStats {
  suno: { count: number };
  gemini: { count: number };
  imagen: { count: number };
}

interface SettingsTabProps {
  apiConfig: APIConfig;
  setApiConfig: React.Dispatch<React.SetStateAction<APIConfig>>;
  showApiKeys: { music: boolean; image: boolean; text: boolean };
  setShowApiKeys: React.Dispatch<React.SetStateAction<{ music: boolean; image: boolean; text: boolean }>>;
  savingSettings: boolean;
  saveSettings: () => void;
}

export default function SettingsTab({
  apiConfig,
  setApiConfig,
  showApiKeys,
  setShowApiKeys,
  savingSettings,
  saveSettings,
}: SettingsTabProps) {
  const [usageStats, setUsageStats] = useState<APIUsageStats | null>(null);
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [clearingCache, setClearingCache] = useState<string | null>(null);
  const [sunoCredits, setSunoCredits] = useState<{ credits: number; tracksAvailable: number } | null>(null);

  // Fetch Suno credits
  const fetchSunoCredits = async () => {
    try {
      const res = await fetch('/api/admin/generate/music?action=credits');
      const data = await res.json();
      if (data.success && data.data) {
        setSunoCredits({
          credits: data.data.credits,
          tracksAvailable: data.data.tracksAvailable,
        });
      }
    } catch (error) {
      console.error('Failed to fetch Suno credits:', error);
    }
  };

  // Fetch API usage and cache stats
  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const [usageRes, cacheRes] = await Promise.all([
        fetch('/api/admin/generate/cache?action=usage'),
        fetch('/api/admin/generate/cache?action=list'),
      ]);

      const usageData = await usageRes.json();
      const cacheData = await cacheRes.json();

      if (usageData.success) {
        setUsageStats(usageData.data);
      }
      if (cacheData.success) {
        setCacheStats({
          suno: { count: cacheData.data.suno.count },
          gemini: { count: cacheData.data.gemini.count },
          imagen: { count: cacheData.data.imagen.count },
        });
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  // Clear cache
  const clearCache = async (type: 'suno' | 'gemini' | 'imagen' | 'all') => {
    setClearingCache(type);
    try {
      await fetch(`/api/admin/generate/cache?type=${type}`, { method: 'DELETE' });
      await fetchStats();
    } catch (error) {
      console.error('Failed to clear cache:', error);
    } finally {
      setClearingCache(null);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchSunoCredits();
  }, []);

  return (
    <div className="space-y-6">
      {/* Suno 프리셋 관리 */}
      <PresetManager />

      {/* API 모니터링 섹션 */}
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5" /> API 사용량 모니터링
          </h3>
          <button
            onClick={() => { fetchStats(); fetchSunoCredits(); }}
            disabled={loadingStats}
            className="p-2 bg-gray-700 hover:bg-gray-600 rounded text-gray-300"
          >
            <RefreshCw className={`w-4 h-4 ${loadingStats ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {usageStats ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Suno API */}
            <div className="bg-gray-900 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Music className="w-5 h-5 text-purple-400" />
                  <span className="font-medium text-white">Suno (음악)</span>
                </div>
                {sunoCredits && (
                  <div className="flex items-center gap-1.5 bg-yellow-500/20 px-2 py-1 rounded">
                    <Zap className="w-3.5 h-3.5 text-yellow-400" />
                    <span className="text-yellow-400 font-bold text-sm">{sunoCredits.credits.toLocaleString()}</span>
                  </div>
                )}
              </div>
              <div className="space-y-2 text-sm">
                {sunoCredits && (
                  <div className="flex justify-between text-xs mb-2 pb-2 border-b border-gray-700">
                    <span className="text-gray-500">생성 가능</span>
                    <span className="text-yellow-400">~{sunoCredits.tracksAvailable}곡</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-400">오늘 호출</span>
                  <span className="text-white">{usageStats.today.suno.calls}회</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">성공/실패</span>
                  <span>
                    <span className="text-green-400">{usageStats.today.suno.success}</span>
                    <span className="text-gray-500"> / </span>
                    <span className="text-red-400">{usageStats.today.suno.failed}</span>
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">생성된 트랙</span>
                  <span className="text-purple-400">{usageStats.today.suno.tracks}개</span>
                </div>
                <div className="border-t border-gray-700 pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">전체 누적</span>
                    <span className="text-gray-400">{usageStats.totals.suno.calls}회 / {usageStats.totals.suno.tracks}트랙</span>
                  </div>
                </div>
                {cacheStats && (
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-gray-500">캐시 {cacheStats.suno.count}건</span>
                    <button
                      onClick={() => clearCache('suno')}
                      disabled={clearingCache === 'suno'}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      {clearingCache === 'suno' ? '삭제 중...' : '삭제'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Gemini API (Title) */}
            <div className="bg-gray-900 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Type className="w-5 h-5 text-blue-400" />
                  <span className="font-medium text-white">Gemini (제목)</span>
                </div>
                {usageStats.totals.gemini.calls > 0 && (
                  <div className="flex items-center gap-1 bg-blue-500/20 px-2 py-1 rounded text-xs">
                    <DollarSign className="w-3 h-3 text-blue-400" />
                    <span className="text-blue-400">~${(usageStats.totals.gemini.calls * API_COSTS.gemini).toFixed(3)}</span>
                  </div>
                )}
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">오늘 호출</span>
                  <span className="text-white">{usageStats.today.gemini.calls}회</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">성공/실패</span>
                  <span>
                    <span className="text-green-400">{usageStats.today.gemini.success}</span>
                    <span className="text-gray-500"> / </span>
                    <span className="text-red-400">{usageStats.today.gemini.failed}</span>
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">생성된 제목</span>
                  <span className="text-blue-400">{usageStats.today.gemini.titles}개</span>
                </div>
                <div className="border-t border-gray-700 pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">전체 누적</span>
                    <span className="text-gray-400">{usageStats.totals.gemini.calls}회 / {usageStats.totals.gemini.titles}제목</span>
                  </div>
                  <div className="flex justify-between text-xs mt-1">
                    <span className="text-gray-600">예상 비용</span>
                    <span className="text-gray-500">${(usageStats.totals.gemini.calls * API_COSTS.gemini).toFixed(4)}</span>
                  </div>
                </div>
                {cacheStats && (
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-gray-500">캐시 {cacheStats.gemini.count}건</span>
                    <button
                      onClick={() => clearCache('gemini')}
                      disabled={clearingCache === 'gemini'}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      {clearingCache === 'gemini' ? '삭제 중...' : '삭제'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Imagen API */}
            <div className="bg-gray-900 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Image className="w-5 h-5 text-green-400" />
                  <span className="font-medium text-white">Imagen (이미지)</span>
                </div>
                {usageStats.totals.imagen.images > 0 && (
                  <div className="flex items-center gap-1 bg-green-500/20 px-2 py-1 rounded text-xs">
                    <DollarSign className="w-3 h-3 text-green-400" />
                    <span className="text-green-400">~${(usageStats.totals.imagen.images * API_COSTS.imagen).toFixed(2)}</span>
                  </div>
                )}
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">오늘 호출</span>
                  <span className="text-white">{usageStats.today.imagen.calls}회</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">성공/실패</span>
                  <span>
                    <span className="text-green-400">{usageStats.today.imagen.success}</span>
                    <span className="text-gray-500"> / </span>
                    <span className="text-red-400">{usageStats.today.imagen.failed}</span>
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">생성된 이미지</span>
                  <span className="text-green-400">{usageStats.today.imagen.images}개</span>
                </div>
                <div className="border-t border-gray-700 pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">전체 누적</span>
                    <span className="text-gray-400">{usageStats.totals.imagen.calls}회 / {usageStats.totals.imagen.images}이미지</span>
                  </div>
                  <div className="flex justify-between text-xs mt-1">
                    <span className="text-gray-600">예상 비용</span>
                    <span className="text-gray-500">${(usageStats.totals.imagen.images * API_COSTS.imagen).toFixed(2)}</span>
                  </div>
                </div>
                {cacheStats && (
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-gray-500">캐시 {cacheStats.imagen.count}건</span>
                    <button
                      onClick={() => clearCache('imagen')}
                      disabled={clearingCache === 'imagen'}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      {clearingCache === 'imagen' ? '삭제 중...' : '삭제'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            {loadingStats ? '로딩 중...' : '사용량 데이터 없음'}
          </div>
        )}

        {/* 전체 캐시 삭제 */}
        {cacheStats && (cacheStats.suno.count + cacheStats.gemini.count + cacheStats.imagen.count) > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-700 flex justify-end">
            <button
              onClick={() => clearCache('all')}
              disabled={clearingCache === 'all'}
              className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded flex items-center gap-2 text-sm"
            >
              <Trash className="w-4 h-4" />
              {clearingCache === 'all' ? '삭제 중...' : '전체 캐시 삭제'}
            </button>
          </div>
        )}
      </div>

      {/* API 설정 */}
      <div className="bg-gray-800 rounded-lg p-4 space-y-4">
        <h3 className="text-lg font-semibold text-white">API 설정</h3>

        {/* Music API */}
        <div className="bg-gray-900 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-white font-medium flex items-center gap-2"><Music className="w-4 h-4" /> 음악 생성 (Suno)</span>
            <input
              type="checkbox"
              checked={apiConfig.music.enabled}
              onChange={(e) => setApiConfig(prev => ({ ...prev, music: { ...prev.music, enabled: e.target.checked }}))}
              className="w-5 h-5 rounded bg-gray-700 border-gray-600 text-purple-600"
            />
          </div>
          <div className="relative">
            <input
              type={showApiKeys.music ? 'text' : 'password'}
              value={apiConfig.music.apiKey}
              onChange={(e) => setApiConfig(prev => ({ ...prev, music: { ...prev.music, apiKey: e.target.value }}))}
              placeholder="Suno API Key"
              className="w-full px-3 py-2 pr-10 bg-gray-700 border border-gray-600 rounded text-white text-sm"
            />
            <button
              onClick={() => setShowApiKeys(prev => ({ ...prev, music: !prev.music }))}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
            >
              {showApiKeys.music ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Image API */}
        <div className="bg-gray-900 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-white font-medium flex items-center gap-2"><Image className="w-4 h-4" /> 이미지 생성 (Gemini)</span>
            <input
              type="checkbox"
              checked={apiConfig.image.enabled}
              onChange={(e) => setApiConfig(prev => ({ ...prev, image: { ...prev.image, enabled: e.target.checked }}))}
              className="w-5 h-5 rounded bg-gray-700 border-gray-600 text-purple-600"
            />
          </div>
          <div className="relative">
            <input
              type={showApiKeys.image ? 'text' : 'password'}
              value={apiConfig.image.apiKey}
              onChange={(e) => setApiConfig(prev => ({ ...prev, image: { ...prev.image, apiKey: e.target.value }}))}
              placeholder="Gemini API Key"
              className="w-full px-3 py-2 pr-10 bg-gray-700 border border-gray-600 rounded text-white text-sm"
            />
            <button
              onClick={() => setShowApiKeys(prev => ({ ...prev, image: !prev.image }))}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
            >
              {showApiKeys.image ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Text API */}
        <div className="bg-gray-900 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-white font-medium flex items-center gap-2"><Type className="w-4 h-4" /> 텍스트 생성</span>
            <input
              type="checkbox"
              checked={apiConfig.text.enabled}
              onChange={(e) => setApiConfig(prev => ({ ...prev, text: { ...prev.text, enabled: e.target.checked }}))}
              className="w-5 h-5 rounded bg-gray-700 border-gray-600 text-purple-600"
            />
          </div>
          <div className="flex gap-2">
            {[
              { value: 'openai', label: 'OpenAI' },
              { value: 'claude', label: 'Claude' },
              { value: 'gemini', label: 'Gemini' },
            ].map(p => (
              <button
                key={p.value}
                onClick={() => setApiConfig(prev => ({ ...prev, text: { ...prev.text, provider: p.value }}))}
                className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
                  apiConfig.text.provider === p.value
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="relative">
            <input
              type={showApiKeys.text ? 'text' : 'password'}
              value={apiConfig.text.apiKey}
              onChange={(e) => setApiConfig(prev => ({ ...prev, text: { ...prev.text, apiKey: e.target.value }}))}
              placeholder="API Key"
              className="w-full px-3 py-2 pr-10 bg-gray-700 border border-gray-600 rounded text-white text-sm"
            />
            <button
              onClick={() => setShowApiKeys(prev => ({ ...prev, text: !prev.text }))}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
            >
              {showApiKeys.text ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          onClick={saveSettings}
          disabled={savingSettings}
          className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded-lg flex items-center justify-center gap-2"
        >
          {savingSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          API 설정 저장
        </button>
      </div>
    </div>
  );
}
