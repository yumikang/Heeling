"use client";

import React from 'react';
import { Search } from 'lucide-react';

interface PlaylistFiltersProps {
  filterType: string;
  searchQuery: string;
  onFilterChange: (type: string) => void;
  onSearchChange: (query: string) => void;
  playlistTypes: Record<string, { label: string; color: string }>;
}

export default function PlaylistFilters({
  filterType,
  searchQuery,
  onFilterChange,
  onSearchChange,
  playlistTypes,
}: PlaylistFiltersProps) {
  return (
    <div className="flex flex-wrap gap-4">
      <div className="flex gap-2">
        <button
          onClick={() => onFilterChange('')}
          className={`px-4 py-2 rounded-lg transition-colors ${filterType === '' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
        >
          전체
        </button>
        {Object.entries(playlistTypes).map(([key, value]) => (
          <button
            key={key}
            onClick={() => onFilterChange(key)}
            className={`px-4 py-2 rounded-lg transition-colors ${filterType === key ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
          >
            {value.label}
          </button>
        ))}
      </div>

      <div className="flex-1 min-w-[200px]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="플레이리스트 검색..."
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500"
          />
        </div>
      </div>
    </div>
  );
}
