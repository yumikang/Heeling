"use client";

import React, { useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { Music, ListMusic } from 'lucide-react';
import { TracksTab, PlaylistsTab } from './components';

type TabType = 'tracks' | 'playlists';

export default function ContentPage() {
  const [activeTab, setActiveTab] = useState<TabType>('tracks');

  const tabs = [
    { id: 'tracks' as TabType, label: '트랙 관리', icon: Music },
    { id: 'playlists' as TabType, label: '플레이리스트 관리', icon: ListMusic },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Music className="w-7 h-7 text-blue-400" />
            콘텐츠 관리
          </h1>
          <p className="text-gray-400 mt-1">음악 트랙과 플레이리스트를 관리합니다</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-700 pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-t-lg flex items-center gap-2 transition-colors ${
                activeTab === tab.id
                  ? 'bg-gray-800 text-blue-400 border-b-2 border-blue-400'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'tracks' && <TracksTab />}
        {activeTab === 'playlists' && <PlaylistsTab />}
      </div>
    </AdminLayout>
  );
}
