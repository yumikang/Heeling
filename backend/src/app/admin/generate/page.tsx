"use client";

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import {
  Wand2,
  RefreshCw,
  AlertCircle,
  Loader2,
  Settings,
  Calendar,
  Zap,
  List,
  X,
  Sparkles,
  Upload,
} from 'lucide-react';
import { TabType, GeneratedTrack, DeployedTrack } from './types';
import { GenerateTab, TracksTab, DeployedTab, ScheduleTab, SettingsTab, GenerationModal } from './components';
import { useGeneration, useTracks, useSync, useSettings } from './hooks';

export default function GeneratePage() {
  const [activeTab, setActiveTab] = useState<TabType>('generate');
  const [error, setError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // ==================== 음악 생성 폼 상태 ====================
  const [titleKeywords, setTitleKeywords] = useState('');
  const [style, setStyle] = useState('piano');
  const [mood, setMood] = useState('calm');
  const [instrumental, setInstrumental] = useState(true);
  const [trackCount, setTrackCount] = useState(2);

  // ==================== 생성 목록 상태 (useTracks에서 공유) ====================
  const [generatedTracks, setGeneratedTracks] = useState<GeneratedTrack[]>([]);

  // ==================== 배포된 트랙 상태 ====================
  const [deployedTracks, setDeployedTracks] = useState<DeployedTrack[]>([]);
  const [loadingDeployedTracks, setLoadingDeployedTracks] = useState(false);

  // ==================== Custom Hooks ====================
  const settings = useSettings(setError);

  const generation = useGeneration({
    style,
    mood,
    instrumental,
    trackCount,
    titleKeywords,
    setGeneratedTracks,
    setError,
  });

  const tracks = useTracks(setError, generatedTracks, setGeneratedTracks);

  const sync = useSync(
    setError,
    setGeneratedTracks,
    settings.fetchSunoCredits,
    generation.saveSunoCache
  );

  // 초기 트랙 로드 및 기존 배포 트랙 마이그레이션
  useEffect(() => {
    const loadSavedTracks = async () => {
      try {
        const response = await fetch('/api/admin/generate/tracks');
        const data = await response.json();
        if (data.success && data.data) {
          const tracks: GeneratedTrack[] = data.data;

          // 기존 배포 트랙 마이그레이션: dbTrackId가 있지만 deployed가 false인 트랙 찾기
          const needsMigration = tracks.filter(t => t.dbTrackId && !t.deployed);

          if (needsMigration.length > 0) {
            // 서버에 deployed 상태 업데이트
            const bulkUpdate = needsMigration.map(t => ({
              id: t.id,
              deployed: true,
              deployedAt: t.deployedAt || new Date().toISOString(),
            }));

            await fetch('/api/admin/generate/tracks', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ bulkUpdate }),
            });

            // 로컬 상태도 업데이트
            const migratedTracks = tracks.map(t =>
              t.dbTrackId && !t.deployed
                ? { ...t, deployed: true, deployedAt: t.deployedAt || new Date().toISOString() }
                : t
            );
            setGeneratedTracks(migratedTracks);
            console.log(`Migrated ${needsMigration.length} previously deployed tracks`);
          } else {
            setGeneratedTracks(tracks);
          }
        }
      } catch (err) {
        console.log('No saved tracks found');
      }
    };
    loadSavedTracks();
  }, []);

  // 배포된 트랙 로드 함수
  const loadDeployedTracks = async () => {
    setLoadingDeployedTracks(true);
    try {
      const response = await fetch('/api/admin/generate/deployed');
      const data = await response.json();
      if (data.success && data.data) {
        setDeployedTracks(data.data);
      }
    } catch (err) {
      console.error('Failed to load deployed tracks:', err);
    } finally {
      setLoadingDeployedTracks(false);
    }
  };

  // deployed 탭 진입 시 배포된 트랙 로드
  useEffect(() => {
    if (activeTab === 'deployed') {
      loadDeployedTracks();
    }
  }, [activeTab]);

  // 제목 캐시 체크 트리거
  useEffect(() => {
    generation.checkTitleCache();
  }, [generation.checkTitleCache]);

  // 키워드 생성 핸들러 (폼 상태 업데이트)
  const handleGenerateKeywords = async () => {
    const keyword = await generation.generateKeywordsWithAI();
    if (keyword) {
      setTitleKeywords(keyword);
    }
  };

  // 생성 완료 감지 및 토스트 표시
  useEffect(() => {
    if (generation.generationProgress?.phase === 'complete' && generation.showGenerationModal) {
      setToastMessage(`${generation.generationProgress.completedTracks.length}개의 곡 생성 완료!`);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  }, [generation.generationProgress?.phase, generation.showGenerationModal]);

  // 미배포 트랙만 필터링
  const pendingTracks = generatedTracks.filter(t => !t.deployed);

  const tabs = [
    { id: 'generate' as TabType, label: '음악 생성', icon: Wand2 },
    { id: 'tracks' as TabType, label: '생성 목록', icon: List, count: pendingTracks.length },
    { id: 'deployed' as TabType, label: '배포 목록', icon: Upload, count: deployedTracks.length },
    { id: 'schedule' as TabType, label: '스케줄', icon: Calendar },
    { id: 'settings' as TabType, label: '설정', icon: Settings },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Wand2 className="w-7 h-7 text-purple-400" />
              AI 음악 생성
            </h1>
            <p className="text-gray-400 mt-1">AI로 힐링 음악을 자동 생성하고 관리하세요</p>
          </div>
          <div className="flex items-center gap-3">
            {settings.sunoCredits !== null && (
              <div className="bg-gray-800 px-4 py-2 rounded-lg flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-400" />
                <span className="text-gray-300">Suno 크레딧:</span>
                <span className="text-white font-bold">{settings.sunoCredits}</span>
              </div>
            )}
            <button
              onClick={() => sync.setShowSyncModal(true)}
              disabled={sync.syncingRecords}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                sync.syncingRecords
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-cyan-600/20 hover:bg-cyan-600/40 border border-cyan-500/30 text-cyan-400'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${sync.syncingRecords ? 'animate-spin' : ''}`} />
              {sync.syncingRecords ? '동기화 중...' : 'Task ID로 가져오기'}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-700 pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-t-lg flex items-center gap-2 transition-colors ${
                activeTab === tab.id
                  ? 'bg-gray-800 text-purple-400 border-b-2 border-purple-400'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className="ml-1 px-2 py-0.5 text-xs bg-purple-600 rounded-full">{tab.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
            <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-300">×</button>
          </div>
        )}

        {/* Background Generation Progress Banner */}
        {!generation.showGenerationModal && generation.isGenerating && generation.generationProgress && (
          <div
            onClick={() => generation.setShowGenerationModal(true)}
            className="bg-purple-900/50 border border-purple-500/30 text-purple-200 px-4 py-3 rounded-lg cursor-pointer hover:bg-purple-900/70 transition-colors"
          >
            <div className="flex items-center gap-3 mb-2">
              <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
              <span className="font-medium">백그라운드에서 음악 생성 중...</span>
              <span className="ml-auto text-purple-400">
                {generation.generationProgress.currentTrack}/{generation.generationProgress.totalTracks}곡
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all"
                style={{ width: `${(generation.generationProgress.currentTrack / generation.generationProgress.totalTracks) * 100}%` }}
              />
            </div>
            <p className="text-xs text-purple-300 mt-2">클릭하여 진행 상황 보기</p>
          </div>
        )}

        {/* Sync Progress Alert */}
        {sync.syncingRecords && sync.syncProgress && (
          <div className="bg-cyan-900/50 border border-cyan-500/30 text-cyan-200 px-4 py-3 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="font-medium">{sync.syncProgress.status}</span>
              {sync.syncProgress.total > 0 && (
                <span className="ml-auto text-cyan-400">
                  {sync.syncProgress.current}/{sync.syncProgress.total}
                </span>
              )}
            </div>
            {sync.syncProgress.total > 0 && (
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-cyan-500 h-2 rounded-full transition-all"
                  style={{ width: `${(sync.syncProgress.current / sync.syncProgress.total) * 100}%` }}
                />
              </div>
            )}
          </div>
        )}

        {/* ==================== 탭 콘텐츠 ==================== */}
        {activeTab === 'generate' && (
          <GenerateTab
            titleKeywords={titleKeywords}
            setTitleKeywords={setTitleKeywords}
            style={style}
            setStyle={setStyle}
            mood={mood}
            setMood={setMood}
            trackCount={trackCount}
            setTrackCount={setTrackCount}
            instrumental={instrumental}
            setInstrumental={setInstrumental}
            isGenerating={generation.isGenerating}
            generatingKeywords={generation.generatingKeywords}
            titleCacheStatus={generation.titleCacheStatus}
            generateKeywordsWithAI={handleGenerateKeywords}
            preGenerateTitles={generation.preGenerateTitles}
            startBulkGeneration={generation.startBulkGeneration}
          />
        )}

        {activeTab === 'tracks' && (
          <TracksTab
            generatedTracks={pendingTracks}
            selectedTrackIds={tracks.selectedTrackIds}
            trackViewMode={tracks.trackViewMode}
            setTrackViewMode={tracks.setTrackViewMode}
            playingId={tracks.playingId}
            downloadingTracks={tracks.downloadingTracks}
            toggleSelectAll={tracks.toggleSelectAll}
            toggleTrackSelection={tracks.toggleTrackSelection}
            togglePlay={tracks.togglePlay}
            downloadTrack={tracks.downloadTrack}
            downloadSelectedTracks={tracks.downloadSelectedTracks}
            exportTracksAsJson={tracks.exportTracksAsJson}
            deleteSelectedTracks={tracks.deleteSelectedTracks}
            setShowPlaylistModal={tracks.setShowPlaylistModal}
            setPlaylistName={tracks.setPlaylistName}
            setActiveTab={setActiveTab}
            // 편집 관련
            showEditModal={tracks.showEditModal}
            editingTrack={tracks.editingTrack}
            editForm={tracks.editForm}
            savingEdit={tracks.savingEdit}
            openEditModal={tracks.openEditModal}
            closeEditModal={tracks.closeEditModal}
            updateEditForm={tracks.updateEditForm}
            saveTrackEdit={tracks.saveTrackEdit}
            // 배포 관련
            deploying={tracks.deploying}
            deploySelectedTracks={tracks.deploySelectedTracks}
          />
        )}

        {activeTab === 'deployed' && (
          <DeployedTab
            deployedTracks={deployedTracks}
            loading={loadingDeployedTracks}
            onRefresh={loadDeployedTracks}
            setActiveTab={setActiveTab}
            setError={setError}
          />
        )}

        {activeTab === 'schedule' && (
          <ScheduleTab
            schedules={settings.schedules}
            showScheduleForm={settings.showScheduleForm}
            setShowScheduleForm={settings.setShowScheduleForm}
            editingSchedule={settings.editingSchedule}
            setEditingSchedule={settings.setEditingSchedule}
            saveSchedule={settings.saveSchedule}
            deleteSchedule={settings.deleteSchedule}
            runScheduleNow={settings.runScheduleNow}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsTab
            apiConfig={settings.apiConfig}
            setApiConfig={settings.setApiConfig}
            showApiKeys={settings.showApiKeys}
            setShowApiKeys={settings.setShowApiKeys}
            savingSettings={settings.savingSettings}
            saveSettings={settings.saveSettings}
          />
        )}

        {/* ==================== 모달들 ==================== */}
        {/* Generation Modal */}
        <GenerationModal
          show={generation.showGenerationModal}
          progress={generation.generationProgress}
          onClose={generation.stopGeneration}
          onViewTracks={() => {
            generation.setShowGenerationModal(false);
            setActiveTab('tracks');
          }}
          onMinimize={() => generation.setShowGenerationModal(false)}
        />

        {/* Toast Notification */}
        {showToast && (
          <div className="fixed top-4 right-4 z-[100] animate-slide-down">
            <div className="bg-green-600 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 min-w-[300px]">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">생성 완료!</p>
                <p className="text-sm text-green-100">{toastMessage}</p>
              </div>
              <button
                onClick={() => setShowToast(false)}
                className="text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Sync Modal */}
        {sync.showSyncModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-cyan-400" />
                Suno Task ID로 가져오기
              </h3>
              <p className="text-sm text-gray-400 mb-4">
                Suno API에서 생성한 Task ID를 입력하면 기존 생성 기록을 가져옵니다.
                여러 개는 줄바꿈 또는 쉼표로 구분해주세요.
              </p>
              <textarea
                value={sync.syncTaskIds}
                onChange={(e) => sync.setSyncTaskIds(e.target.value)}
                placeholder="예:&#10;550e8400-e29b-41d4-a716-446655440000&#10;6ba7b810-9dad-11d1-80b4-00c04fd430c8"
                className="w-full h-32 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm resize-none"
              />
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => sync.setShowSyncModal(false)}
                  className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
                >
                  취소
                </button>
                <button
                  onClick={() => sync.syncSunoRecords()}
                  disabled={!sync.syncTaskIds.trim()}
                  className="flex-1 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 text-white rounded-lg"
                >
                  가져오기
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Playlist Modal */}
        {tracks.showPlaylistModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">플레이리스트 생성</h3>
                <button onClick={() => tracks.setShowPlaylistModal(false)} className="text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-gray-400 mb-4">
                선택한 {tracks.selectedTrackIds.size}개 트랙으로 플레이리스트를 만듭니다
              </p>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tracks.playlistName}
                    onChange={(e) => tracks.setPlaylistName(e.target.value)}
                    placeholder="플레이리스트 이름"
                    className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  />
                  <button
                    onClick={tracks.generatePlaylistName}
                    disabled={tracks.generatingPlaylistName}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded-lg"
                    title="AI로 이름 생성"
                  >
                    {tracks.generatingPlaylistName ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Sparkles className="w-5 h-5" />
                    )}
                  </button>
                </div>
                <button
                  onClick={tracks.createPlaylist}
                  className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
                >
                  플레이리스트 생성
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
