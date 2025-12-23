"use client";

import { useState, useCallback } from 'react';
import { GeneratedTrack, GenerationProgress, TitleCacheStatus } from '../types';

interface UseGenerationProps {
  style: string;
  mood: string;
  instrumental: boolean;
  trackCount: number;
  titleKeywords: string;
  setGeneratedTracks: React.Dispatch<React.SetStateAction<GeneratedTrack[]>>;
  setError: (error: string | null) => void;
}

export function useGeneration({
  style,
  mood,
  instrumental,
  trackCount,
  titleKeywords,
  setGeneratedTracks,
  setError,
}: UseGenerationProps) {
  const [showGenerationModal, setShowGenerationModal] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<GenerationProgress | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [titleCacheStatus, setTitleCacheStatus] = useState<TitleCacheStatus>({
    available: 0,
    total: 0,
    needsGeneration: true,
    loading: false,
    generating: false,
  });
  const [generatingKeywords, setGeneratingKeywords] = useState(false);

  // ==================== 캐시 관리 ====================
  const checkSunoCache = async (title: string, currentStyle: string, currentMood: string) => {
    try {
      const params = new URLSearchParams({ type: 'suno', title, style: currentStyle, mood: currentMood });
      const response = await fetch(`/api/admin/generate/cache?${params}`);
      const data = await response.json();
      if (data.success && data.data?.found) {
        return data.data.cached;
      }
    } catch (err) {
      console.error('[Cache] Suno cache check failed:', err);
    }
    return null;
  };

  const saveSunoCache = async (taskId: string, title: string, currentStyle: string, currentMood: string, status: string, tracks: any[]) => {
    try {
      await fetch('/api/admin/generate/cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'suno', data: { taskId, title, style: currentStyle, mood: currentMood, status, tracks } }),
      });
    } catch (err) {
      console.error('[Cache] Suno cache save failed:', err);
    }
  };

  const checkGeminiCache = async (keyword: string, currentStyle: string, currentMood: string) => {
    try {
      const params = new URLSearchParams({ type: 'gemini', keyword, style: currentStyle, mood: currentMood });
      const response = await fetch(`/api/admin/generate/cache?${params}`);
      const data = await response.json();
      if (data.success && data.data?.found) {
        return data.data.cached;
      }
    } catch (err) {
      console.error('[Cache] Gemini cache check failed:', err);
    }
    return null;
  };

  // ==================== 제목 캐시 관리 ====================
  // 제목 캐시는 하나의 통합 카테고리('healing')만 사용
  const getCategory = useCallback(() => {
    return 'healing';  // 모든 스타일에서 통합 캐시 사용
  }, []);

  const checkTitleCache = useCallback(async () => {
    setTitleCacheStatus(prev => ({ ...prev, loading: true }));
    try {
      const category = getCategory();
      // style/mood 무관하게 통합 캐시만 조회
      const params = new URLSearchParams({ category });
      const response = await fetch(`/api/admin/generate/titles?${params}`);
      const data = await response.json();
      if (data.success) {
        setTitleCacheStatus({
          available: data.data.available || 0,
          total: data.data.total || 0,
          needsGeneration: data.data.needsGeneration || data.data.available < 10,
          loading: false,
          generating: false,
        });
      }
    } catch (err) {
      console.error('[TitleCache] Check failed:', err);
      setTitleCacheStatus(prev => ({ ...prev, loading: false }));
    }
  }, [getCategory]);

  const generateKeywordsWithAI = async () => {
    setGeneratingKeywords(true);
    setError(null);
    try {
      const category = getCategory();
      const response = await fetch('/api/admin/generate/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'keywords', category, mood, style, count: 1 }),
      });
      const data = await response.json();
      if (data.success && data.data?.keywords?.length > 0) {
        return data.data.keywords[0];
      } else {
        setError(data.error || '키워드 생성에 실패했습니다.');
      }
    } catch (err) {
      setError('AI 키워드 생성 오류: 네트워크 에러');
    } finally {
      setGeneratingKeywords(false);
    }
    return null;
  };

  const preGenerateTitles = async (count: number = 50) => {
    setTitleCacheStatus(prev => ({ ...prev, loading: true }));
    try {
      const category = getCategory();
      const response = await fetch('/api/admin/generate/titles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, mood, style, count }),
      });
      const data = await response.json();
      if (data.success) {
        await checkTitleCache();
      } else {
        setError(data.error || '제목 생성 실패');
      }
    } catch (err) {
      setError('제목 프리-제너레이션 오류');
    } finally {
      setTitleCacheStatus(prev => ({ ...prev, loading: false }));
    }
  };

  // 2개 제목을 캐시에서 가져오기 (Suno는 한 번에 2곡 생성하므로)
  const getTitlesFromCache = async (count: number = 2): Promise<{ ko: string; en: string; keywords: string }[]> => {
    try {
      const category = getCategory();
      // style/mood 무관하게 통합 캐시에서 가져옴
      const params = new URLSearchParams({ category, count: String(count) });
      const response = await fetch(`/api/admin/generate/titles?${params}`);
      const data = await response.json();
      if (data.success && data.data.titles?.length > 0) {
        const titles = data.data.titles.slice(0, count);
        // 사용된 제목들 마킹
        await fetch('/api/admin/generate/titles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'markUsed', category, titleIds: titles.map((t: any) => t.ko) }),
        });
        return titles;
      }
    } catch (err) {
      console.error('[TitleCache] Get titles failed:', err);
    }
    return [];
  };

  // ==================== 음악 대량 생성 ====================
  const startBulkGeneration = async () => {
    const totalBatches = trackCount / 2;
    const batchId = `batch_${Date.now()}`;

    setShowGenerationModal(true);
    setIsGenerating(true);
    setGenerationProgress({
      currentBatch: 0,
      totalBatches,
      currentTrack: 0,
      totalTracks: trackCount,
      phase: 'title',
      taskIds: [],
      completedTracks: [],
    });

    const completedTracks: GeneratedTrack[] = [];
    let generatedKeywords: string[] = [];
    let effectiveKeywords = titleKeywords.trim();

    if (!effectiveKeywords) {
      try {
        const keywordsResponse = await fetch('/api/admin/generate/text', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'keywords',
            category: getCategory(),
            mood,
            style,
            count: totalBatches,
          }),
        });
        const keywordsData = await keywordsResponse.json();
        if (keywordsData.success && keywordsData.data?.keywords) {
          generatedKeywords = keywordsData.data.keywords;
        }
      } catch (err) {
        console.error('[Generation] Failed to generate keywords:', err);
      }
    }

    try {
      for (let batch = 0; batch < totalBatches; batch++) {
        setGenerationProgress(prev => prev ? { ...prev, currentBatch: batch + 1, phase: 'title' } : null);

        const batchKeywords = effectiveKeywords || generatedKeywords[batch] || `healing, ${mood}, ${style}`;

        // 2개 제목을 캐시에서 가져오기 (각 트랙에 별도 제목 할당)
        let trackTitles: { en: string; keywords: string }[] = [];

        const cachedTitles = await getTitlesFromCache(2);
        if (cachedTitles.length >= 2) {
          trackTitles = cachedTitles.map(t => ({ en: t.en, keywords: t.keywords }));
        } else if (cachedTitles.length === 1) {
          // 1개만 있으면 폴백 제목 추가
          trackTitles = [
            { en: cachedTitles[0].en, keywords: cachedTitles[0].keywords },
            { en: `${cachedTitles[0].en} II`, keywords: cachedTitles[0].keywords },
          ];
        }

        // 캐시에 제목이 없으면 AI 생성 또는 폴백
        if (trackTitles.length < 2) {
          const geminiCache = await checkGeminiCache(batchKeywords, style, mood);
          if (geminiCache?.titles?.length >= 2) {
            trackTitles = geminiCache.titles.slice(0, 2).map((t: any) => ({ en: t.en, keywords: batchKeywords }));
          } else {
            // AI로 제목 생성
            const titleResponse = await fetch('/api/admin/generate/text', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'title',
                keywords: batchKeywords,
                mood,
                style,
                category: getCategory(),
                count: 2,
              }),
            });
            const titleData = await titleResponse.json();

            if (titleData.success && titleData.data?.titles?.length >= 2) {
              trackTitles = titleData.data.titles.slice(0, 2).map((t: any) => ({ en: t.en || t.ko, keywords: batchKeywords }));
            }
          }
        }

        // 최종 폴백
        if (trackTitles.length < 2) {
          const fallbackBase = batchKeywords.split(',')[0].trim();
          trackTitles = [
            { en: `Melody of ${fallbackBase}`, keywords: batchKeywords },
            { en: `Whispers of ${fallbackBase}`, keywords: batchKeywords },
          ];
        }

        // 첫 번째 제목을 progress에 표시 (영어만)
        setGenerationProgress(prev => prev ? { ...prev, currentTitle: trackTitles[0].en, currentTitleEn: trackTitles[0].en, phase: 'music' } : null);

        // Suno 캐시 확인 (첫 번째 제목으로 확인)
        const sunoCache = await checkSunoCache(trackTitles[0].en, style, mood);
        if (sunoCache?.status === 'SUCCESS' && sunoCache.tracks?.length > 0) {
          const cachedTracks: GeneratedTrack[] = sunoCache.tracks.map((t: any, idx: number) => ({
            id: `${batchId}_${batch}_${idx}`,
            title: trackTitles[idx]?.en || trackTitles[0].en,
            titleEn: trackTitles[idx]?.en || trackTitles[0].en,
            audioUrl: t.audioUrl,
            duration: t.duration,
            imageUrl: t.imageUrl,
            style,
            mood,
            generatedAt: sunoCache.completedAt || new Date().toISOString(),
            batchId,
          }));
          completedTracks.push(...cachedTracks);
          setGeneratedTracks(prev => [...cachedTracks, ...prev]);

          await fetch('/api/admin/generate/tracks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tracks: cachedTracks }),
          });

          setGenerationProgress(prev => prev ? { ...prev, currentTrack: completedTracks.length, completedTracks: [...completedTracks] } : null);
          continue;
        }

        // 음악 생성 (첫 번째 제목으로 Suno API 호출 - Suno는 제목을 참고만 함)
        const musicResponse = await fetch('/api/admin/generate/music', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: trackTitles[0].en, titleEn: trackTitles[0].en, style, mood, instrumental }),
        });
        const musicData = await musicResponse.json();

        if (!musicData.success || !musicData.data?.taskId) {
          throw new Error(musicData.error || '음악 생성 실패');
        }

        const taskId = musicData.data.taskId;
        setGenerationProgress(prev => prev ? { ...prev, phase: 'waiting', taskIds: [...prev.taskIds, taskId] } : null);

        // 완료 대기
        let attempts = 0;
        const maxAttempts = 60;
        while (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 5000));

          const statusResponse = await fetch(`/api/admin/generate/music?taskId=${taskId}`);
          const statusData = await statusResponse.json();

          if (statusData.success && statusData.data?.status === 'SUCCESS') {
            const rawTracks = statusData.data.tracks || [];

            setGenerationProgress(prev => prev ? { ...prev, phase: 'downloading' } : null);

            const downloadedTracks: GeneratedTrack[] = [];
            for (let idx = 0; idx < rawTracks.length; idx++) {
              const t = rawTracks[idx];
              const remoteAudioUrl = t.audioUrl || t.audio_url;
              const remoteImageUrl = t.imageUrl || t.image_url;

              // 각 트랙에 개별 영어 제목 할당
              const trackTitle = trackTitles[idx]?.en || trackTitles[0].en;
              const trackKeywords = trackTitles[idx]?.keywords || batchKeywords;

              let localAudioUrl = remoteAudioUrl;
              let trackDuration = t.duration || 0;  // Suno API duration (보통 null)
              try {
                const downloadResponse = await fetch('/api/admin/generate/download', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ audioUrl: remoteAudioUrl, title: trackTitle, style, mood, type: 'audio' }),
                });
                const downloadData = await downloadResponse.json();
                if (downloadData.success && downloadData.data?.filePath) {
                  localAudioUrl = downloadData.data.filePath;
                  // 다운로드 API에서 추출한 duration 사용
                  if (downloadData.data.duration) {
                    trackDuration = downloadData.data.duration;
                  }
                }
              } catch (downloadErr) {
                console.error('[Generation] Audio download failed:', downloadErr);
              }

              setGenerationProgress(prev => prev ? { ...prev, phase: 'image' } : null);

              let localImageUrl = '';
              try {
                // 각 트랙의 영어 제목을 기반으로 고유한 이미지 생성
                const imageResponse = await fetch('/api/admin/generate/image', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    title: trackTitle,  // 각 트랙의 개별 영어 제목
                    category: getCategory(),
                    mood,
                    keywords: trackKeywords,
                    save: true,
                    variation: idx,
                  }),
                });
                const imageData = await imageResponse.json();
                localImageUrl = imageData.success && imageData.data?.url ? imageData.data.url : (remoteImageUrl || '');
              } catch (imageErr) {
                console.error('[Generation] Gemini Imagen generation error:', imageErr);
                localImageUrl = remoteImageUrl || '';
              }

              downloadedTracks.push({
                id: `${batchId}_${batch}_${idx}`,
                title: trackTitle,      // 영어 제목만 사용
                titleEn: trackTitle,    // 동일하게 영어 제목
                audioUrl: localAudioUrl,
                duration: trackDuration,  // 다운로드 API에서 추출한 duration 사용
                imageUrl: localImageUrl,
                style,
                mood,
                generatedAt: new Date().toISOString(),
                batchId,
              });
            }

            completedTracks.push(...downloadedTracks);

            await saveSunoCache(taskId, trackTitles[0].en, style, mood, 'SUCCESS', downloadedTracks.map(t => ({
              id: t.id,
              audioUrl: t.audioUrl,
              imageUrl: t.imageUrl || '',
              duration: t.duration,
            })));

            setGeneratedTracks(prev => [...downloadedTracks, ...prev]);

            await fetch('/api/admin/generate/tracks', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ tracks: downloadedTracks }),
            });

            setGenerationProgress(prev => prev ? { ...prev, currentTrack: completedTracks.length, completedTracks: [...completedTracks] } : null);
            break;
          } else if (statusData.data?.status === 'FAILED') {
            throw new Error('음악 생성 실패');
          }
          attempts++;
        }

        if (attempts >= maxAttempts) {
          throw new Error('음악 생성 시간 초과');
        }
      }

      setGenerationProgress(prev => prev ? { ...prev, phase: 'complete' } : null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '생성 중 오류 발생';
      setGenerationProgress(prev => prev ? { ...prev, phase: 'error', errorMessage } : null);
      setError(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const stopGeneration = () => {
    setIsGenerating(false);
    setShowGenerationModal(false);
    setGenerationProgress(null);
  };

  return {
    // State
    showGenerationModal,
    generationProgress,
    isGenerating,
    titleCacheStatus,
    generatingKeywords,
    // Actions
    setShowGenerationModal,
    checkTitleCache,
    generateKeywordsWithAI,
    preGenerateTitles,
    startBulkGeneration,
    stopGeneration,
    saveSunoCache,
  };
}
