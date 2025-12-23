"use client";

import React from 'react';
import {
  Play,
  Plus,
  Edit3,
  Trash2,
  Calendar,
  Clock,
  Upload,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { Schedule } from '../types';
import { STYLES, MOODS } from '../constants';

interface ScheduleFormProps {
  schedule: Schedule | null;
  onSave: (schedule: Partial<Schedule>) => void;
  onCancel: () => void;
}

// 스케줄 폼 컴포넌트
function ScheduleForm({ schedule, onSave, onCancel }: ScheduleFormProps) {
  const [name, setName] = React.useState(schedule?.name || '');
  const [frequency, setFrequency] = React.useState<Schedule['frequency']>(schedule?.frequency || 'daily');
  const [intervalDays, setIntervalDays] = React.useState(schedule?.intervalDays || 1);
  const [runTime, setRunTime] = React.useState(schedule?.runTime || '09:00');
  const [count, setCount] = React.useState(schedule?.count || 2);
  const [style, setStyle] = React.useState(schedule?.style || 'piano');
  const [mood, setMood] = React.useState(schedule?.mood || 'calm');
  const [autoDeploy, setAutoDeploy] = React.useState(schedule?.autoDeploy ?? false);
  const [isActive, setIsActive] = React.useState(schedule?.isActive ?? true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 다음 실행 시간 계산
    const now = new Date();
    const [hours, minutes] = runTime.split(':').map(Number);
    const nextRun = new Date();
    nextRun.setHours(hours, minutes, 0, 0);
    if (nextRun <= now) {
      nextRun.setDate(nextRun.getDate() + intervalDays);
    }

    onSave({
      id: schedule?.id,
      name,
      frequency,
      intervalDays,
      runTime,
      count,
      style,
      mood,
      templateId: '', // 템플릿 사용하지 않음 (프리셋 프롬프트 사용)
      autoDeploy,
      isActive,
      nextRun: nextRun.toISOString(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
      <div>
        <label className="block text-sm text-gray-300 mb-1">스케줄 이름</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="예: 매일 아침 힐링 음악"
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
          required
        />
      </div>

      {/* 실행 주기 */}
      <div>
        <label className="block text-sm text-gray-300 mb-1">실행 주기</label>
        <div className="grid grid-cols-4 gap-2">
          {[
            { value: 'daily', label: '매일', days: 1 },
            { value: 'daily', label: '2일마다', days: 2 },
            { value: 'daily', label: '3일마다', days: 3 },
            { value: 'daily', label: '7일마다', days: 7 },
            { value: 'weekly', label: '매주', days: 7 },
            { value: 'monthly', label: '매월', days: 30 },
            { value: 'once', label: '1회', days: 0 },
          ].map(f => (
            <button
              key={`${f.value}-${f.days}`}
              type="button"
              onClick={() => {
                setFrequency(f.value as Schedule['frequency']);
                setIntervalDays(f.days);
              }}
              className={`px-3 py-2 rounded text-sm ${
                frequency === f.value && intervalDays === f.days
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* 실행 시간 */}
      <div>
        <label className="block text-sm text-gray-300 mb-1">실행 시간</label>
        <div className="flex gap-2">
          {['06:00', '09:00', '12:00', '18:00', '21:00'].map(time => (
            <button
              key={time}
              type="button"
              onClick={() => setRunTime(time)}
              className={`flex-1 px-3 py-2 rounded text-sm ${
                runTime === time
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {time}
            </button>
          ))}
        </div>
        <input
          type="time"
          value={runTime}
          onChange={(e) => setRunTime(e.target.value)}
          className="w-full mt-2 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
        />
      </div>

      {/* 생성할 곡 수 */}
      <div>
        <label className="block text-sm text-gray-300 mb-1">생성할 곡 수</label>
        <div className="flex gap-2">
          {[2, 4, 6, 10].map(n => (
            <button
              key={n}
              type="button"
              onClick={() => setCount(n)}
              className={`flex-1 px-3 py-2 rounded text-sm ${
                count === n
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {n}곡
            </button>
          ))}
        </div>
      </div>

      {/* 스타일 */}
      <div>
        <label className="block text-sm text-gray-300 mb-2">스타일</label>
        <div className="flex flex-wrap gap-2">
          {STYLES.map(s => (
            <button
              key={s.value}
              type="button"
              onClick={() => setStyle(s.value)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                style === s.value
                  ? 'bg-purple-500 text-white'
                  : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/70 border border-gray-600'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* 무드 */}
      <div>
        <label className="block text-sm text-gray-300 mb-2">무드</label>
        <div className="flex flex-wrap gap-2">
          {MOODS.map(m => (
            <button
              key={m.value}
              type="button"
              onClick={() => setMood(m.value)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                mood === m.value
                  ? 'bg-purple-500 text-white'
                  : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/70 border border-gray-600'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* 자동 배포 토글 */}
      <div className="flex items-center justify-between bg-gray-700/50 rounded-lg p-3">
        <div className="flex items-center gap-2">
          <Upload className="w-4 h-4 text-purple-400" />
          <div>
            <span className="text-gray-300 text-sm">자동 배포</span>
            <p className="text-xs text-gray-500">생성 완료 후 자동으로 앱에 배포</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setAutoDeploy(!autoDeploy)}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg ${
            autoDeploy
              ? 'bg-purple-600/20 text-purple-400'
              : 'bg-gray-600/50 text-gray-400'
          }`}
        >
          {autoDeploy ? (
            <><ToggleRight className="w-5 h-5" /> ON</>
          ) : (
            <><ToggleLeft className="w-5 h-5" /> OFF</>
          )}
        </button>
      </div>

      {/* 활성화 체크박스 */}
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-purple-600"
        />
        <span className="text-gray-300">스케줄 활성화</span>
      </label>

      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded"
        >
          취소
        </button>
        <button
          type="submit"
          className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded"
        >
          저장
        </button>
      </div>
    </form>
  );
}

interface ScheduleTabProps {
  schedules: Schedule[];
  showScheduleForm: boolean;
  setShowScheduleForm: (show: boolean) => void;
  editingSchedule: Schedule | null;
  setEditingSchedule: (schedule: Schedule | null) => void;
  saveSchedule: (schedule: Partial<Schedule>) => void;
  deleteSchedule: (id: string) => void;
  runScheduleNow: (id: string) => void;
}

export default function ScheduleTab({
  schedules,
  showScheduleForm,
  setShowScheduleForm,
  editingSchedule,
  setEditingSchedule,
  saveSchedule,
  deleteSchedule,
  runScheduleNow,
}: ScheduleTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">자동 생성 스케줄</h3>
        <button
          onClick={() => { setEditingSchedule(null); setShowScheduleForm(true); }}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> 스케줄 추가
        </button>
      </div>

      {schedules.length === 0 ? (
        <div className="bg-gray-800 rounded-lg p-12 text-center text-gray-500">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>등록된 스케줄이 없습니다</p>
          <p className="text-sm mt-1">자동 음악 생성 스케줄을 추가해보세요</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {schedules.map((schedule) => (
            <div key={schedule.id} className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-white font-medium">{schedule.name}</h4>
                  <p className="text-sm text-gray-400 mt-1">
                    {schedule.frequency === 'daily'
                      ? (schedule.intervalDays === 1 ? '매일' : `${schedule.intervalDays}일마다`)
                      : schedule.frequency === 'weekly' ? '매주'
                      : schedule.frequency === 'monthly' ? '매월' : '1회'}
                    {schedule.runTime && ` ${schedule.runTime}`} • {schedule.count}곡
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {STYLES.find(s => s.value === schedule.style)?.label || schedule.style || '피아노'} /
                    {MOODS.find(m => m.value === schedule.mood)?.label || schedule.mood || '평온'}
                  </p>
                  {schedule.nextRun && (
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> 다음 실행: {new Date(schedule.nextRun).toLocaleString('ko-KR')}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className={`px-2 py-1 rounded text-xs ${schedule.isActive ? 'bg-green-600/20 text-green-400' : 'bg-gray-600/20 text-gray-400'}`}>
                    {schedule.isActive ? '활성' : '비활성'}
                  </div>
                  {schedule.autoDeploy && (
                    <div className="px-2 py-1 rounded text-xs bg-purple-600/20 text-purple-400 flex items-center gap-1">
                      <Upload className="w-3 h-3" /> 자동배포
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => runScheduleNow(schedule.id)}
                  className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded flex items-center justify-center gap-1"
                >
                  <Play className="w-3 h-3" /> 지금 실행
                </button>
                <button
                  onClick={() => { setEditingSchedule(schedule); setShowScheduleForm(true); }}
                  className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    if (confirm(`"${schedule.name}" 스케줄을 삭제하시겠습니까?`)) {
                      deleteSchedule(schedule.id);
                    }
                  }}
                  className="px-3 py-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showScheduleForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-white mb-4">
              {editingSchedule ? '스케줄 수정' : '새 스케줄'}
            </h3>
            <ScheduleForm
              schedule={editingSchedule}
              onSave={saveSchedule}
              onCancel={() => { setShowScheduleForm(false); setEditingSchedule(null); }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
