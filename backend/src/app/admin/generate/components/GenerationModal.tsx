"use client";

import React from 'react';
import {
  Music,
  Image,
  Type,
  Check,
  AlertCircle,
  Loader2,
  Clock,
  Download,
  X,
  Sparkles,
} from 'lucide-react';
import { GenerationProgress, TabType } from '../types';

interface GenerationModalProps {
  show: boolean;
  progress: GenerationProgress | null;
  onClose: () => void;
  onViewTracks: () => void;
  onMinimize?: () => void;
}

export default function GenerationModal({
  show,
  progress,
  onClose,
  onViewTracks,
  onMinimize,
}: GenerationModalProps) {
  if (!show || !progress) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-2xl p-8 w-full max-w-lg mx-4 relative">
        {/* 닫기 버튼 (항상 표시) */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          title="닫기"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 최소화 버튼 (진행 중일 때만 표시) */}
        {progress.phase !== 'complete' && progress.phase !== 'error' && onMinimize && (
          <button
            onClick={onMinimize}
            className="absolute top-4 right-14 p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            title="백그라운드로 실행"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}

        {progress.phase === 'complete' ? (
          // 완료 화면
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
              <Check className="w-10 h-10 text-green-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">생성 완료!</h3>
            <p className="text-gray-400 mb-6">
              {progress.completedTracks.length}개의 멋진 곡이 생성되었습니다
            </p>
            <div className="flex gap-3">
              <button
                onClick={onViewTracks}
                className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium"
              >
                생성 목록 보기
              </button>
              <button
                onClick={onClose}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
              >
                닫기
              </button>
            </div>
          </div>
        ) : progress.phase === 'error' ? (
          // 에러 화면
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
              <AlertCircle className="w-10 h-10 text-red-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">생성 오류</h3>
            <p className="text-red-400 mb-4 text-sm break-words">
              {progress.errorMessage || '알 수 없는 오류가 발생했습니다'}
            </p>
            {progress.completedTracks.length > 0 && (
              <p className="text-gray-400 mb-4">
                {progress.completedTracks.length}개의 곡이 생성되었습니다
              </p>
            )}
            <div className="flex gap-3">
              {progress.completedTracks.length > 0 && (
                <button
                  onClick={onViewTracks}
                  className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium"
                >
                  생성된 곡 보기
                </button>
              )}
              <button
                onClick={onClose}
                className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
              >
                닫기
              </button>
            </div>
          </div>
        ) : (
          // 진행 중 화면
          <>
            <div className="text-center mb-8">
              <div className="w-20 h-20 mx-auto mb-4 relative">
                <div className="absolute inset-0 rounded-full border-4 border-gray-700"></div>
                <div
                  className="absolute inset-0 rounded-full border-4 border-purple-500 border-t-transparent animate-spin"
                ></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-purple-400" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">멋진 곡들을 생성중입니다...</h3>
              <p className="text-gray-400">잠시만 기다려주세요</p>
            </div>

            {/* 진행 바 */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-400 mb-2">
                <span>전체 진행률</span>
                <span>{progress.currentTrack} / {progress.totalTracks}곡</span>
              </div>
              <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                  style={{ width: `${(progress.currentTrack / progress.totalTracks) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* 현재 단계 */}
            <div className="space-y-3">
              <PhaseIndicator
                phase="title"
                currentPhase={progress.phase}
                title="제목 생성 중"
                subtitle={progress.currentTitle}
                extra={`${progress.currentBatch}/${progress.totalBatches}`}
                activeColor="purple"
              />
              <PhaseIndicator
                phase="music"
                currentPhase={progress.phase}
                title="음악 생성 중"
                subtitle="Suno AI로 음악 생성"
                activeColor="pink"
              />
              <PhaseIndicator
                phase="waiting"
                currentPhase={progress.phase}
                title="처리 대기 중"
                subtitle="음악 파일 처리 중..."
                activeColor="blue"
              />
              <PhaseIndicator
                phase="downloading"
                currentPhase={progress.phase}
                title="파일 다운로드"
                subtitle="오디오 파일 저장 중..."
                activeColor="cyan"
              />
              <PhaseIndicator
                phase="image"
                currentPhase={progress.phase}
                title="커버 이미지 생성"
                subtitle="Gemini AI로 이미지 생성"
                activeColor="orange"
              />
            </div>

            {/* 생성된 곡 미리보기 */}
            {progress.completedTracks.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-700">
                <p className="text-sm text-gray-400 mb-3">생성된 곡 ({progress.completedTracks.length})</p>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {progress.completedTracks.slice(-4).map((track) => (
                    <div key={track.id} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-400" />
                      <span className="text-white truncate">{track.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 중지 버튼 */}
            <button
              onClick={onClose}
              className="w-full mt-6 py-3 bg-red-600/20 hover:bg-red-600/40 border border-red-500/30 text-red-400 rounded-lg font-medium transition-colors"
            >
              생성 중지
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// 단계 표시 컴포넌트
function PhaseIndicator({
  phase,
  currentPhase,
  title,
  subtitle,
  extra,
  activeColor,
}: {
  phase: string;
  currentPhase: string;
  title: string;
  subtitle?: string;
  extra?: string;
  activeColor: string;
}) {
  const phases = ['title', 'music', 'waiting', 'downloading', 'image', 'complete'];
  const phaseIndex = phases.indexOf(phase);
  const currentIndex = phases.indexOf(currentPhase);

  const isActive = currentPhase === phase;
  const isComplete = currentIndex > phaseIndex;

  const colorClasses: Record<string, string> = {
    purple: 'bg-purple-900/30 border-purple-500/30',
    pink: 'bg-pink-900/30 border-pink-500/30',
    blue: 'bg-blue-900/30 border-blue-500/30',
    cyan: 'bg-cyan-900/30 border-cyan-500/30',
    orange: 'bg-orange-900/30 border-orange-500/30',
  };

  const iconColorClasses: Record<string, string> = {
    purple: 'text-purple-400',
    pink: 'text-pink-400',
    blue: 'text-blue-400',
    cyan: 'text-cyan-400',
    orange: 'text-orange-400',
  };

  const IconMap: Record<string, React.ReactNode> = {
    title: <Type className="w-5 h-5" />,
    music: <Music className="w-5 h-5" />,
    waiting: <Clock className="w-5 h-5" />,
    downloading: <Download className="w-5 h-5" />,
    image: <Image className="w-5 h-5" />,
  };

  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg ${
      isActive ? `${colorClasses[activeColor]} border` : 'bg-gray-700/50'
    }`}>
      {isActive ? (
        <Loader2 className={`w-5 h-5 ${iconColorClasses[activeColor]} animate-spin`} />
      ) : isComplete ? (
        <Check className="w-5 h-5 text-green-400" />
      ) : (
        <span className="text-gray-500">{IconMap[phase]}</span>
      )}
      <div className="flex-1">
        <p className="text-white text-sm font-medium">{title}</p>
        {subtitle && <p className="text-xs text-gray-400 truncate">{subtitle}</p>}
      </div>
      {extra && <span className="text-xs text-gray-500">{extra}</span>}
    </div>
  );
}
