"use client";

import React, { useState, useRef } from 'react';
import AdminLayout from '@/components/AdminLayout';
import {
  Play,
  Square,
  Trash2,
  Download,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  FileJson,
  Music,
  Type,
  Image,
  Server,
  Zap,
} from 'lucide-react';

interface LogEntry {
  id: string;
  timestamp: string;
  step: string;
  type: 'info' | 'success' | 'error' | 'request' | 'response' | 'warning';
  message: string;
  data?: any;
  duration?: number;
}

export default function DevTestPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState<string | null>(null);
  const [taskId, setTaskId] = useState<string>('');
  const [manualTaskId, setManualTaskId] = useState<string>('');
  const abortRef = useRef(false);

  // 로그 추가 함수
  const addLog = (step: string, type: LogEntry['type'], message: string, data?: any, duration?: number) => {
    const entry: LogEntry = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      step,
      type,
      message,
      data,
      duration,
    };
    setLogs(prev => [...prev, entry]);
    return entry;
  };

  // 로그 초기화
  const clearLogs = () => {
    setLogs([]);
    setTaskId('');
    setCurrentStep(null);
  };

  // ==================== 테스트 1: Gemini 텍스트 생성 ====================
  const testGeminiText = async () => {
    setIsRunning(true);
    setCurrentStep('gemini');
    const startTime = Date.now();

    addLog('gemini', 'info', '🚀 Gemini 텍스트 생성 테스트 시작');

    try {
      const requestBody = {
        type: 'title',
        keywords: '평화, 자연, 힐링',
        mood: 'calm',
        style: 'piano',
        batchNumber: 1,
      };

      addLog('gemini', 'request', 'POST /api/admin/generate/text', requestBody);

      const response = await fetch('/api/admin/generate/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      const duration = Date.now() - startTime;

      addLog('gemini', 'response', `응답 (${response.status})`, data, duration);

      if (data.success) {
        addLog('gemini', 'success', `✅ 생성된 제목: ${data.data?.text?.split('\n')[0] || '없음'}`, null, duration);
      } else {
        addLog('gemini', 'error', `❌ 실패: ${data.error}`, null, duration);
      }
    } catch (err) {
      addLog('gemini', 'error', `❌ 예외 발생: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsRunning(false);
      setCurrentStep(null);
    }
  };

  // ==================== 테스트 2: Suno 크레딧 확인 ====================
  const testSunoCredits = async () => {
    setIsRunning(true);
    setCurrentStep('credits');
    const startTime = Date.now();

    addLog('credits', 'info', '🚀 Suno 크레딧 확인 테스트 시작');

    try {
      addLog('credits', 'request', 'GET /api/admin/generate/music?action=credits');

      const response = await fetch('/api/admin/generate/music?action=credits');
      const data = await response.json();
      const duration = Date.now() - startTime;

      addLog('credits', 'response', `응답 (${response.status})`, data, duration);

      if (data.success) {
        addLog('credits', 'success', `✅ 크레딧: ${data.data?.credits} (${data.data?.tracksAvailable}곡 생성 가능)`, null, duration);
      } else {
        addLog('credits', 'error', `❌ 실패: ${data.error}`, null, duration);
      }
    } catch (err) {
      addLog('credits', 'error', `❌ 예외 발생: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsRunning(false);
      setCurrentStep(null);
    }
  };

  // ==================== 테스트 3: Suno 음악 생성 (POST) ====================
  const testSunoGenerate = async () => {
    setIsRunning(true);
    setCurrentStep('generate');
    const startTime = Date.now();

    addLog('generate', 'info', '🚀 Suno 음악 생성 테스트 시작');
    addLog('generate', 'warning', '⚠️ 이 테스트는 실제 크레딧(12)을 소모합니다!');

    try {
      const requestBody = {
        title: '테스트 힐링 음악',
        titleEn: 'Test Healing Music',
        style: 'piano',
        mood: 'calm',
        instrumental: true,
        model: 'V5',
      };

      addLog('generate', 'request', 'POST /api/admin/generate/music', requestBody);

      const response = await fetch('/api/admin/generate/music', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      const duration = Date.now() - startTime;

      addLog('generate', 'response', `응답 (${response.status})`, data, duration);

      if (data.success && data.data?.taskId) {
        setTaskId(data.data.taskId);
        addLog('generate', 'success', `✅ 생성 시작됨! TaskID: ${data.data.taskId}`, null, duration);
        addLog('generate', 'info', '💡 "상태 확인" 버튼으로 진행 상황을 확인하세요');
      } else {
        addLog('generate', 'error', `❌ 실패: ${data.error}`, null, duration);
      }
    } catch (err) {
      addLog('generate', 'error', `❌ 예외 발생: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsRunning(false);
      setCurrentStep(null);
    }
  };

  // ==================== 테스트 4: Suno 상태 확인 (GET) ====================
  const testSunoStatus = async (targetTaskId?: string) => {
    const checkTaskId = targetTaskId || taskId || manualTaskId;
    if (!checkTaskId) {
      addLog('status', 'error', '❌ TaskID가 없습니다. 먼저 음악 생성을 실행하거나 TaskID를 입력하세요.');
      return;
    }

    setIsRunning(true);
    setCurrentStep('status');
    const startTime = Date.now();

    addLog('status', 'info', `🚀 상태 확인 시작 (TaskID: ${checkTaskId})`);

    try {
      addLog('status', 'request', `GET /api/admin/generate/music?taskId=${checkTaskId}`);

      const response = await fetch(`/api/admin/generate/music?taskId=${checkTaskId}`);
      const data = await response.json();
      const duration = Date.now() - startTime;

      addLog('status', 'response', `응답 (${response.status})`, data, duration);

      if (data.success) {
        const status = data.data?.status || 'UNKNOWN';
        const tracks = data.data?.tracks || [];

        if (status === 'SUCCESS') {
          addLog('status', 'success', `✅ 생성 완료! ${tracks.length}개 트랙`, null, duration);

          // 트랙 상세 정보 로그
          tracks.forEach((track: any, idx: number) => {
            addLog('status', 'info', `📀 트랙 ${idx + 1}: ${track.title || 'Untitled'}`, {
              id: track.id,
              audioUrl: track.audioUrl,
              duration: track.duration,
              imageUrl: track.imageUrl,
            });
          });
        } else if (status === 'FAILED') {
          addLog('status', 'error', `❌ 생성 실패`, null, duration);
        } else {
          addLog('status', 'warning', `⏳ 진행 중: ${status}`, null, duration);
        }
      } else {
        addLog('status', 'error', `❌ 실패: ${data.error}`, null, duration);
      }
    } catch (err) {
      addLog('status', 'error', `❌ 예외 발생: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsRunning(false);
      setCurrentStep(null);
    }
  };

  // ==================== 테스트 5: 자동 폴링 ====================
  const testAutoPolling = async () => {
    const checkTaskId = taskId || manualTaskId;
    if (!checkTaskId) {
      addLog('polling', 'error', '❌ TaskID가 없습니다.');
      return;
    }

    setIsRunning(true);
    setCurrentStep('polling');
    abortRef.current = false;

    addLog('polling', 'info', `🚀 자동 폴링 시작 (TaskID: ${checkTaskId})`);
    addLog('polling', 'info', '5초 간격으로 상태를 확인합니다. 최대 60회 시도.');

    let attempts = 0;
    const maxAttempts = 60;

    while (attempts < maxAttempts && !abortRef.current) {
      attempts++;
      const startTime = Date.now();

      addLog('polling', 'info', `📡 폴링 ${attempts}/${maxAttempts}...`);

      try {
        const response = await fetch(`/api/admin/generate/music?taskId=${checkTaskId}`);
        const data = await response.json();
        const duration = Date.now() - startTime;

        if (data.success) {
          const status = data.data?.status;

          if (status === 'SUCCESS') {
            const tracks = data.data?.tracks || [];
            addLog('polling', 'success', `✅ 완료! ${tracks.length}개 트랙 생성됨`, data.data, duration);

            // 트랙 정보 출력
            tracks.forEach((track: any, idx: number) => {
              addLog('polling', 'info', `📀 트랙 ${idx + 1}`, {
                id: track.id,
                title: track.title,
                audioUrl: track.audioUrl,
                duration: track.duration,
              });
            });
            break;
          } else if (status === 'FAILED') {
            addLog('polling', 'error', `❌ 생성 실패`, data.data, duration);
            break;
          } else {
            addLog('polling', 'warning', `⏳ ${status} (${duration}ms)`);
          }
        } else {
          addLog('polling', 'error', `❌ API 오류: ${data.error}`, null, duration);
        }
      } catch (err) {
        addLog('polling', 'error', `❌ 예외: ${err instanceof Error ? err.message : String(err)}`);
      }

      // 5초 대기
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    if (attempts >= maxAttempts) {
      addLog('polling', 'error', '❌ 타임아웃: 최대 시도 횟수 초과');
    }

    if (abortRef.current) {
      addLog('polling', 'warning', '⚠️ 폴링 중단됨');
    }

    setIsRunning(false);
    setCurrentStep(null);
  };

  // 폴링 중단
  const stopPolling = () => {
    abortRef.current = true;
  };

  // ==================== 테스트 6: 파일 다운로드 ====================
  const testDownload = async () => {
    // 로그에서 마지막으로 찾은 audioUrl 사용
    const lastTrackLog = [...logs].reverse().find(l => l.data?.audioUrl);
    const audioUrl = lastTrackLog?.data?.audioUrl;

    if (!audioUrl) {
      addLog('download', 'error', '❌ 다운로드할 audioUrl이 없습니다. 먼저 상태 확인을 실행하세요.');
      return;
    }

    setIsRunning(true);
    setCurrentStep('download');
    const startTime = Date.now();

    addLog('download', 'info', `🚀 파일 다운로드 테스트 시작`);
    addLog('download', 'info', `📥 URL: ${audioUrl}`);

    try {
      const requestBody = {
        audioUrl,
        title: '테스트 다운로드',
        style: 'piano',
        mood: 'calm',
      };

      addLog('download', 'request', 'POST /api/admin/generate/download', requestBody);

      const response = await fetch('/api/admin/generate/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      const duration = Date.now() - startTime;

      addLog('download', 'response', `응답 (${response.status})`, data, duration);

      if (data.success) {
        addLog('download', 'success', `✅ 다운로드 완료!`, {
          filePath: data.data?.filePath,
          filename: data.data?.filename,
          size: `${((data.data?.size || 0) / 1024 / 1024).toFixed(2)} MB`,
        }, duration);
      } else {
        addLog('download', 'error', `❌ 실패: ${data.error}`, null, duration);
      }
    } catch (err) {
      addLog('download', 'error', `❌ 예외 발생: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsRunning(false);
      setCurrentStep(null);
    }
  };

  // 로그 JSON 내보내기
  const exportLogs = () => {
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dev-test-logs-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 로그 타입별 스타일
  const getLogStyle = (type: LogEntry['type']) => {
    switch (type) {
      case 'success': return 'bg-green-900/30 border-green-500/30 text-green-300';
      case 'error': return 'bg-red-900/30 border-red-500/30 text-red-300';
      case 'warning': return 'bg-yellow-900/30 border-yellow-500/30 text-yellow-300';
      case 'request': return 'bg-blue-900/30 border-blue-500/30 text-blue-300';
      case 'response': return 'bg-purple-900/30 border-purple-500/30 text-purple-300';
      default: return 'bg-gray-800/50 border-gray-600/30 text-gray-300';
    }
  };

  const getLogIcon = (type: LogEntry['type']) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-400" />;
      case 'warning': return <Clock className="w-4 h-4 text-yellow-400" />;
      case 'request': return <Zap className="w-4 h-4 text-blue-400" />;
      case 'response': return <Server className="w-4 h-4 text-purple-400" />;
      default: return <FileJson className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">🛠️ 개발자 테스트 페이지</h1>
          <p className="text-gray-400">음악 생성 파이프라인 각 단계별 테스트 및 로그 확인</p>
        </div>

        {/* 테스트 버튼들 */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <button
            onClick={testGeminiText}
            disabled={isRunning}
            className={`p-4 rounded-lg border flex flex-col items-center gap-2 transition-colors ${
              currentStep === 'gemini'
                ? 'bg-blue-600 border-blue-500 text-white'
                : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
            } ${isRunning && currentStep !== 'gemini' ? 'opacity-50' : ''}`}
          >
            <Type className="w-6 h-6" />
            <span className="text-sm font-medium">1. Gemini 텍스트</span>
          </button>

          <button
            onClick={testSunoCredits}
            disabled={isRunning}
            className={`p-4 rounded-lg border flex flex-col items-center gap-2 transition-colors ${
              currentStep === 'credits'
                ? 'bg-green-600 border-green-500 text-white'
                : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
            } ${isRunning && currentStep !== 'credits' ? 'opacity-50' : ''}`}
          >
            <RefreshCw className="w-6 h-6" />
            <span className="text-sm font-medium">2. 크레딧 확인</span>
          </button>

          <button
            onClick={testSunoGenerate}
            disabled={isRunning}
            className={`p-4 rounded-lg border flex flex-col items-center gap-2 transition-colors ${
              currentStep === 'generate'
                ? 'bg-purple-600 border-purple-500 text-white'
                : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
            } ${isRunning && currentStep !== 'generate' ? 'opacity-50' : ''}`}
          >
            <Music className="w-6 h-6" />
            <span className="text-sm font-medium">3. 음악 생성</span>
            <span className="text-xs text-yellow-400">12 크레딧</span>
          </button>

          <button
            onClick={() => testSunoStatus()}
            disabled={isRunning}
            className={`p-4 rounded-lg border flex flex-col items-center gap-2 transition-colors ${
              currentStep === 'status'
                ? 'bg-orange-600 border-orange-500 text-white'
                : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
            } ${isRunning && currentStep !== 'status' ? 'opacity-50' : ''}`}
          >
            <Server className="w-6 h-6" />
            <span className="text-sm font-medium">4. 상태 확인</span>
          </button>

          <button
            onClick={currentStep === 'polling' ? stopPolling : testAutoPolling}
            disabled={isRunning && currentStep !== 'polling'}
            className={`p-4 rounded-lg border flex flex-col items-center gap-2 transition-colors ${
              currentStep === 'polling'
                ? 'bg-red-600 border-red-500 text-white'
                : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
            } ${isRunning && currentStep !== 'polling' ? 'opacity-50' : ''}`}
          >
            {currentStep === 'polling' ? <Square className="w-6 h-6" /> : <Play className="w-6 h-6" />}
            <span className="text-sm font-medium">{currentStep === 'polling' ? '폴링 중단' : '5. 자동 폴링'}</span>
          </button>

          <button
            onClick={testDownload}
            disabled={isRunning}
            className={`p-4 rounded-lg border flex flex-col items-center gap-2 transition-colors ${
              currentStep === 'download'
                ? 'bg-cyan-600 border-cyan-500 text-white'
                : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
            } ${isRunning && currentStep !== 'download' ? 'opacity-50' : ''}`}
          >
            <Download className="w-6 h-6" />
            <span className="text-sm font-medium">6. 다운로드</span>
          </button>
        </div>

        {/* TaskID 입력 */}
        <div className="mb-6 p-4 bg-gray-800 rounded-lg border border-gray-700">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="block text-sm text-gray-400 mb-1">TaskID (수동 입력)</label>
              <input
                type="text"
                value={manualTaskId}
                onChange={(e) => setManualTaskId(e.target.value)}
                placeholder="기존 TaskID를 입력하여 상태 확인..."
                className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded text-white text-sm"
              />
            </div>
            {taskId && (
              <div className="flex-1">
                <label className="block text-sm text-gray-400 mb-1">현재 TaskID (자동)</label>
                <div className="px-3 py-2 bg-gray-900 border border-green-600 rounded text-green-400 text-sm font-mono">
                  {taskId}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 로그 컨트롤 */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">📋 실행 로그 ({logs.length})</h2>
          <div className="flex gap-2">
            <button
              onClick={exportLogs}
              disabled={logs.length === 0}
              className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded flex items-center gap-1"
            >
              <FileJson className="w-4 h-4" />
              JSON 내보내기
            </button>
            <button
              onClick={clearLogs}
              className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/40 text-red-400 text-sm rounded flex items-center gap-1"
            >
              <Trash2 className="w-4 h-4" />
              로그 초기화
            </button>
          </div>
        </div>

        {/* 로그 목록 */}
        <div className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
          <div className="max-h-[600px] overflow-y-auto">
            {logs.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                테스트를 실행하면 로그가 여기에 표시됩니다.
              </div>
            ) : (
              <div className="divide-y divide-gray-800">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className={`p-3 border-l-4 ${getLogStyle(log.type)}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">{getLogIcon(log.type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-gray-500 font-mono">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                          <span className="px-1.5 py-0.5 text-xs bg-gray-700 text-gray-300 rounded">
                            {log.step}
                          </span>
                          {log.duration && (
                            <span className="text-xs text-gray-500">
                              {log.duration}ms
                            </span>
                          )}
                        </div>
                        <p className="text-sm">{log.message}</p>
                        {log.data && (
                          <pre className="mt-2 p-2 bg-black/30 rounded text-xs overflow-x-auto font-mono text-gray-400">
                            {JSON.stringify(log.data, null, 2)}
                          </pre>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 진행 중 표시 */}
        {isRunning && (
          <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>실행 중: {currentStep}</span>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
