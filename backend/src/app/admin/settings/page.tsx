"use client";

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { Save, Lock, User, Loader2, CheckCircle, AlertCircle, CreditCard } from 'lucide-react';

interface AdminInfo {
  id: string;
  email: string;
  name: string | null;
  role: string;
  lastLoginAt: string | null;
  createdAt: string;
}

export default function Settings() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [adminInfo, setAdminInfo] = useState<AdminInfo | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 프로필 폼
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  // 비밀번호 폼
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // 프리미엄 가격 설정
  const [yearlyPrice, setYearlyPrice] = useState('59900');
  const [yearlyDescription, setYearlyDescription] = useState('월 ₩4,992 (50% 할인)');
  const [monthlyPrice, setMonthlyPrice] = useState('9900');
  const [monthlyDescription, setMonthlyDescription] = useState('언제든 해지 가능');
  const [trialDays, setTrialDays] = useState('7');
  const [trialEnabled, setTrialEnabled] = useState(true);
  const [isPremiumSaving, setIsPremiumSaving] = useState(false);

  useEffect(() => {
    fetchAdminInfo();
    fetchPremiumConfig();
  }, []);

  const fetchPremiumConfig = async () => {
    try {
      const res = await fetch('/api/admin/config?category=premium');
      const data = await res.json();
      if (data.success && data.data) {
        const configs = data.data as Record<string, string>;
        if (configs['premium.yearly.price']) setYearlyPrice(configs['premium.yearly.price']);
        if (configs['premium.yearly.description']) setYearlyDescription(configs['premium.yearly.description']);
        if (configs['premium.monthly.price']) setMonthlyPrice(configs['premium.monthly.price']);
        if (configs['premium.monthly.description']) setMonthlyDescription(configs['premium.monthly.description']);
        if (configs['premium.trial.days']) setTrialDays(configs['premium.trial.days']);
        if (configs['premium.trial.enabled']) setTrialEnabled(configs['premium.trial.enabled'] === 'true');
      }
    } catch (error) {
      console.error('Failed to fetch premium config:', error);
    }
  };

  const handlePremiumSave = async () => {
    setIsPremiumSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: 'premium',
          configs: {
            'premium.yearly.price': yearlyPrice,
            'premium.yearly.description': yearlyDescription,
            'premium.monthly.price': monthlyPrice,
            'premium.monthly.description': monthlyDescription,
            'premium.trial.days': trialDays,
            'premium.trial.enabled': trialEnabled.toString(),
          },
        }),
      });

      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: '프리미엄 가격 설정이 저장되었습니다.' });
      } else {
        setMessage({ type: 'error', text: data.error || '저장에 실패했습니다.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: '저장 중 오류가 발생했습니다.' });
    } finally {
      setIsPremiumSaving(false);
    }
  };

  const fetchAdminInfo = async () => {
    try {
      const res = await fetch('/api/admin/settings');
      const data = await res.json();
      if (data.success) {
        setAdminInfo(data.data);
        setName(data.data.name || '');
        setEmail(data.data.email);
      }
    } catch (error) {
      console.error('Failed to fetch admin info:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileSave = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
      });

      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: '프로필이 저장되었습니다.' });
        setAdminInfo(data.data);
      } else {
        setMessage({ type: 'error', text: data.error || '저장에 실패했습니다.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: '저장 중 오류가 발생했습니다.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: '새 비밀번호가 일치하지 않습니다.' });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: '비밀번호는 6자 이상이어야 합니다.' });
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: '비밀번호가 변경되었습니다.' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setMessage({ type: 'error', text: data.error || '비밀번호 변경에 실패했습니다.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: '비밀번호 변경 중 오류가 발생했습니다.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white">설정</h2>
        <p className="text-gray-400 mt-2">관리자 계정 설정을 관리합니다.</p>
      </div>

      {/* 메시지 */}
      {message && (
        <div className={`mb-6 flex items-center gap-3 p-4 rounded-lg ${
          message.type === 'success'
            ? 'bg-green-500/10 border border-green-500/30 text-green-400'
            : 'bg-red-500/10 border border-red-500/30 text-red-400'
        }`}>
          {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span>{message.text}</span>
        </div>
      )}

      <div className="space-y-6 max-w-4xl">
        {/* 프로필 설정 */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-900/30 rounded-lg text-purple-400">
              <User size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">프로필 설정</h3>
              <p className="text-sm text-gray-500">역할: {adminInfo?.role === 'SUPER_ADMIN' ? '최고 관리자' : '관리자'}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">이름</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="관리자 이름"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">이메일</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="text-sm text-gray-500">
              마지막 로그인: {adminInfo?.lastLoginAt
                ? new Date(adminInfo.lastLoginAt).toLocaleString('ko-KR')
                : '정보 없음'}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={handleProfileSave}
                disabled={isSaving}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors disabled:opacity-50"
              >
                {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                프로필 저장
              </button>
            </div>
          </div>
        </div>

        {/* 비밀번호 변경 */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-900/30 rounded-lg text-blue-400">
              <Lock size={24} />
            </div>
            <h3 className="text-xl font-bold text-white">비밀번호 변경</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">현재 비밀번호</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">새 비밀번호</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="6자 이상"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">새 비밀번호 확인</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={handlePasswordChange}
                disabled={isSaving || !currentPassword || !newPassword || !confirmPassword}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors disabled:opacity-50"
              >
                {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Lock size={18} />}
                비밀번호 변경
              </button>
            </div>
          </div>
        </div>

        {/* 프리미엄 가격 설정 */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-yellow-900/30 rounded-lg text-yellow-400">
              <CreditCard size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">프리미엄 가격 설정</h3>
              <p className="text-sm text-gray-500">앱에 표시되는 프리미엄 구독 가격을 관리합니다.</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* 연간 구독 */}
            <div className="bg-gray-800/50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-yellow-400 mb-3">연간 구독</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">가격 (원)</label>
                  <input
                    type="number"
                    value={yearlyPrice}
                    onChange={(e) => setYearlyPrice(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">설명</label>
                  <input
                    type="text"
                    value={yearlyDescription}
                    onChange={(e) => setYearlyDescription(e.target.value)}
                    placeholder="월 ₩4,992 (50% 할인)"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-500"
                  />
                </div>
              </div>
            </div>

            {/* 월간 구독 */}
            <div className="bg-gray-800/50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-400 mb-3">월간 구독</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">가격 (원)</label>
                  <input
                    type="number"
                    value={monthlyPrice}
                    onChange={(e) => setMonthlyPrice(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">설명</label>
                  <input
                    type="text"
                    value={monthlyDescription}
                    onChange={(e) => setMonthlyDescription(e.target.value)}
                    placeholder="언제든 해지 가능"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* 무료 체험 */}
            <div className="bg-gray-800/50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-green-400 mb-3">무료 체험</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">체험 기간 (일)</label>
                  <input
                    type="number"
                    value={trialDays}
                    onChange={(e) => setTrialDays(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-green-500"
                  />
                </div>
                <div className="flex items-center">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={trialEnabled}
                      onChange={(e) => setTrialEnabled(e.target.checked)}
                      className="w-5 h-5 rounded border-gray-600 bg-gray-800 text-green-500 focus:ring-green-500"
                    />
                    <span className="text-gray-300">무료 체험 활성화</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={handlePremiumSave}
                disabled={isPremiumSaving}
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors disabled:opacity-50"
              >
                {isPremiumSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                가격 설정 저장
              </button>
            </div>
          </div>
        </div>

      </div>
    </AdminLayout>
  );
}
