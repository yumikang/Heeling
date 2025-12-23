"use client";

import React from 'react';
import {
  Wand2,
  Loader2,
  FileJson,
  Sparkles,
} from 'lucide-react';
import { STYLES, MOODS, TRACK_COUNTS } from '../constants';
import { TitleCacheStatus } from '../types';

interface GenerateTabProps {
  // 상태
  titleKeywords: string;
  setTitleKeywords: (v: string) => void;
  style: string;
  setStyle: (v: string) => void;
  mood: string;
  setMood: (v: string) => void;
  trackCount: number;
  setTrackCount: (v: number) => void;
  instrumental: boolean;
  setInstrumental: (v: boolean) => void;
  isGenerating: boolean;
  generatingKeywords: boolean;
  titleCacheStatus: TitleCacheStatus;
  // 핸들러
  generateKeywordsWithAI: () => void;
  preGenerateTitles: (count: number) => void;
  startBulkGeneration: () => void;
}

export default function GenerateTab({
  titleKeywords,
  setTitleKeywords,
  style,
  setStyle,
  mood,
  setMood,
  trackCount,
  setTrackCount,
  instrumental,
  setInstrumental,
  isGenerating,
  generatingKeywords,
  titleCacheStatus,
  generateKeywordsWithAI,
  preGenerateTitles,
  startBulkGeneration,
}: GenerateTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 설정 패널 */}
      <div className="bg-gray-800 rounded-lg p-6 space-y-6">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-400" /> 대량 음악 생성
        </h3>

        {/* 키워드 입력 - 숨김 처리 (나중에 필요 시 사용) */}
        <div className="hidden">
          <label className="block text-sm text-gray-300 mb-2">키워드 / 테마</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={titleKeywords}
              onChange={(e) => setTitleKeywords(e.target.value)}
              placeholder="예: 아침, 평화, 새로운 시작 (비워두면 AI가 자동 생성)"
              className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
            />
            <button
              onClick={generateKeywordsWithAI}
              disabled={generatingKeywords}
              className="px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded-lg flex items-center gap-2 transition-colors"
              title="AI로 키워드 생성"
            >
              {generatingKeywords ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Wand2 className="w-5 h-5" />
              )}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {titleKeywords.trim()
              ? '각 곡마다 이 키워드를 기반으로 고유한 제목이 생성됩니다'
              : '비워두면 AI가 자동으로 창의적인 키워드를 생성합니다'}
          </p>
        </div>

        {/* 제목 캐시 상태 */}
        <div className="p-3 bg-gray-700/50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <FileJson className="w-4 h-4 text-blue-400" />
              <span className="text-gray-400">사전 생성된 제목:</span>
              <span className={`font-medium ${titleCacheStatus.available > 20 ? 'text-green-400' : titleCacheStatus.available > 5 ? 'text-yellow-400' : 'text-red-400'}`}>
                {titleCacheStatus.loading ? '확인 중...' : `${titleCacheStatus.available}개 사용 가능`}
              </span>
            </div>
            <button
              onClick={() => preGenerateTitles(50)}
              disabled={titleCacheStatus.loading}
              className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded flex items-center gap-1.5 transition-colors"
            >
              {titleCacheStatus.loading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              50개 생성
            </button>
          </div>
          {titleCacheStatus.needsGeneration && titleCacheStatus.available < 10 && !titleCacheStatus.loading && (
            <p className="text-xs text-yellow-400 mt-2">
              💡 제목이 부족합니다. &quot;50개 생성&quot; 버튼을 눌러 미리 생성해두면 토큰을 절약하고 더 빠르게 음악을 생성할 수 있습니다.
            </p>
          )}
        </div>

        {/* 스타일 선택 */}
        <div>
          <label className="block text-sm text-gray-300 mb-2">스타일</label>
          <div className="flex flex-wrap gap-2">
            {STYLES.map(s => (
              <button
                key={s.value}
                onClick={() => setStyle(s.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  style === s.value
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* 분위기 선택 */}
        <div>
          <label className="block text-sm text-gray-300 mb-2">분위기</label>
          <div className="flex flex-wrap gap-2">
            {MOODS.map(m => (
              <button
                key={m.value}
                onClick={() => setMood(m.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  mood === m.value
                    ? 'bg-pink-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* 곡 수 선택 */}
        <div>
          <label className="block text-sm text-gray-300 mb-2">생성할 곡 수</label>
          <div className="flex gap-2">
            {TRACK_COUNTS.map(tc => (
              <button
                key={tc.value}
                onClick={() => setTrackCount(tc.value)}
                className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  trackCount === tc.value
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <div className="font-bold">{tc.label}</div>
                <div className="text-xs opacity-75">{tc.batches}회 생성</div>
              </button>
            ))}
          </div>
        </div>

        {/* 악기만 옵션 */}
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={instrumental}
            onChange={(e) => setInstrumental(e.target.checked)}
            className="w-5 h-5 rounded bg-gray-700 border-gray-600 text-purple-600"
          />
          <span className="text-gray-300">악기 연주만 (보컬 없음)</span>
        </label>
      </div>

      {/* 시작 패널 */}
      <div className="bg-gray-800 rounded-lg p-6 flex flex-col">
        <h3 className="text-lg font-semibold text-white mb-4">생성 시작</h3>

        <div className="flex-1 space-y-4">
          <div className="p-4 bg-gray-700/50 rounded-lg">
            <h4 className="text-white font-medium mb-2">생성 요약</h4>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>• 키워드: <span className="text-white">{titleKeywords || <span className="text-purple-400 italic">AI 자동 생성</span>}</span></li>
              <li>• 스타일: <span className="text-white">{STYLES.find(s => s.value === style)?.label}</span></li>
              <li>• 분위기: <span className="text-white">{MOODS.find(m => m.value === mood)?.label}</span></li>
              <li>• 총 곡 수: <span className="text-white font-bold">{trackCount}곡</span></li>
              <li>• 생성 횟수: <span className="text-white">{trackCount / 2}회 (1회당 2곡)</span></li>
              <li>• 예상 크레딧: <span className="text-yellow-400">{(trackCount / 2) * 12} 크레딧</span> <span className="text-gray-500">(1회당 12크레딧)</span></li>
              <li>• 제목 캐시: <span className={titleCacheStatus.available > 0 ? 'text-green-400' : 'text-yellow-400'}>{titleCacheStatus.available > 0 ? `${titleCacheStatus.available}개 (토큰 절약 모드)` : 'AI 실시간 생성'}</span></li>
            </ul>
          </div>

          <div className="p-4 bg-blue-900/30 border border-blue-500/30 rounded-lg">
            <p className="text-sm text-blue-300">
              <strong>💡 알림:</strong> {titleCacheStatus.available >= trackCount / 2
                ? '사전 생성된 제목을 사용하여 토큰 비용 없이 빠르게 생성됩니다.'
                : '각 곡마다 AI가 고유한 제목(한글/영문)을 생성합니다.'}
              {' '}전체 생성에는 약 {Math.ceil(trackCount / 2 * 2)}분이 소요됩니다.
            </p>
          </div>
        </div>

        <button
          onClick={startBulkGeneration}
          disabled={isGenerating}
          className="w-full py-4 mt-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-bold text-lg rounded-lg flex items-center justify-center gap-2 transition-all"
        >
          <Sparkles className="w-6 h-6" />
          {trackCount}곡 생성 시작
        </button>
      </div>
    </div>
  );
}
