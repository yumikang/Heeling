"use client";

import React, { useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { Home, FileText, FolderTree, Bell, Settings } from 'lucide-react';
import { HomeSectionsTab, PagesTab, CategoriesTab, PushTab, AppConfigTab } from './components';

type TabType = 'home' | 'pages' | 'categories' | 'push' | 'config';

export default function AppManagePage() {
  const [activeTab, setActiveTab] = useState<TabType>('home');

  const tabs = [
    { id: 'home' as TabType, label: '홈 화면', icon: Home },
    { id: 'pages' as TabType, label: '페이지', icon: FileText },
    { id: 'categories' as TabType, label: '카테고리', icon: FolderTree },
    { id: 'push' as TabType, label: '푸시 알림', icon: Bell },
    { id: 'config' as TabType, label: '앱 설정', icon: Settings },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">앱 관리</h1>
          <p className="text-gray-400">앱 화면 구성, 콘텐츠 페이지, 카테고리, 푸시 알림을 관리합니다.</p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-800">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-purple-500 text-purple-400'
                      : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-700'
                  }`}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'home' && <HomeSectionsTab />}
          {activeTab === 'pages' && <PagesTab />}
          {activeTab === 'categories' && <CategoriesTab />}
          {activeTab === 'push' && <PushTab />}
          {activeTab === 'config' && <AppConfigTab />}
        </div>
      </div>
    </AdminLayout>
  );
}
