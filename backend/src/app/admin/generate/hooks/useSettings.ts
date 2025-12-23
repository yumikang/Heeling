"use client";

import { useState, useEffect } from 'react';
import { Template, Schedule, APIConfig } from '../types';
import { DEFAULT_TEMPLATES } from '../constants';

export function useSettings(setError: (error: string | null) => void) {
  // 설정 상태
  const [apiConfig, setApiConfig] = useState<APIConfig>({
    music: { provider: 'suno', apiKey: '', enabled: false },
    image: { provider: 'gemini', apiKey: '', enabled: false },
    text: { provider: 'openai', apiKey: '', enabled: false },
  });
  const [showApiKeys, setShowApiKeys] = useState({ music: false, image: false, text: false });
  const [savingSettings, setSavingSettings] = useState(false);

  // 템플릿 상태
  const [templates, setTemplates] = useState<Template[]>(DEFAULT_TEMPLATES);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [showTemplateForm, setShowTemplateForm] = useState(false);

  // 스케줄 상태
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [showScheduleForm, setShowScheduleForm] = useState(false);

  // Suno 크레딧
  const [sunoCredits, setSunoCredits] = useState<number | null>(null);

  // 초기 로드
  useEffect(() => {
    loadSettings();
    loadTemplates();
    loadSchedules();
    fetchSunoCredits();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings/ai');
      const data = await response.json();
      if (data.success && data.data) {
        setApiConfig(data.data);
      }
    } catch (err) {
      console.log('No saved settings found');
    }
  };

  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/admin/generate/templates');
      const data = await response.json();
      if (data.success && data.data) {
        setTemplates([...DEFAULT_TEMPLATES, ...data.data]);
      }
    } catch (err) {
      console.log('Using default templates');
    }
  };

  const loadSchedules = async () => {
    try {
      const response = await fetch('/api/admin/generate/schedules');
      const data = await response.json();
      if (data.success && data.data) {
        setSchedules(data.data);
      }
    } catch (err) {
      console.log('No schedules found');
    }
  };

  const fetchSunoCredits = async () => {
    try {
      const response = await fetch('/api/admin/generate/music?action=credits');
      const data = await response.json();
      if (data.success && data.data?.credits !== undefined) {
        setSunoCredits(data.data.credits);
      }
    } catch (err) {
      console.log('Could not fetch credits');
    }
  };

  const saveSettings = async () => {
    setSavingSettings(true);
    try {
      const response = await fetch('/api/admin/settings/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiConfig),
      });
      const data = await response.json();
      if (!data.success) {
        setError(data.error || '설정 저장 실패');
      }
    } catch (err) {
      setError('설정 저장 중 오류');
    } finally {
      setSavingSettings(false);
    }
  };

  // 스케줄 관리
  const saveSchedule = async (schedule: Partial<Schedule>) => {
    try {
      const response = await fetch('/api/admin/generate/schedules', {
        method: schedule.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(schedule),
      });
      const data = await response.json();
      if (data.success) {
        loadSchedules();
        setShowScheduleForm(false);
        setEditingSchedule(null);
      }
    } catch (err) {
      setError('스케줄 저장 실패');
    }
  };

  const runScheduleNow = async (scheduleId: string) => {
    try {
      const response = await fetch('/api/admin/generate/schedules/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduleId }),
      });
      const data = await response.json();
      if (data.success) {
        alert(`생성이 시작되었습니다.\n• ${data.data.totalGenerations}회 생성 요청\n• 예상 곡 수: ${data.data.expectedTracks}곡`);
        loadSchedules();
      } else {
        setError(data.error || '실행 실패');
      }
    } catch (err) {
      setError('실행 실패');
    }
  };

  const deleteSchedule = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/generate/schedules?id=${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        loadSchedules();
      } else {
        setError(data.error || '스케줄 삭제 실패');
      }
    } catch (err) {
      setError('스케줄 삭제 실패');
    }
  };

  // 템플릿 관리
  const saveTemplate = async (template: Partial<Template>) => {
    try {
      const response = await fetch('/api/admin/generate/templates', {
        method: template.id?.startsWith('default-') ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template),
      });
      const data = await response.json();
      if (data.success) {
        loadTemplates();
        setShowTemplateForm(false);
        setEditingTemplate(null);
      }
    } catch (err) {
      setError('템플릿 저장 실패');
    }
  };

  const deleteTemplate = async (id: string) => {
    if (id.startsWith('default-')) return;
    try {
      await fetch(`/api/admin/generate/templates?id=${id}`, { method: 'DELETE' });
      loadTemplates();
    } catch (err) {
      setError('템플릿 삭제 실패');
    }
  };

  return {
    // API Config State
    apiConfig,
    setApiConfig,
    showApiKeys,
    setShowApiKeys,
    savingSettings,
    saveSettings,
    // Template State
    templates,
    editingTemplate,
    setEditingTemplate,
    showTemplateForm,
    setShowTemplateForm,
    saveTemplate,
    deleteTemplate,
    // Schedule State
    schedules,
    editingSchedule,
    setEditingSchedule,
    showScheduleForm,
    setShowScheduleForm,
    saveSchedule,
    deleteSchedule,
    runScheduleNow,
    // Suno Credits
    sunoCredits,
    fetchSunoCredits,
  };
}
